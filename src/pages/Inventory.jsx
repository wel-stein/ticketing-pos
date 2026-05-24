import { useState } from 'react'
import { INVENTORY_ITEMS } from '../data'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

function StockBar({ stock, maxStock }) {
  const pct = maxStock > 0 ? Math.round((stock / maxStock) * 100) : 0
  let color = 'bg-secondary'
  let textColor = 'text-secondary'
  let label = 'Optimal'
  if (stock === 0) { color = 'bg-error'; textColor = 'text-error'; label = 'Sold Out' }
  else if (pct < 20) { color = 'bg-tertiary'; textColor = 'text-tertiary'; label = 'Low Stock' }
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
    'Apparel': 'bg-primary-fixed text-on-primary-fixed-variant',
    'Accessories': 'bg-secondary-container/50 text-on-secondary-container',
    'Electronics': 'bg-tertiary-fixed/50 text-on-tertiary-fixed-variant',
    'Stationery': 'bg-surface-container-highest text-on-surface-variant',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[category] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
      {category}
    </span>
  )
}

export default function Inventory() {
  const [items, setItems] = useState(INVENTORY_ITEMS)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category: 'Apparel', price: '', stock: '', threshold: '' })

  const totalStock = items.reduce((a, i) => a + i.stock, 0) + 969
  const lowStock = items.filter(i => i.stock > 0 && (i.stock / i.maxStock) < 0.2).length + 20
  const outOfStock = items.filter(i => i.stock === 0).length

  const filtered = items.filter(item => {
    const q = searchQuery.toLowerCase()
    return !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  })

  const handleSave = () => {
    if (!form.name || !form.sku) return
    const newItem = {
      id: `i${Date.now()}`,
      sku: form.sku,
      name: form.name,
      category: form.category,
      stock: parseInt(form.stock) || 0,
      maxStock: Math.max(parseInt(form.stock) || 0, 100),
      price: parseFloat(form.price) || 0,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=80&h=80&fit=crop&q=80',
    }
    setItems(prev => [newItem, ...prev])
    setForm({ name: '', sku: '', category: 'Apparel', price: '', stock: '', threshold: '' })
    setShowModal(false)
  }

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Stats grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex items-center justify-between card-shadow">
              <div>
                <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Items</p>
                <h3 className="text-headline-lg font-semibold">{totalStock.toLocaleString()}</h3>
                <p className="text-secondary text-sm font-medium mt-1">+12 this week</p>
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

          {/* Table */}
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
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors font-mono text-label-md">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Filter
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    {['SKU', 'Product Name', 'Category', 'Stock Level', 'Unit Price', ''].map(h => (
                      <th key={h} className={`px-6 py-4 font-mono text-label-md text-on-surface-variant uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container transition-colors group">
                      <td className="px-6 py-4 font-mono text-label-md text-primary">{item.sku}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                          </div>
                          <span className="font-medium text-on-surface">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CategoryPill category={item.category} />
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <StockBar stock={item.stock} maxStock={item.maxStock} />
                      </td>
                      <td className="px-6 py-4 font-mono text-label-md font-medium">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-primary transition-colors ml-auto">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant opacity-50">
                        No items match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low">
              <span className="text-sm text-on-surface-variant">
                Showing {filtered.length} of {items.length} items
              </span>
              <div className="flex items-center gap-1">
                <button disabled className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-variant disabled:opacity-30 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary font-semibold text-sm">1</button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant font-semibold text-sm transition-colors">2</button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant font-semibold text-sm transition-colors">3</button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      </div>

      {/* FAB Mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full card-shadow flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-surface flex flex-col modal-shadow">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-title-lg font-semibold text-on-surface">Add New Product</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form className="flex-1 overflow-y-auto p-6 space-y-5" onSubmit={e => e.preventDefault()}>
              <div className="space-y-2">
                <label className="font-mono text-label-md text-on-surface-variant">Product Image</label>
                <div className="w-full h-36 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-1">add_a_photo</span>
                  <span className="text-sm text-on-surface-variant">Click to upload or drag & drop</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-label-md text-on-surface-variant">Product Name *</label>
                <input
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none"
                  placeholder="e.g. Classic Snapback"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-label-md text-on-surface-variant">SKU *</label>
                  <input
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-label-md outline-none"
                    placeholder="MT-ACC-000"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-label-md text-on-surface-variant">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {['Apparel', 'Accessories', 'Electronics', 'Stationery', 'Souvenirs', 'Media'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-label-md text-on-surface-variant">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-label-md outline-none"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-label-md text-on-surface-variant">Initial Stock</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-label-md outline-none"
                    placeholder="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-label-md text-on-surface-variant">Low Stock Threshold</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-label-md outline-none"
                  placeholder="10"
                  value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                />
              </div>
            </form>

            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors font-mono text-label-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-mono text-label-md font-semibold"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
