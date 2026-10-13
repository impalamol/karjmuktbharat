const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('en-IN')

export const formatINR = (v: number) => (Number.isFinite(v) ? inr.format(v) : '-')
export const formatNumber = (v: number) => (Number.isFinite(v) ? num.format(Math.round(v)) : '-')

/** ₹5.2L, ₹1,120Cr: Indian short units. */
export function formatShortINR(v: number) {
  if (!Number.isFinite(v)) return '-'
  if (v >= 1e7) return `₹${num.format(+(v / 1e7).toFixed(v >= 1e9 ? 0 : 1))}Cr`
  if (v >= 1e5) return `₹${+(v / 1e5).toFixed(1)}L`
  return inr.format(v)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export const maskTail = (last4: string | number) => `****${String(last4).padStart(4, '0').slice(-4)}`
