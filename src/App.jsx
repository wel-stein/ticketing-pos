import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { StoreProvider, useStore } from './context/StoreContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Terminal from './pages/Terminal'
import Checkout from './pages/Checkout'
import Inventory from './pages/Inventory'
import Counters from './pages/Counters'
import Reports from './pages/Reports'
import History from './pages/History'
import Support from './pages/Support'

function Splash({ message, detail }) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center gap-3">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      <p className="text-body-md text-on-surface-variant">{message}</p>
      {detail && <p className="text-label-md font-mono text-error max-w-md text-center">{detail}</p>}
    </div>
  )
}

/** Blocks the app shell until the first data load finishes, so pages can keep
 *  assuming their lists are present rather than each handling a loading state. */
function StoreGate({ children }) {
  const { loading, error, refresh } = useStore()

  if (loading) return <Splash message="Loading counter data…" />

  if (error) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-error text-5xl">cloud_off</span>
        <div>
          <p className="text-title-lg font-semibold text-on-surface">Could not load data</p>
          <p className="text-label-md font-mono text-on-surface-variant mt-1">{error}</p>
        </div>
        <button
          onClick={refresh}
          className="px-6 py-3 bg-primary text-on-primary rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <Splash message="Checking your session…" />
  if (!isAuthenticated) return <Login />

  return (
    <StoreProvider>
      <StoreGate>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Terminal />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/counters" element={<Counters />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </CartProvider>
      </StoreGate>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
