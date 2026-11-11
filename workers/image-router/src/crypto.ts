import type { WorkerEnv } from './types'

const CIPHER_PREFIX = 'v1:'
const IV_BYTES = 12

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  const binary = atob(normalized + '='.repeat(padding))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function resolveEncryptionSecret(env: WorkerEnv): string {
  const secret = (env.ACCOUNTS_ENCRYPTION_KEY || env.ROUTER_ADMIN_KEY || env.ROUTER_API_KEY || '').trim()
  if (!secret) {
    throw new Error(
      'Kunci enkripsi akun tidak tersedia (isi ACCOUNTS_ENCRYPTION_KEY, ROUTER_ADMIN_KEY, atau ROUTER_API_KEY)'
    )
  }
  return secret
}

async function deriveAesGcmKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
}

export async function encryptPayload(plaintext: string, secret: string): Promise<string> {
  if (!secret.trim()) {
    throw new Error('Secret enkripsi tidak boleh kosong')
  }
  const key = await deriveAesGcmKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const encoded = new TextEncoder().encode(plaintext)
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoded.buffer as ArrayBuffer
  )
  const cipherBytes = new Uint8Array(encryptedBuffer)
  return `${CIPHER_PREFIX}${bytesToBase64Url(iv)}:${bytesToBase64Url(cipherBytes)}`
}

export async function decryptPayload(payload: string, secret: string): Promise<string> {
  if (!secret.trim()) {
    throw new Error('Secret dekripsi tidak boleh kosong')
  }
  if (!payload.startsWith(CIPHER_PREFIX)) {
    throw new Error('Format ciphertext akun tidak valid')
  }
  const rest = payload.slice(CIPHER_PREFIX.length)
  const separatorIndex = rest.indexOf(':')
  if (separatorIndex <= 0) {
    throw new Error('Struktur ciphertext akun korup')
  }

  const ivB64 = rest.slice(0, separatorIndex)
  const cipherB64 = rest.slice(separatorIndex + 1)
  const iv = base64UrlToBytes(ivB64)
  const cipherBytes = base64UrlToBytes(cipherB64)

  if (iv.byteLength !== IV_BYTES || cipherBytes.byteLength === 0) {
    throw new Error('Panjang IV atau ciphertext tidak valid')
  }

  const key = await deriveAesGcmKey(secret)
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    cipherBytes.buffer as ArrayBuffer
  )
  return new TextDecoder().decode(decryptedBuffer)
}
