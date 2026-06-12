import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StoreProvider } from './context/StoreContext'
import Terminal from './pages/Terminal'
import Checkout from './pages/Checkout'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import History from './pages/History'
import Support from './pages/Support'

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Terminal />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </StoreProvider>
  )
}
