import { Router } from 'express'
import { query, queryOne, withTransaction, nextDocNo, sql } from '../db.js'
import { writeAudit } from '../audit.js'

export const salesRouter = Router()

const money = value => ({ type: sql.Decimal(12, 2), value })

/** Shape a transaction row + its items the way the UI expects. */
async function loadTransaction(id, runner = { query, queryOne }) {
  const tx = await runner.queryOne(
    `SELECT id, tx_no, tx_datetime, status, staff_id, staff_name, counter_id, counter_name,
            payment_method, subtotal, discount, total, cash_received, change_due,
            refund_reason, refund_at, refund_by
       FROM dbo.transactions WHERE id = @id`, { id })
  if (!tx) return null
  tx.items = await runner.query(
    `SELECT id, product_id, sku, name, qty, unit_price, line_total
       FROM dbo.transaction_items WHERE transaction_id = @id ORDER BY id`, { id })
  return tx
}

// ── Read ──────────────────────────────────────────────────────────────────
salesRouter.get('/transactions', async (req, res, next) => {
  try {
    const { from, to, staffId, status, txNo } = req.query
    const limit = Math.min(Number(req.query.limit) || 200, 1000)
    const where = []
    const params = { limit }
    if (from)    { where.push('t.tx_datetime >= @from');                   params.from = new Date(from) }
    if (to)      { where.push('t.tx_datetime < DATEADD(day, 1, @to)');     params.to = new Date(to) }
    if (staffId) { where.push('t.staff_id = @staffId');                    params.staffId = Number(staffId) }
    if (status)  { where.push('t.status = @status');                       params.status = status }
    if (txNo)    { where.push('t.tx_no LIKE @txNo');                       params.txNo = `%${txNo}%` }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : ''

    const rows = await query(
      `SELECT TOP (@limit) t.id, t.tx_no, t.tx_datetime, t.status, t.staff_name,
              t.counter_name, t.payment_method, t.subtotal, t.discount, t.total,
              t.cash_received, t.change_due, t.refund_reason, t.refund_at, t.refund_by,
              (SELECT COUNT(*) FROM dbo.transaction_items i WHERE i.transaction_id = t.id) AS item_count
         FROM dbo.transactions t${clause}
        ORDER BY t.tx_datetime DESC, t.id DESC`, params)

    // The history receipt and the item-level reports both need lines, so fetch
    // them for the whole page in one round trip rather than per transaction.
    if (rows.length) {
      const items = await query(
        `SELECT i.transaction_id, i.id, i.product_id, i.sku, i.name, i.qty,
                i.unit_price, i.line_total
           FROM dbo.transaction_items i
           JOIN (SELECT TOP (@limit) t.id
                   FROM dbo.transactions t${clause}
                  ORDER BY t.tx_datetime DESC, t.id DESC) page ON page.id = i.transaction_id
          ORDER BY i.transaction_id, i.id`, params)

      const byTx = new Map()
      for (const item of items) {
        if (!byTx.has(item.transaction_id)) byTx.set(item.transaction_id, [])
        byTx.get(item.transaction_id).push(item)
      }
      for (const row of rows) row.items = byTx.get(row.id) ?? []
    }

    res.json(rows)
  } catch (err) { next(err) }
})

salesRouter.get('/transactions/:id', async (req, res, next) => {
  try {
    const tx = await loadTransaction(Number(req.params.id))
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' })
    res.json(tx)
  } catch (err) { next(err) }
})

// ── Record a sale ─────────────────────────────────────────────────────────
// Everything (stock decrement, transaction, items, ledger) happens in one
// transaction: a sale that cannot fully post must not post at all.
salesRouter.post('/sales', async (req, res, next) => {
  try {
    const { items, discount = 0, payment, cashReceived, changeDue } = req.body ?? {}
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'A sale needs at least one item.' })
    }
    if (!payment) return res.status(400).json({ error: 'A payment method is required.' })

    const user = req.user
    const result = await withTransaction(async tx => {
      let subtotal = 0
      const priced = []

      for (const item of items) {
        const qty = Number(item.qty ?? item.quantity)
        if (!Number.isInteger(qty) || qty <= 0) {
          return { error: `Invalid quantity for product ${item.productId ?? item.id}.`, status: 400 }
        }
        const product = await tx.queryOne(
          `SELECT id, sku, name, price, stock, status FROM dbo.products WITH (UPDLOCK, ROWLOCK)
            WHERE id = @id`, { id: Number(item.productId ?? item.id) })
        if (!product) return { error: `Product ${item.productId ?? item.id} not found.`, status: 404 }
        if (product.status !== 'Active') {
          return { error: `${product.sku} is not available for sale.`, status: 409 }
        }
        if (product.stock < qty) {
          return { error: `Insufficient stock for ${product.sku}: ${product.stock} left.`, status: 409 }
        }
        // Price comes from the database, never from the client.
        const unitPrice = Number(product.price)
        subtotal += unitPrice * qty
        priced.push({ product, qty, unitPrice, balanceAfter: product.stock - qty })
      }

      const discountValue = Number(discount) || 0
      const total = subtotal - discountValue
      if (total < 0) return { error: 'Discount cannot exceed the subtotal.', status: 400 }

      const cash = payment === 'Cash' ? Number(cashReceived) || 0 : null
      if (payment === 'Cash' && cash < total) {
        return { error: 'Cash received is less than the amount due.', status: 400 }
      }

      const txNo = await nextDocNo(tx, 'TX')
      const inserted = await tx.queryOne(
        `INSERT INTO dbo.transactions
           (tx_no, status, staff_id, staff_name, counter_id, counter_name, payment_method,
            subtotal, discount, total, cash_received, change_due)
         OUTPUT inserted.id
         VALUES (@txNo, 'Completed', @staffId, @staffName, @counterId, @counterName, @payment,
                 @subtotal, @discount, @total, @cashReceived, @changeDue)`,
        {
          txNo,
          staffId: user.staffId, staffName: user.name,
          counterId: user.counterId ?? null, counterName: user.counterName ?? null,
          payment,
          subtotal: money(subtotal), discount: money(discountValue), total: money(total),
          cashReceived: cash == null ? null : money(cash),
          changeDue: payment === 'Cash'
            ? money(changeDue != null ? Number(changeDue) : cash - total)
            : null,
        }
      )

      for (const line of priced) {
        await tx.query(
          `INSERT INTO dbo.transaction_items (transaction_id, product_id, sku, name, qty, unit_price)
           VALUES (@txId, @productId, @sku, @name, @qty, @unitPrice)`,
          {
            txId: inserted.id, productId: line.product.id, sku: line.product.sku,
            name: line.product.name, qty: line.qty,
            unitPrice: { type: sql.Decimal(10, 2), value: line.unitPrice },
          })
        await tx.query(
          'UPDATE dbo.products SET stock = @stock, updated_at = getdate() WHERE id = @id',
          { stock: line.balanceAfter, id: line.product.id })
        await tx.query(
          `INSERT INTO dbo.stock_movements
             (doc_no, type, movement_date, product_id, sku, product_name, qty, balance_after,
              reason, remarks, counter_id, counter_name, transaction_id, created_by)
           VALUES (@docNo, 'SALE', getdate(), @productId, @sku, @productName, @qty, @balanceAfter,
                   'Sales Transaction', @remarks, @counterId, @counterName, @txId, @createdBy)`,
          {
            docNo: txNo, productId: line.product.id, sku: line.product.sku,
            productName: line.product.name, qty: line.qty, balanceAfter: line.balanceAfter,
            remarks: `Receipt ${txNo}`,
            counterId: user.counterId ?? null, counterName: user.counterName ?? null,
            txId: inserted.id, createdBy: user.name,
          })
      }

      return { id: inserted.id, txNo, total }
    })

    if (result.error) return res.status(result.status).json({ error: result.error })

    await writeAudit('SALE_COMPLETED',
      `${result.txNo}: ${payment} RM${result.total.toFixed(2)}`, user.name)
    res.status(201).json(await loadTransaction(result.id))
  } catch (err) { next(err) }
})

// ── Refund ────────────────────────────────────────────────────────────────
salesRouter.post('/transactions/:id/refund', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { reason } = req.body ?? {}
    if (!reason) return res.status(400).json({ error: 'A refund reason is required.' })
    const user = req.user

    const result = await withTransaction(async tx => {
      const original = await tx.queryOne(
        `SELECT id, tx_no, status, total FROM dbo.transactions WITH (UPDLOCK, ROWLOCK)
          WHERE id = @id`, { id })
      if (!original) return { error: 'Transaction not found.', status: 404 }
      if (original.status !== 'Completed') {
        return { error: `Only completed transactions can be refunded (this one is ${original.status}).`, status: 409 }
      }

      const items = await tx.query(
        'SELECT product_id, sku, name, qty FROM dbo.transaction_items WHERE transaction_id = @id',
        { id })

      for (const item of items) {
        if (!item.product_id) continue
        const product = await tx.queryOne(
          'SELECT id, stock FROM dbo.products WITH (UPDLOCK, ROWLOCK) WHERE id = @id',
          { id: item.product_id })
        if (!product) continue

        const balanceAfter = product.stock + item.qty
        const docNo = await nextDocNo(tx, 'RT')
        await tx.query('UPDATE dbo.products SET stock = @stock, updated_at = getdate() WHERE id = @id',
          { stock: balanceAfter, id: product.id })
        await tx.query(
          `INSERT INTO dbo.stock_movements
             (doc_no, type, movement_date, product_id, sku, product_name, qty, balance_after,
              return_type, reason, counter_id, counter_name, transaction_id, created_by)
           VALUES (@docNo, 'RETURN', getdate(), @productId, @sku, @productName, @qty, @balanceAfter,
                   'Customer Return', @reason, @counterId, @counterName, @txId, @createdBy)`,
          {
            docNo, productId: product.id, sku: item.sku, productName: item.name,
            qty: item.qty, balanceAfter,
            reason: `Refund ${original.tx_no}: ${reason}`,
            counterId: user.counterId ?? null, counterName: user.counterName ?? null,
            txId: id, createdBy: user.name,
          })
      }

      await tx.query(
        `UPDATE dbo.transactions
            SET status = 'Refunded', refund_reason = @reason,
                refund_at = getdate(), refund_by = @by
          WHERE id = @id`,
        { id, reason, by: user.name })

      return { txNo: original.tx_no, total: Number(original.total) }
    })

    if (result.error) return res.status(result.status).json({ error: result.error })

    await writeAudit('REFUND_ISSUED',
      `${result.txNo}: ${reason} (RM${result.total.toFixed(2)})`, user.name)
    res.json(await loadTransaction(id))
  } catch (err) { next(err) }
})
