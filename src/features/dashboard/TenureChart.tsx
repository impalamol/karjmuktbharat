import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { m } from 'framer-motion'
import { colors } from '@/lib/design-tokens'
import { formatCompactINR } from '@/lib/format'

export interface YearPoint {
  year: number
  withoutKarjmukt: number
  withKarjmukt: number
}

/** Year-end balance bars. Bars grow from height 0 (Recharts animation) inside a Framer fade-up. Lazy chunk. */
export default function TenureChart({ data, labels }: { data: YearPoint[]; labels: { without: string; with: string; months: string } }) {
  return (
    <m.div
      className="h-56 w-full md:h-64"
      role="img"
      aria-label={`${labels.without} vs ${labels.with}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
          <defs>
            <linearGradient id="barWith" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent.DEFAULT} />
              <stop offset="100%" stopColor={colors.accent[700]} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke={colors.neutral[200]} vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} stroke={colors.neutral[500]} tickFormatter={(y: number) => `${y}y`} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} stroke={colors.neutral[500]} tickFormatter={(v: number) => formatCompactINR(v)} />
          <Tooltip
            cursor={{ fill: colors.primary[50] }}
            formatter={(v: number) => formatCompactINR(v)}
            labelFormatter={(y: number) => `${y} ${labels.months}`}
            contentStyle={{ borderRadius: 12, border: `1px solid ${colors.neutral[200]}`, fontSize: 12, boxShadow: '0 12px 24px -6px rgb(15 44 97 / 0.16)' }}
          />
          <Bar dataKey="withoutKarjmukt" name={labels.without} fill={colors.neutral[300]} radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
          <Bar dataKey="withKarjmukt" name={labels.with} fill="url(#barWith)" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </m.div>
  )
}
