# ManjaLink Counter POS

Counter inventory and sales system (SRS HISB/CR/00130). React + Vite front end,
Express API, SQL Server (`dbmanjapos`).

## Layout

```
src/            React SPA (HashRouter)
  api/client.js   fetch wrapper — all calls go to /api
  context/        Auth, Store (server-backed), Cart, Theme
server/         Express API
  db.js           mssql pool, query/withTransaction/nextDocNo helpers
  auth.js         PIN verification, sessions, requireAuth
  routes/         auth, catalog, stock, sales, reports
  scripts/        set-pin.js
```

## First-time setup

### 1. Install

```bash
npm install
```

### 2. Configure the database connection

```bash
cp server/.env.example server/.env
```

Fill in `DB_SERVER`, `DB_USER` and `DB_PASSWORD`. Use a SQL login scoped to
`dbmanjapos` only — it does not need server-wide rights. The minimum is:

```sql
USE dbmanjapos;
CREATE USER manjapos_app FOR LOGIN manjapos_app;
ALTER ROLE db_datareader ADD MEMBER manjapos_app;
ALTER ROLE db_datawriter ADD MEMBER manjapos_app;
```

`server/.env` is gitignored. Never commit it.

### 3. Set a staff PIN

No one can sign in until a PIN exists — every seeded staff row starts with a
null hash, which can never authenticate.

```bash
npm run set-pin STF-004
```

The script prompts twice, hides what you type, and stores only a bcrypt hash.
Nothing is passed on the command line, so PINs stay out of shell history.
Seeded staff codes: `STF-001` (Karen Khor, Supervisor), `STF-004` (John Doe),
`STF-009` (M. Smith), `STF-012` (K. Johnson).

Re-running it resets the PIN and signs out that person's existing sessions.

### 4. Run

```bash
npm run dev          # Vite on :5173 + API on :3001 together
```

Vite proxies `/api` to the API, so the session cookie is same-origin in dev
exactly as in production. Individually: `npm run dev:web`, `npm run dev:api`.

Check the API alone with `curl http://localhost:3001/api/health`.

## Production

```bash
npm run build        # -> dist/
npm start            # API only
```

Serve `dist/` from your web server and reverse-proxy `/api` to the Node
process. Set `COOKIE_SECURE=true` and `NODE_ENV=production`; the session
cookie is httpOnly + SameSite=Lax and must only travel over HTTPS.

## Database

`dbmanjapos` on the handal SQL Server instance.

| Table | Holds |
|---|---|
| `products` | catalogue, current stock, min/max levels |
| `counters` | sales counters |
| `staff` | staff, PIN hash, lockout state |
| `transactions` / `transaction_items` | sales header and lines |
| `stock_movements` | the stock ledger — IN / OUT / RETURN / SALE |
| `audit_log` | who did what |
| `sessions` | live sign-ins (revocable) |
| `document_sequences` | SI / SO / RT / TX running numbers |
| `categories`, `units_of_measure` | lookups |

Notes on the design:

- **The ledger is authoritative.** Every stock change writes a
  `stock_movements` row carrying `balance_after`, so history is
  reconstructable without replaying `products.stock`.
- **Sales are atomic.** Stock decrement, header, lines and ledger rows all
  happen in one SQL transaction; a sale that cannot fully post does not post.
  Product rows are taken with `UPDLOCK` so concurrent counters cannot oversell.
- **Prices come from the database**, never from the client. The browser sends
  product ids and quantities only.
- **Document numbers come from `document_sequences`**, reserved with an
  `UPDATE ... OUTPUT` inside the transaction, so two counters cannot mint the
  same number. The UI shows "Assigned on save" rather than guessing.
- **Names are snapshotted** next to their foreign keys on transactions and
  movements, so renaming a counter later does not rewrite historical receipts.
- **There is no tax.** Totals are subtotal minus discount.

## Auth

Staff pick their ID and counter, then enter a PIN. The server returns an
httpOnly cookie holding an opaque session id; the session lives in
`dbo.sessions`, so signing out revokes immediately.

- PINs are bcrypt hashed (cost 12) and 4–12 digits.
- Five failed attempts locks the account for 15 minutes
  (`AUTH_MAX_FAILED`, `AUTH_LOCKOUT_MINUTES`).
- `/api/auth/login` is additionally rate limited to 20 requests / 15 min per IP.
- Login never distinguishes "unknown staff" from "wrong PIN", so the endpoint
  cannot be used to enumerate staff codes.
- Every route except `/api/health` and `/api/auth/*` requires a live session.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness + DB check |
| GET | `/api/auth/staff-options` | staff and counters for the sign-in screen |
| POST | `/api/auth/login` | `{ staffCode, pin, counterId }` |
| POST | `/api/auth/logout` | revoke session |
| GET | `/api/auth/me` | current user |
| GET | `/api/products` | `?status=&category=&counterId=&search=` |
| POST/PUT | `/api/products[/:id]` | create / update |
| PATCH | `/api/products/:id/status` | activate / deactivate |
| GET/POST/PUT | `/api/counters[/:id]` | counters |
| GET | `/api/lookups` | categories, UOMs, staff |
| GET | `/api/movements` | `?type=&productId=&from=&to=` |
| POST | `/api/stock-in` \| `/api/stock-out` \| `/api/stock-return` | ledger writes |
| GET | `/api/transactions[/:id]` | `?from=&to=&staffId=&status=&txNo=` |
| POST | `/api/sales` | record a sale |
| POST | `/api/transactions/:id/refund` | refund, returns stock |
| GET | `/api/reports/summary` \| `top-products` \| `daily-sales` \| `stock-levels` | reporting |
| GET | `/api/audit` | audit trail |
