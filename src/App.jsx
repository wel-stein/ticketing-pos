import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StoreProvider } from './context/StoreContext'
import { ThemeProvider } from './context/ThemeContext'
import Terminal from './pages/Terminal'
import Checkout from './pages/Checkout'
import Inventory from './pages/Inventory'
import Counters from './pages/Counters'
import Reports from './pages/Reports'
import History from './pages/History'
import Support from './pages/Support'

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <CartProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Terminal />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/counters" element={<Counters />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<History />} />
              <Route path="/support" element={<Support />} />
            </Routes>
          </HashRouter>
        </CartProvider>
      </StoreProvider>
    </ThemeProvider>
  )
}
