import { useState } from 'react'
import { FlatList, View } from 'react-native'
import { Redirect } from 'expo-router'
import { MotiView } from 'moti'
import { Check, GraduationCap, Home, X } from 'lucide-react-native'
import { Screen } from '@/components/Screen'
import { StackHeader } from '@/components/StackHeader'
import { T } from '@/components/T'
import { Chip, Pill } from '@/components/Pill'
import { Empty, ErrorView, Loading } from '@/components/States'
import { useProfile, usePendingLoans, useVerifyLoan } from '@/lib/api'
import { confirmWithBiometrics } from '@/lib/biometrics'
import { formatDate, formatShortINR, maskTail } from '@/lib/format'
import { success, warn } from '@/lib/haptics'
import type { PendingLoan } from '@/lib/types'
import { colors } from '@/theme/tokens'

function LoanCard({ loan, index }: { loan: PendingLoan; index: number }) {
  const verify = useVerifyLoan()
  const [error, setError] = useState<string | null>(null)
  const home = loan.loan_type === 'home'

  const decide = async (decision: 'verified' | 'rejected') => {
    if (!(await confirmWithBiometrics(decision === 'verified' ? 'Approve this loan' : 'Reject this loan'))) return
    try {
      await verify.mutateAsync({ loanId: loan.id, decision, reason: decision === 'rejected' ? 'Documents could not be verified' : undefined })
      success()
    } catch (e) {
      warn()
      setError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  return (
    <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140, delay: Math.min(index, 8) * 80 }} className={`mb-3 gap-4 rounded-card p-5 ${home ? 'bg-beige' : 'bg-lavender'}`}>
      <View className="flex-row items-center gap-3">
        <View className="size-12 items-center justify-center rounded-md bg-paper">
          {home ? <Home size={22} color={colors.beige.ink} /> : <GraduationCap size={22} color={colors.lavender.ink} />}
        </View>
        <View className="flex-1">
          <T variant="label" className="text-base">{loan.profiles?.full_name ?? 'Unnamed member'}</T>
          <T variant="small" className="text-gray-700">{loan.bank_name} · {loan.ifsc} · {maskTail(loan.loan_account_last4)}</T>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <Chip label={`Outstanding ${formatShortINR(loan.outstanding)}`} />
        <T variant="small" className="text-gray-700">{formatDate(loan.created_at)}</T>
      </View>
      {error && <T className="text-sm text-danger">{error}</T>}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Pill size="md" tone="outline" icon={X} iconSide="left" label="Reject" disabled={verify.isPending} onPress={() => decide('rejected')} />
        </View>
        <View className="flex-1">
          <Pill size="md" tone="dark" icon={Check} iconSide="left" label="Approve" disabled={verify.isPending} onPress={() => decide('verified')} />
        </View>
      </View>
    </MotiView>
  )
}

/** Admin: pending loan verification queue. Every decision needs Face ID and is audited server-side. */
export default function Admin() {
  const profile = useProfile()
  const isAdmin = profile.data?.user_type === 'admin'
  const q = usePendingLoans(isAdmin)

  if (profile.isLoading) return <Loading />
  if (!isAdmin) return <Redirect href="/(tabs)/dashboard" />

  return (
    <Screen scroll={false} bottomInset={false}>
      <StackHeader title="Verify loans" />
      <View className="flex-row gap-2">
        <Chip tone="green" label={`${q.data?.length ?? 0} pending`} />
      </View>
      {q.isError ? (
        <ErrorView error={q.error} onRetry={() => q.refetch()} />
      ) : q.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={q.data}
          keyExtractor={(l) => l.id}
          renderItem={({ item, index }) => <LoanCard loan={item} index={index} />}
          ListEmptyComponent={<Empty title="All caught up" body="No loans are waiting for verification." />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  )
}
