import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [options, setOptions] = useState({ staff: [], counters: [] })
  const [staffCode, setStaffCode] = useState('')
  const [counterId, setCounterId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsError, setOptionsError] = useState(null)

  useEffect(() => {
    api.get('/auth/staff-options')
      .then(data => {
        setOptions(data)
        if (data.staff.length === 1) setStaffCode(data.staff[0].staff_code)
        if (data.counters.length === 1) setCounterId(String(data.counters[0].id))
      })
      .catch(err => setOptionsError(err.message))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(staffCode, pin, counterId ? Number(counterId) : null)
    } catch (err) {
      setError(err.message)
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  const noStaffConfigured = !optionsError && options.staff.length === 0

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-6">
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
      >
        <span className="material-symbols-outlined text-[22px]">
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">point_of_sale</span>
          </div>
          <h1 className="text-headline-lg font-bold text-primary">ManjaLink POS</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Counter sign in</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 card-shadow flex flex-col gap-4"
        >
          {optionsError && (
            <p className="text-label-md font-mono text-error bg-error-container/40 rounded-lg px-3 py-2">
              {optionsError}
            </p>
          )}

          {noStaffConfigured && (
            <p className="text-label-md font-mono text-on-surface-variant bg-surface-container-high rounded-lg px-3 py-2 leading-relaxed">
              No staff account has a PIN yet. Set one with{' '}
              <span className="text-on-surface font-semibold">npm run set-pin STF-004</span>.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant" htmlFor="staff">
              Staff
            </label>
            <select
              id="staff"
              required
              value={staffCode}
              onChange={e => setStaffCode(e.target.value)}
              className="w-full h-touch-target-min px-4 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">Select staff…</option>
              {options.staff.map(s => (
                <option key={s.staff_code} value={s.staff_code}>
                  {s.name} ({s.staff_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant" htmlFor="counter">
              Counter
            </label>
            <select
              id="counter"
              value={counterId}
              onChange={e => setCounterId(e.target.value)}
              className="w-full h-touch-target-min px-4 bg-surface border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">Select counter…</option>
              {options.counters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-label-md text-on-surface-variant" htmlFor="pin">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              className="w-full h-touch-target-min px-4 bg-surface border border-outline-variant rounded-lg text-body-md font-mono tracking-[0.3em] focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {error && (
            <p className="text-label-md font-mono text-error flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !staffCode || !pin}
            className="w-full py-4 bg-primary text-on-primary rounded-xl text-title-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
