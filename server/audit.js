import { query } from './db.js'

/**
 * Append an audit row. Auditing must never break the operation it records,
 * so failures are logged and swallowed.
 */
export async function writeAudit(action, detail, userName, tx = null) {
  const text = `INSERT INTO dbo.audit_log (action, detail, user_name)
                VALUES (@action, @detail, @userName)`
  const params = { action, detail: detail ?? null, userName: userName ?? null }
  try {
    if (tx) await tx.query(text, params)
    else await query(text, params)
  } catch (err) {
    console.error('[audit] failed to record %s: %s', action, err.message)
  }
}
