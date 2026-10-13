import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { MotiView } from 'moti'
import { GraduationCap, Home } from 'lucide-react-native'
import { Screen } from '@/components/Screen'
import { T } from '@/components/T'
import { Segmented } from '@/components/Segmented'
import { CandleChart, toCandles } from '@/components/CandleChart'
import { CountUp } from '@/components/CountUp'
import { ListRow } from '@/components/ListRow'
import { ErrorView, SkeletonBlock } from '@/components/States'
import { useRescueDaily, useRescueWall } from '@/lib/api'
import { BLOCK_RULES, calculatePooledRescueCapacity, calculateTypeTotals, type BlockType } from '@/lib/calculations'
import { formatNumber, formatShortINR } from '@/lib/format'
import { rescueRow } from '@/lib/rescue'
import { colors } from '@/theme/tokens'

type Range = 'daily' | 'weekly' | 'monthly'
const RANGES: Record<Range, { days: number; per: number; label: (d: Date) => string }> = {
  daily: { days: 30, per: 1, label: (d) => String(d.getDate()) },
  weekly: { days: 84, per: 7, label: (d) => `${d.getDate()}/${d.getMonth() + 1}` },
  monthly: { days: 360, per: 30, label: (d) => d.toLocaleString('en-IN', { month: 'short' }) },
}

/** Pill with a mint circle icon: "Houses Saved 22,400". */
function StatPill({ icon: Icon, label, value, delay }: { icon: typeof Home; label: string; value: number; delay: number }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140, delay }} className="flex-1 flex-row items-center gap-2.5 rounded-full bg-gray-900 p-2 pr-3">
      <View className="size-10 items-center justify-center rounded-full bg-mint-strong">
        <Icon size={18} color={colors.ink} />
      </View>
      <View className="flex-1">
        <T variant="small" className="text-gray-400" numberOfLines={1}>{label}</T>
        <CountUp value={value} format={formatNumber} variant="title" className="text-paper" />
      </View>
    </MotiView>
  )
}

/** One breakdown row with an animated share bar. */
function ShareRow({ label, pct, amount, color, index }: { label: string; pct: number; amount: number; color: string; index: number }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350, delay: 200 + index * 100 }} className="gap-2 py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
          <T variant="label" className="text-paper">{label}</T>
          <T variant="small" className="text-gray-500">{pct}%</T>
        </View>
        <T className="font-heavy text-base text-paper">{formatShortINR(amount)}</T>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <MotiView from={{ width: '0%' }} animate={{ width: `${pct}%` }} transition={{ type: 'timing', duration: 900, delay: 300 + index * 100 }} style={{ height: '100%', backgroundColor: color, borderRadius: 999 }} />
      </View>
    </MotiView>
  )
}

/** Black analytics screen: monthly rescue pool, candlestick of rescues per day, pool split. */
export default function Rescue() {
  const [type, setType] = useState<BlockType>('home')
  const [range, setRange] = useState<Range>('daily')
  const users = BLOCK_RULES[type].targetUsers
  const totals = useMemo(() => calculateTypeTotals(type, users), [type, users])
  const r = RANGES[range]
  const daily = useRescueDaily(type, r.days, users)
  const candles = useMemo(() => (daily.data ? toCandles(daily.data, r.per, r.label) : []), [daily.data, r])
  const wall = useRescueWall()
  const recent = (wall.data?.pages.flat() ?? []).filter((x) => x.loan_type === type).slice(0, 3)
  const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const regularCsr = totals.csrPool - totals.rescuePool

  return (
    <Screen dark>
      <View className="flex-row items-center justify-between pt-3">
        <T variant="title" className="text-paper">Rescue Analytics</T>
        <View className="w-36">
          <Segmented dark options={[{ key: 'home', label: 'Home' }, { key: 'education', label: 'Edu' }]} value={type} onChange={setType} />
        </View>
      </View>

      <View className="gap-1">
        <T variant="small" className="text-sm text-gray-400">Rescue Pool / Month</T>
        <MotiView key={type} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 160 }}>
          <T variant="hero" className="text-[48px] leading-[54px] text-paper">{formatShortINR(totals.rescuePool)}</T>
        </MotiView>
        <T variant="small" className="text-gray-500">{month} · at {formatNumber(users)} members</T>
      </View>

      <Segmented dark options={[{ key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }]} value={range} onChange={setRange} />

      <View className="gap-2">
        <T variant="small" className="text-gray-400">{type === 'home' ? 'Houses' : 'Students'} saved per day</T>
        {daily.isError ? <ErrorView dark error={daily.error} onRetry={() => daily.refetch()} /> : daily.isLoading ? <SkeletonBlock dark className="h-[200px]" /> : <CandleChart key={`${type}-${range}`} candles={candles} />}
      </View>

      <View className="flex-row gap-3">
        <StatPill icon={Home} label="Houses Saved" value={calculatePooledRescueCapacity('home', BLOCK_RULES.home.targetUsers)} delay={200} />
        <StatPill icon={GraduationCap} label="Students Saved" value={calculatePooledRescueCapacity('education', BLOCK_RULES.education.targetUsers)} delay={300} />
      </View>

      <View className="rounded-card bg-gray-900 p-5">
        <T variant="title" className="mb-2 text-paper">Pool Breakdown</T>
        <ShareRow index={0} label="Rescue" pct={Math.round((totals.rescuePool / totals.csrPool) * 100)} amount={totals.rescuePool} color={colors.mint.strong} />
        <ShareRow index={1} label="Regular (CSR)" pct={Math.round((regularCsr / totals.csrPool) * 100)} amount={regularCsr} color={colors.sky.strong} />
        <ShareRow index={2} label="Borrower pool" pct={Math.round((totals.borrowerPool / totals.totalPool) * 100)} amount={totals.borrowerPool} color={colors.beige.strong} />
        <T variant="small" className="mt-2 text-gray-500">80% of CSR funds go to rescues. Borrower money always returns to borrowers.</T>
      </View>

      {recent.length > 0 && (
        <View>
          <T variant="title" className="text-paper">Latest rescues</T>
          {recent.map((x, i) => (
            <ListRow key={x.id} index={i} dark {...rescueRow(x)} amountClass="text-mint-strong" />
          ))}
        </View>
      )}
    </Screen>
  )
}
