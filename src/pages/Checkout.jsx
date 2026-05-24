import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import TopBar from '../components/TopBar'

const PAYMENT_METHODS = [
  { id: 'card', icon: 'credit_card', label: 'Credit / Debit Card', sub: 'Swipe, Chip or Tap', color: 'text-primary' },
  { id: 'cash', icon: 'payments', label: 'Cash', sub: 'Manual calculation', color: 'text-secondary' },
  { id: 'wallet', icon: 'account_balance_wallet', label: 'Digital Wallet', sub: 'Apple Pay, Google Pay', color: 'text-tertiary' },
]

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

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, tax, total } = useCart()
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/')
    }
  }, [cart.length, success, navigate])

  const handleCompleteSale = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setSuccess(true)
    }, 1400)
  }

  const handleNewTransaction = () => {
    clearCart()
    navigate('/')
  }

  const orderNumber = '#9842-X'

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
                  <span className="font-semibold text-secondary">−$5.00</span>
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
                    ${(total - (promoApplied ? 5 : 0)).toFixed(2)}
                  </p>
                  <p className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider mt-1">USD</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Payment */}
        <aside className="bg-surface-container-lowest border-l border-outline-variant p-6 flex flex-col h-full overflow-y-auto card-shadow z-10 flex-shrink-0" style={{ width: '360px' }}>
          <h2 className="text-headline-md font-semibold mb-5">Payment Method</h2>

          <div className="flex-1 space-y-6">
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

            {/* Gift card */}
            <button className="w-full flex justify-between items-center p-4 bg-surface border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">featured_seasonal_and_gifts</span>
                <span className="text-title-lg font-semibold">Add Gift Card</span>
              </div>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Bottom action bar */}
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-label-sm font-mono text-on-surface-variant">Total to Pay</p>
                <p className="text-headline-md font-semibold text-on-surface">
                  ${(total - (promoApplied ? 5 : 0)).toFixed(2)}
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
            <button
              onClick={handleCompleteSale}
              disabled={processing}
              className="w-full py-5 bg-primary text-on-primary rounded-xl text-headline-md font-semibold card-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[22px]">refresh</span>
                  <span>Processing…</span>
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
          <div className="bg-surface-container-lowest p-12 rounded-3xl modal-shadow max-w-md w-full mx-4 text-center animate-[fadeInScale_0.3s_ease]">
            <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-secondary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h2 className="text-headline-lg font-semibold mb-3">Payment Successful</h2>
            <p className="text-body-lg text-on-surface-variant mb-8">
              Order {orderNumber} has been processed. A digital receipt has been sent.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleNewTransaction}
                className="w-full py-4 bg-primary text-on-primary rounded-xl text-title-lg font-semibold hover:opacity-90 transition-opacity"
              >
                New Transaction
              </button>
              <button className="w-full py-4 bg-surface-container-high text-on-surface-variant rounded-xl text-title-lg font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-[20px]">print</span>
                Print Paper Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
