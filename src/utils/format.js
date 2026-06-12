export const fmtRM = (n) => `RM${(Number(n) || 0).toFixed(2)}`

export const TAX_RATE = 0.08

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateTime(iso) {
  return `${fmtDate(iso)} ${fmtTime(iso)}`
}
