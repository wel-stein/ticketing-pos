import { useState } from 'react'
import { TRANSACTIONS } from '../data'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const STATUS_STYLES = {
  'Completed': 'bg-secondary-container text-on-secondary-container',
  'Refunded': 'bg-error-container text-on-error-container',
  'Pending': 'bg-tertiary-fixed/50 text-tertiary',
}

function BarcodeVisual() {
  const bars = [4, 1, 8, 1, 4, 4, 8, 4, 1, 4, 4, 8, 1, 4, 4, 8, 4, 4, 8, 1]
  return (
    <div className="mt-5 flex flex-col items-center gap-1 opacity-60">
      <div className="w-full h-12 bg-on-surface rounded-sm flex items-center justify-center">
        <div className="w-11/12 h-8 bg-white flex items-center px-2 gap-[1px]">
          {bars.map((w, i) => (
            <div key={i} className="h-6 bg-black rounded-[0.5px]" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
      <span className="text-label-sm font-mono tracking-widest">8829100042423</span>
    </div>
  )
}

export default function History() {
  const [transactions] = useState(TRANSACTIONS)
  const [selectedTx, setSelectedTx] = useState(transactions[0])
  const [filters, setFilters] = useState({ date: 'Today, Oct 24, 2023', staff: '', type: '' })
  const [showMobileReceipt, setShowMobileReceipt] = useState(false)

  const handleRowClick = (tx) => {
    setSelectedTx(tx)
    setShowMobileReceipt(true)
  }

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Filters */}
        <section className="bg-surface p-5 border-b border-outline-variant grid grid-cols-1 md:grid-cols-4 gap-4 items-end flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Date Range</label>
            <div className="relative">
              <input
                className="w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none pr-10"
                value={filters.date}
                onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                calendar_today
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Staff ID</label>
            <select
              className="w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              value={filters.staff}
              onChange={e => setFilters(f => ({ ...f, staff: e.target.value }))}
            >
              <option value="">All Staff</option>
              <option>J. Doe (04)</option>
              <option>M. Smith (09)</option>
              <option>K. Johnson (12)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Transaction Type</label>
            <select
              className="w-full h-touch-target-min px-4 bg-white border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option>Sales</option>
              <option>Refunds</option>
              <option>Exchanges</option>
            </select>
          </div>
          <button className="h-touch-target-min bg-primary text-on-primary rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Apply Filters
          </button>
        </section>

        {/* Content: table + receipt panel */}
        <section className="flex-1 overflow-hidden flex">
          {/* Transaction Table */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    {['Order ID', 'Timestamp', 'Items', 'Total', 'Payment', 'Status', ''].map((h, i) => (
                      <th
                        key={h + i}
                        className={`p-4 font-mono text-label-md text-on-surface-variant ${['Items', 'Total', ''].includes(h) ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {transactions.map(tx => (
                    <tr
                      key={tx.id}
                      onClick={() => handleRowClick(tx)}
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer group ${
                        selectedTx?.id === tx.id ? 'bg-primary-fixed/50' : ''
                      }`}
                    >
                      <td className="p-4 font-mono text-label-sm text-primary font-semibold">#{tx.id}</td>
                      <td className="p-4">
                        <div className="text-body-md text-on-surface">{tx.time}</div>
                        <div className="font-mono text-label-sm text-on-surface-variant">{tx.date}</div>
                      </td>
                      <td className="p-4 text-right text-body-md">{tx.itemCount.toString().padStart(2, '0')}</td>
                      <td className="p-4 text-right font-bold text-on-surface">${tx.total.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{tx.payment.icon}</span>
                          <span className="text-body-md">{tx.payment.label}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${STATUS_STYLES[tx.status] ?? ''}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-white transition-colors ml-auto">
                          <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Detail Panel */}
          <aside
            style={{ width: '360px' }}
            className={`bg-surface-container-low border-l border-outline-variant flex flex-col p-5 overflow-y-auto flex-shrink-0 ${
              showMobileReceipt ? 'fixed inset-0 z-50 bg-white w-full md:relative md:w-panel-cart' : 'hidden md:flex md:flex-col'
            }`}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-title-lg font-semibold text-on-surface">Transaction Detail</h2>
              <button
                onClick={() => setShowMobileReceipt(false)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {selectedTx ? (
              <>
                {/* Receipt Visual */}
                <div className="receipt-texture border border-outline-variant rounded-xl p-6 flex flex-col gap-3 card-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <div className="text-center">
                    <p className="font-bold text-headline-md text-primary">MerchTrack POS</p>
                    <p className="font-mono text-label-sm text-on-surface-variant">Store #402 — New York, NY</p>
                  </div>

                  <div className="border-y border-dashed border-outline-variant py-3 my-1 flex flex-col gap-1.5">
                    {[
                      { label: 'Receipt', value: `#${selectedTx.id}` },
                      { label: 'Date', value: `${selectedTx.date} ${selectedTx.time}` },
                      { label: 'Staff', value: selectedTx.staff },
                      { label: 'Counter', value: selectedTx.counter },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="font-mono text-label-sm text-on-surface-variant uppercase">{row.label}</span>
                        <span className="font-mono text-label-sm text-on-surface font-bold">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {selectedTx.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="text-body-md font-semibold">{item.name}</p>
                          <p className="font-mono text-label-sm text-on-surface-variant">SKU: {item.sku}</p>
                        </div>
                        <span className="text-body-md ml-3 flex-shrink-0">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-body-md">
                      <span>Subtotal</span>
                      <span className="font-semibold">${selectedTx.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-body-md">
                      <span>Sales Tax (8%)</span>
                      <span className="font-semibold">${selectedTx.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-title-lg font-bold">TOTAL</span>
                      <span className="text-headline-md font-bold text-primary">${selectedTx.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <BarcodeVisual />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button className="h-touch-target-min border border-primary text-primary rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[20px]">print</span>
                    Print
                  </button>
                  <button className="h-touch-target-min border border-primary text-primary rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    Email
                  </button>
                  <button className="col-span-2 h-touch-target-min bg-error text-on-error rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">assignment_return</span>
                    Issue Refund
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <span className="material-symbols-outlined text-5xl mb-3">receipt_long</span>
                <p className="text-body-md">Select a transaction to view details</p>
              </div>
            )}
          </aside>
        </section>
      </main>
      </div>
    </div>
  )
}
