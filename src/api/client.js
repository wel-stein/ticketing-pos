/**
 * Thin fetch wrapper. Always sends the session cookie, and turns a non-2xx
 * response into an ApiError carrying the server's message so callers can show
 * it directly.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(method, path, body) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0)
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(payload?.error || `Request failed (${response.status}).`, response.status)
  }
  return payload
}

export const api = {
  get:   path => request('GET', path),
  post:  (path, body) => request('POST', path, body),
  put:   (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
}

/** Build a querystring, skipping empty values. */
export function qs(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const string = search.toString()
  return string ? `?${string}` : ''
}
