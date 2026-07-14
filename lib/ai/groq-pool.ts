// lib/ai/groq-pool.ts
// Sistem rotasi multi API key Groq
//
// Mendukung hingga 5 API key yang bisa diisi di .env.local:
//   GROQ_API_KEY=key1
//   GROQ_API_KEY_2=key2
//   GROQ_API_KEY_3=key3
//   GROQ_API_KEY_4=key4
//   GROQ_API_KEY_5=key5
//
// Jika satu key kena rate limit (429), otomatis pindah ke key berikutnya.
// Setelah semua key habis, throw error.

import Groq from 'groq-sdk'

interface KeyState {
  key: string
  label: string
  client: Groq
  /** Timestamp kapan key ini terkena rate limit (0 = belum pernah) */
  rateLimitedAt: number
  /** Berapa detik harus menunggu (dari header Groq) */
  retryAfterSec: number
  /** Total request yang berhasil sejak app start */
  successCount: number
  /** Total request yang gagal (rate limited) */
  failCount: number
}

const ENV_KEYS = [
  'GROQ_API_KEY',
  'GROQ_API_KEY_2',
  'GROQ_API_KEY_3',
  'GROQ_API_KEY_4',
  'GROQ_API_KEY_5',
] as const

let pool: KeyState[] | null = null

function initPool(): KeyState[] {
  if (pool) return pool

  pool = []
  for (const envName of ENV_KEYS) {
    const key = process.env[envName]
    if (key && key.length > 10) {
      pool.push({
        key,
        label: envName,
        client: new Groq({ apiKey: key }),
        rateLimitedAt: 0,
        retryAfterSec: 0,
        successCount: 0,
        failCount: 0,
      })
    }
  }

  if (pool.length === 0) {
    // Fallback: buat dummy agar tidak crash saat dev tanpa key
    pool.push({
      key: 'dummy_key',
      label: 'GROQ_API_KEY (kosong)',
      client: new Groq({ apiKey: 'dummy_key' }),
      rateLimitedAt: 0,
      retryAfterSec: 0,
      successCount: 0,
      failCount: 0,
    })
  }

  return pool
}

/**
 * Ambil Groq client yang tersedia (belum kena rate limit).
 * Jika semua sedang rate limited, pilih yang paling cepat pulih.
 */
export function getAvailableClient(): { client: Groq; state: KeyState } {
  const keys = initPool()
  const now = Date.now()

  // Cari key yang belum rate limited atau sudah pulih
  for (const state of keys) {
    if (state.rateLimitedAt === 0) {
      return { client: state.client, state }
    }
    // Cek apakah sudah lewat masa tunggu
    const elapsedSec = (now - state.rateLimitedAt) / 1000
    if (elapsedSec >= state.retryAfterSec) {
      // Reset status rate limit
      state.rateLimitedAt = 0
      state.retryAfterSec = 0
      return { client: state.client, state }
    }
  }

  // Semua rate limited — pilih yang paling cepat pulih
  const sorted = [...keys].sort((a, b) => {
    const aReady = a.rateLimitedAt + a.retryAfterSec * 1000
    const bReady = b.rateLimitedAt + b.retryAfterSec * 1000
    return aReady - bReady
  })

  const earliest = sorted[0]
  const waitMs = earliest.rateLimitedAt + earliest.retryAfterSec * 1000 - now
  throw new GroqPoolExhaustedError(
    `Semua ${keys.length} API key Groq kena rate limit. Key tercepat pulih dalam ${Math.ceil(waitMs / 1000)} detik.`,
    Math.ceil(waitMs / 1000)
  )
}

/**
 * Tandai key sebagai rate limited.
 */
export function markRateLimited(state: KeyState, retryAfterSec: number): void {
  state.rateLimitedAt = Date.now()
  state.retryAfterSec = retryAfterSec || 60
  state.failCount++
}

/**
 * Tandai key sebagai berhasil.
 */
export function markSuccess(state: KeyState): void {
  state.successCount++
}

/**
 * Custom error class ketika semua key habis.
 */
export class GroqPoolExhaustedError extends Error {
  waitSeconds: number
  constructor(message: string, waitSeconds: number) {
    super(message)
    this.name = 'GroqPoolExhaustedError'
    this.waitSeconds = waitSeconds
  }
}

/**
 * Parse retry-after dari error message Groq (format: "Please try again in 13m25.248s")
 */
export function parseRetryAfter(errorMessage: string): number {
  const match = errorMessage.match(/try again in (\d+)m([\d.]+)s/)
  if (match) {
    return parseInt(match[1]) * 60 + parseFloat(match[2])
  }
  const secMatch = errorMessage.match(/try again in ([\d.]+)s/)
  if (secMatch) {
    return parseFloat(secMatch[1])
  }
  return 60 // default 60 detik
}

/**
 * Status semua key — dipakai untuk admin panel dashboard.
 */
export interface GroqKeyStatus {
  label: string
  /** 4 karakter terakhir API key (untuk identifikasi) */
  keySuffix: string
  isAvailable: boolean
  successCount: number
  failCount: number
  rateLimitedAt: number | null
  retryAfterSec: number
  /** Estimasi kapan pulih (timestamp), null jika available */
  readyAt: number | null
}

export function getPoolStatus(): GroqKeyStatus[] {
  const keys = initPool()
  const now = Date.now()

  return keys.map((state) => {
    const elapsedSec = state.rateLimitedAt > 0
      ? (now - state.rateLimitedAt) / 1000
      : Infinity

    const isAvailable = state.rateLimitedAt === 0 || elapsedSec >= state.retryAfterSec

    return {
      label: state.label,
      keySuffix: state.key.slice(-4),
      isAvailable,
      successCount: state.successCount,
      failCount: state.failCount,
      rateLimitedAt: state.rateLimitedAt > 0 ? state.rateLimitedAt : null,
      retryAfterSec: state.retryAfterSec,
      readyAt: !isAvailable
        ? state.rateLimitedAt + state.retryAfterSec * 1000
        : null,
    }
  })
}

/**
 * Total key yang terdaftar.
 */
export function getPoolSize(): number {
  return initPool().length
}
