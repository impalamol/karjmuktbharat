import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { colors } from '@/lib/design-tokens'
import { formatCompactINR } from '@/lib/format'

export interface TenurePoint {
  month: number
  withoutKarjmukt: number
  withKarjmukt: number
}

/** Recharts is heavy, so this file is its own lazy chunk. */
export default function TenureChart({ data, labels }: { data: TenurePoint[]; labels: { without: string; with: string; months: string } }) {
  return (
    <div className="h-56 w-full md:h-64" role="img" aria-label={`${labels.without} vs ${labels.with}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gWith" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent.DEFAULT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colors.accent.DEFAULT} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gWithout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.neutral[400]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={colors.neutral[400]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke={colors.neutral[200]} vertical={false} />
          <XAxis dataKey="month" type="number" domain={[0, "dataMax"]} tickCount={6} allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={colors.neutral[500]} tickFormatter={(m: number) => `${Math.round(m / 12)}y`} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} stroke={colors.neutral[500]} tickFormatter={(v: number) => formatCompactINR(v)} />
          <Tooltip
            formatter={(v: number) => formatCompactINR(v)}
            labelFormatter={(m: number) => `${labels.months}: ${m}`}
            contentStyle={{ borderRadius: 8, border: `1px solid ${colors.neutral[200]}`, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="withoutKarjmukt" name={labels.without} stroke={colors.neutral[400]} strokeWidth={2} fill="url(#gWithout)" />
          <Area type="monotone" dataKey="withKarjmukt" name={labels.with} stroke={colors.accent.DEFAULT} strokeWidth={2} fill="url(#gWith)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
