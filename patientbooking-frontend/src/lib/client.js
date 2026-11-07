// Empty in development (Vite proxies /api to the Express server). Set VITE_API_URL when the
// API is deployed on a separate origin, e.g. https://api.example.com
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function request(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, { credentials: 'include', ...options })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data
}

export const fetcher = (url) => request(url)

export function api(url, method, body) {
  return request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const dateFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

export const formatDate = (iso) => dateFmt.format(new Date(iso))
export const formatTime = (iso) => timeFmt.format(new Date(iso))
export const formatPrice = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function todayISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
