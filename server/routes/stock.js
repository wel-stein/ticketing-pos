import { Router } from 'express'
import { query, withTransaction, nextDocNo, sql } from '../db.js'
import { writeAudit } from '../audit.js'

export const stockRouter = Router()

stockRouter.get('/movements', async (req, res, next) => {
  try {
    const { type, productId, from, to } = req.query
    const limit = Math.min(Number(req.query.limit) || 200, 1000)
    const where = []
    const params = { limit }
    if (type)      { where.push('m.type = @type');                    params.type = type }
    if (productId) { where.push('m.product_id = @productId');         params.productId = Number(productId) }
    if (from)      { where.push('m.movement_date >= @from');          params.from = new Date(from) }
    if (to)        { where.push('m.movement_date < DATEADD(day, 1, @to)'); params.to = new Date(to) }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : ''

    res.json(await query(
      `SELECT TOP (@limit) m.id, m.doc_no, m.type, m.movement_date, m.product_id,
              m.sku, m.product_name, m.qty, m.balance_after, m.ref_no, m.reason,
              m.return_type, m.remarks, m.attachment_name, m.counter_name, m.created_by
         FROM dbo.stock_movements m${clause}
        ORDER BY m.movement_date DESC, m.id DESC`, params))
  } catch (err) { next(err) }
})

/**
 * Shared writer for IN / OUT / RETURN.
 * The product row is locked with UPDLOCK inside the transaction so two
 * concurrent movements cannot both read the same starting balance and write
 * a wrong balance_after.
 */
async function applyMovement({ user, type, prefix, productId, qty, delta, extra }) {
  return withTransaction(async tx => {
    const product = await tx.queryOne(
      `SELECT id, sku, name, stock FROM dbo.products WITH (UPDLOCK, ROWLOCK)
        WHERE id = @productId`,
      { productId }
    )
    if (!product) return { error: 'Product not found.', status: 404 }

    const balanceAfter = product.stock + delta
    if (balanceAfter < 0) {
      return { error: 'Quantity cannot exceed current stock.', status: 400 }
    }

    const docNo = await nextDocNo(tx, prefix)
    await tx.query(
      'UPDATE dbo.products SET stock = @balanceAfter, updated_at = getdate() WHERE id = @productId',
      { balanceAfter, productId }
    )
    await tx.query(
      `INSERT INTO dbo.stock_movements
         (doc_no, type, movement_date, product_id, sku, product_name, qty, balance_after,
          ref_no, reason, return_type, remarks, attachment_name,
          counter_id, counter_name, created_by)
       VALUES (@docNo, @type, @movementDate, @productId, @sku, @productName, @qty, @balanceAfter,
               @refNo, @reason, @returnType, @remarks, @attachmentName,
               @counterId, @counterName, @createdBy)`,
      {
        docNo, type,
        movementDate: extra.date ? new Date(extra.date) : new Date(),
        productId, sku: product.sku, productName: product.name,
        qty, balanceAfter,
        refNo: extra.refNo ?? null,
        reason: extra.reason ?? null,
        returnType: extra.returnType ?? null,
        remarks: extra.remarks ?? null,
        attachmentName: extra.attachmentName ?? null,
        counterId: user.counterId ?? null,
        counterName: user.counterName ?? null,
        createdBy: user.name,
      }
    )
    return { docNo, product, balanceAfter }
  })
}

stockRouter.post('/stock-in', async (req, res, next) => {
  try {
    const { productId, qty, refNo, remarks, date, attachmentName } = req.body ?? {}
    const amount = Number(qty)
    if (!productId || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Select a product and enter a valid quantity.' })
    }
    const result = await applyMovement({
      user: req.user, type: 'IN', prefix: 'SI',
      productId: Number(productId), qty: amount, delta: amount,
      extra: { refNo, remarks, date, attachmentName },
    })
    if (result.error) return res.status(result.status).json({ error: result.error })

    await writeAudit('STOCK_IN',
      `${result.docNo}: +${amount} ${result.product.sku} (balance ${result.balanceAfter})`, req.user.name)
    res.status(201).json({ docNo: result.docNo, balanceAfter: result.balanceAfter })
  } catch (err) { next(err) }
})

stockRouter.post('/stock-out', async (req, res, next) => {
  try {
    const { productId, qty, reason, remarks, date } = req.body ?? {}
    const amount = Number(qty)
    if (!productId || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Select a product and enter a valid quantity.' })
    }
    if (!reason) return res.status(400).json({ error: 'A reason is required for stock out.' })

    const result = await applyMovement({
      user: req.user, type: 'OUT', prefix: 'SO',
      productId: Number(productId), qty: amount, delta: -amount,
      extra: { reason, remarks, date },
    })
    if (result.error) return res.status(result.status).json({ error: result.error })

    await writeAudit('STOCK_OUT',
      `${result.docNo}: -${amount} ${result.product.sku} (${reason})`, req.user.name)
    res.status(201).json({ docNo: result.docNo, balanceAfter: result.balanceAfter })
  } catch (err) { next(err) }
})

stockRouter.post('/stock-return', async (req, res, next) => {
  try {
    const { productId, qty, returnType, reason, remarks, date } = req.body ?? {}
    const amount = Number(qty)
    if (!productId || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Select a product and enter a valid quantity.' })
    }
    const VALID = ['Customer Return', 'Counter Return', 'Transfer Out']
    if (!VALID.includes(returnType)) {
      return res.status(400).json({ error: `returnType must be one of ${VALID.join(', ')}.` })
    }
    // Transfer Out sends stock away from the counter; the other two bring it back.
    const delta = returnType === 'Transfer Out' ? -amount : amount

    const result = await applyMovement({
      user: req.user, type: 'RETURN', prefix: 'RT',
      productId: Number(productId), qty: amount, delta,
      extra: { returnType, reason, remarks, date },
    })
    if (result.error) {
      const message = returnType === 'Transfer Out'
        ? 'Quantity Returned cannot exceed Current Stock for a Transfer Out.'
        : result.error
      return res.status(result.status).json({ error: message })
    }

    await writeAudit('STOCK_RETURN',
      `${result.docNo}: ${returnType} ${amount} ${result.product.sku}`, req.user.name)
    res.status(201).json({ docNo: result.docNo, balanceAfter: result.balanceAfter })
  } catch (err) { next(err) }
})
