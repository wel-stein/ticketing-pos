import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { getPool } from './db.js'
import { requireAuth } from './auth.js'
import { authRouter } from './routes/auth.js'
import { catalogRouter } from './routes/catalog.js'
import { stockRouter } from './routes/stock.js'
import { salesRouter } from './routes/sales.js'
import { reportsRouter } from './routes/reports.js'

const app = express()

app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.request().query('SELECT 1 AS ok')
    res.json({ status: 'ok', database: config.db.database })
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message })
  }
})

// Throttle credential guessing on top of the per-account lockout.
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again later.' },
}))

app.use('/api/auth', authRouter)

// Everything past this point needs a live session. Mounted once on its own:
// attaching it to each router would re-run the session lookup for every
// router the path failed to match, costing a database round trip each time.
app.use('/api', requireAuth)

app.use('/api', catalogRouter)
app.use('/api', stockRouter)
app.use('/api', salesRouter)
app.use('/api', reportsRouter)

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint.' }))

// Central error handler. Client errors (a malformed JSON body, for instance,
// which express.json throws as a 400) keep their status and message; anything
// else is logged and reported generically so driver and SQL internals never
// reach the browser.
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: err.expose ? err.message : 'Bad request.' })
  }
  console.error('[api]', err)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(config.port, () => {
  console.log(`ManjaPOS API listening on http://localhost:${config.port}`)
  console.log(`Database: ${config.db.database} on ${config.db.server}`)
})
