import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { query, queryOne, sql } from './db.js'

/**
 * Verify a staff PIN and open a session.
 * Returns { session, staff } or { error } — never distinguishes "no such
 * staff" from "wrong PIN" in the error text, so the endpoint cannot be used
 * to enumerate staff codes.
 */
export async function login({ staffCode, pin, counterId, userAgent, ip }) {
  const generic = { error: 'Invalid staff ID or PIN.' }

  const staff = await queryOne(
    `SELECT id, staff_code, name, role, status, pin_hash, failed_attempts, locked_until
       FROM dbo.staff WHERE staff_code = @staffCode`,
    { staffCode }
  )

  if (!staff || staff.status !== 'Active') return generic

  if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
    return { error: 'This account is temporarily locked. Try again later.' }
  }

  // A staff row with no PIN set cannot sign in at all.
  if (!staff.pin_hash) {
    return { error: 'No PIN has been set for this account. Contact your supervisor.' }
  }

  const ok = await bcrypt.compare(pin, staff.pin_hash)
  if (!ok) {
    const attempts = staff.failed_attempts + 1
    const lock = attempts >= config.auth.maxFailedAttempts
    await query(
      `UPDATE dbo.staff
          SET failed_attempts = @attempts,
              locked_until = CASE WHEN @lock = 1
                                  THEN DATEADD(minute, @minutes, getdate())
                                  ELSE locked_until END
        WHERE id = @id`,
      { attempts, lock: lock ? 1 : 0, minutes: config.auth.lockoutMinutes, id: staff.id }
    )
    return generic
  }

  const session = await queryOne(
    `DECLARE @out TABLE (id UNIQUEIDENTIFIER, expires_at DATETIME2);
     INSERT INTO dbo.sessions (id, staff_id, counter_id, expires_at, user_agent, ip_address)
     OUTPUT inserted.id, inserted.expires_at INTO @out
     VALUES (NEWID(), @staffId, @counterId, DATEADD(hour, @ttl, getdate()), @userAgent, @ip);
     SELECT id, expires_at FROM @out;`,
    {
      staffId: staff.id,
      counterId: counterId ?? null,
      ttl: config.session.ttlHours,
      userAgent: { type: sql.NVarChar(400), value: userAgent?.slice(0, 400) ?? null },
      ip: { type: sql.NVarChar(64), value: ip?.slice(0, 64) ?? null },
    }
  )

  await query(
    `UPDATE dbo.staff SET failed_attempts = 0, locked_until = NULL,
                          last_login_at = getdate() WHERE id = @id`,
    { id: staff.id }
  )

  return {
    session,
    staff: { id: staff.id, staffCode: staff.staff_code, name: staff.name, role: staff.role },
  }
}

export async function resolveSession(sessionId) {
  if (!sessionId) return null
  return queryOne(
    `SELECT s.id AS session_id, s.expires_at,
            st.id AS staff_id, st.staff_code, st.name AS staff_name, st.role, st.status,
            c.id AS counter_id, c.name AS counter_name
       FROM dbo.sessions s
       JOIN dbo.staff st ON st.id = s.staff_id
       LEFT JOIN dbo.counters c ON c.id = s.counter_id
      WHERE s.id = @sessionId
        AND s.revoked_at IS NULL
        AND s.expires_at > getdate()
        AND st.status = 'Active'`,
    { sessionId: { type: sql.UniqueIdentifier, value: sessionId } }
  )
}

export async function revokeSession(sessionId) {
  if (!sessionId) return
  await query(
    `UPDATE dbo.sessions SET revoked_at = getdate()
      WHERE id = @sessionId AND revoked_at IS NULL`,
    { sessionId: { type: sql.UniqueIdentifier, value: sessionId } }
  )
}

/** Express middleware — rejects anything without a live session. */
export async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.[config.session.cookieName]
    const row = await resolveSession(sessionId)
    if (!row) {
      res.clearCookie(config.session.cookieName)
      return res.status(401).json({ error: 'Not signed in.' })
    }
    req.user = {
      staffId: row.staff_id,
      staffCode: row.staff_code,
      name: row.staff_name,
      role: row.role,
      counterId: row.counter_id,
      counterName: row.counter_name,
      sessionId: row.session_id,
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function isValidPinFormat(pin) {
  return typeof pin === 'string' && /^\d{4,12}$/.test(pin)
}

export function hashPin(pin) {
  return bcrypt.hash(pin, 12)
}
