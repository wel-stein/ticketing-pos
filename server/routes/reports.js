import { Router } from 'express'
import { query, queryOne } from '../db.js'

export const reportsRouter = Router()

// Refunded and cancelled sales are excluded from revenue but still counted
// separately, so the totals reconcile against the transaction list.
const REVENUE_FILTER = "t.status = 'Completed'"

reportsRouter.get('/reports/summary', async (req, res, next) => {
  try {
    const params = dateParams(req.query)
    const range = dateClause(req.query, 't.tx_datetime')

    const [totals, byPayment, byCounter, byStaff] = await Promise.all([
      queryOne(
        `SELECT
           COUNT(*)                                            AS transaction_count,
           ISNULL(SUM(CASE WHEN ${REVENUE_FILTER} THEN t.total END), 0)    AS revenue,
           ISNULL(SUM(CASE WHEN ${REVENUE_FILTER} THEN t.discount END), 0) AS discounts,
           SUM(CASE WHEN t.status = 'Refunded'  THEN 1 ELSE 0 END)         AS refunded_count,
           ISNULL(SUM(CASE WHEN t.status = 'Refunded' THEN t.total END),0) AS refunded_value,
           SUM(CASE WHEN t.status = 'Cancelled' THEN 1 ELSE 0 END)         AS cancelled_count
         FROM dbo.transactions t${range}`, params),
      query(
        `SELECT t.payment_method, COUNT(*) AS count_, ISNULL(SUM(t.total), 0) AS amount
           FROM dbo.transactions t${range ? `${range} AND` : ' WHERE'} ${REVENUE_FILTER}
          GROUP BY t.payment_method ORDER BY amount DESC`, params),
      query(
        `SELECT ISNULL(t.counter_name, N'(unassigned)') AS counter_name,
                COUNT(*) AS count_, ISNULL(SUM(t.total), 0) AS amount
           FROM dbo.transactions t${range ? `${range} AND` : ' WHERE'} ${REVENUE_FILTER}
          GROUP BY t.counter_name ORDER BY amount DESC`, params),
      query(
        `SELECT ISNULL(t.staff_name, N'(unknown)') AS staff_name,
                COUNT(*) AS count_, ISNULL(SUM(t.total), 0) AS amount
           FROM dbo.transactions t${range ? `${range} AND` : ' WHERE'} ${REVENUE_FILTER}
          GROUP BY t.staff_name ORDER BY amount DESC`, params),
    ])

    res.json({ totals, byPayment, byCounter, byStaff })
  } catch (err) { next(err) }
})

reportsRouter.get('/reports/top-products', async (req, res, next) => {
  try {
    const params = { ...dateParams(req.query), limit: Math.min(Number(req.query.limit) || 10, 100) }
    const range = dateClause(req.query, 't.tx_datetime')
    res.json(await query(
      `SELECT TOP (@limit) i.sku, i.name,
              SUM(i.qty) AS units_sold, SUM(i.line_total) AS revenue
         FROM dbo.transaction_items i
         JOIN dbo.transactions t ON t.id = i.transaction_id
        ${range ? `${range} AND` : ' WHERE'} ${REVENUE_FILTER}
        GROUP BY i.sku, i.name
        ORDER BY revenue DESC`, params))
  } catch (err) { next(err) }
})

reportsRouter.get('/reports/daily-sales', async (req, res, next) => {
  try {
    const params = dateParams(req.query)
    const range = dateClause(req.query, 't.tx_datetime')
    res.json(await query(
      `SELECT CONVERT(date, t.tx_datetime) AS sale_date,
              COUNT(*) AS transaction_count, ISNULL(SUM(t.total), 0) AS revenue
         FROM dbo.transactions t
        ${range ? `${range} AND` : ' WHERE'} ${REVENUE_FILTER}
        GROUP BY CONVERT(date, t.tx_datetime)
        ORDER BY sale_date DESC`, params))
  } catch (err) { next(err) }
})

reportsRouter.get('/reports/stock-levels', async (req, res, next) => {
  try {
    res.json(await query(
      `SELECT p.sku, p.name, p.category, p.stock, p.min_stock, p.max_stock,
              p.price, c.name AS counter_name,
              CASE WHEN p.stock = 0 THEN 'Out of Stock'
                   WHEN p.stock <= p.min_stock THEN 'Low Stock'
                   ELSE 'In Stock' END AS stock_status
         FROM dbo.products p
         LEFT JOIN dbo.counters c ON c.id = p.counter_id
        WHERE p.status = 'Active'
        ORDER BY CASE WHEN p.stock = 0 THEN 0
                      WHEN p.stock <= p.min_stock THEN 1 ELSE 2 END, p.name`))
  } catch (err) { next(err) }
})

function dateParams({ from, to }) {
  const params = {}
  if (from) params.from = new Date(from)
  if (to) params.to = new Date(to)
  return params
}

function dateClause({ from, to }, column) {
  const parts = []
  if (from) parts.push(`${column} >= @from`)
  if (to) parts.push(`${column} < DATEADD(day, 1, @to)`)
  return parts.length ? ` WHERE ${parts.join(' AND ')}` : ''
}
