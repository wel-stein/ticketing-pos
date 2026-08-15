import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { fmtRM, fmtDate, fmtTime } from '../utils/format'
import { buildReceiptHTML, printReceipt } from '../utils/receipt'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

const STATUS_STYLES = {
  'Completed': 'bg-secondary-container text-on-secondary-container',
  'Refunded': 'bg-error-container text-on-error-container',
  'Cancelled': 'bg-surface-container-highest text-on-surface-variant',
}

const REFUND_REASONS = [
  'Defective item',
  'Wrong item purchased',
  'Customer changed mind',
  'Pricing error',
  'Other',
]

function BarcodeVisual({ code }) {
  const bars = [4, 1, 8, 1, 4, 4, 8, 4, 1, 4, 4, 8, 1, 4, 4, 8, 4, 4, 8, 1]
  return (
    <div className="mt-5 flex flex-col items-center gap-1 opacity-60">
      <div className="w-full h-12 bg-scrim/85 rounded-sm flex items-center justify-center">
        <div className="w-11/12 h-8 bg-white flex items-center px-2 gap-[1px]">
          {bars.map((w, i) => (
            <div key={i} className="h-6 bg-black rounded-[0.5px]" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
      <span className="text-label-sm font-mono tracking-widest">{code}</span>
    </div>
  )
}

function RefundModal({ tx, onClose, onConfirm }) {
  const [reason, setReason] = useState(REFUND_REASONS[0])
  const [otherReason, setOtherReason] = useState('')
  const finalReason = reason === 'Other' ? otherReason.trim() : reason

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl w-full max-w-md mx-4 overflow-hidden modal-shadow animate-[fadeInScale_0.2s_ease]">
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              assignment_return
            </span>
          </div>
          <h3 className="text-headline-md font-semibold text-on-surface mb-2">Issue Refund?</h3>
          <p className="text-body-md text-on-surface-variant">
            Refund <span className="font-semibold text-on-surface">{fmtRM(tx.total)}</span> for transaction{' '}
            <span className="font-mono font-semibold text-on-surface">{tx.id}</span>.
            The refunded quantity will be returned to inventory.
          </p>
        </div>

        <div className="px-6 pb-4 space-y-3 text-left">
          <div className="space-y-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Refund Reason *</label>
            <select
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              {REFUND_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          {reason === 'Other' && (
            <input
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none"
              placeholder="Describe the reason…"
              value={otherReason}
              onChange={e => setOtherReason(e.target.value)}
            />
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant rounded-xl font-mono text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => finalReason && onConfirm(finalReason)}
            disabled={!finalReason}
            className="flex-1 py-3 bg-error text-on-error rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  )
}

function EmailModal({ tx, onClose }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl w-full max-w-md mx-4 overflow-hidden modal-shadow p-6 text-center animate-[fadeInScale_0.2s_ease]">
        {sent ? (
          <>
            <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            </div>
            <h3 className="text-headline-md font-semibold mb-2">Receipt Sent</h3>
            <p className="text-body-md text-on-surface-variant mb-5">Receipt {tx.id} was emailed to <span className="font-semibold text-on-surface">{email}</span>.</p>
            <button onClick={onClose} className="w-full py-3 bg-primary text-on-primary rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity">
              Done
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">mail</span>
            </div>
            <h3 className="text-headline-md font-semibold mb-2">Email Receipt</h3>
            <p className="text-body-md text-on-surface-variant mb-4">Send receipt {tx.id} to the customer's email address.</p>
            <input
              type="email"
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md outline-none mb-4"
              placeholder="customer@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-xl font-mono text-label-md hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setSent(true)}
                disabled={!valid}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function History() {
  const { transactions, refundTransaction, lookups } = useStore()
  const [selectedId, setSelectedId] = useState(transactions[0]?.id ?? null)
  const [filters, setFilters] = useState({ from: '', to: '', staff: '', type: '', orderId: '' })
  const [showMobileReceipt, setShowMobileReceipt] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [emailing, setEmailing] = useState(false)

  const filtered = useMemo(() => {
    const start = filters.from ? new Date(filters.from).getTime() : -Infinity
    const end = filters.to ? new Date(filters.to).getTime() + 24 * 3600 * 1000 - 1 : Infinity
    return transactions.filter(tx => {
      const t = new Date(tx.dateTime).getTime()
      if (t < start || t > end) return false
      if (filters.staff && tx.staff !== filters.staff) return false
      if (filters.type && tx.status !== filters.type) return false
      if (filters.orderId && !tx.id.toLowerCase().includes(filters.orderId.toLowerCase())) return false
      return true
    })
  }, [transactions, filters])

  const selectedTx = transactions.find(t => t.id === selectedId) ?? null

  const handleRowClick = (tx) => {
    setSelectedId(tx.id)
    setShowMobileReceipt(true)
  }

  const handlePrint = async () => {
    if (!selectedTx) return
    const html = await buildReceiptHTML(selectedTx)
    printReceipt(html)
  }

  const itemCount = tx => tx.items.reduce((a, i) => a + i.qty, 0)

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar brand />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Search & filter (SRS #F005) */}
        <section className="bg-surface p-5 border-b border-outline-variant grid grid-cols-1 md:grid-cols-4 gap-4 items-end flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="w-full h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={filters.from}
                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              />
              <input
                type="date"
                className="w-full h-touch-target-min px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Staff ID</label>
            <select
              className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              value={filters.staff}
              onChange={e => setFilters(f => ({ ...f, staff: e.target.value }))}
            >
              <option value="">All Staff</option>
              {lookups.staff.map(s => (
                <option key={s.staff_code} value={s.name}>{s.name} ({s.staff_code})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Transaction Type</label>
            <select
              className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option>Completed</option>
              <option>Refunded</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant">Order ID</label>
            <div className="relative">
              <input
                className="w-full h-touch-target-min px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none pr-10 font-mono"
                placeholder="TX-00000"
                value={filters.orderId}
                onChange={e => setFilters(f => ({ ...f, orderId: e.target.value }))}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
            </div>
          </div>
        </section>

        {/* Content: table + receipt panel */}
        <section className="flex-1 overflow-hidden flex">
          {/* Transaction Table */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
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
                  {filtered.map(tx => (
                    <tr
                      key={tx.id}
                      onClick={() => handleRowClick(tx)}
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer group ${
                        selectedTx?.id === tx.id ? 'bg-primary-fixed/50' : ''
                      }`}
                    >
                      <td className="p-4 font-mono text-label-sm text-primary font-semibold">{tx.id}</td>
                      <td className="p-4">
                        <div className="text-body-md text-on-surface">{fmtTime(tx.dateTime)}</div>
                        <div className="font-mono text-label-sm text-on-surface-variant">{fmtDate(tx.dateTime)}</div>
                      </td>
                      <td className="p-4 text-right text-body-md">{itemCount(tx).toString().padStart(2, '0')}</td>
                      <td className="p-4 text-right font-bold text-on-surface">{fmtRM(tx.total)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                            {tx.payment === 'Cash' ? 'payments' : tx.payment === 'E-Wallet' ? 'account_balance_wallet' : 'credit_card'}
                          </span>
                          <span className="text-body-md">{tx.payment}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 font-mono text-label-sm rounded-full ${STATUS_STYLES[tx.status] ?? ''}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="w-9 h-9 flex items-center justify-center rounded-full group-hover:bg-surface-container-high transition-colors ml-auto">
                          <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-on-surface-variant opacity-50">
                        No transactions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Detail Panel */}
          <aside
            style={{ width: '360px' }}
            className={`bg-surface-container-low border-l border-outline-variant flex flex-col p-5 overflow-y-auto flex-shrink-0 ${
              showMobileReceipt ? 'fixed inset-0 z-40 bg-surface-container-low w-full md:relative md:w-panel-cart' : 'hidden md:flex md:flex-col'
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
                    <p className="font-bold text-headline-md text-primary">ManjaLink POS</p>
                    <p className="font-mono text-label-sm text-on-surface-variant">{selectedTx.counter}</p>
                  </div>

                  <div className="border-y border-dashed border-outline-variant py-3 my-1 flex flex-col gap-1.5">
                    {[
                      { label: 'Receipt', value: selectedTx.id },
                      { label: 'Date', value: `${fmtDate(selectedTx.dateTime)} ${fmtTime(selectedTx.dateTime)}` },
                      { label: 'Staff', value: selectedTx.staff },
                      { label: 'Payment', value: selectedTx.payment },
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
                          <p className="font-mono text-label-sm text-on-surface-variant">
                            {item.sku} · {item.qty} × {fmtRM(item.unitPrice)}
                          </p>
                        </div>
                        <span className="text-body-md ml-3 flex-shrink-0">{fmtRM(item.qty * item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-body-md">
                      <span>Subtotal</span>
                      <span className="font-semibold">{fmtRM(selectedTx.subtotal)}</span>
                    </div>
                    {selectedTx.discount > 0 && (
                      <div className="flex justify-between text-body-md text-secondary">
                        <span>Discount</span>
                        <span className="font-semibold">-{fmtRM(selectedTx.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-title-lg font-bold">TOTAL</span>
                      <span className="text-headline-md font-bold text-primary">{fmtRM(selectedTx.total)}</span>
                    </div>
                  </div>

                  {selectedTx.refund && (
                    <div className="bg-error-container/50 rounded-lg p-3 text-left">
                      <p className="font-mono text-label-sm text-error uppercase tracking-wider mb-1">Refunded</p>
                      <p className="text-label-sm text-on-surface">
                        {selectedTx.refund.reason} — by {selectedTx.refund.by}, {fmtDate(selectedTx.refund.date)}
                      </p>
                    </div>
                  )}

                  <BarcodeVisual code={selectedTx.id} />
                </div>

                {/* Receipt & refund functions (SRS #F005) */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={handlePrint}
                    className="h-touch-target-min border border-primary text-primary rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">print</span>
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setEmailing(true)}
                    className="h-touch-target-min border border-primary text-primary rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    Email Receipt
                  </button>
                  {selectedTx.status === 'Completed' && (
                    <button
                      onClick={() => setRefunding(true)}
                      className="col-span-2 h-touch-target-min bg-error text-on-error rounded-lg font-mono text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[20px]">assignment_return</span>
                      Issue Refund
                    </button>
                  )}
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

      {refunding && selectedTx && (
        <RefundModal
          tx={selectedTx}
          onClose={() => setRefunding(false)}
          onConfirm={(reason) => {
            refundTransaction(selectedTx.id, reason)
            setRefunding(false)
          }}
        />
      )}

      {emailing && selectedTx && (
        <EmailModal tx={selectedTx} onClose={() => setEmailing(false)} />
      )}
    </div>
  )
}
