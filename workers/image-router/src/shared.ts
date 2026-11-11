import type { AntigravityAccount, KvNamespaceLike, WorkerEnv } from './types'

export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
export const ANTIGRAVITY_USER_AGENT = 'antigravity/1.107.0 darwin/arm64'
export const MIN_KV_TTL_SEC = 60

interface CachedTokenRecord {
  accessToken: string
  expiresAtMs: number
}

export class OAuthRevokedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OAuthRevokedError'
  }
}

export function maskEmail(email: string): string {
  const trimmed = email.trim()
  const atIndex = trimmed.indexOf('@')
  if (atIndex <= 2) return '***'
  return `${trimmed.slice(0, 2)}***${trimmed.slice(atIndex)}`
}

export function toKvSafeId(
  accountOrIdentifier: string | Pick<AntigravityAccount, 'email' | 'projectId'>
): string {
  const raw =
    typeof accountOrIdentifier === 'string'
      ? accountOrIdentifier
      : accountOrIdentifier.email?.trim() || accountOrIdentifier.projectId?.trim() || ''
  const sanitized = raw.toLowerCase().replace(/[^a-z0-9._-]/g, '_')
  if (!sanitized) {
    throw new Error('Identitas akun (email atau projectId) wajib diisi')
  }
  return sanitized
}

export function getKvTokenKey(account: Pick<AntigravityAccount, 'email' | 'projectId'>): string {
  return `ag:token:${toKvSafeId(account)}`
}

export function getKvCooldownKey(account: Pick<AntigravityAccount, 'email' | 'projectId'>): string {
  return `ag:cooldown:${toKvSafeId(account)}`
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(500, timeoutMs))
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function kvGetSafe(kv: KvNamespaceLike | undefined, key: string): Promise<string | null> {
  if (!kv) return null
  try {
    return await kv.get(key)
  } catch {
    return null
  }
}

export async function kvPutSafe(
  kv: KvNamespaceLike | undefined,
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  if (!kv) return
  try {
    const options =
      typeof ttlSeconds === 'number'
        ? { expirationTtl: Math.max(MIN_KV_TTL_SEC, Math.floor(ttlSeconds)) }
        : undefined
    await kv.put(key, value, options)
  } catch {
    // Abaikan kegagalan cache KV agar pipeline utama tetap berjalan
  }
}

export async function kvDeleteSafe(kv: KvNamespaceLike | undefined, key: string): Promise<void> {
  if (!kv) return
  try {
    await kv.delete(key)
  } catch {
    // Abaikan kegagalan delete KV
  }
}

export function sortAntigravityAccounts(accounts: AntigravityAccount[]): AntigravityAccount[] {
  return [...accounts].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
}

export function parseAntigravityAccounts(rawJson?: string): AntigravityAccount[] {
  if (!rawJson || !rawJson.trim()) return []
  try {
    const parsed: unknown = JSON.parse(rawJson)
    if (!Array.isArray(parsed)) return []

    const valid: AntigravityAccount[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      const email = typeof record.email === 'string' ? record.email.trim() : ''
      const projectId = typeof record.projectId === 'string' ? record.projectId.trim() : ''
      const refreshToken = typeof record.refreshToken === 'string' ? record.refreshToken.trim() : ''
      const priority = typeof record.priority === 'number' ? record.priority : undefined
      const isActive = typeof record.isActive === 'boolean' ? record.isActive : true
      const addedAt = typeof record.addedAt === 'string' ? record.addedAt : undefined
      const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : undefined

      if (refreshToken && projectId) {
        valid.push({
          email: email || `proj_${projectId}`,
          projectId,
          refreshToken,
          priority,
          isActive,
          addedAt,
          updatedAt,
        })
      }
    }

    return sortAntigravityAccounts(valid)
  } catch {
    return []
  }
}

export async function getAccessTokenForAccount(
  account: AntigravityAccount,
  env: WorkerEnv,
  forceRefresh = false,
  timeoutMs = 8000
): Promise<string> {
  const clientId = (env.ANTIGRAVITY_CLIENT_ID || '').trim()
  const clientSecret = (env.ANTIGRAVITY_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('Konfigurasi ANTIGRAVITY_CLIENT_ID / ANTIGRAVITY_CLIENT_SECRET belum diisi')
  }

  const tokenKey = getKvTokenKey(account)

  if (!forceRefresh) {
    const cachedRaw = await kvGetSafe(env.ROUTER_KV, tokenKey)
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw) as Partial<CachedTokenRecord>
        if (
          typeof parsed.accessToken === 'string' &&
          parsed.accessToken &&
          typeof parsed.expiresAtMs === 'number' &&
          parsed.expiresAtMs - Date.now() > 120_000
        ) {
          return parsed.accessToken
        }
      } catch {
        // Lanjut refresh OAuth jika cache korup
      }
    }
  }

  const response = await fetchWithTimeout(
    GOOGLE_TOKEN_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    },
    timeoutMs
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    if (response.status === 400 && /invalid_grant/i.test(errText)) {
      throw new OAuthRevokedError('Refresh token kedaluwarsa atau dicabut (invalid_grant)')
    }
    throw new Error(`OAuth refresh gagal (HTTP ${response.status}): ${errText.slice(0, 140)}`)
  }

  const tokenPayload = (await response.json()) as {
    access_token?: string
    expires_in?: number
  }

  if (!tokenPayload.access_token) {
    throw new Error('OAuth refresh tidak mengembalikan access_token')
  }

  const expiresInSec = typeof tokenPayload.expires_in === 'number' ? tokenPayload.expires_in : 3600
  const safeTtlSec = Math.max(MIN_KV_TTL_SEC, Math.min(3300, expiresInSec - 300))
  const record: CachedTokenRecord = {
    accessToken: tokenPayload.access_token,
    expiresAtMs: Date.now() + safeTtlSec * 1000,
  }

  await kvPutSafe(env.ROUTER_KV, tokenKey, JSON.stringify(record), safeTtlSec)
  return tokenPayload.access_token
}
