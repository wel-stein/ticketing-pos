import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { fmtRM } from '../utils/format'
import { buildReceiptHTML, printReceipt } from '../utils/receipt'
import TopBar from '../components/TopBar'

const PAYMENT_METHODS = [
  { id: 'Cash', icon: 'payments', label: 'Cash', sub: 'Manual calculation', color: 'text-secondary' },
  { id: 'Credit Card', icon: 'credit_card', label: 'Credit Card', sub: 'Swipe, Chip or Tap', color: 'text-primary' },
  { id: 'Debit Card', icon: 'card_membership', label: 'Debit Card', sub: 'Swipe, Chip or Tap', color: 'text-primary' },
  { id: 'E-Wallet', icon: 'account_balance_wallet', label: 'E-Wallet', sub: "Touch 'n Go, GrabPay, Boost", color: 'text-tertiary' },
]

// Common cash denominations (SRS #F001 shortcut amount buttons).
const QUICK_AMOUNTS = [10, 20, 50, 100]

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
            {fmtRM(item.price * item.quantity)}
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
              disabled={item.quantity >= item.stock}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-highest rounded-full transition-colors text-primary disabled:opacity-30 disabled:cursor-not-allowed"
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

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, tax, total } = useCart()
  const { recordSale } = useStore()
  const [selectedPayment, setSelectedPayment] = useState('Cash')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completedTx, setCompletedTx] = useState(null)
  const [cashReceived, setCashReceived] = useState('')
  const cashInputRef = useRef(null)

  const discount = promoApplied ? 5 : 0
  const grandTotal = total - discount
  const cashValue = parseFloat(cashReceived) || 0
  const changeDue = Math.max(0, cashValue - grandTotal)
  const cashSufficient = cashValue >= grandTotal

  useEffect(() => {
    if (cart.length === 0 && !completedTx) {
      navigate('/')
    }
  }, [cart.length, completedTx, navigate])

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
    if (selectedPayment === 'Cash' && !cashSufficient) return

    setProcessing(true)
    setTimeout(() => {
      const tx = recordSale({
        items: cart,
        subtotal,
        tax,
        discount,
        total: grandTotal,
        payment: selectedPayment,
        cashReceived: selectedPayment === 'Cash' ? cashValue : undefined,
        changeDue: selectedPayment === 'Cash' ? changeDue : undefined,
      })
      setProcessing(false)
      setCompletedTx(tx)
    }, 1400)
  }

  const handlePrintReceipt = async () => {
    if (!completedTx) return
    const html = await buildReceiptHTML(completedTx)
    printReceipt(html)
  }

  const handleNewTransaction = () => {
    clearCart()
    navigate('/')
  }

  const canComplete = selectedPayment !== 'Cash' || cashSufficient

  return (
    <div className="bg-background text-on-background h-screen flex flex-col overflow-hidden">
      <TopBar back={{ to: '/', label: 'Back to Sales' }} brand orderNumber={completedTx?.id} />

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
                <span className="font-semibold">{fmtRM(subtotal)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-body-md">
                  <span className="text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">sell</span>
                    Discount Applied
                  </span>
                  <span className="font-semibold text-secondary">-{fmtRM(5)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-md">
                <span className="text-on-surface-variant">Tax (8%)</span>
                <span className="font-semibold">{fmtRM(tax)}</span>
              </div>
              <div className="pt-4 border-t border-outline-variant flex justify-between items-end">
                <span className="text-headline-md font-semibold">Net Amount Payable</span>
                <div className="text-right">
                  <p className="text-display-price font-bold text-primary leading-none tracking-tight">
                    {fmtRM(grandTotal)}
                  </p>
                  <p className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider mt-1">MYR</p>
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

            {/* Cash received calculation (SRS #F001) */}
            {selectedPayment === 'Cash' && (
              <div className="space-y-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant animate-[fadeInDown_0.2s_ease]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
                  <span className="text-title-lg font-semibold">Cash Received</span>
                </div>

                {/* Cash input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-title-lg font-bold text-on-surface-variant">RM</span>
                  <input
                    ref={cashInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant rounded-xl text-headline-md font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Shortcut amount buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => addQuickAmount(amt)}
                      className="py-2.5 bg-surface-container-highest text-on-surface rounded-lg text-body-md font-semibold hover:bg-primary hover:text-on-primary active:scale-95 transition-all"
                    >
                      +RM{amt}
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

                {/* Total payable + change display */}
                <div className="flex justify-between items-center text-body-md px-1">
                  <span className="text-on-surface-variant">Total Amount Payable</span>
                  <span className="font-bold">{fmtRM(grandTotal)}</span>
                </div>
                <div className={`rounded-xl p-4 text-center transition-all ${
                  cashReceived === '' ? 'bg-surface-container border border-outline-variant' :
                  cashSufficient ? 'bg-secondary-container border-2 border-secondary' :
                  'bg-error-container border-2 border-error'
                }`}>
                  {cashReceived === '' ? (
                    <p className="text-body-md text-on-surface-variant">Enter the amount received from customer</p>
                  ) : cashSufficient ? (
                    <>
                      <p className="text-label-sm font-mono text-secondary uppercase tracking-wider">Balance / Change</p>
                      <p className="text-display-price font-bold text-secondary leading-none mt-1">
                        {fmtRM(changeDue)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-label-sm font-mono text-error uppercase tracking-wider">Insufficient</p>
                      <p className="text-title-lg font-bold text-error mt-1">
                        Short {fmtRM(grandTotal - cashValue)}
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
                  Promo code applied — {fmtRM(5)} off!
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
                  {fmtRM(grandTotal)}
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

            {selectedPayment === 'Cash' && cashSufficient && cashReceived !== '' && (
              <div className="flex justify-between items-center mb-4 p-3 bg-secondary-container rounded-xl">
                <span className="text-body-md font-semibold text-secondary">Change to return:</span>
                <span className="text-title-lg font-bold text-secondary">{fmtRM(changeDue)}</span>
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
                  <span>{selectedPayment === 'Cash' ? 'Confirm Payment' : 'Complete Sale'}</span>
                  <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Payment confirmation pop-up (SRS #F001) */}
      {completedTx && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface-container-lowest p-10 rounded-3xl modal-shadow max-w-lg w-full mx-4 text-center animate-[fadeInScale_0.3s_ease]">
            <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-secondary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h2 className="text-headline-lg font-semibold mb-3">Payment Successful</h2>
            <p className="text-body-lg text-on-surface-variant mb-2">
              Order {completedTx.id} has been processed successfully.
            </p>

            <div className="bg-secondary-container rounded-2xl p-5 mb-6 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-body-md text-secondary">Total Amount</span>
                <span className="text-title-lg font-bold text-secondary">{fmtRM(completedTx.total)}</span>
              </div>
              {completedTx.payment === 'Cash' ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-md text-secondary">Cash Received</span>
                    <span className="text-title-lg font-bold text-secondary">{fmtRM(completedTx.cashReceived)}</span>
                  </div>
                  <div className="pt-3 border-t border-secondary/20 flex justify-between items-center">
                    <span className="text-title-lg font-bold text-secondary">Change Due</span>
                    <span className="text-display-price font-bold text-secondary leading-none">{fmtRM(completedTx.changeDue)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-body-md text-secondary">Payment Method</span>
                  <span className="text-title-lg font-bold text-secondary">{completedTx.payment}</span>
                </div>
              )}
            </div>

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
