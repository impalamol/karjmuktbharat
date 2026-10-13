import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

/**
 * Supabase auth storage backed by the iOS Keychain / Android Keystore (expo-secure-store).
 * SecureStore values are limited to ~2 KB, so long session JSON is split into chunks.
 * On web (preview only) the session lives in memory and is never written to localStorage.
 */
const CHUNK = 1800
const memory = new Map<string, string>()
const safeKey = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_')

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return memory.get(key) ?? null
    const k = safeKey(key)
    const count = Number((await SecureStore.getItemAsync(`${k}.n`)) ?? 0)
    if (!count) return null
    const parts: string[] = []
    for (let i = 0; i < count; i++) parts.push((await SecureStore.getItemAsync(`${k}.${i}`)) ?? '')
    return parts.join('')
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return void memory.set(key, value)
    const k = safeKey(key)
    await secureStorage.removeItem(key)
    const n = Math.ceil(value.length / CHUNK)
    for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK))
    await SecureStore.setItemAsync(`${k}.n`, String(n))
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') return void memory.delete(key)
    const k = safeKey(key)
    const count = Number((await SecureStore.getItemAsync(`${k}.n`)) ?? 0)
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${k}.${i}`)
    await SecureStore.deleteItemAsync(`${k}.n`)
  },
}
