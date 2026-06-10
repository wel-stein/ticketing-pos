import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import TopBar from '../components/TopBar'

const PAYMENT_METHODS = [
  { id: 'cash', icon: 'payments', label: 'Cash', sub: 'Manual calculation', color: 'text-secondary' },
  { id: 'card', icon: 'credit_card', label: 'Credit / Debit Card', sub: 'Swipe, Chip or Tap', color: 'text-primary' },
  { id: 'wallet', icon: 'account_balance_wallet', label: 'Digital Wallet', sub: 'Apple Pay, Google Pay', color: 'text-tertiary' },
]

const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100]

function OrderItem({ item, onUpdate, onRemove }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex gap-4 hover:border-primary transition-all group">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-title-lg font-semibold truncate">{item.name}</h3>
            <p className="text-label-md font-mono text-on-surface-variant">SKU: {item.sku}</p>
          </div>
          <span className="text-title-lg font-semibold text-primary flex-shrink-0">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center border border-outline-variant rounded-full p-1 bg-surface">
            <button
              onClick={() => onUpdate(item.id, -1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-highest rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="px-4 font-mono text-label-md">{item.quantity}</span>
            <button
              onClick={() => onUpdate(item.id, 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-highest rounded-full transition-colors text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-error flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span className="text-label-sm font-mono">Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function buildReceiptHTML(cart, subtotal, tax, grandTotal, promoApplied, cashReceived, changeDue, selectedPayment, orderNumber) {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const itemLines = cart.map(item => {
    const name = item.name.length > 24 ? item.name.slice(0, 24) : item.name
    const qty = item.quantity
    const lineTotal = (item.price * item.quantity).toFixed(2)
    const unitPrice = item.price.toFixed(2)
    return `
      <tr>
        <td style="text-align:left;padding:2px 0;">${name}</td>
        <td style="text-align:center;padding:2px 4px;">${qty}</td>
        <td style="text-align:right;padding:2px 0;">${unitPrice}</td>
        <td style="text-align:right;padding:2px 0;">${lineTotal}</td>
      </tr>`
  }).join('')

  const paymentLabel = selectedPayment === 'cash' ? 'CASH' : selectedPayment === 'card' ? 'CARD' : 'DIGITAL WALLET'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt</title>
<style>
  @page {
    margin: 0;
    size: 80mm auto;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 12px;
    line-height: 1.4;
    width: 80mm;
    padding: 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .double-divider {
    border: none;
    border-top: 2px solid #000;
    margin: 6px 0;
  }
  table { width: 100%; border-collapse: collapse; }
  .total-row td {
    font-weight: bold;
    font-size: 14px;
    padding-top: 4px;
  }
  .store-name {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
  }
  .receipt-footer {
    font-size: 11px;
    color: #333;
  }
  @media print {
    html, body { height: auto; }
    body { page-break-inside: avoid; break-inside: avoid; }
    table, tr { page-break-inside: avoid; break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="store-name">TICKETPRO POS</div>
    <div style="font-size:11px;margin-top:2px;">Counter 04 &bull; Terminal TERM-402</div>
    <div style="font-size:11px;">Staff: John Doe</div>
  </div>

  <hr class="double-divider">

  <div style="display:flex;justify-content:space-between;font-size:11px;">
    <span>Date: ${date}</span>
    <span>Time: ${time}</span>
  </div>
  <div style="font-size:11px;">Order: ${orderNumber}</div>

  <hr class="divider">

  <table>
    <thead>
      <tr style="font-size:11px;border-bottom:1px solid #000;">
        <th style="text-align:left;padding-bottom:3px;">Item</th>
        <th style="text-align:center;padding-bottom:3px;">Qty</th>
        <th style="text-align:right;padding-bottom:3px;">Price</th>
        <th style="text-align:right;padding-bottom:3px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemLines}
    </tbody>
  </table>

  <hr class="divider">

  <table>
    <tr>
      <td style="text-align:left;">Subtotal</td>
      <td style="text-align:right;">$${subtotal.toFixed(2)}</td>
    </tr>
    ${promoApplied ? `<tr>
      <td style="text-align:left;">Discount</td>
      <td style="text-align:right;">-$5.00</td>
    </tr>` : ''}
    <tr>
      <td style="text-align:left;">Tax (8%)</td>
      <td style="text-align:right;">$${tax.toFixed(2)}</td>
    </tr>
  </table>

  <hr class="double-divider">

  <table>
    <tr class="total-row">
      <td style="text-align:left;">TOTAL</td>
      <td style="text-align:right;">$${grandTotal.toFixed(2)}</td>
    </tr>
  </table>

  <hr class="divider">

  <table style="font-size:12px;">
    <tr>
      <td style="text-align:left;">Payment: ${paymentLabel}</td>
      <td></td>
    </tr>
    ${selectedPayment === 'cash' ? `
    <tr>
      <td style="text-align:left;">Cash Received</td>
      <td style="text-align:right;">$${cashReceived.toFixed(2)}</td>
    </tr>
    <tr class="bold">
      <td style="text-align:left;">Change Due</td>
      <td style="text-align:right;">$${changeDue.toFixed(2)}</td>
    </tr>` : ''}
  </table>

  <hr class="divider">

  <div class="center receipt-footer" style="margin-top:8px;">
    <div>Items: ${cart.reduce((a, i) => a + i.quantity, 0)}</div>
    <div style="margin-top:8px;">Thank you for your purchase!</div>
    <div style="margin-top:2px;">Please retain this receipt</div>
    <div style="margin-top:2px;">for returns or exchanges.</div>
    <div style="margin-top:8px;">* * *</div>
  </div>
</body>
</html>`
}

function printReceipt(html) {
  const printWindow = window.open('', '_blank', 'width=320,height=600')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onafterprint = () => printWindow.close()
  setTimeout(() => {
    // The Star TSP100 raster driver ignores "size: 80mm auto" and paginates
    // against its fixed default page length, auto-cutting at every page break.
    // Pin the page height to the rendered content so the job is one page and
    // the printer only cuts once, at the end of the receipt.
    const doc = printWindow.document
    const contentHeightMm = Math.ceil((doc.body.scrollHeight * 25.4) / 96) + 2
    const pageStyle = doc.createElement('style')
    pageStyle.textContent = `@page { size: 80mm ${contentHeightMm}mm; margin: 0; }`
    doc.head.appendChild(pageStyle)
    printWindow.print()
  }, 250)
}

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, tax, total } = useCart()
  const [selectedPayment, setSelectedPayment] = useState('cash')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const cashInputRef = useRef(null)

  const grandTotal = total - (promoApplied ? 5 : 0)
  const cashValue = parseFloat(cashReceived) || 0
  const changeDue = Math.max(0, cashValue - grandTotal)
  const cashSufficient = cashValue >= grandTotal

  const completedSaleRef = useRef({ cart: [], subtotal: 0, tax: 0, grandTotal: 0, cashReceived: 0, changeDue: 0 })

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/')
    }
  }, [cart.length, success, navigate])

  const setExactAmount = useCallback(() => {
    setCashReceived(grandTotal.toFixed(2))
  }, [grandTotal])

  const addQuickAmount = useCallback((amount) => {
    setCashReceived(prev => {
      const current = parseFloat(prev) || 0
      return (current + amount).toFixed(2)
    })
  }, [])

  const handleCompleteSale = () => {
    if (selectedPayment === 'cash' && !cashSufficient) return

    completedSaleRef.current = {
      cart: [...cart],
      subtotal,
      tax,
      grandTotal,
      cashReceived: cashValue,
      changeDue,
    }

    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setSuccess(true)
    }, 1400)
  }

  const handlePrintReceipt = () => {
    const sale = completedSaleRef.current
    const html = buildReceiptHTML(
      sale.cart, sale.subtotal, sale.tax, sale.grandTotal,
      promoApplied, sale.cashReceived, sale.changeDue,
      selectedPayment, orderNumber
    )
    printReceipt(html)
  }

  const handleNewTransaction = () => {
    clearCart()
    navigate('/')
  }

  const orderNumber = '#9842-X'

  const canComplete = selectedPayment !== 'cash' || cashSufficient

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar back={{ to: '/', label: 'Back to Terminal' }} brand orderNumber={orderNumber} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Order Summary */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-headline-md font-semibold">Order Summary</h2>
            <span className="font-mono text-label-md text-on-surface-variant">
              {cart.reduce((a, i) => a + i.quantity, 0)} Items
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {cart.map(item => (
              <OrderItem
                key={item.id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Totals card */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant mt-4">
            <div className="space-y-3">
              <div className="flex justify-between text-body-md">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-md">
                <span className="text-on-surface-variant">Shipping (In-Store)</span>
                <span className="font-semibold text-secondary">Free</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">sell</span>
                    Promo Applied
                  </span>
                  <span className="font-semibold text-secondary">-$5.00</span>
                </div>
              )}
              <div className="flex justify-between text-body-md">
                <span className="text-on-surface-variant">Tax (8%)</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant flex justify-between items-end">
                <span className="text-headline-md font-semibold">Grand Total</span>
                <div className="text-right">
                  <p className="text-display-price font-bold text-primary leading-none tracking-tight">
                    ${grandTotal.toFixed(2)}
                  </p>
                  <p className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider mt-1">USD</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Payment */}
        <aside className="bg-surface-container-lowest border-l border-outline-variant p-6 flex flex-col h-full overflow-y-auto card-shadow z-10 flex-shrink-0" style={{ width: '400px' }}>
          <h2 className="text-headline-md font-semibold mb-5">Payment Method</h2>

          <div className="flex-1 space-y-5">
            {/* Payment options */}
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === pm.id}
                    onChange={() => setSelectedPayment(pm.id)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center gap-4 p-4 border-2 border-outline-variant rounded-xl peer-checked:border-primary peer-checked:bg-primary-fixed hover:bg-surface-container-high transition-all">
                    <span className={`material-symbols-outlined text-3xl ${pm.color}`}>{pm.icon}</span>
                    <div>
                      <p className="text-title-lg font-semibold">{pm.label}</p>
                      <p className="font-mono text-label-md text-on-surface-variant">{pm.sub}</p>
                    </div>
                    {selectedPayment === pm.id && (
                      <span className="ml-auto material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Cash input section */}
            {selectedPayment === 'cash' && (
              <div className="space-y-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant animate-[fadeInDown_0.2s_ease]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
                  <span className="text-title-lg font-semibold">Cash Received</span>
                </div>

                {/* Cash input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-headline-md font-bold text-on-surface-variant">$</span>
                  <input
                    ref={cashInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl text-headline-md font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => addQuickAmount(amt)}
                      className="py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-body-md font-semibold hover:bg-primary hover:text-on-primary active:scale-95 transition-all"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={setExactAmount}
                    className="flex-1 py-2.5 bg-secondary-container text-secondary rounded-lg text-body-md font-semibold hover:opacity-80 active:scale-95 transition-all"
                  >
                    Exact Amount
                  </button>
                  <button
                    onClick={() => setCashReceived('')}
                    className="px-4 py-2.5 bg-surface-container-highest text-on-surface-variant rounded-lg text-body-md font-semibold hover:bg-error-container hover:text-error active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                </div>

                {/* Change display */}
                <div className={`rounded-xl p-4 text-center transition-all ${
                  cashReceived === '' ? 'bg-surface-container border border-outline-variant' :
                  cashSufficient ? 'bg-secondary-container border-2 border-secondary' :
                  'bg-error-container border-2 border-error'
                }`}>
                  {cashReceived === '' ? (
                    <p className="text-body-md text-on-surface-variant">Enter the amount received from customer</p>
                  ) : cashSufficient ? (
                    <>
                      <p className="text-label-sm font-mono text-secondary uppercase tracking-wider">Change Due</p>
                      <p className="text-display-price font-bold text-secondary leading-none mt-1">
                        ${changeDue.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-label-sm font-mono text-error uppercase tracking-wider">Insufficient</p>
                      <p className="text-title-lg font-bold text-error mt-1">
                        Short ${(grandTotal - cashValue).toFixed(2)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Promo code */}
            <div className="space-y-2">
              <label className="font-mono text-label-md text-on-surface-variant uppercase">Apply Discount</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">sell</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md transition-all"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => promoCode && setPromoApplied(true)}
                  className="px-5 py-3 bg-surface-container-highest text-on-surface text-title-lg font-semibold rounded-lg hover:bg-outline-variant transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoApplied && (
                <p className="text-secondary text-label-md font-mono flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Promo code applied — $5.00 off!
                </p>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-label-sm font-mono text-on-surface-variant">Total to Pay</p>
                <p className="text-headline-md font-semibold text-on-surface">
                  ${grandTotal.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="flex items-center gap-1 text-secondary font-mono text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Verified Terminal
                </span>
                <span className="text-label-sm font-mono text-on-surface-variant">ID: TERM-402</span>
              </div>
            </div>

            {selectedPayment === 'cash' && cashSufficient && cashReceived !== '' && (
              <div className="flex justify-between items-center mb-4 p-3 bg-secondary-container rounded-xl">
                <span className="text-body-md font-semibold text-secondary">Change to return:</span>
                <span className="text-title-lg font-bold text-secondary">${changeDue.toFixed(2)}</span>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={processing || !canComplete}
              className="w-full py-5 bg-primary text-on-primary rounded-xl text-headline-md font-semibold card-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[22px]">refresh</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Complete Sale</span>
                  <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-lowest p-10 rounded-3xl modal-shadow max-w-lg w-full mx-4 text-center animate-[fadeInScale_0.3s_ease]">
            <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-secondary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h2 className="text-headline-lg font-semibold mb-3">Payment Successful</h2>
            <p className="text-body-lg text-on-surface-variant mb-2">
              Order {orderNumber} has been processed.
            </p>

            {selectedPayment === 'cash' && (
              <div className="bg-secondary-container rounded-2xl p-5 mb-6 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body-md text-secondary">Total</span>
                  <span className="text-title-lg font-bold text-secondary">${completedSaleRef.current.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body-md text-secondary">Cash Received</span>
                  <span className="text-title-lg font-bold text-secondary">${completedSaleRef.current.cashReceived.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-secondary/20 flex justify-between items-center">
                  <span className="text-title-lg font-bold text-secondary">Change Due</span>
                  <span className="text-display-price font-bold text-secondary leading-none">${completedSaleRef.current.changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {selectedPayment !== 'cash' && <div className="mb-6" />}

            <div className="space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full py-4 bg-primary text-on-primary rounded-xl text-title-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                Print Receipt
              </button>
              <button
                onClick={handleNewTransaction}
                className="w-full py-4 bg-surface-container-high text-on-surface-variant rounded-xl text-title-lg font-semibold hover:bg-surface-container-highest transition-colors"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
