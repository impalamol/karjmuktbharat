// AES-256-GCM field encryption. The key never leaves Edge Functions.
// Ciphertext format: "v1:<base64 iv>:<base64 ciphertext+tag>"
import { HttpError } from './http.ts'

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

let keyPromise: Promise<CryptoKey> | null = null
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const raw = Deno.env.get('FIELD_ENCRYPTION_KEY')
    if (!raw) throw new HttpError(500, 'Encryption key not configured', 'config')
    const bytes = unb64(raw)
    if (bytes.length !== 32) throw new HttpError(500, 'FIELD_ENCRYPTION_KEY must be 32 bytes (base64)', 'config')
    keyPromise = crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }
  return keyPromise
}

/** `aad` binds the ciphertext to its owner so it cannot be copied onto another row. */
export async function encryptField(plain: string, aad: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, await getKey(), enc.encode(plain))
  return `v1:${b64(iv)}:${b64(new Uint8Array(ct))}`
}

export async function decryptField(payload: string, aad: string): Promise<string> {
  const [v, iv, ct] = payload.split(':')
  if (v !== 'v1' || !iv || !ct) throw new HttpError(500, 'Unknown ciphertext format', 'crypto')
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: enc.encode(aad) }, await getKey(), unb64(ct))
  return dec.decode(pt)
}

export async function encryptBytes(plain: string, aad: string): Promise<Uint8Array> {
  return enc.encode(await encryptField(plain, aad))
}

export async function hmacSha256(secret: string | Uint8Array<ArrayBuffer>, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', typeof secret === 'string' ? enc.encode(secret) : secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export { b64, unb64 }

/** Constant-time string compare. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
