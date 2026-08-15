import { Router } from 'express'
import { query, queryOne, sql } from '../db.js'
import { writeAudit } from '../audit.js'

export const catalogRouter = Router()

const PRODUCT_SELECT = `
  SELECT p.id, p.sku, p.name, p.description, p.category, p.uom,
         p.price, p.stock, p.min_stock, p.max_stock, p.status,
         p.image_url, p.created_by, p.created_at, p.updated_at,
         p.counter_id, c.name AS counter_name
    FROM dbo.products p
    LEFT JOIN dbo.counters c ON c.id = p.counter_id`

// ── Products ──────────────────────────────────────────────────────────────
catalogRouter.get('/products', async (req, res, next) => {
  try {
    const { status, category, counterId, search } = req.query
    const where = []
    const params = {}
    if (status)   { where.push('p.status = @status');         params.status = status }
    if (category) { where.push('p.category = @category');     params.category = category }
    if (counterId){ where.push('p.counter_id = @counterId');  params.counterId = Number(counterId) }
    if (search)   {
      where.push('(p.name LIKE @search OR p.sku LIKE @search)')
      params.search = `%${search}%`
    }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : ''
    res.json(await query(`${PRODUCT_SELECT}${clause} ORDER BY p.name`, params))
  } catch (err) { next(err) }
})

catalogRouter.get('/products/:id', async (req, res, next) => {
  try {
    const row = await queryOne(`${PRODUCT_SELECT} WHERE p.id = @id`, { id: Number(req.params.id) })
    if (!row) return res.status(404).json({ error: 'Product not found.' })
    res.json(row)
  } catch (err) { next(err) }
})

catalogRouter.post('/products', async (req, res, next) => {
  try {
    const b = req.body ?? {}
    if (!b.sku || !b.name || b.price == null) {
      return res.status(400).json({ error: 'sku, name and price are required.' })
    }
    if (await queryOne('SELECT id FROM dbo.products WHERE sku = @sku', { sku: b.sku })) {
      return res.status(409).json({ error: `SKU ${b.sku} already exists.` })
    }
    const row = await queryOne(
      `INSERT INTO dbo.products
         (sku, name, description, category, uom, price, stock, min_stock, max_stock,
          counter_id, status, image_url, created_by)
       OUTPUT inserted.id
       VALUES (@sku, @name, @description, @category, @uom, @price, @stock, @minStock,
               @maxStock, @counterId, @status, @imageUrl, @createdBy)`,
      {
        sku: b.sku,
        name: b.name,
        description: b.description ?? null,
        category: b.category ?? 'Others',
        uom: b.uom ?? 'Unit',
        price: { type: sql.Decimal(10, 2), value: b.price },
        // Opening stock is recorded directly; later changes must go through
        // the stock endpoints so the ledger stays authoritative.
        stock: Number(b.stock ?? 0),
        minStock: Number(b.minStock ?? 0),
        maxStock: b.maxStock == null ? null : Number(b.maxStock),
        counterId: b.counterId ?? null,
        status: b.status ?? 'Active',
        imageUrl: b.imageUrl ?? null,
        createdBy: req.user.name,
      }
    )
    await writeAudit('PRODUCT_CREATED', `${b.sku} — ${b.name}`, req.user.name)
    res.status(201).json(await queryOne(`${PRODUCT_SELECT} WHERE p.id = @id`, { id: row.id }))
  } catch (err) { next(err) }
})

catalogRouter.put('/products/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const b = req.body ?? {}
    const existing = await queryOne('SELECT sku, name FROM dbo.products WHERE id = @id', { id })
    if (!existing) return res.status(404).json({ error: 'Product not found.' })

    await query(
      `UPDATE dbo.products SET
         name = COALESCE(@name, name),
         description = COALESCE(@description, description),
         category = COALESCE(@category, category),
         uom = COALESCE(@uom, uom),
         price = COALESCE(@price, price),
         min_stock = COALESCE(@minStock, min_stock),
         max_stock = COALESCE(@maxStock, max_stock),
         counter_id = COALESCE(@counterId, counter_id),
         status = COALESCE(@status, status),
         image_url = COALESCE(@imageUrl, image_url),
         updated_at = getdate()
       WHERE id = @id`,
      {
        id,
        name: b.name ?? null,
        description: b.description ?? null,
        category: b.category ?? null,
        uom: b.uom ?? null,
        price: b.price == null ? null : { type: sql.Decimal(10, 2), value: b.price },
        minStock: b.minStock == null ? null : Number(b.minStock),
        maxStock: b.maxStock == null ? null : Number(b.maxStock),
        counterId: b.counterId ?? null,
        status: b.status ?? null,
        imageUrl: b.imageUrl ?? null,
      }
    )
    await writeAudit('PRODUCT_UPDATED', `${existing.sku} — ${b.name ?? existing.name}`, req.user.name)
    res.json(await queryOne(`${PRODUCT_SELECT} WHERE p.id = @id`, { id }))
  } catch (err) { next(err) }
})

catalogRouter.patch('/products/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body ?? {}
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ error: "status must be 'Active' or 'Inactive'." })
    }
    const existing = await queryOne('SELECT sku FROM dbo.products WHERE id = @id', { id })
    if (!existing) return res.status(404).json({ error: 'Product not found.' })

    await query('UPDATE dbo.products SET status = @status, updated_at = getdate() WHERE id = @id',
      { id, status })
    await writeAudit('PRODUCT_STATUS', `${existing.sku} set to ${status}`, req.user.name)
    res.json(await queryOne(`${PRODUCT_SELECT} WHERE p.id = @id`, { id }))
  } catch (err) { next(err) }
})

// ── Counters ──────────────────────────────────────────────────────────────
catalogRouter.get('/counters', async (_req, res, next) => {
  try {
    res.json(await query(
      `SELECT c.id, c.code, c.name, c.location, c.status,
              (SELECT COUNT(*) FROM dbo.products p WHERE p.counter_id = c.id) AS product_count
         FROM dbo.counters c ORDER BY c.code`))
  } catch (err) { next(err) }
})

catalogRouter.post('/counters', async (req, res, next) => {
  try {
    const { code, name, location, status } = req.body ?? {}
    if (!code || !name) return res.status(400).json({ error: 'code and name are required.' })
    const clash = await queryOne(
      'SELECT id FROM dbo.counters WHERE code = @code OR name = @name', { code, name })
    if (clash) return res.status(409).json({ error: 'A counter with that code or name exists.' })

    const row = await queryOne(
      `INSERT INTO dbo.counters (code, name, location, status)
       OUTPUT inserted.id VALUES (@code, @name, @location, @status)`,
      { code, name, location: location ?? null, status: status ?? 'Active' })
    await writeAudit('COUNTER_CREATED', `${code} — ${name}`, req.user.name)
    res.status(201).json(await queryOne('SELECT * FROM dbo.counters WHERE id = @id', { id: row.id }))
  } catch (err) { next(err) }
})

catalogRouter.put('/counters/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { code, name, location, status } = req.body ?? {}
    const existing = await queryOne('SELECT code FROM dbo.counters WHERE id = @id', { id })
    if (!existing) return res.status(404).json({ error: 'Counter not found.' })

    await query(
      `UPDATE dbo.counters SET
         code = COALESCE(@code, code), name = COALESCE(@name, name),
         location = COALESCE(@location, location), status = COALESCE(@status, status),
         updated_at = getdate()
       WHERE id = @id`,
      { id, code: code ?? null, name: name ?? null, location: location ?? null, status: status ?? null })
    await writeAudit('COUNTER_UPDATED', `${code ?? existing.code} — ${name ?? ''}`, req.user.name)
    res.json(await queryOne('SELECT * FROM dbo.counters WHERE id = @id', { id }))
  } catch (err) { next(err) }
})

// ── Lookups ───────────────────────────────────────────────────────────────
catalogRouter.get('/lookups', async (_req, res, next) => {
  try {
    const [categories, uoms, staff] = await Promise.all([
      query('SELECT name FROM dbo.categories ORDER BY sort_order, name'),
      query('SELECT name FROM dbo.units_of_measure ORDER BY id'),
      query("SELECT staff_code, name FROM dbo.staff WHERE status = 'Active' ORDER BY name"),
    ])
    res.json({
      categories: categories.map(r => r.name),
      unitsOfMeasure: uoms.map(r => r.name),
      staff,
    })
  } catch (err) { next(err) }
})

catalogRouter.get('/audit', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    res.json(await query(
      `SELECT TOP (@limit) id, action, detail, user_name, created_at
         FROM dbo.audit_log ORDER BY created_at DESC, id DESC`,
      { limit }))
  } catch (err) { next(err) }
})
