import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  SEED_PRODUCTS, SEED_TRANSACTIONS, SEED_MOVEMENTS, SEED_COUNTERS,
  CURRENT_USER, CURRENT_COUNTER,
} from '../data'

const StoreContext = createContext(null)

// v2: suppliers replaced by counters (older v1 state is incompatible).
const STORAGE_KEY = 'manjalink-store-v2'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.products && parsed.transactions && parsed.movements && parsed.counters) return parsed
    }
  } catch {
    // Corrupted persisted state — fall back to seed data.
  }
  return {
    products: SEED_PRODUCTS,
    transactions: SEED_TRANSACTIONS,
    movements: SEED_MOVEMENTS,
    counters: SEED_COUNTERS,
    auditLog: [],
  }
}

const pad = (n, len = 4) => String(n).padStart(len, '0')

function nextDocNo(movements, prefix) {
  const max = movements
    .filter(m => m.no?.startsWith(prefix))
    .reduce((acc, m) => Math.max(acc, parseInt(m.no.slice(prefix.length + 1), 10) || 0), 0)
  return `${prefix}-${pad(max + 1)}`
}

function nextTxId(transactions) {
  const max = transactions.reduce((acc, t) => Math.max(acc, parseInt(t.id.replace('TX-', ''), 10) || 0), 88291)
  return `TX-${max + 1}`
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
      // Storage full or unavailable — app keeps working in memory.
    }
  }, [store])

  const audit = (action, detail) => ({
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toISOString(),
    user: CURRENT_USER.name,
    action,
    detail,
  })

  const saveProduct = useCallback((product) => {
    setStore(prev => {
      const exists = prev.products.some(p => p.id === product.id)
      const products = exists
        ? prev.products.map(p => (p.id === product.id ? { ...p, ...product } : p))
        : [{
            ...product,
            id: product.id || `p${Date.now()}`,
            status: product.status || 'Active',
            createdDate: new Date().toISOString(),
            createdBy: CURRENT_USER.name,
          }, ...prev.products]
      return {
        ...prev,
        products,
        auditLog: [audit(exists ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED', `${product.sku} — ${product.name}`), ...prev.auditLog],
      }
    })
  }, [])

  const setProductStatus = useCallback((id, status) => {
    setStore(prev => {
      const product = prev.products.find(p => p.id === id)
      if (!product) return prev
      return {
        ...prev,
        products: prev.products.map(p => (p.id === id ? { ...p, status } : p)),
        auditLog: [audit('PRODUCT_STATUS', `${product.sku} set to ${status}`), ...prev.auditLog],
      }
    })
  }, [])

  const saveCounter = useCallback((counter) => {
    setStore(prev => {
      const existing = prev.counters.find(c => c.id === counter.id)
      if (existing) {
        // Cascade a rename to products assigned to this counter; historical
        // movements and transactions keep the name they were recorded under.
        const products = existing.name !== counter.name
          ? prev.products.map(p => (p.counter === existing.name ? { ...p, counter: counter.name } : p))
          : prev.products
        return {
          ...prev,
          products,
          counters: prev.counters.map(c => (c.id === counter.id ? { ...c, ...counter } : c)),
          auditLog: [audit('COUNTER_UPDATED', `${counter.code} — ${counter.name}`), ...prev.auditLog],
        }
      }
      return {
        ...prev,
        counters: [...prev.counters, { ...counter, id: counter.id || `c${Date.now()}`, status: counter.status || 'Active' }],
        auditLog: [audit('COUNTER_CREATED', `${counter.code} — ${counter.name}`), ...prev.auditLog],
      }
    })
  }, [])

  const setCounterStatus = useCallback((id, status) => {
    setStore(prev => {
      const counter = prev.counters.find(c => c.id === id)
      if (!counter) return prev
      return {
        ...prev,
        counters: prev.counters.map(c => (c.id === id ? { ...c, status } : c)),
        auditLog: [audit('COUNTER_STATUS', `${counter.code} set to ${status}`), ...prev.auditLog],
      }
    })
  }, [])

  const stockIn = useCallback(({ productId, qty, counter, refNo, remarks, date, attachmentName }) => {
    setStore(prev => {
      const product = prev.products.find(p => p.id === productId)
      if (!product || qty <= 0) return prev
      const balanceAfter = product.stock + qty
      const movement = {
        id: `m${Date.now()}`, no: nextDocNo(prev.movements, 'SI'), type: 'IN',
        date: date || new Date().toISOString(), productId, sku: product.sku, productName: product.name,
        qty, balanceAfter, refNo, remarks, attachmentName,
        createdBy: CURRENT_USER.name, counter: counter || CURRENT_COUNTER,
      }
      return {
        ...prev,
        products: prev.products.map(p => (p.id === productId ? { ...p, stock: balanceAfter } : p)),
        movements: [movement, ...prev.movements],
        auditLog: [audit('STOCK_IN', `${movement.no}: +${qty} ${product.sku} (balance ${balanceAfter})`), ...prev.auditLog],
      }
    })
  }, [])

  const stockOut = useCallback(({ productId, qty, reason, remarks, date }) => {
    // Validate against current state before queueing the update — updater
    // functions run later, so they cannot return errors to the caller.
    const current = store.products.find(p => p.id === productId)
    if (!current || qty <= 0) return 'Select a product and enter a valid quantity.'
    if (qty > current.stock) return 'Quantity Out cannot exceed Current Stock.'
    setStore(prev => {
      const product = prev.products.find(p => p.id === productId)
      if (!product || qty > product.stock) return prev
      const balanceAfter = product.stock - qty
      const movement = {
        id: `m${Date.now()}`, no: nextDocNo(prev.movements, 'SO'), type: 'OUT',
        date: date || new Date().toISOString(), productId, sku: product.sku, productName: product.name,
        qty, balanceAfter, reason, remarks,
        createdBy: CURRENT_USER.name, counter: CURRENT_COUNTER,
      }
      return {
        ...prev,
        products: prev.products.map(p => (p.id === productId ? { ...p, stock: balanceAfter } : p)),
        movements: [movement, ...prev.movements],
        auditLog: [audit('STOCK_OUT', `${movement.no}: -${qty} ${product.sku} (${reason})`), ...prev.auditLog],
      }
    })
    return null
  }, [store.products])

  const returnStock = useCallback(({ productId, qty, returnType, reason, remarks, date }) => {
    // Transfer Out sends stock away from the counter (stock down); customer
    // and counter returns come back in (stock up).
    const current = store.products.find(p => p.id === productId)
    if (!current || qty <= 0) return 'Select a product and enter a valid quantity.'
    if (returnType === 'Transfer Out' && qty > current.stock) {
      return 'Quantity Returned cannot exceed Current Stock for a Transfer Out.'
    }
    setStore(prev => {
      const product = prev.products.find(p => p.id === productId)
      if (!product) return prev
      const delta = returnType === 'Transfer Out' ? -qty : qty
      if (product.stock + delta < 0) return prev
      const balanceAfter = product.stock + delta
      const movement = {
        id: `m${Date.now()}`, no: nextDocNo(prev.movements, 'RT'), type: 'RETURN',
        date: date || new Date().toISOString(), productId, sku: product.sku, productName: product.name,
        qty, balanceAfter, returnType, reason, remarks,
        createdBy: CURRENT_USER.name, counter: CURRENT_COUNTER,
      }
      return {
        ...prev,
        products: prev.products.map(p => (p.id === productId ? { ...p, stock: balanceAfter } : p)),
        movements: [movement, ...prev.movements],
        auditLog: [audit('STOCK_RETURN', `${movement.no}: ${returnType} ${qty} ${product.sku}`), ...prev.auditLog],
      }
    })
    return null
  }, [store.products])

  const recordSale = useCallback(({ items, subtotal, discount, total, payment, cashReceived, changeDue }) => {
    // Build the transaction outside the updater so it can be returned to the
    // caller (the updater itself runs asynchronously).
    const tx = {
      id: nextTxId(store.transactions),
      dateTime: new Date().toISOString(),
      status: 'Completed',
      staff: CURRENT_USER.name, staffId: CURRENT_USER.id, counter: CURRENT_COUNTER,
      payment, subtotal, discount, total, cashReceived, changeDue,
      items: items.map(i => ({ id: i.id, sku: i.sku, name: i.name, qty: i.quantity, unitPrice: i.price })),
    }
    setStore(prev => {
      const products = prev.products.map(p => {
        const sold = items.find(i => i.id === p.id)
        return sold ? { ...p, stock: Math.max(0, p.stock - sold.quantity) } : p
      })
      const saleMovements = items.map((i, idx) => {
        const product = products.find(p => p.id === i.id)
        return {
          id: `m${Date.now()}-${idx}`, no: tx.id, type: 'SALE',
          date: tx.dateTime, productId: i.id, sku: i.sku, productName: i.name,
          qty: i.quantity, balanceAfter: product ? product.stock : 0,
          reason: 'Sales Transaction', remarks: `Receipt ${tx.id}`,
          createdBy: CURRENT_USER.name, counter: CURRENT_COUNTER,
        }
      })
      return {
        ...prev,
        products,
        transactions: [tx, ...prev.transactions],
        movements: [...saleMovements, ...prev.movements],
        auditLog: [audit('SALE_COMPLETED', `${tx.id}: ${payment} RM${total.toFixed(2)}`), ...prev.auditLog],
      }
    })
    return tx
  }, [store.transactions])

  const refundTransaction = useCallback((txId, reason) => {
    setStore(prev => {
      const tx = prev.transactions.find(t => t.id === txId)
      if (!tx || tx.status !== 'Completed') return prev
      const refundDate = new Date().toISOString()
      // Refunded quantities go back to inventory (SRS #F005).
      const products = prev.products.map(p => {
        const item = tx.items.find(i => i.id === p.id)
        return item ? { ...p, stock: p.stock + item.qty } : p
      })
      const rtBase = parseInt(nextDocNo(prev.movements, 'RT').slice(3), 10)
      const refundMovements = tx.items
        .filter(i => prev.products.some(p => p.id === i.id))
        .map((i, idx) => {
          const product = products.find(p => p.id === i.id)
          return {
            id: `m${Date.now()}-${idx}`, no: `RT-${pad(rtBase + idx)}`, type: 'RETURN',
            date: refundDate, productId: i.id, sku: i.sku, productName: i.name,
            qty: i.qty, balanceAfter: product.stock,
            returnType: 'Customer Return', reason: `Refund ${txId}: ${reason}`, remarks: '',
            createdBy: CURRENT_USER.name, counter: CURRENT_COUNTER,
          }
        })
      return {
        ...prev,
        products,
        transactions: prev.transactions.map(t =>
          t.id === txId
            ? { ...t, status: 'Refunded', refund: { reason, date: refundDate, by: CURRENT_USER.name } }
            : t
        ),
        movements: [...refundMovements, ...prev.movements],
        auditLog: [audit('REFUND_ISSUED', `${txId}: ${reason} (RM${tx.total.toFixed(2)})`), ...prev.auditLog],
      }
    })
  }, [])

  const value = {
    products: store.products,
    transactions: store.transactions,
    movements: store.movements,
    counters: store.counters,
    auditLog: store.auditLog,
    saveProduct,
    setProductStatus,
    saveCounter,
    setCounterStatus,
    stockIn,
    stockOut,
    returnStock,
    recordSale,
    refundTransaction,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
