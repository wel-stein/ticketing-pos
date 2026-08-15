import { Router } from 'express'
import { config } from '../config.js'
import { query } from '../db.js'
import { login, revokeSession, requireAuth, isValidPinFormat } from '../auth.js'
import { writeAudit } from '../audit.js'

export const authRouter = Router()

// Staff list for the sign-in screen. Deliberately exposes only what the
// picker needs, and only accounts that actually have a PIN set.
authRouter.get('/staff-options', async (_req, res, next) => {
  try {
    const [staff, counters] = await Promise.all([
      query(`SELECT staff_code, name, role FROM dbo.staff
              WHERE status = 'Active' AND pin_hash IS NOT NULL ORDER BY name`),
      query(`SELECT id, code, name FROM dbo.counters
              WHERE status = 'Active' ORDER BY code`),
    ])
    res.json({ staff, counters })
  } catch (err) { next(err) }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { staffCode, pin, counterId } = req.body ?? {}
    if (!staffCode || !isValidPinFormat(pin)) {
      return res.status(400).json({ error: 'Invalid staff ID or PIN.' })
    }

    const result = await login({
      staffCode,
      pin,
      counterId: counterId ? Number(counterId) : null,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })
    if (result.error) return res.status(401).json({ error: result.error })

    res.cookie(config.session.cookieName, result.session.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.session.secure,
      expires: new Date(result.session.expires_at),
    })
    await writeAudit('LOGIN', `${result.staff.staffCode} signed in`, result.staff.name)
    res.json({ user: result.staff })
  } catch (err) { next(err) }
})

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await revokeSession(req.user.sessionId)
    res.clearCookie(config.session.cookieName)
    await writeAudit('LOGOUT', `${req.user.staffCode} signed out`, req.user.name)
    res.status(204).end()
  } catch (err) { next(err) }
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      staffId: req.user.staffId,
      staffCode: req.user.staffCode,
      name: req.user.name,
      role: req.user.role,
      counterId: req.user.counterId,
      counterName: req.user.counterName,
    },
  })
})
