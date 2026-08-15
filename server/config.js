import 'dotenv/config'

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
      'Copy server/.env.example to server/.env and fill it in.'
    )
  }
  return value
}

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    server: required('DB_SERVER'),
    database: process.env.DB_DATABASE || 'dbmanjapos',
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    port: Number(process.env.DB_PORT || 1433),
    options: {
      // Most on-prem SQL Server instances use a self-signed certificate.
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
      enableArithAbort: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  },

  session: {
    cookieName: 'manjapos_sid',
    // Sessions are rows in dbo.sessions; this only bounds how long one lives.
    ttlHours: Number(process.env.SESSION_TTL_HOURS || 12),
    secure: process.env.COOKIE_SECURE === 'true',
  },

  auth: {
    maxFailedAttempts: Number(process.env.AUTH_MAX_FAILED || 5),
    lockoutMinutes: Number(process.env.AUTH_LOCKOUT_MINUTES || 15),
  },
}
