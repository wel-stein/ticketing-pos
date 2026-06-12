import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { COUNTERS } from '../data'
import { fmtRM, fmtDate } from '../utils/format'
import { exportToExcel } from '../utils/exportExcel'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const FIELD_CLS = 'w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none'

const PAYMENT_OPTIONS = ['Cash', 'Credit Card', 'Debit Card', 'E-Wallet']

function rangeBounds(from, to) {
  const start = from ? new Date(from).getTime() : -Infinity
  const end = to ? new Date(to).getTime() + 24 * 3600 * 1000 - 1 : Infinity
  return [start, end]
}

// Signed stock effect of a movement: positive feeds inventory, negative drains it.
function movementDelta(m) {
  if (m.type === 'IN') return m.qty
  if (m.type === 'OUT' || m.type === 'SALE') return -m.qty
  if (m.type === 'RETURN') return m.returnType === 'Supplier Return' ? -m.qty : m.qty
  return 0
}

function FilterBar({ children, onExport }) {
  return (
    <section className="bg-surface p-5 border border-outline-variant rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
      {children}
      <button
        onClick={onExport}
        className="h-touch-target-min bg-secondary-container text-on-secondary-container rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[20px]">download</span>
        Export to Excel
      </button>
    </section>
  )
}

function Filter({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-label-md text-on-surface-variant">{label}</label>
      {children}
    </div>
  )
}

function ReportTable({ columns, rows, footer, emptyText }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              {columns.map(c => (
                <th key={c.label} className={`px-5 py-4 font-mono text-label-md text-on-surface-variant uppercase tracking-wider ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-container transition-colors">
                {columns.map(c => (
                  <td key={c.label} className={`px-5 py-3 text-body-md ${c.align === 'right' ? 'text-right font-mono' : ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface-variant opacity-50">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
          {footer && rows.length > 0 && (
            <tfoot className="bg-surface-container-low border-t-2 border-outline-variant">
              <tr>
                {footer.map((cell, i) => (
                  <td key={i} className={`px-5 py-4 font-bold ${i > 0 ? 'text-right font-mono' : ''}`}>{cell}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  )
}

function StockBalanceReport() {
  const { products, movements } = useStore()
  const [filters, setFilters] = useState({ from: '', to: '', counter: '', productId: '' })

  const rows = useMemo(() => {
    const [start, end] = rangeBounds(filters.from, filters.to)
    const inCounter = m => !filters.counter || m.counter === filters.counter

    return products
      .filter(p => !filters.productId || p.id === filters.productId)
      .map(p => {
        const productMoves = movements.filter(m => m.productId === p.id && inCounter(m))
        const inRange = productMoves.filter(m => {
          const t = new Date(m.date).getTime()
          return t >= start && t <= end
        })
        const stockIn = inRange.filter(m => movementDelta(m) > 0).reduce((a, m) => a + m.qty, 0)
        const stockOut = inRange.filter(m => movementDelta(m) < 0).reduce((a, m) => a + m.qty, 0)
        // Roll the live balance back across every movement since the range
        // started to get the opening balance at the start of the period.
        const netSinceStart = productMoves
          .filter(m => new Date(m.date).getTime() >= start)
          .reduce((a, m) => a + movementDelta(m), 0)
        const opening = p.stock - netSinceStart
        const closing = opening + stockIn - stockOut
        return {
          sku: p.sku, name: p.name, opening, stockIn, stockOut,
          balance: closing, price: p.price, amount: closing * p.price,
        }
      })
  }, [products, movements, filters])

  const totals = rows.reduce((a, r) => ({
    stockIn: a.stockIn + r.stockIn, stockOut: a.stockOut + r.stockOut,
    balance: a.balance + r.balance, amount: a.amount + r.amount,
  }), { stockIn: 0, stockOut: 0, balance: 0, amount: 0 })

  const handleExport = () => {
    exportToExcel(
      `stock-balance-report-${new Date().toISOString().slice(0, 10)}`,
      ['Item Code', 'Item Name', 'Opening Balance', 'Stock In Qty', 'Stock Out Qty', 'Current Balance', 'Unit Price (RM)', 'Total Amount (RM)'],
      rows.map(r => [r.sku, r.name, r.opening, r.stockIn, r.stockOut, r.balance, r.price.toFixed(2), r.amount.toFixed(2)])
    )
  }

  return (
    <div className="space-y-4">
      <FilterBar onExport={handleExport}>
        <Filter label="Date From">
          <input type="date" className={FIELD_CLS} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </Filter>
        <Filter label="Date To">
          <input type="date" className={FIELD_CLS} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </Filter>
        <Filter label="Counter Location">
          <select className={FIELD_CLS} value={filters.counter} onChange={e => setFilters(f => ({ ...f, counter: e.target.value }))}>
            <option value="">All Counters</option>
            {COUNTERS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Filter>
        <Filter label="Item">
          <select className={FIELD_CLS} value={filters.productId} onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))}>
            <option value="">All Items</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Filter>
      </FilterBar>

      <ReportTable
        rows={rows}
        emptyText="No stock data for the selected filters."
        columns={[
          { label: 'Item Code', render: r => <span className="font-mono text-primary">{r.sku}</span> },
          { label: 'Item Name', render: r => r.name },
          { label: 'Opening Balance', align: 'right', render: r => r.opening },
          { label: 'Stock In', align: 'right', render: r => <span className="text-secondary">+{r.stockIn}</span> },
          { label: 'Stock Out', align: 'right', render: r => <span className="text-error">-{r.stockOut}</span> },
          { label: 'Current Balance', align: 'right', render: r => <span className="font-bold">{r.balance}</span> },
          { label: 'Unit Price', align: 'right', render: r => fmtRM(r.price) },
          { label: 'Total Amount', align: 'right', render: r => fmtRM(r.amount) },
        ]}
        footer={[
          `Total (${rows.length} items)`, '', '', `+${totals.stockIn}`,
          `-${totals.stockOut}`, totals.balance, '', fmtRM(totals.amount),
        ]}
      />
    </div>
  )
}

function SalesReport() {
  const { transactions, products } = useStore()
  const [filters, setFilters] = useState({ from: '', to: '', counter: '', payment: '', productId: '' })

  const rows = useMemo(() => {
    const [start, end] = rangeBounds(filters.from, filters.to)
    const product = products.find(p => p.id === filters.productId)

    return transactions
      .filter(tx => tx.status !== 'Cancelled')
      .filter(tx => {
        const t = new Date(tx.dateTime).getTime()
        return t >= start && t <= end
      })
      .filter(tx => !filters.counter || tx.counter === filters.counter)
      .filter(tx => !filters.payment || tx.payment === filters.payment)
      .flatMap(tx =>
        tx.items
          .filter(i => !product || i.id === product.id || i.sku === product.sku)
          .map(i => ({
            receipt: tx.id, date: tx.dateTime, counter: tx.counter,
            item: i.name, qty: i.qty, amount: i.qty * i.unitPrice,
            payment: tx.payment, status: tx.status,
          }))
      )
  }, [transactions, products, filters])

  const totals = rows.reduce((a, r) => ({ qty: a.qty + r.qty, amount: a.amount + r.amount }), { qty: 0, amount: 0 })

  const handleExport = () => {
    exportToExcel(
      `sales-report-${new Date().toISOString().slice(0, 10)}`,
      ['Receipt Number', 'Transaction Date', 'Counter Location', 'Item Name', 'Quantity Sold', 'Total Sales Amount (RM)', 'Payment Method', 'Status'],
      rows.map(r => [r.receipt, fmtDate(r.date), r.counter, r.item, r.qty, r.amount.toFixed(2), r.payment, r.status])
    )
  }

  return (
    <div className="space-y-4">
      <FilterBar onExport={handleExport}>
        <Filter label="Date From">
          <input type="date" className={FIELD_CLS} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </Filter>
        <Filter label="Date To">
          <input type="date" className={FIELD_CLS} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </Filter>
        <Filter label="Counter / Payment">
          <div className="grid grid-cols-2 gap-2">
            <select className={FIELD_CLS} value={filters.counter} onChange={e => setFilters(f => ({ ...f, counter: e.target.value }))}>
              <option value="">All Counters</option>
              {COUNTERS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className={FIELD_CLS} value={filters.payment} onChange={e => setFilters(f => ({ ...f, payment: e.target.value }))}>
              <option value="">All Payments</option>
              {PAYMENT_OPTIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </Filter>
        <Filter label="Item">
          <select className={FIELD_CLS} value={filters.productId} onChange={e => setFilters(f => ({ ...f, productId: e.target.value }))}>
            <option value="">All Items</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Filter>
      </FilterBar>

      <ReportTable
        rows={rows}
        emptyText="No sales match the selected filters."
        columns={[
          { label: 'Receipt No.', render: r => <span className="font-mono text-primary">{r.receipt}</span> },
          { label: 'Date', render: r => fmtDate(r.date) },
          { label: 'Counter Location', render: r => r.counter },
          { label: 'Item Name', render: r => r.item },
          { label: 'Qty Sold', align: 'right', render: r => r.qty },
          { label: 'Sales Amount', align: 'right', render: r => fmtRM(r.amount) },
          { label: 'Payment', render: r => r.payment },
          { label: 'Status', render: r => (
            <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${
              r.status === 'Completed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
            }`}>
              {r.status}
            </span>
          ) },
        ]}
        footer={[`Total (${rows.length} lines)`, '', '', '', totals.qty, fmtRM(totals.amount), '', '']}
      />
    </div>
  )
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock')

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-6 py-3 bg-surface flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant flex-shrink-0">
            {[
              { id: 'stock', icon: 'inventory', label: 'Stock Balance Report' },
              { id: 'sales', icon: 'point_of_sale', label: 'Sales Report' },
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

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'stock' ? <StockBalanceReport /> : <SalesReport />}
          </div>
        </main>
      </div>
    </div>
  )
}
