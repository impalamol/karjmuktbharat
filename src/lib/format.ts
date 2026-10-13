import { CRORE, LAKH } from './calculations'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('en-IN')

export const formatINR = (v: number) => (Number.isFinite(v) ? inr.format(v) : '—')
export const formatNumber = (v: number) => (Number.isFinite(v) ? num.format(v) : '—')

/** 1,23,45,678 -> "₹1.23 Cr"; 4,50,000 -> "₹4.5 L" */
export function formatCompactINR(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= CRORE) return `₹${trim(v / CRORE)} Cr`
  if (Math.abs(v) >= LAKH) return `₹${trim(v / LAKH)} L`
  return formatINR(v)
}

export function formatCompactNumber(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v >= CRORE) return `${trim(v / CRORE)} Cr`
  if (v >= LAKH) return `${trim(v / LAKH)} L`
  return num.format(v)
}

function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

export function formatMonths(m: number, labels: { yr: string; mo: string; never: string }): string {
  if (!Number.isFinite(m)) return labels.never
  const y = Math.floor(m / 12)
  const r = m % 12
  return [y ? `${y} ${labels.yr}` : '', r ? `${r} ${labels.mo}` : ''].filter(Boolean).join(' ') || `0 ${labels.mo}`
}

export const maskAccount = (last4: string) => `•••• •••• ${last4}`

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}
