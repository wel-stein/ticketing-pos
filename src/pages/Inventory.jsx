import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { CATEGORIES, UNITS_OF_MEASURE, STOCK_OUT_REASONS, RETURN_TYPES, CURRENT_COUNTER } from '../data'
import { fmtRM, fmtDate, fmtDateTime } from '../utils/format'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const TABS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Stock Dashboard' },
  { id: 'stock-in', icon: 'input', label: 'Stock In' },
  { id: 'stock-out', icon: 'output', label: 'Stock Out' },
  { id: 'returns', icon: 'assignment_return', label: 'Return Stock' },
  { id: 'movements', icon: 'receipt_long', label: 'Movement History' },
]

const MOVEMENT_BADGES = {
  IN: 'bg-secondary-container text-on-secondary-container',
  OUT: 'bg-error-container text-on-error-container',
  RETURN: 'bg-tertiary-fixed/50 text-tertiary',
  SALE: 'bg-primary-fixed text-on-primary-fixed-variant',
}

function StockBar({ stock, minStock, maxStock }) {
  const pct = maxStock > 0 ? Math.min(100, Math.round((stock / maxStock) * 100)) : 0
  let color = 'bg-secondary'
  let textColor = 'text-secondary'
  let label = 'Optimal'
  if (stock === 0) { color = 'bg-error'; textColor = 'text-error'; label = 'Out of Stock' }
  else if (stock <= minStock) { color = 'bg-tertiary'; textColor = 'text-tertiary'; label = 'Low Stock' }
  else if (pct < 50) { color = 'bg-secondary'; textColor = 'text-secondary'; label = 'Good' }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className={stock === 0 ? 'text-error' : ''}>{stock.toLocaleString()} Units</span>
        <span className={textColor}>{label}</span>
      </div>
      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CategoryPill({ category }) {
  const colors = {
    'Souvenirs': 'bg-primary-fixed text-on-primary-fixed-variant',
    'Mini Bus Models': 'bg-secondary-container/50 text-on-secondary-container',
    'Manja SIM': 'bg-tertiary-fixed/50 text-on-tertiary-fixed-variant',
    'Promotional Items': 'bg-surface-container-highest text-on-surface-variant',
    'Others': 'bg-surface-container-high text-on-surface-variant',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[category] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
      {category}
    </span>
  )
}

const FIELD_CLS = 'w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant'
const LABEL_CLS = 'font-mono text-label-md text-on-surface-variant'

function Field({ label, children, required }) {
  return (
    <div className="space-y-2">
      <label className={LABEL_CLS}>{label} {required && '*'}</label>
      {children}
    </div>
  )
}

const EMPTY_PRODUCT_FORM = {
  id: null, name: '', description: '', sku: '', category: CATEGORIES[0],
  price: '', stock: '', minStock: '', counter: CURRENT_COUNTER, status: 'Active',
  uom: UNITS_OF_MEASURE[0], image: '',
}

function ProductDrawer({ initial, onClose, onSave }) {
  const { counters } = useStore()
  const [form, setForm] = useState(initial)
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const isEdit = Boolean(form.id)

  const handleSave = () => {
    if (!form.name || !form.sku) return
    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 0,
      maxStock: form.maxStock ?? Math.max((parseInt(form.stock) || 0) * 2, 100),
      image: form.image || 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop&q=80',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-surface flex flex-col modal-shadow">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-surface">{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form className="flex-1 overflow-y-auto p-6 space-y-5" onSubmit={e => e.preventDefault()}>
          <Field label="Product Image URL">
            <input className={FIELD_CLS} placeholder="https://…" value={form.image} onChange={set('image')} />
            {form.image && (
              <div className="w-full h-36 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant">
                <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
              </div>
            )}
          </Field>
          <Field label="Product Name" required>
            <input className={FIELD_CLS} placeholder="e.g. Mini Bus Model" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Product Description">
            <textarea className={`${FIELD_CLS} resize-none`} rows={2} placeholder="Short description…" value={form.description} onChange={set('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU" required>
              <input className={`${FIELD_CLS} font-mono`} placeholder="MBM-000" value={form.sku} onChange={set('sku')} />
            </Field>
            <Field label="Category">
              <select className={FIELD_CLS} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Unit Price (RM)">
              <input type="number" step="0.01" className={`${FIELD_CLS} font-mono`} placeholder="0.00" value={form.price} onChange={set('price')} />
            </Field>
            <Field label="Unit of Measure">
              <select className={FIELD_CLS} value={form.uom} onChange={set('uom')}>
                {UNITS_OF_MEASURE.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={isEdit ? 'Current Stock' : 'Initial Stock'}>
              <input type="number" className={`${FIELD_CLS} font-mono`} placeholder="0" value={form.stock} onChange={set('stock')} disabled={isEdit} />
            </Field>
            <Field label="Low Stock Threshold">
              <input type="number" className={`${FIELD_CLS} font-mono`} placeholder="10" value={form.minStock} onChange={set('minStock')} />
            </Field>
          </div>
          <Field label="Counter">
            <select className={FIELD_CLS} value={form.counter} onChange={set('counter')}>
              {counters.filter(c => c.status === 'Active' || c.name === form.counter).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className={FIELD_CLS} value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
          {isEdit && (
            <p className="text-label-sm font-mono text-on-surface-variant">
              Created {fmtDate(initial.createdDate)} by {initial.createdBy}. Use Stock In / Stock Out to adjust stock.
            </p>
          )}
        </form>

        <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors font-mono text-label-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.sku}
            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold disabled:opacity-40"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardTab({ onEdit, onAdd }) {
  const { products, setProductStatus } = useStore()
  const [searchQuery, setSearchQuery] = useState('')

  const active = products.filter(p => p.status === 'Active')
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  const newThisWeek = active.filter(p => new Date(p.createdDate).getTime() >= weekAgo).length
  const lowStock = active.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStock = active.filter(p => p.stock === 0).length

  const filtered = products.filter(item => {
    const q = searchQuery.toLowerCase()
    return !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  })

  return (
    <>
      {/* Inventory dashboard summary (SRS #F002) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center justify-between card-shadow">
          <div>
            <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Items</p>
            <h3 className="text-headline-lg font-semibold">{active.length.toLocaleString()}</h3>
            <p className="text-secondary text-sm font-medium mt-1">+{newThisWeek} this week</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">inventory</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center justify-between card-shadow">
          <div>
            <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <h3 className="text-headline-lg font-semibold text-tertiary">{lowStock}</h3>
            <p className="text-tertiary text-sm font-medium mt-1">Requires attention</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center justify-between card-shadow">
          <div>
            <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Out of Stock</p>
            <h3 className="text-headline-lg font-semibold text-error">{outOfStock}</h3>
            <p className="text-error text-sm font-medium mt-1">Immediate restock needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-2xl">block</span>
          </div>
        </div>
      </section>

      {/* Product master table */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none"
              placeholder="Search by SKU, Name, or Category…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                {['SKU', 'Product Name', 'Category', 'Stock Level', 'Min Stock', 'Unit Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 font-mono text-label-md text-on-surface-variant uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-surface-container transition-colors group ${item.status === 'Inactive' ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4 font-mono text-label-md text-primary">{item.sku}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-on-surface block truncate">{item.name}</span>
                        <span className="text-label-sm font-mono text-on-surface-variant">{item.uom} · {item.counter}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <CategoryPill category={item.category} />
                  </td>
                  <td className="px-5 py-4 min-w-[160px]">
                    <StockBar stock={item.stock} minStock={item.minStock} maxStock={item.maxStock} />
                  </td>
                  <td className="px-5 py-4 font-mono text-label-md">{item.minStock}</td>
                  <td className="px-5 py-4 font-mono text-label-md font-medium">{fmtRM(item.price)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${
                      item.status === 'Active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit product"
                      className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => setProductStatus(item.id, item.status === 'Active' ? 'Inactive' : 'Active')}
                      title={item.status === 'Active' ? 'Deactivate' : 'Activate'}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.status === 'Active' ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant opacity-50">
                    No items match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
          <span className="text-sm text-on-surface-variant">
            Showing {filtered.length} of {products.length} items
          </span>
        </div>
      </section>
    </>
  )
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function MovementHistoryTable({ title, movements, columns }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant">
        <h3 className="text-title-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              {columns.map(c => (
                <th key={c.label} className="px-5 py-3 font-mono text-label-md text-on-surface-variant uppercase tracking-wider">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {movements.map(m => (
              <tr key={m.id} className="hover:bg-surface-container transition-colors">
                {columns.map(c => (
                  <td key={c.label} className="px-5 py-3 text-body-md">{c.render(m)}</td>
                ))}
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-on-surface-variant opacity-50">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StockInTab() {
  const { products, movements, counters, stockIn } = useStore()
  const [form, setForm] = useState({ productId: '', qty: '', counter: CURRENT_COUNTER, refNo: '', remarks: '', date: todayInput(), attachmentName: '' })
  const [savedNo, setSavedNo] = useState(null)

  const product = products.find(p => p.id === form.productId)
  const qty = parseInt(form.qty) || 0
  const docNo = useMemo(() => {
    const max = movements.filter(m => m.no?.startsWith('SI')).reduce((a, m) => Math.max(a, parseInt(m.no.slice(3), 10) || 0), 0)
    return `SI-${String(max + 1).padStart(4, '0')}`
  }, [movements])

  const submit = () => {
    if (!product || qty <= 0) return
    stockIn({
      productId: product.id, qty, counter: form.counter, refNo: form.refNo,
      remarks: form.remarks, date: new Date(form.date).toISOString(), attachmentName: form.attachmentName,
    })
    setSavedNo(docNo)
    setForm({ productId: '', qty: '', counter: CURRENT_COUNTER, refNo: '', remarks: '', date: todayInput(), attachmentName: '' })
  }

  const history = movements.filter(m => m.type === 'IN')

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">input</span>
            Stock In Form
          </h3>
          {savedNo && (
            <span className="text-secondary text-label-md font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {savedNo} recorded — stock updated.
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Stock In No.">
            <input className={`${FIELD_CLS} font-mono`} value={docNo} disabled />
          </Field>
          <Field label="Stock In Date">
            <input type="date" className={FIELD_CLS} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Product Name" required>
            <select className={FIELD_CLS} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="SKU">
            <input className={`${FIELD_CLS} font-mono`} value={product?.sku ?? ''} disabled />
          </Field>
          <Field label="Current Stock">
            <input className={`${FIELD_CLS} font-mono`} value={product ? product.stock : ''} disabled />
          </Field>
          <Field label="Quantity Received" required>
            <input type="number" min="1" className={`${FIELD_CLS} font-mono`} placeholder="0" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
          </Field>
          <Field label="New Stock Balance">
            <input className={`${FIELD_CLS} font-mono`} value={product && qty > 0 ? product.stock + qty : ''} disabled />
          </Field>
          <Field label="Counter">
            <select className={FIELD_CLS} value={form.counter} onChange={e => setForm(f => ({ ...f, counter: e.target.value }))}>
              {counters.filter(c => c.status === 'Active').map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Reference No.">
            <input className={`${FIELD_CLS} font-mono`} placeholder="PO-2026-0000" value={form.refNo} onChange={e => setForm(f => ({ ...f, refNo: e.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <input className={FIELD_CLS} placeholder="Optional notes…" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </Field>
          </div>
          <Field label="Attachment (Optional)">
            <input
              type="file"
              className={`${FIELD_CLS} file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-surface-container-highest file:text-label-md file:font-mono`}
              onChange={e => setForm(f => ({ ...f, attachmentName: e.target.files?.[0]?.name ?? '' }))}
            />
          </Field>
        </div>
        <button
          onClick={submit}
          disabled={!product || qty <= 0}
          className="px-8 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold disabled:opacity-40"
        >
          Submit
        </button>
      </section>

      <MovementHistoryTable
        title="Stock In History"
        movements={history}
        columns={[
          { label: 'Stock In No.', render: m => <span className="font-mono text-primary">{m.no}</span> },
          { label: 'Date', render: m => fmtDate(m.date) },
          { label: 'Product', render: m => <span>{m.productName} <span className="font-mono text-label-sm text-on-surface-variant">({m.sku})</span></span> },
          { label: 'Quantity', render: m => <span className="font-mono text-secondary">+{m.qty}</span> },
          { label: 'Counter', render: m => m.counter ?? '—' },
          { label: 'Created By', render: m => m.createdBy },
        ]}
      />
    </>
  )
}

function StockOutTab() {
  const { products, movements, stockOut } = useStore()
  const [form, setForm] = useState({ productId: '', qty: '', reason: STOCK_OUT_REASONS[0], remarks: '', date: todayInput() })
  const [message, setMessage] = useState(null)

  const product = products.find(p => p.id === form.productId)
  const qty = parseInt(form.qty) || 0
  const exceeds = product && qty > product.stock
  const docNo = useMemo(() => {
    const max = movements.filter(m => m.no?.startsWith('SO')).reduce((a, m) => Math.max(a, parseInt(m.no.slice(3), 10) || 0), 0)
    return `SO-${String(max + 1).padStart(4, '0')}`
  }, [movements])

  const submit = () => {
    if (!product || qty <= 0 || exceeds) return
    const error = stockOut({
      productId: product.id, qty, reason: form.reason, remarks: form.remarks,
      date: new Date(form.date).toISOString(),
    })
    setMessage(error ? { type: 'error', text: error } : { type: 'ok', text: `${docNo} recorded — stock updated.` })
    if (!error) setForm({ productId: '', qty: '', reason: STOCK_OUT_REASONS[0], remarks: '', date: todayInput() })
  }

  const history = movements.filter(m => m.type === 'OUT')

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-error">output</span>
            Stock Out Form
          </h3>
          {message && (
            <span className={`text-label-md font-mono flex items-center gap-1 ${message.type === 'ok' ? 'text-secondary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[16px]">{message.type === 'ok' ? 'check_circle' : 'error'}</span>
              {message.text}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Stock Out No.">
            <input className={`${FIELD_CLS} font-mono`} value={docNo} disabled />
          </Field>
          <Field label="Stock Out Date">
            <input type="date" className={FIELD_CLS} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Product Name" required>
            <select className={FIELD_CLS} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="SKU">
            <input className={`${FIELD_CLS} font-mono`} value={product?.sku ?? ''} disabled />
          </Field>
          <Field label="Current Stock">
            <input className={`${FIELD_CLS} font-mono`} value={product ? product.stock : ''} disabled />
          </Field>
          <Field label="Quantity Out" required>
            <input
              type="number" min="1" max={product?.stock}
              className={`${FIELD_CLS} font-mono ${exceeds ? 'border-error ring-1 ring-error' : ''}`}
              placeholder="0" value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
            />
            {exceeds && <p className="text-error text-label-sm font-mono">Quantity Out cannot exceed Current Stock ({product.stock}).</p>}
          </Field>
          <Field label="Reason" required>
            <select className={FIELD_CLS} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
              {STOCK_OUT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <input className={FIELD_CLS} placeholder="Optional notes…" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </Field>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!product || qty <= 0 || exceeds}
          className="px-8 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold disabled:opacity-40"
        >
          Submit
        </button>
      </section>

      <MovementHistoryTable
        title="Stock Out History"
        movements={history}
        columns={[
          { label: 'Stock Out No.', render: m => <span className="font-mono text-primary">{m.no}</span> },
          { label: 'Date', render: m => fmtDate(m.date) },
          { label: 'Product', render: m => <span>{m.productName} <span className="font-mono text-label-sm text-on-surface-variant">({m.sku})</span></span> },
          { label: 'Quantity', render: m => <span className="font-mono text-error">-{m.qty}</span> },
          { label: 'Reason', render: m => m.reason ?? '—' },
          { label: 'Created By', render: m => m.createdBy },
        ]}
      />
    </>
  )
}

function ReturnStockTab() {
  const { products, movements, returnStock } = useStore()
  const [form, setForm] = useState({ productId: '', qty: '', returnType: RETURN_TYPES[0], reason: '', remarks: '', date: todayInput() })
  const [message, setMessage] = useState(null)

  const product = products.find(p => p.id === form.productId)
  const qty = parseInt(form.qty) || 0
  const isTransferOut = form.returnType === 'Transfer Out'
  const exceeds = isTransferOut && product && qty > product.stock
  const docNo = useMemo(() => {
    const max = movements.filter(m => m.no?.startsWith('RT')).reduce((a, m) => Math.max(a, parseInt(m.no.slice(3), 10) || 0), 0)
    return `RT-${String(max + 1).padStart(4, '0')}`
  }, [movements])

  const submit = () => {
    if (!product || qty <= 0 || exceeds) return
    const error = returnStock({
      productId: product.id, qty, returnType: form.returnType, reason: form.reason,
      remarks: form.remarks, date: new Date(form.date).toISOString(),
    })
    setMessage(error ? { type: 'error', text: error } : { type: 'ok', text: `${docNo} recorded — stock updated.` })
    if (!error) setForm({ productId: '', qty: '', returnType: RETURN_TYPES[0], reason: '', remarks: '', date: todayInput() })
  }

  const history = movements.filter(m => m.type === 'RETURN')

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-title-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">assignment_return</span>
            Return Stock Form
          </h3>
          {message && (
            <span className={`text-label-md font-mono flex items-center gap-1 ${message.type === 'ok' ? 'text-secondary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[16px]">{message.type === 'ok' ? 'check_circle' : 'error'}</span>
              {message.text}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Return No.">
            <input className={`${FIELD_CLS} font-mono`} value={docNo} disabled />
          </Field>
          <Field label="Return Date">
            <input type="date" className={FIELD_CLS} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Product Name" required>
            <select className={FIELD_CLS} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="SKU">
            <input className={`${FIELD_CLS} font-mono`} value={product?.sku ?? ''} disabled />
          </Field>
          <Field label="Quantity Returned" required>
            <input
              type="number" min="1"
              className={`${FIELD_CLS} font-mono ${exceeds ? 'border-error ring-1 ring-error' : ''}`}
              placeholder="0" value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
            />
            {exceeds && <p className="text-error text-label-sm font-mono">Transfer Out cannot exceed Current Stock ({product.stock}).</p>}
          </Field>
          <Field label="Return Type" required>
            <select className={FIELD_CLS} value={form.returnType} onChange={e => setForm(f => ({ ...f, returnType: e.target.value }))}>
              {RETURN_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
            <p className="text-label-sm font-mono text-on-surface-variant">
              {isTransferOut ? 'Stock balance will decrease.' : 'Stock balance will increase.'}
            </p>
          </Field>
          <Field label="Reason">
            <input className={FIELD_CLS} placeholder="Reason for return…" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <input className={FIELD_CLS} placeholder="Optional notes…" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </Field>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!product || qty <= 0 || exceeds}
          className="px-8 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold disabled:opacity-40"
        >
          Submit
        </button>
      </section>

      <MovementHistoryTable
        title="Return History"
        movements={history}
        columns={[
          { label: 'Return No.', render: m => <span className="font-mono text-primary">{m.no}</span> },
          { label: 'Date', render: m => fmtDate(m.date) },
          { label: 'Product', render: m => <span>{m.productName} <span className="font-mono text-label-sm text-on-surface-variant">({m.sku})</span></span> },
          { label: 'Quantity', render: m => <span className={`font-mono ${m.returnType === 'Transfer Out' ? 'text-error' : 'text-secondary'}`}>{m.returnType === 'Transfer Out' ? '-' : '+'}{m.qty}</span> },
          { label: 'Return Type', render: m => m.returnType ?? '—' },
          { label: 'Reason', render: m => m.reason || '—' },
          { label: 'Created By', render: m => m.createdBy },
        ]}
      />
    </>
  )
}

function MovementsTab() {
  const { movements } = useStore()
  return (
    <MovementHistoryTable
      title="Full Stock Movement History (Audit)"
      movements={movements}
      columns={[
        { label: 'Doc No.', render: m => <span className="font-mono text-primary">{m.no}</span> },
        { label: 'Type', render: m => (
          <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${MOVEMENT_BADGES[m.type] ?? ''}`}>{m.type}</span>
        ) },
        { label: 'Date & Time', render: m => fmtDateTime(m.date) },
        { label: 'Product', render: m => <span>{m.productName} <span className="font-mono text-label-sm text-on-surface-variant">({m.sku})</span></span> },
        { label: 'Qty', render: m => {
          const negative = m.type === 'OUT' || m.type === 'SALE' || m.returnType === 'Transfer Out'
          return <span className={`font-mono ${negative ? 'text-error' : 'text-secondary'}`}>{negative ? '-' : '+'}{m.qty}</span>
        } },
        { label: 'Balance', render: m => <span className="font-mono">{m.balanceAfter}</span> },
        { label: 'Detail', render: m => m.reason || m.returnType || m.counter || '—' },
        { label: 'By', render: m => m.createdBy },
      ]}
    />
  )
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [drawer, setDrawer] = useState(null) // null | product form initial values
  const { saveProduct } = useStore()

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab bar */}
          <div className="px-6 py-3 bg-surface flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-full font-mono text-label-md flex-shrink-0 transition-all duration-150 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'dashboard' && (
              <DashboardTab
                onAdd={() => setDrawer(EMPTY_PRODUCT_FORM)}
                onEdit={(item) => setDrawer({ ...item, price: String(item.price), stock: String(item.stock), minStock: String(item.minStock) })}
              />
            )}
            {activeTab === 'stock-in' && <StockInTab />}
            {activeTab === 'stock-out' && <StockOutTab />}
            {activeTab === 'returns' && <ReturnStockTab />}
            {activeTab === 'movements' && <MovementsTab />}
          </div>
        </main>
      </div>

      {drawer && (
        <ProductDrawer
          initial={drawer}
          onClose={() => setDrawer(null)}
          onSave={saveProduct}
        />
      )}
    </div>
  )
}
