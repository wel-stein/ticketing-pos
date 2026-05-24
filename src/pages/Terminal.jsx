import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { PRODUCTS, CATEGORIES } from '../data'
import SideNav from '../components/SideNav'
import TopBar from '../components/TopBar'

function StatusChip({ status }) {
  const styles = {
    'In Stock': 'text-secondary bg-secondary-container/30',
    'Low Stock': 'text-tertiary bg-[#ffdcc6]/50',
    'Out of Stock': 'text-error bg-error-container/50',
  }
  return (
    <span className={`text-label-sm font-mono px-2 py-0.5 rounded ${styles[status] ?? 'text-outline'}`}>
      {status}
    </span>
  )
}

function ProductCard({ product, onAdd }) {
  const disabled = product.status === 'Out of Stock'
  return (
    <div
      className={`group bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all card-shadow flex flex-col ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary active:scale-[0.97]'
      } duration-150`}
      onClick={() => !disabled && onAdd(product)}
    >
      <div className="aspect-square w-full relative bg-surface-container overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="absolute bottom-2 right-2 bg-primary text-on-primary px-3 py-1 rounded-lg text-body-md font-bold">
          ${product.price.toFixed(2)}
        </div>
        {disabled && (
          <div className="absolute inset-0 bg-surface-container-lowest/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-4xl">block</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-label-sm font-mono text-outline mb-1 uppercase tracking-wider">
          {product.sku}
        </div>
        <div className="text-title-lg text-on-surface line-clamp-2 font-semibold leading-tight">
          {product.name}
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <StatusChip status={product.status} />
          <button
            disabled={disabled}
            onClick={e => { e.stopPropagation(); !disabled && onAdd(product) }}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-110 active:scale-90 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
      <div className="flex-1 min-w-0">
        <div className="text-label-sm font-mono text-outline uppercase tracking-wider truncate">{item.sku}</div>
        <div className="text-body-md font-semibold text-on-surface truncate">{item.name}</div>
        <div className="text-primary font-bold mt-0.5">${(item.price * item.quantity).toFixed(2)}</div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center bg-surface-container-lowest rounded-lg border border-outline-variant">
          <button
            onClick={() => onUpdate(item.id, -1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-l-lg transition-colors text-on-surface font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span className="text-label-md font-mono w-8 text-center text-on-surface">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, 1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-r-lg transition-colors text-primary font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-error text-on-error hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  )
}

export default function Terminal() {
  const [activeCategory, setActiveCategory] = useState('All Items')
  const [searchQuery, setSearchQuery] = useState('')
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, tax, total } = useCart()

  const filtered = PRODUCTS.filter(p => {
    const catMatch = activeCategory === 'All Items' || p.category === activeCategory
    const q = searchQuery.toLowerCase()
    const searchMatch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return catMatch && searchMatch
  })

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col overflow-hidden">
      <TopBar brand showSearch searchValue={searchQuery} onSearch={setSearchQuery} />

      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Category filter */}
          <div className="px-6 py-3 bg-surface flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant flex-shrink-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full font-mono text-label-md flex-shrink-0 transition-all duration-150 ${
                  activeCategory === cat
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-on-surface-variant opacity-40">
                <span className="material-symbols-outlined text-6xl mb-3">search_off</span>
                <p className="text-body-md">No products found</p>
              </div>
            )}
          </div>
        </main>

        {/* Cart panel */}
        <aside className="hidden md:flex flex-col h-full flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant" style={{ width: '360px' }}>
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart</span>
              <h2 className="text-title-lg font-semibold text-on-surface">Active Cart</h2>
              {cart.length > 0 && (
                <span className="ml-1 bg-primary text-on-primary text-label-sm font-mono rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((a, i) => a + i.quantity, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-label-sm font-mono text-error hover:underline transition-all"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <span className="material-symbols-outlined text-6xl mb-3">shopping_bag</span>
                <p className="text-body-md leading-relaxed">Cart is empty.<br />Select items to start.</p>
              </div>
            ) : (
              cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>

          <div className="p-6 bg-surface border-t border-outline-variant flex flex-col gap-3">
            <div className="flex justify-between items-center text-body-md">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-body-md">
              <span className="text-on-surface-variant">Tax (8%)</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-1 border-t border-outline-variant">
              <span className="text-title-lg font-semibold text-on-surface">Total</span>
              <span className="text-display-price font-bold text-primary leading-none tracking-tight">
                ${total.toFixed(2)}
              </span>
            </div>
            <Link
              to={cart.length > 0 ? '/checkout' : '#'}
              className={`w-full bg-primary text-on-primary py-4 rounded-xl text-title-lg font-semibold transition-all flex items-center justify-center gap-2 card-shadow mt-1 ${
                cart.length === 0
                  ? 'opacity-40 pointer-events-none cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              <span>Proceed to Checkout</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
