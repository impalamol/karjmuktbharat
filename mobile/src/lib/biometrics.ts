import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const KEY = 'kmb.biometricLock'

export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync())
}

/** Face ID / fingerprint prompt. Resolves true when there is no biometric hardware (PIN-less devices fall back to OTP). */
export async function confirmWithBiometrics(reason: string): Promise<boolean> {
  if (!(await biometricAvailable())) return true
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancel', disableDeviceFallback: false })
  return r.success
}

export async function getBiometricLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  return (await SecureStore.getItemAsync(KEY)) === '1'
}

export async function setBiometricLock(on: boolean) {
  if (Platform.OS === 'web') return
  await SecureStore.setItemAsync(KEY, on ? '1' : '0')
}
