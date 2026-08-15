import sql from 'mssql'
import { config } from './config.js'

let poolPromise = null

/** Lazily created singleton pool — every request shares it. */
export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config.db)
      .connect()
      .catch(err => {
        // Reset so a later request can retry instead of reusing a dead promise.
        poolPromise = null
        throw err
      })
  }
  return poolPromise
}

/**
 * Run a parameterised query.
 * `params` is { name: value } or { name: { type, value } } when the inferred
 * type is wrong (e.g. a DECIMAL that would otherwise infer as float).
 */
export async function query(text, params = {}) {
  const pool = await getPool()
  const request = pool.request()
  bind(request, params)
  const result = await request.query(text)
  return result.recordset ?? []
}

export async function queryOne(text, params = {}) {
  const rows = await query(text, params)
  return rows[0] ?? null
}

function bind(request, params) {
  for (const [key, raw] of Object.entries(params)) {
    if (raw !== null && typeof raw === 'object' && 'type' in raw) {
      request.input(key, raw.type, raw.value)
    } else {
      request.input(key, raw)
    }
  }
}

/**
 * Run `fn` inside a SQL transaction, rolling back on any throw.
 * `fn` receives a helper with the same shape as `query`, bound to the tx.
 */
export async function withTransaction(fn) {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  const tx = {
    async query(text, params = {}) {
      const request = new sql.Request(transaction)
      bind(request, params)
      const result = await request.query(text)
      return result.recordset ?? []
    },
    async queryOne(text, params = {}) {
      const rows = await tx.query(text, params)
      return rows[0] ?? null
    },
  }

  try {
    const value = await fn(tx)
    await transaction.commit()
    return value
  } catch (err) {
    try {
      await transaction.rollback()
    } catch {
      // Rollback can fail if the transaction was already aborted (e.g. by
      // XACT_ABORT); the original error is the one worth surfacing.
    }
    throw err
  }
}

/**
 * Reserve the next document number for a prefix. The UPDATE takes an update
 * lock on the row, so two concurrent sales cannot mint the same number.
 */
export async function nextDocNo(tx, prefix) {
  const row = await tx.queryOne(
    `UPDATE dbo.document_sequences
        SET last_value = last_value + 1
      OUTPUT inserted.last_value, inserted.pad_width
      WHERE prefix = @prefix`,
    { prefix }
  )
  if (!row) throw new Error(`Unknown document sequence '${prefix}'`)
  const num = row.pad_width > 0
    ? String(row.last_value).padStart(row.pad_width, '0')
    : String(row.last_value)
  return `${prefix}-${num}`
}

export { sql }
