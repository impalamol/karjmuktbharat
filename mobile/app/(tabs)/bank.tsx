import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { MotiView } from 'moti'
import { Landmark, Lock, ShieldCheck } from 'lucide-react-native'
import { z } from 'zod'
import { Screen } from '@/components/Screen'
import { T } from '@/components/T'
import { Chip, Pill } from '@/components/Pill'
import { ErrorView, SkeletonBlock } from '@/components/States'
import { useMyLoan, useUpdateBank } from '@/lib/api'
import { confirmWithBiometrics } from '@/lib/biometrics'
import { verifyTotp } from '@/lib/mfa'
import { formatINR, maskTail } from '@/lib/format'
import { success, warn } from '@/lib/haptics'
import { colors } from '@/theme/tokens'

const form = z.object({
  bankName: z.string().trim().min(2, 'Bank name is too short').max(80),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC looks like SBIN0001234'),
  loanAccount: z
    .string()
    .transform((s) => s.replace(/\s/g, '').toUpperCase())
    .pipe(z.string().regex(/^[0-9A-Z]{6,20}$/, 'Loan account is 6 to 20 letters or digits')),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6 digit code from your authenticator app'),
})

function Field({ label, value, onChange, placeholder, secure, keyboard }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; secure?: boolean; keyboard?: 'number-pad' | 'default' }) {
  return (
    <View className="gap-1.5">
      <T variant="small" className="font-semi text-gray-700">{label}</T>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.gray[400]} secureTextEntry={secure} keyboardType={keyboard} autoCapitalize="characters" accessibilityLabel={label} className="h-14 rounded-md border border-gray-200 bg-gray-100 px-4 font-semi text-base text-ink" />
    </View>
  )
}

/** Bank: masked loan account card; changes need Face ID + authenticator code, then admin re-verification. */
export default function Bank() {
  const loan = useMyLoan()
  const update = useUpdateBank()
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState({ bankName: '', ifsc: '', loanAccount: '', code: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const l = loan.data

  if (loan.isError) return <Screen><ErrorView error={loan.error} onRetry={() => loan.refetch()} /></Screen>

  const submit = async () => {
    if (!l) return
    const p = form.safeParse(v)
    if (!p.success) return setError(p.error.issues[0]!.message)
    setError(null)
    if (!(await confirmWithBiometrics('Confirm bank change'))) return setError('Face ID / fingerprint was not confirmed')
    try {
      if ((await verifyTotp(p.data.code)) === 'no_factor') return setError('Set up two-factor authentication on karjmuktbharat.com first')
      await update.mutateAsync({ loanId: l.id, bankName: p.data.bankName, ifsc: p.data.ifsc, loanAccount: p.data.loanAccount })
      success()
      setDone(true)
      setEditing(false)
      setV({ bankName: '', ifsc: '', loanAccount: '', code: '' })
    } catch (e) {
      warn()
      setError(e instanceof Error ? e.message : 'Could not update bank details')
    }
  }

  return (
    <Screen>
      <View className="gap-2 pt-3">
        <T variant="hero">Bank</T>
        <T className="text-gray-500">Where your Karj Mukti credits are paid.</T>
      </View>

      {!l ? (
        <SkeletonBlock className="h-52" />
      ) : (
        <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140 }} className="overflow-hidden rounded-card bg-ink p-6">
          <View className="absolute -right-10 top-[68px] size-20 rounded-full bg-sky-strong" />
          <View className="absolute right-12 top-[100px] size-5 rotate-45 rounded-[3px] bg-beige-strong" />
          <View className="flex-row items-center justify-between">
            <View className="size-12 items-center justify-center rounded-md bg-white/10">
              <Landmark size={22} color={colors.paper} />
            </View>
            <Chip tone="dark" label={l.loan_type === 'home' ? 'Home loan' : 'Education loan'} />
          </View>
          <T className="mt-8 font-heavy text-2xl tracking-[4px] text-paper">{maskTail(l.loan_account_last4)}</T>
          <View className="mt-4 flex-row justify-between">
            <View>
              <T variant="small" className="text-gray-400">{l.bank_name}</T>
              <T variant="label" className="text-paper">{l.ifsc}</T>
            </View>
            <View className="items-end">
              <T variant="small" className="text-gray-400">EMI</T>
              <T variant="label" className="text-paper">{formatINR(l.emi)}</T>
            </View>
          </View>
        </MotiView>
      )}

      <View className="flex-row items-center gap-3 rounded-card bg-mint p-4">
        <ShieldCheck size={22} color={colors.mint.ink} />
        <T variant="small" className="flex-1 text-mint-ink">Your full account number is encrypted. Changing it needs Face ID and your authenticator code, and an admin re-verifies it.</T>
      </View>

      {done && <Chip tone="green" label="Change submitted. Status: pending verification." />}

      {editing ? (
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} className="gap-4">
          <Field label="Bank name" value={v.bankName} onChange={(x) => setV({ ...v, bankName: x })} placeholder="State Bank of India" />
          <Field label="IFSC" value={v.ifsc} onChange={(x) => setV({ ...v, ifsc: x.toUpperCase() })} placeholder="SBIN0001234" />
          <Field label="Loan account number" value={v.loanAccount} onChange={(x) => setV({ ...v, loanAccount: x })} placeholder="Account number" secure />
          <Field label="Authenticator code" value={v.code} onChange={(x) => setV({ ...v, code: x.replace(/\D/g, '').slice(0, 6) })} placeholder="123456" keyboard="number-pad" />
          {error && <T className="text-sm text-danger">{error}</T>}
          <Pill label={update.isPending ? 'Saving…' : 'Confirm change'} icon={Lock} onPress={submit} disabled={update.isPending} />
          <Pill label="Cancel" tone="outline" size="md" onPress={() => setEditing(false)} />
        </MotiView>
      ) : (
        <Pill label="Change bank details" tone="outline" icon={Lock} onPress={() => setEditing(true)} disabled={!l} />
      )}
    </Screen>
  )
}
