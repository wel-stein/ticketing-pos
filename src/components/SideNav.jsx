import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/', icon: 'point_of_sale', label: 'Sales' },
  { path: '/inventory', icon: 'inventory_2', label: 'Inventory' },
  { path: '/counters', icon: 'storefront', label: 'Counters' },
  { path: '/reports', icon: 'monitoring', label: 'Reports' },
  { path: '/history', icon: 'history', label: 'History' },
]

function LogoutModal({ onClose }) {
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await logout()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-surface-container-lowest rounded-2xl w-full max-w-xs mx-4 overflow-hidden text-center"
        style={{ boxShadow: 'var(--shadow-modal)', animation: 'fadeInScale 0.15s ease' }}
      >
        <div className="px-6 pt-8 pb-6">
          <div className="w-14 h-14 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-error text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              logout
            </span>
          </div>
          <h3 className="text-headline-md font-semibold text-on-surface mb-2">End Session?</h3>
          <p className="text-body-md text-on-surface-variant">
            You're signed in as <span className="font-semibold text-on-surface">{user?.name}</span>
            {user?.counterName && <> at <span className="font-semibold text-on-surface">{user.counterName}</span></>}.
            Any items still in the cart will be lost.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={signingOut}
            className="flex-1 py-3 border border-outline-variant rounded-xl font-mono text-label-md text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex-1 py-3 bg-error text-on-error rounded-xl font-mono text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {signingOut ? 'Signing out…' : 'End Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SideNav() {
  const location = useLocation()
  const [showLogout, setShowLogout] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <aside className="hidden lg:flex flex-col h-full bg-surface-container-low border-r border-outline-variant flex-shrink-0 overflow-y-auto" style={{ width: '280px' }}>
        <div className="px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="min-w-0">
              <p className="text-label-md font-mono font-bold text-on-surface truncate">
                {user?.counterName ?? 'No counter'}
              </p>
              <p className="text-label-sm font-mono text-on-surface-variant truncate">
                Staff: {user?.name}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-150 font-mono text-label-md ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container scale-[0.97]'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 px-2 pb-4 border-t border-outline-variant pt-4 mx-2">
          <Link
            to="/support"
            className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-150 font-mono text-label-md ${
              location.pathname === '/support'
                ? 'bg-secondary-container text-on-secondary-container scale-[0.97]'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={location.pathname === '/support' ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              help
            </span>
            <span>Support</span>
          </Link>
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 text-error px-4 py-3 hover:bg-error-container rounded-full transition-colors font-mono text-label-md w-full text-left"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  )
}
