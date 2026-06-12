import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { fmtRM } from '../utils/format'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const FIELD_CLS = 'w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none'

const EMPTY_COUNTER_FORM = { id: null, code: '', name: '', location: '', status: 'Active' }

function counterStats(counter, products) {
  const assigned = products.filter(p => p.counter === counter.name && p.status === 'Active')
  return {
    skus: assigned.length,
    units: assigned.reduce((a, p) => a + p.stock, 0),
    value: assigned.reduce((a, p) => a + p.stock * p.price, 0),
    lowStock: assigned.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    outOfStock: assigned.filter(p => p.stock === 0).length,
  }
}

function StockBar({ stock, minStock, maxStock }) {
  const pct = maxStock > 0 ? Math.min(100, Math.round((stock / maxStock) * 100)) : 0
  let color = 'bg-secondary'
  let textColor = 'text-secondary'
  let label = 'Optimal'
  if (stock === 0) { color = 'bg-error'; textColor = 'text-error'; label = 'Out of Stock' }
  else if (stock <= minStock) { color = 'bg-tertiary'; textColor = 'text-tertiary'; label = 'Low Stock' }
  else if (pct < 50) { label = 'Good' }

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

function CounterModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  const isEdit = Boolean(form.id)
  const valid = form.code.trim() && form.name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl w-full max-w-md mx-4 overflow-hidden modal-shadow animate-[fadeInScale_0.2s_ease]">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-surface">{isEdit ? 'Edit Counter' : 'Add New Counter'}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-label-md text-on-surface-variant">Code *</label>
              <input className={`${FIELD_CLS} font-mono`} placeholder="C00" value={form.code} onChange={set('code')} />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-mono text-label-md text-on-surface-variant">Counter Name *</label>
              <input className={FIELD_CLS} placeholder="e.g. Ipoh Amanjaya (Counter 15)" value={form.name} onChange={set('name')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-label-md text-on-surface-variant">Location</label>
            <input className={FIELD_CLS} placeholder="Station / terminal address…" value={form.location} onChange={set('location')} />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-label-md text-on-surface-variant">Status</label>
            <select className={FIELD_CLS} value={form.status} onChange={set('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors font-mono text-label-md"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose() }}
            disabled={!valid}
            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold disabled:opacity-40"
          >
            Save Counter
          </button>
        </div>
      </div>
    </div>
  )
}

function StockStatusTab() {
  const { counters, products } = useStore()
  const [selectedId, setSelectedId] = useState(counters[0]?.id ?? null)

  const selected = counters.find(c => c.id === selectedId) ?? null
  const assigned = useMemo(
    () => (selected ? products.filter(p => p.counter === selected.name) : []),
    [products, selected]
  )

  return (
    <>
      {/* Counter status cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {counters.map(counter => {
          const stats = counterStats(counter, products)
          const isSelected = counter.id === selectedId
          return (
            <button
              key={counter.id}
              onClick={() => setSelectedId(counter.id)}
              className={`text-left bg-surface-container-lowest border rounded-xl p-5 card-shadow transition-all ${
                isSelected ? 'border-primary ring-2 ring-primary' : 'border-outline-variant hover:border-primary'
              } ${counter.status === 'Inactive' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{counter.name}</p>
                    <p className="text-label-sm font-mono text-on-surface-variant truncate">{counter.code} · {counter.location || 'No location set'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 font-mono text-label-sm rounded-full flex-shrink-0 ${
                  counter.status === 'Active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {counter.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-container-low rounded-lg py-2">
                  <p className="text-title-lg font-bold text-on-surface leading-tight">{stats.skus}</p>
                  <p className="text-label-sm font-mono text-on-surface-variant">Products</p>
                </div>
                <div className="bg-surface-container-low rounded-lg py-2">
                  <p className="text-title-lg font-bold text-on-surface leading-tight">{stats.units.toLocaleString()}</p>
                  <p className="text-label-sm font-mono text-on-surface-variant">Units</p>
                </div>
                <div className="bg-surface-container-low rounded-lg py-2">
                  <p className="text-title-lg font-bold text-on-surface leading-tight">{fmtRM(stats.value)}</p>
                  <p className="text-label-sm font-mono text-on-surface-variant">Stock Value</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-label-sm font-mono">
                <span className={stats.lowStock > 0 ? 'text-tertiary' : 'text-on-surface-variant'}>
                  ⚠ {stats.lowStock} low stock
                </span>
                <span className={stats.outOfStock > 0 ? 'text-error' : 'text-on-surface-variant'}>
                  ✕ {stats.outOfStock} out of stock
                </span>
              </div>
            </button>
          )
        })}
      </section>

      {/* Selected counter stock table */}
      {selected && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
            <h3 className="text-title-lg font-semibold">Stock at {selected.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {['SKU', 'Product Name', 'Category', 'Stock Level', 'Min Stock', 'Unit Price', 'Stock Value'].map(h => (
                    <th key={h} className="px-5 py-3 font-mono text-label-md text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {assigned.map(p => (
                  <tr key={p.id} className={`hover:bg-surface-container transition-colors ${p.status === 'Inactive' ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 font-mono text-label-md text-primary">{p.sku}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                        </div>
                        <span className="font-medium text-on-surface">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-body-md">{p.category}</td>
                    <td className="px-5 py-3 min-w-[160px]">
                      <StockBar stock={p.stock} minStock={p.minStock} maxStock={p.maxStock} />
                    </td>
                    <td className="px-5 py-3 font-mono text-label-md">{p.minStock}</td>
                    <td className="px-5 py-3 font-mono text-label-md">{fmtRM(p.price)}</td>
                    <td className="px-5 py-3 font-mono text-label-md font-medium">{fmtRM(p.stock * p.price)}</td>
                  </tr>
                ))}
                {assigned.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant opacity-50">
                      No products assigned to this counter yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}

function ManageCountersTab() {
  const { counters, products, setCounterStatus } = useStore()
  const [modal, setModal] = useState(null)
  const { saveCounter } = useStore()

  return (
    <>
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
            Counter Definitions
          </h3>
          <button
            onClick={() => setModal(EMPTY_COUNTER_FORM)}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Counter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                {['Code', 'Counter Name', 'Location', 'Products Assigned', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 font-mono text-label-md text-on-surface-variant uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {counters.map(counter => {
                const assignedCount = products.filter(p => p.counter === counter.name).length
                return (
                  <tr key={counter.id} className={`hover:bg-surface-container transition-colors ${counter.status === 'Inactive' ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4 font-mono text-label-md text-primary">{counter.code}</td>
                    <td className="px-5 py-4 font-medium text-on-surface">{counter.name}</td>
                    <td className="px-5 py-4 text-body-md text-on-surface-variant">{counter.location || '—'}</td>
                    <td className="px-5 py-4 font-mono text-label-md">{assignedCount}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${
                        counter.status === 'Active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {counter.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setModal(counter)}
                        title="Edit counter"
                        className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => setCounterStatus(counter.id, counter.status === 'Active' ? 'Inactive' : 'Active')}
                        title={counter.status === 'Active' ? 'Deactivate' : 'Activate'}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {counter.status === 'Active' ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <CounterModal initial={modal} onClose={() => setModal(null)} onSave={saveCounter} />
      )}
    </>
  )
}

export default function Counters() {
  const [activeTab, setActiveTab] = useState('status')

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-6 py-3 bg-surface flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant flex-shrink-0">
            {[
              { id: 'status', icon: 'monitoring', label: 'Counter Stock Status' },
              { id: 'manage', icon: 'storefront', label: 'Manage Counters' },
            ].map(tab => (
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
            {activeTab === 'status' ? <StockStatusTab /> : <ManageCountersTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
