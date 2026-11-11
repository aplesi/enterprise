import { NextResponse } from 'next/server'
import { getImageRouterConfig } from '@/lib/ai/cloudflare-image'
import type {
  RouterAccountQuotaResult,
  RouterHealthStatus,
  RouterStorageSource,
  SanitizedRouterAccount,
} from '@/types'

const ADMIN_REQUEST_TIMEOUT_MS = 18_000

export class RouterAdminError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'RouterAdminError'
    this.status = status
  }
}

function normalizeWorkerOrigin(rawUrl: string): string {
  const cleaned = rawUrl.trim().replace(/\/+$/, '')
  if (!cleaned) {
    return 'https://ai.aplesi.my.id'
  }
  return cleaned.replace(/\/v1$/i, '')
}

async function resolveWorkerAdminConnection(): Promise<{
  origin: string
  adminKey: string
}> {
  const config = await getImageRouterConfig()
  const baseUrl = config.url || process.env.IMAGE_ROUTER_URL || 'https://ai.aplesi.my.id/v1'
  const origin = normalizeWorkerOrigin(baseUrl)
  const adminKey = (
    process.env.ROUTER_ADMIN_KEY ||
    config.key ||
    process.env.ROUTER_API_KEY ||
    ''
  ).trim()

  if (!adminKey) {
    throw new RouterAdminError(
      'Kunci admin router (ROUTER_ADMIN_KEY / IMAGE_ROUTER_KEY) belum dikonfigurasi.',
      500
    )
  }

  return { origin, adminKey }
}

async function callWorkerAdmin<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    timeoutMs?: number
  } = {}
): Promise<T> {
  const { origin, adminKey } = await resolveWorkerAdminConnection()
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? ADMIN_REQUEST_TIMEOUT_MS
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${origin}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${adminKey}`,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      cache: 'no-store',
      signal: controller.signal,
    })

    const data = (await response.json().catch(() => ({}))) as {
      error?: { message?: string } | string
    } & T

    if (!response.ok) {
      const errorMsg =
        typeof data.error === 'string'
          ? data.error
          : data.error?.message || `Worker router mengembalikan status HTTP ${response.status}`
      throw new RouterAdminError(errorMsg, response.status)
    }

    return data
  } catch (err) {
    if (err instanceof RouterAdminError) {
      throw err
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new RouterAdminError(
        'Koneksi ke Cloudflare AI Router timeout. Coba beberapa saat lagi.',
        504
      )
    }
    throw new RouterAdminError(
      err instanceof Error
        ? `Gagal terhubung ke Cloudflare AI Router: ${err.message}`
        : 'Gagal terhubung ke Cloudflare AI Router',
      502
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchWorkerHealth(): Promise<RouterHealthStatus | null> {
  try {
    const { origin } = await resolveWorkerAdminConnection()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${origin}/health`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!res.ok) return null
      return (await res.json()) as RouterHealthStatus
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

export async function listRouterAccounts(): Promise<{
  accounts: SanitizedRouterAccount[]
  totalAccounts: number
  activeAccounts: number
  storageSource: RouterStorageSource
  health: RouterHealthStatus | null
}> {
  const [listData, health] = await Promise.all([
    callWorkerAdmin<{
      accounts: SanitizedRouterAccount[]
      totalAccounts: number
      activeAccounts: number
      storageSource: RouterStorageSource
    }>('/v1/admin/accounts', { method: 'GET' }),
    fetchWorkerHealth(),
  ])

  return {
    ...listData,
    health,
  }
}

export async function syncRouterAccountsFromEnv(mode: 'merge' | 'reset' = 'merge'): Promise<{
  mode: 'merge' | 'reset'
  added: number
  updated: number
  total: number
  activeAccounts: number
  storageSource: RouterStorageSource
  accounts: SanitizedRouterAccount[]
}> {
  return callWorkerAdmin('/v1/admin/accounts/sync-env', {
    method: 'POST',
    body: { mode },
  })
}

export async function updateRouterAccount(payload: {
  email: string
  isActive?: boolean
  priority?: number
}): Promise<{ account: SanitizedRouterAccount }> {
  return callWorkerAdmin('/v1/admin/accounts', {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteRouterAccount(email: string): Promise<{
  deletedEmail: string
  maskedEmail: string
  remainingCount: number
}> {
  return callWorkerAdmin(`/v1/admin/accounts?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })
}

export async function createRouterOAuthUrl(redirectUri: string): Promise<{
  authUrl: string
  state: string
  redirectUri: string
  expiresInSec: number
}> {
  return callWorkerAdmin('/v1/admin/accounts/oauth-url', {
    method: 'POST',
    body: { redirectUri },
  })
}

export async function exchangeRouterOAuthCallback(payload: {
  callbackUrl?: string
  code?: string
  state?: string
}): Promise<{
  action: 'created' | 'updated'
  account: SanitizedRouterAccount
}> {
  return callWorkerAdmin('/v1/admin/accounts/exchange', {
    method: 'POST',
    body: payload,
  })
}

export async function checkRouterAccountsQuota(email?: string): Promise<{
  checkedAt: string
  totalChecked: number
  results: RouterAccountQuotaResult[]
}> {
  return callWorkerAdmin('/v1/admin/accounts/quota', {
    method: 'POST',
    body: email ? { email } : {},
    timeoutMs: 12_000,
  })
}

export function unauthorizedAdminResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Silakan login sebagai admin.' },
    { status: 401 }
  )
}

export function routerAdminErrorResponse(err: unknown) {
  if (err instanceof RouterAdminError) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status }
    )
  }
  const message =
    err instanceof Error ? err.message : 'Terjadi kesalahan internal server'
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}
