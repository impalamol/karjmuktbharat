import { useState } from 'react'
import { Platform, TextInput, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { MotiView } from 'moti'
import { Camera, CheckCircle2, Search, XCircle } from 'lucide-react-native'
import { z } from 'zod'
import { Screen } from '@/components/Screen'
import { T } from '@/components/T'
import { Pill } from '@/components/Pill'
import { ListRow } from '@/components/ListRow'
import { findUtr } from '@/lib/api'
import { txnRow } from '@/lib/txn'
import { success, warn } from '@/lib/haptics'
import type { Txn } from '@/lib/types'
import { colors } from '@/theme/tokens'

const utrSchema = z.string().regex(/^[A-Z0-9]{10,22}$/, 'A UTR is 10 to 22 letters or digits')

/** Pulls a UTR out of a scanned bank receipt QR (plain UTR, or a "utr=" / "UTR:" field). */
function utrFromQr(data: string) {
  const m = /utr[=:\s]+([A-Z0-9]{10,22})/i.exec(data) ?? /\b([A-Z0-9]{12,22})\b/i.exec(data)
  return m?.[1]?.toUpperCase() ?? ''
}

/** Centre tab: check a credit by UTR, typed or scanned from the bank receipt QR. */
export default function CheckUtr() {
  const [utr, setUtr] = useState('')
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Txn | null | undefined>(undefined)
  const [perm, requestPerm] = useCameraPermissions()
  const canScan = Platform.OS !== 'web'

  const check = async (value = utr) => {
    const p = utrSchema.safeParse(value)
    if (!p.success) return setError(p.error.issues[0]!.message)
    setError(null)
    setBusy(true)
    try {
      const t = await findUtr(value)
      setResult(t)
      if (t) success()
      else warn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setBusy(false)
    }
  }

  const startScan = async () => {
    if (!perm?.granted && !(await requestPerm()).granted) return setError('Camera permission is needed to scan')
    setResult(undefined)
    setScanning(true)
  }

  return (
    <Screen>
      <View className="gap-2 pt-3">
        <T variant="hero">Check a credit</T>
        <T className="text-gray-500">Scan the QR on your bank receipt or type the UTR to confirm your Karj Mukti payment landed.</T>
      </View>

      {scanning ? (
        <View className="h-80 overflow-hidden rounded-card bg-ink">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              const v = utrFromQr(data)
              if (!v) return
              setScanning(false)
              setUtr(v)
              void check(v)
            }}
          />
          <View pointerEvents="none" className="absolute inset-10 rounded-card border-2 border-mint-strong" />
        </View>
      ) : (
        <View className="items-center justify-center gap-4 rounded-card bg-sky p-8">
          <View className="size-16 items-center justify-center rounded-full bg-paper">
            <Camera size={28} color={colors.sky.ink} />
          </View>
          <Pill label={canScan ? 'Scan receipt QR' : 'Scanning works in the app'} tone="dark" size="md" disabled={!canScan} onPress={startScan} className="w-64" />
        </View>
      )}

      <View className="gap-3">
        <T variant="label">Or enter the UTR</T>
        <TextInput
          value={utr}
          onChangeText={(v) => setUtr(v.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 22))}
          autoCapitalize="characters"
          placeholder="e.g. SBIN2610400000"
          placeholderTextColor={colors.gray[400]}
          accessibilityLabel="UTR number"
          className="h-14 rounded-full border border-gray-200 bg-gray-100 px-6 font-semi text-base tracking-[1px] text-ink"
        />
        {error && <T className="text-sm text-danger">{error}</T>}
        <Pill label={busy ? 'Checking…' : 'Check UTR'} icon={Search} onPress={() => check()} disabled={busy} />
      </View>

      {result !== undefined && (
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 160 }} className={`rounded-card p-5 ${result ? 'bg-mint' : 'bg-gray-100'}`}>
          <View className="flex-row items-center gap-2">
            {result ? <CheckCircle2 size={20} color={colors.mint.ink} /> : <XCircle size={20} color={colors.danger} />}
            <T variant="label">{result ? 'Found in your account' : 'No transaction with this UTR'}</T>
          </View>
          {result && <ListRow {...txnRow(result)} />}
        </MotiView>
      )}
    </Screen>
  )
}
