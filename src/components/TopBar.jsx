import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const USER = {
  name: 'John Doe',
  initials: 'JD',
  role: 'Sales Staff',
  counter: '04',
  shift: 'Morning Shift',
  since: '08:00 AM',
}

const NOTIFICATIONS_DATA = [
  {
    id: 1,
    icon: 'warning',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary-fixed/40',
    title: 'Low Stock Alert',
    body: 'MBM-002 has only 8 units remaining.',
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    icon: 'check_circle',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary-container/50',
    title: 'Shift Summary Ready',
    body: 'Morning shift: 12 transactions · RM1,842.50 total.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 3,
    icon: 'system_update',
    iconColor: 'text-primary',
    iconBg: 'bg-primary-fixed',
    title: 'Firmware Updated',
    body: 'Terminal updated to v2.4.1 — no action needed.',
    time: '3h ago',
    unread: false,
  },
  {
    id: 4,
    icon: 'sell',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary-fixed/30',
    title: 'New Promo Code Active',
    body: 'SUMMER10 — 10% off all apparel items.',
    time: 'Today',
    unread: false,
  },
]

function NotificationsDropdown({ onClose }) {
  const [notifs, setNotifs] = useState(NOTIFICATIONS_DATA)
  const unreadCount = notifs.filter(n => n.unread).length

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden z-50"
      style={{ boxShadow: 'var(--shadow-modal)', animation: 'fadeInDown 0.15s ease' }}
    >
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">notifications</span>
          <h3 className="text-title-lg font-semibold text-on-surface">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-on-primary text-label-sm font-mono rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => setNotifs(n => n.map(i => ({ ...i, unread: false })))}
            className="text-label-sm font-mono text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-outline-variant">
        {notifs.map(n => (
          <button
            key={n.id}
            onClick={() => setNotifs(prev => prev.map(i => i.id === n.id ? { ...i, unread: false } : i))}
            className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-container-low transition-colors ${n.unread ? 'bg-primary-fixed/20' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${n.iconBg}`}>
              <span
                className={`material-symbols-outlined text-[18px] ${n.iconColor}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {n.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-body-md font-semibold leading-tight ${n.unread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {n.title}
                </p>
                <span className="text-label-sm font-mono text-outline flex-shrink-0">{n.time}</span>
              </div>
              <p className="text-label-sm font-mono text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
          </button>
        ))}
      </div>

      <div className="border-t border-outline-variant p-3">
        <button
          onClick={onClose}
          className="w-full py-2.5 font-mono text-label-md text-primary hover:bg-surface-container-low rounded-xl transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-primary' : 'bg-outline-variant'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SettingsDropdown({ onClose }) {
  const [settings, setSettings] = useState({ sound: true, autoPrint: false })
  const toggle = key => setSettings(s => ({ ...s, [key]: !s[key] }))
  const { isDark, toggleTheme } = useTheme()

  return (
    <div
      className="absolute right-0 top-full mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden z-50"
      style={{ boxShadow: 'var(--shadow-modal)', animation: 'fadeInDown 0.15s ease' }}
    >
      <div className="px-5 py-4 border-b border-outline-variant bg-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[22px]">settings</span>
        <h3 className="text-title-lg font-semibold text-on-surface">Quick Settings</h3>
      </div>

      <div className="divide-y divide-outline-variant">
        {[
          { key: 'sound', icon: 'volume_up', label: 'Sound Effects' },
          { key: 'autoPrint', icon: 'print', label: 'Auto-Print Receipt' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{item.icon}</span>
              <span className="text-body-md font-medium text-on-surface">{item.label}</span>
            </div>
            <ToggleSwitch on={settings[item.key]} onClick={() => toggle(item.key)} />
          </div>
        ))}

        <div className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">dark_mode</span>
            <span className="text-body-md font-medium text-on-surface">Dark Mode</span>
          </div>
          <ToggleSwitch on={isDark} onClick={toggleTheme} />
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-outline-variant bg-surface-container-low grid grid-cols-2 gap-x-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Currency</span>
          <span className="text-body-md font-semibold text-on-surface">MYR (RM)</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Printer</span>
          <span className="text-body-md font-semibold text-on-surface truncate">Star TSP100</span>
        </div>
      </div>

      <div className="p-3 border-t border-outline-variant">
        <button
          onClick={onClose}
          className="w-full py-2.5 font-mono text-label-md text-primary hover:bg-surface-container-low rounded-xl transition-colors"
        >
          Open Full Settings
        </button>
      </div>
    </div>
  )
}

function ProfileDropdown({ onClose }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden z-50"
      style={{ boxShadow: 'var(--shadow-modal)', animation: 'fadeInDown 0.15s ease' }}
    >
      <div className="px-5 py-4 bg-primary-fixed border-b border-outline-variant flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg flex-shrink-0">
          {USER.initials}
        </div>
        <div className="min-w-0">
          <p className="text-title-lg font-semibold text-on-surface truncate">{USER.name}</p>
          <p className="text-label-sm font-mono text-on-surface-variant">{USER.role} · Counter {USER.counter}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
            <span className="text-label-sm font-mono text-secondary">{USER.shift} since {USER.since}</span>
          </div>
        </div>
      </div>

      <div className="py-1.5">
        {[
          { icon: 'manage_accounts', label: 'My Profile',    sub: 'View & edit account details' },
          { icon: 'pin',             label: 'Change PIN',     sub: 'Update your access PIN' },
          { icon: 'swap_horiz',      label: 'Switch Counter', sub: 'Move to a different terminal' },
        ].map(item => (
          <button
            key={item.icon}
            onClick={onClose}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors text-left group"
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant group-hover:text-primary transition-colors">
              {item.icon}
            </span>
            <div>
              <p className="text-body-md font-medium text-on-surface leading-tight">{item.label}</p>
              <p className="text-label-sm font-mono text-on-surface-variant">{item.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-outline-variant py-1.5">
        <div className="px-5 py-2 flex justify-between text-label-sm font-mono text-on-surface-variant">
          <span>Session ID</span>
          <span className="text-outline">SESS-8A24F</span>
        </div>
        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-error-container transition-colors text-left group"
        >
          <span className="material-symbols-outlined text-[22px] text-error">logout</span>
          <div>
            <p className="text-body-md font-medium text-error leading-tight">Sign Out</p>
            <p className="text-label-sm font-mono text-on-surface-variant">End this session</p>
          </div>
        </button>
      </div>
    </div>
  )
}

/**
 * Props:
 *  brand       – show "ManjaLink POS" logo on the left
 *  pageTitle   – show a page-level h1 heading on the left
 *  back        – { to, label } show a back-navigation button
 *  showSearch  – show inline search input
 *  searchValue / onSearch – controlled search state
 *  orderNumber – show an order-ID badge on the right (Checkout)
 */
export default function TopBar({
  brand = false,
  pageTitle,
  back,
  showSearch = false,
  searchValue = '',
  onSearch,
  orderNumber,
}) {
  const [activePanel, setActivePanel] = useState(null)
  const rightActionsRef = useRef(null)
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    if (!activePanel) return
    const handler = e => {
      if (rightActionsRef.current && !rightActionsRef.current.contains(e.target)) {
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activePanel])

  const togglePanel = panel => setActivePanel(p => p === panel ? null : panel)

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-6 h-touch-target-min flex-shrink-0 z-40">

      {/* ── Left ── */}
      <div className="flex items-center gap-3">
        {back && (
          <>
            <Link
              to={back.to}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="font-mono text-label-md">{back.label}</span>
            </Link>
            {(brand || pageTitle) && (
              <div className="h-5 w-px bg-outline-variant" />
            )}
          </>
        )}

        {brand && (
          <span className="text-title-lg font-bold text-primary">ManjaLink POS</span>
        )}

        {brand && pageTitle && (
          <div className="h-5 w-px bg-outline-variant" />
        )}

        {pageTitle && (
          <h1 className="text-title-lg font-semibold text-on-surface">{pageTitle}</h1>
        )}
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1" ref={rightActionsRef}>
        {/* Inline search (Terminal) */}
        {showSearch && (
          <div className="relative hidden md:block mr-2">
            <input
              className="bg-surface-container-low border-none rounded-full pl-4 pr-10 py-1.5 text-label-md font-mono w-64 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Search products..."
              value={searchValue}
              onChange={e => onSearch?.(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
          </div>
        )}

        {/* Order number badge (Checkout) */}
        {orderNumber && (
          <span className="font-mono text-label-md text-on-surface-variant mr-2 hidden sm:block">
            Order {orderNumber}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => togglePanel('notifications')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              activePanel === 'notifications'
                ? 'bg-primary-fixed text-primary ring-2 ring-primary ring-offset-1'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          {activePanel === 'notifications' && (
            <NotificationsDropdown onClose={() => setActivePanel(null)} />
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => togglePanel('settings')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              activePanel === 'settings'
                ? 'bg-primary-fixed text-primary ring-2 ring-primary ring-offset-1'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>
          {activePanel === 'settings' && (
            <SettingsDropdown onClose={() => setActivePanel(null)} />
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => togglePanel('profile')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              activePanel === 'profile'
                ? 'bg-primary-fixed text-primary ring-2 ring-primary ring-offset-1'
                : 'text-primary hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
          </button>
          {activePanel === 'profile' && (
            <ProfileDropdown onClose={() => setActivePanel(null)} />
          )}
        </div>
      </div>
    </header>
  )
}
