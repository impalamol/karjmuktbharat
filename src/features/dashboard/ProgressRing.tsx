import { m } from 'framer-motion'
import { useThemeColors } from '@/lib/theme'

/** SVG ring whose strokeDashoffset animates from empty to `value`% (easeInOut 1.5s). */
export function ProgressRing({ value, size = 120, stroke = 10, label, sublabel }: { value: number; size?: number; stroke?: number; label: string; sublabel?: string }) {
  const colors = useThemeColors()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${pct.toFixed(0)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.secondary.DEFAULT} />
            <stop offset="100%" stopColor={colors.accent.DEFAULT} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.neutral[200]} strokeWidth={stroke} />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tabular text-primary">{pct.toFixed(0)}%</span>
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  )
}
