import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { api, qs } from '../api/client'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

// ── Row mappers ───────────────────────────────────────────────────────────
// The API speaks snake_case with numeric keys; the pages were written against
// the original camelCase seed shapes. Mapping here keeps both sides idiomatic
// and means a schema rename touches one file.

const mapProduct = row => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  description: row.description,
  category: row.category,
  uom: row.uom,
  price: Number(row.price),
  stock: row.stock,
  minStock: row.min_stock,
  maxStock: row.max_stock,
  counterId: row.counter_id,
  counter: row.counter_name,
  status: row.status,
  image: row.image_url,
  createdBy: row.created_by,
  createdDate: row.created_at,
})

const mapTransaction = row => ({
  // `id` is the receipt number the UI prints and filters on; `dbId` is the
  // surrogate key the API needs for writes.
  id: row.tx_no,
  dbId: row.id,
  dateTime: row.tx_datetime,
  status: row.status,
  staff: row.staff_name,
  counter: row.counter_name,
  payment: row.payment_method,
  subtotal: Number(row.subtotal),
  discount: Number(row.discount),
  total: Number(row.total),
  cashReceived: row.cash_received == null ? undefined : Number(row.cash_received),
  changeDue: row.change_due == null ? undefined : Number(row.change_due),
  itemCount: row.item_count,
  items: (row.items ?? []).map(i => ({
    id: i.product_id,
    sku: i.sku,
    name: i.name,
    qty: i.qty,
    unitPrice: Number(i.unit_price),
  })),
  refund: row.refund_reason
    ? { reason: row.refund_reason, date: row.refund_at, by: row.refund_by }
    : undefined,
})

const mapMovement = row => ({
  id: row.id,
  no: row.doc_no,
  type: row.type,
  date: row.movement_date,
  productId: row.product_id,
  sku: row.sku,
  productName: row.product_name,
  qty: row.qty,
  balanceAfter: row.balance_after,
  refNo: row.ref_no,
  reason: row.reason,
  returnType: row.return_type,
  remarks: row.remarks,
  attachmentName: row.attachment_name,
  counter: row.counter_name,
  createdBy: row.created_by,
})

const mapAudit = row => ({
  id: row.id,
  time: row.created_at,
  user: row.user_name,
  action: row.action,
  detail: row.detail,
})

export function StoreProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [movements, setMovements] = useState([])
  const [counters, setCounters] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [lookups, setLookups] = useState({ categories: [], unitsOfMeasure: [], staff: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setError(null)
    try {
      const [p, t, m, c, a, l] = await Promise.all([
        api.get('/products'),
        api.get('/transactions' + qs({ limit: 200 })),
        api.get('/movements' + qs({ limit: 200 })),
        api.get('/counters'),
        api.get('/audit' + qs({ limit: 100 })),
        api.get('/lookups'),
      ])
      setProducts(p.map(mapProduct))
      setTransactions(t.map(mapTransaction))
      setMovements(m.map(mapMovement))
      setCounters(c)
      setAuditLog(a.map(mapAudit))
      setLookups(l)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      refresh()
    } else {
      setProducts([]); setTransactions([]); setMovements([]); setCounters([]); setAuditLog([])
      setLoading(false)
    }
  }, [isAuthenticated, refresh])

  // Writes go to the server, then re-read. The server owns stock arithmetic
  // and document numbering, so there is no optimistic local copy to drift.
  const counterIdFor = useCallback(
    name => counters.find(c => c.name === name)?.id ?? null,
    [counters]
  )

  const saveProduct = useCallback(async product => {
    const body = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      uom: product.uom,
      price: Number(product.price),
      minStock: Number(product.minStock ?? 0),
      maxStock: product.maxStock == null ? null : Number(product.maxStock),
      counterId: product.counterId ?? counterIdFor(product.counter),
      status: product.status,
      imageUrl: product.image,
    }
    if (product.id) await api.put(`/products/${product.id}`, body)
    else await api.post('/products', { ...body, stock: Number(product.stock ?? 0) })
    await refresh()
  }, [counterIdFor, refresh])

  const setProductStatus = useCallback(async (id, status) => {
    await api.patch(`/products/${id}/status`, { status })
    await refresh()
  }, [refresh])

  const saveCounter = useCallback(async counter => {
    const body = {
      code: counter.code,
      name: counter.name,
      location: counter.location,
      status: counter.status,
    }
    if (counter.id) await api.put(`/counters/${counter.id}`, body)
    else await api.post('/counters', body)
    await refresh()
  }, [refresh])

  const setCounterStatus = useCallback(async (id, status) => {
    await api.put(`/counters/${id}`, { status })
    await refresh()
  }, [refresh])

  // Stock helpers resolve to { error, docNo }. The document number is
  // assigned by the server sequence, so the caller must display what comes
  // back rather than predicting the next one locally.
  const postMovement = useCallback(async (path, payload) => {
    try {
      const result = await api.post(path, payload)
      await refresh()
      return { error: null, docNo: result.docNo, balanceAfter: result.balanceAfter }
    } catch (err) {
      return { error: err.message, docNo: null }
    }
  }, [refresh])

  const stockIn = useCallback(p => postMovement('/stock-in', p), [postMovement])
  const stockOut = useCallback(p => postMovement('/stock-out', p), [postMovement])
  const returnStock = useCallback(p => postMovement('/stock-return', p), [postMovement])

  const recordSale = useCallback(async ({ items, discount, total, payment, cashReceived, changeDue }) => {
    const created = await api.post('/sales', {
      items: items.map(i => ({ productId: i.id, qty: i.quantity })),
      discount,
      payment,
      cashReceived,
      changeDue,
    })
    await refresh()
    return mapTransaction(created)
  }, [refresh])

  const refundTransaction = useCallback(async (txNo, reason) => {
    const target = transactions.find(t => t.id === txNo)
    if (!target) return 'Transaction not found.'
    try {
      await api.post(`/transactions/${target.dbId}/refund`, { reason })
      await refresh()
      return null
    } catch (err) { return err.message }
  }, [transactions, refresh])

  const value = useMemo(() => ({
    products, transactions, movements, counters, auditLog, lookups,
    loading, error, refresh,
    saveProduct, setProductStatus, saveCounter, setCounterStatus,
    stockIn, stockOut, returnStock, recordSale, refundTransaction,
  }), [
    products, transactions, movements, counters, auditLog, lookups, loading, error,
    refresh, saveProduct, setProductStatus, saveCounter, setCounterStatus,
    stockIn, stockOut, returnStock, recordSale, refundTransaction,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
