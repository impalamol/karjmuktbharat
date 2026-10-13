import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { MotiView } from 'moti'
import { ArrowUpRight, Bell } from 'lucide-react-native'
import { Screen } from '@/components/Screen'
import { T } from '@/components/T'
import { Chip, IconPill, Pill } from '@/components/Pill'
import { Press } from '@/components/Pressable'
import { CountUp } from '@/components/CountUp'
import { PoolCard } from '@/components/PoolCard'
import { ListRow } from '@/components/ListRow'
import { ErrorView, SkeletonBlock } from '@/components/States'
import { useMyLoan, usePool, useProfile, useRescueWall } from '@/lib/api'
import { calculateBlockBreakdown, calculateInterestSaved, calculateRegularPerUser } from '@/lib/calculations'
import { formatINR, formatNumber, formatShortINR, maskTail } from '@/lib/format'
import { rescueRow } from '@/lib/rescue'

const initials = (name?: string | null) =>
  (name ?? 'K M')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** White dashboard: extra monthly payment, savings chips, my block pools, rescue wall. */
export default function Dashboard() {
  const profile = useProfile()
  const loan = useMyLoan()
  const l = loan.data
  const pool = usePool(l?.loan_type, l?.block_number)
  const wall = useRescueWall()
  const [autoPay, setAutoPay] = useState(true)
  const [alerts, setAlerts] = useState(true)

  if (loan.isError) return <Screen><ErrorView error={loan.error} onRetry={() => loan.refetch()} /></Screen>

  const users = pool.data?.total_users ?? 1000
  const block = l ? calculateBlockBreakdown(l.loan_type, Math.min(users, 1000)) : null
  const extra = l ? calculateRegularPerUser(l.loan_type) : 0
  const saving = l ? calculateInterestSaved(l.outstanding, Number(l.interest_rate), l.emi, extra) : null
  const years = saving && Number.isFinite(saving.monthsSaved) ? Math.round(saving.monthsSaved / 12) : null
  const rescues = wall.data?.pages.flat().slice(0, 4) ?? []

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-3">
        <Press onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel="Profile">
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full bg-lavender">
              <T className="font-heavy text-base text-lavender-ink">{initials(profile.data?.full_name)}</T>
            </View>
            <View>
              <T variant="small">Welcome back</T>
              <T variant="label" className="text-base">{profile.data?.full_name ?? ' '}</T>
            </View>
          </View>
        </Press>
        <IconPill icon={Bell} label="Notifications" onPress={() => router.push('/transactions')} />
      </View>

      {!l ? (
        <View className="gap-3">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </View>
      ) : (
        <>
          <View className="gap-3">
            <T variant="small" className="text-sm">Total Karj Mukti</T>
            <View className="flex-row items-end gap-2">
              <CountUp value={extra} format={formatINR} variant="hero" className="text-[44px] leading-[50px]" />
              <T className="mb-1.5 font-semi text-base text-gray-500">Extra/mo</T>
            </View>
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', delay: 500 }} className="flex-row flex-wrap gap-2">
              <Chip tone="green" label={years !== null ? `${years} Varsha Vachle` : 'Calculating'} />
              <Chip tone="gray" label={saving && Number.isFinite(saving.interestSaved) ? `${formatShortINR(saving.interestSaved).replace('₹', '')} Vyaj Vachle` : '-'} />
            </MotiView>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <T variant="title">My Block · {formatNumber(users)} Users</T>
              <T variant="small">#{l.block_number ?? '-'}</T>
            </View>
            {block && (
              <>
                <PoolCard tint="mint" index={0} title="Borrower Pool" amount={formatShortINR(block.borrowerPool)} masked={maskTail(l.loan_account_last4)} meta="Auto-pay" on={autoPay} onToggle={setAutoPay} toggleLabel="eMandate auto-pay" />
                <PoolCard tint="beige" index={1} title="CSR Pool" amount={formatShortINR(block.csrPool)} masked={maskTail(l.loan_account_last4)} meta="Rescue alerts" on={alerts} onToggle={setAlerts} toggleLabel="Rescue alerts" />
                <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 350 }} className="flex-row gap-3">
                  <View className="flex-1">
                    <Pill size="md" tone="dark" label={`Rescue ${formatShortINR(block.rescuePool)}`} onPress={() => router.push('/(tabs)/rescue')} />
                  </View>
                  <View className="flex-1">
                    <Pill size="md" tone="outline" label={`Regular ${formatShortINR(block.regularPool)}`} onPress={() => router.push('/transactions')} />
                  </View>
                </MotiView>
              </>
            )}
          </View>

          <View className="rounded-card bg-gray-100 px-4 pb-2 pt-4">
            <View className="flex-row items-center justify-between">
              <T variant="title">Rescue Wall</T>
              <Press onPress={() => router.push('/(tabs)/rescue')} accessibilityRole="link" accessibilityLabel="See all rescues">
                <View className="flex-row items-center gap-1">
                  <T variant="label" className="text-gray-500">See all</T>
                  <ArrowUpRight size={16} color="#6B7280" />
                </View>
              </Press>
            </View>
            {wall.isLoading
              ? [0, 1].map((i) => <SkeletonBlock key={i} className="my-2 h-12" />)
              : rescues.map((r, i) => {
                  const row = rescueRow(r)
                  return <ListRow key={r.id} index={i} {...row} amountClass="text-mint-ink" />
                })}
          </View>
        </>
      )}
    </Screen>
  )
}
