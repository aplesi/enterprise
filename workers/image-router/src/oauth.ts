import {
  ANTIGRAVITY_USER_AGENT,
  GOOGLE_TOKEN_ENDPOINT,
  OAuthRevokedError,
  fetchWithTimeout,
  getAccessTokenForAccount,
  getKvTokenKey,
  kvDeleteSafe,
  kvGetSafe,
  maskEmail,
} from './shared'
import type {
  AccountQuotaResult,
  AntigravityAccount,
  ModelQuotaInfo,
  WorkerEnv,
} from './types'

export const ANTIGRAVITY_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_USERINFO_ENDPOINT =
  'https://www.googleapis.com/oauth2/v1/userinfo?alt=json'
export const CLOUDCODE_LOAD_ASSIST_URL =
  'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist'
export const CLOUDCODE_ONBOARD_URL =
  'https://cloudcode-pa.googleapis.com/v1internal:onboardUser'
export const CLOUDCODE_FETCH_MODELS_URL =
  'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels'

export const ANTIGRAVITY_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs',
] as const

export const OAUTH_STATE_KV_PREFIX = 'ag:oauth-state:'
export const OAUTH_STATE_TTL_SEC = 300
export const QUOTA_PER_ACCOUNT_TIMEOUT_MS = 5000

export const TRACKED_QUOTA_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3-flash',
  'claude-sonnet-4-6',
  'claude-opus-4-6-thinking',
  'gemini-2.5-pro',
] as const

const CLIENT_METADATA = {
  ideType: 9,
  platform: 2,
  pluginType: 2,
} as const

interface StoredOAuthState {
  redirectUri: string
  createdAt: string
}

function generateRandomState(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function buildCloudCodeHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'google-api-nodejs-client/9.15.1',
    'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
    'Client-Metadata': JSON.stringify(CLIENT_METADATA),
    'x-request-source': 'local',
  }
}

export async function storeOAuthState(
  state: string,
  redirectUri: string,
  env: WorkerEnv
): Promise<void> {
  if (!env.ROUTER_KV) {
    throw new Error('Binding ROUTER_KV wajib tersedia untuk menyimpan state OAuth')
  }
  const payload: StoredOAuthState = {
    redirectUri,
    createdAt: new Date().toISOString(),
  }
  await env.ROUTER_KV.put(`${OAUTH_STATE_KV_PREFIX}${state}`, JSON.stringify(payload), {
    expirationTtl: OAUTH_STATE_TTL_SEC,
  })
}

export async function consumeOAuthState(
  state: string,
  env: WorkerEnv
): Promise<StoredOAuthState> {
  const trimmedState = state.trim()
  if (!trimmedState) {
    throw new Error('State OAuth wajib diisi')
  }
  if (!env.ROUTER_KV) {
    throw new Error('Binding ROUTER_KV belum dikonfigurasi pada Worker')
  }

  const key = `${OAUTH_STATE_KV_PREFIX}${trimmedState}`
  const raw = await kvGetSafe(env.ROUTER_KV, key)
  if (!raw) {
    throw new Error(
      'Sesi OAuth kedaluwarsa atau tidak valid. Silakan ulangi dari tombol Hubungkan Akun Google.'
    )
  }

  await kvDeleteSafe(env.ROUTER_KV, key)

  try {
    const parsed = JSON.parse(raw) as Partial<StoredOAuthState>
    if (typeof parsed.redirectUri !== 'string' || !parsed.redirectUri.trim()) {
      throw new Error('Payload redirectUri tidak valid')
    }
    return {
      redirectUri: parsed.redirectUri.trim(),
      createdAt:
        typeof parsed.createdAt === 'string'
          ? parsed.createdAt
          : new Date().toISOString(),
    }
  } catch {
    throw new Error('Data sesi OAuth di KV rusak. Silakan ulangi proses login Google.')
  }
}

export async function buildAntigravityAuthUrl(
  redirectUri: string,
  env: WorkerEnv
): Promise<{
  authUrl: string
  state: string
  redirectUri: string
  expiresInSec: number
}> {
  const clientId = env.ANTIGRAVITY_CLIENT_ID?.trim()
  if (!clientId) {
    throw new Error('Secret ANTIGRAVITY_CLIENT_ID belum dikonfigurasi di Worker')
  }

  const normalizedRedirectUri = redirectUri.trim()
  if (!normalizedRedirectUri) {
    throw new Error('redirectUri OAuth wajib diisi')
  }

  const state = generateRandomState()
  await storeOAuthState(state, normalizedRedirectUri, env)

  const url = new URL(ANTIGRAVITY_AUTH_ENDPOINT)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', normalizedRedirectUri)
  url.searchParams.set('scope', ANTIGRAVITY_OAUTH_SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)

  return {
    authUrl: url.toString(),
    state,
    redirectUri: normalizedRedirectUri,
    expiresInSec: OAUTH_STATE_TTL_SEC,
  }
}

/**
 * Mem-parse input callback OAuth dari 3 kemungkinan format:
 * 1. Full URL (`http://localhost:8080/callback?state=...&code=4/0A...&scope=...`)
 * 2. Query string saja (`?code=4/0A...&state=...` atau `code=4/0A...&state=...`)
 * 3. Raw authorization code (`4/0A...`), dengan `fallbackState` dari sesi modal UI
 */
export function parseCallbackInput(
  rawInput: string,
  fallbackState?: string
): { code: string; state: string } {
  const trimmed = rawInput.trim().replace(/^["']|["']$/g, '')
  if (!trimmed) {
    throw new Error('Input URL atau kode callback OAuth tidak boleh kosong')
  }

  let code = ''
  let state = ''
  let oauthError = ''
  let oauthErrorDesc = ''

  if (/^https?:\/\//i.test(trimmed)) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(trimmed)
    } catch {
      throw new Error('Format URL callback OAuth tidak valid')
    }
    oauthError = parsedUrl.searchParams.get('error')?.trim() ?? ''
    oauthErrorDesc = parsedUrl.searchParams.get('error_description')?.trim() ?? ''
    code = parsedUrl.searchParams.get('code')?.trim() ?? ''
    state = parsedUrl.searchParams.get('state')?.trim() ?? ''
  } else if (trimmed.startsWith('?') || /(?:^|&)code=/.test(trimmed)) {
    const queryPart = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed
    const params = new URLSearchParams(queryPart)
    oauthError = params.get('error')?.trim() ?? ''
    oauthErrorDesc = params.get('error_description')?.trim() ?? ''
    code = params.get('code')?.trim() ?? ''
    state = params.get('state')?.trim() ?? ''
  } else {
    // Raw authorization code (biasanya berawalan 4/0A... atau ter-encode 4%2F0A...)
    let normalizedCode = trimmed
    if (!normalizedCode.includes('/') && normalizedCode.includes('%2F')) {
      try {
        normalizedCode = decodeURIComponent(normalizedCode)
      } catch {
        normalizedCode = trimmed
      }
    }
    code = normalizedCode
    state = fallbackState?.trim() ?? ''
  }

  if (oauthError) {
    const detail = oauthErrorDesc ? ` (${oauthErrorDesc})` : ''
    throw new Error(`Google menolak otorisasi OAuth: ${oauthError}${detail}`)
  }

  if (!code) {
    throw new Error('Authorization code tidak ditemukan dalam input callback')
  }

  const resolvedState = state || fallbackState?.trim() || ''
  if (!resolvedState) {
    throw new Error(
      'Parameter state OAuth tidak ditemukan. Ulangi login Google dari modal tambah akun.'
    )
  }

  return {
    code,
    state: resolvedState,
  }
}

export async function exchangeAntigravityCode(
  code: string,
  redirectUri: string,
  env: WorkerEnv
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientId = env.ANTIGRAVITY_CLIENT_ID?.trim()
  const clientSecret = env.ANTIGRAVITY_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw new Error(
      'ANTIGRAVITY_CLIENT_ID atau ANTIGRAVITY_CLIENT_SECRET belum dikonfigurasi di Worker'
    )
  }

  const res = await fetchWithTimeout(
    GOOGLE_TOKEN_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri.trim(),
        grant_type: 'authorization_code',
      }).toString(),
    },
    10_000
  )

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !data.access_token) {
    const reason =
      data.error_description || data.error || `HTTP ${res.status}`
    throw new Error(`Penukaran kode OAuth ke Google gagal: ${reason}`)
  }

  if (!data.refresh_token) {
    throw new Error(
      'Google tidak mengirimkan refresh_token. Silakan ulangi login dan pastikan seluruh izin disetujui.'
    )
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: typeof data.expires_in === 'number' ? data.expires_in : 3600,
  }
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetchWithTimeout(
    GOOGLE_USERINFO_ENDPOINT,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    8000
  )

  const data = (await res.json().catch(() => ({}))) as {
    email?: string
    error?: { message?: string }
  }

  if (!res.ok || !data.email) {
    const detail = data.error?.message || `HTTP ${res.status}`
    throw new Error(`Gagal mengambil email profil Google: ${detail}`)
  }

  return data.email.trim().toLowerCase()
}

function extractProjectIdFromPayload(rawProject: unknown): string {
  if (typeof rawProject === 'string') {
    return rawProject.trim()
  }
  if (rawProject && typeof rawProject === 'object') {
    const id = (rawProject as { id?: unknown }).id
    if (typeof id === 'string') {
      return id.trim()
    }
  }
  return ''
}

export async function loadAndOnboardProject(accessToken: string): Promise<string> {
  const headers = buildCloudCodeHeaders(accessToken)
  const loadRes = await fetchWithTimeout(
    CLOUDCODE_LOAD_ASSIST_URL,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ metadata: CLIENT_METADATA }),
    },
    8000
  )

  if (!loadRes.ok) {
    const errText = await loadRes.text().catch(() => '')
    throw new Error(
      `Gagal memanggil loadCodeAssist Google (HTTP ${loadRes.status}): ${errText.slice(0, 180)}`
    )
  }

  const loadData = (await loadRes.json().catch(() => ({}))) as {
    cloudaicompanionProject?: unknown
    allowedTiers?: Array<{ id?: string; isDefault?: boolean }>
  }

  const directProjectId = extractProjectIdFromPayload(loadData.cloudaicompanionProject)
  if (directProjectId) {
    return directProjectId
  }

  const defaultTier =
    loadData.allowedTiers?.find((tier) => tier.isDefault)?.id?.trim() || 'legacy-tier'

  // Lakukan onboard cepat (maksimal 3 percobaan singkat agar aman di runtime Worker)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const onboardRes = await fetchWithTimeout(
      CLOUDCODE_ONBOARD_URL,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tierId: defaultTier,
          metadata: CLIENT_METADATA,
        }),
      },
      6000
    )

    if (!onboardRes.ok) {
      const errText = await onboardRes.text().catch(() => '')
      throw new Error(
        `Gagal melakukan onboarding Cloud Code project (HTTP ${onboardRes.status}): ${errText.slice(0, 180)}`
      )
    }

    const onboardData = (await onboardRes.json().catch(() => ({}))) as {
      done?: boolean
      response?: {
        cloudaicompanionProject?: unknown
      }
    }

    const onboardedProjectId = extractProjectIdFromPayload(
      onboardData.response?.cloudaicompanionProject
    )
    if (onboardedProjectId) {
      return onboardedProjectId
    }

    if (onboardData.done) {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  throw new Error(
    'Akun Google ini belum mengembalikan Cloud Code projectId aktif. Pastikan akun terdaftar di Antigravity / Gemini Code Assist.'
  )
}

interface FetchAvailableModelsResponse {
  models?: Record<
    string,
    {
      quotaInfo?: {
        remainingFraction?: number
        resetTime?: string
      }
    }
  >
}

function parseTrackedModelsQuota(data: FetchAvailableModelsResponse): ModelQuotaInfo[] {
  const modelsMap = data.models ?? {}
  return TRACKED_QUOTA_MODELS.map((modelId) => {
    const quotaInfo = modelsMap[modelId]?.quotaInfo
    if (!quotaInfo) {
      return {
        modelId,
        remainingFraction: null,
        remainingPercent: null,
        resetTime: null,
      }
    }

    const resetTime = typeof quotaInfo.resetTime === 'string' ? quotaInfo.resetTime : null

    if (typeof quotaInfo.remainingFraction === 'number' && Number.isFinite(quotaInfo.remainingFraction)) {
      const clamped = Math.max(0, Math.min(1, quotaInfo.remainingFraction))
      return {
        modelId,
        remainingFraction: clamped,
        remainingPercent: Math.round(clamped * 100),
        resetTime,
      }
    }

    // Jika resetTime ada namun remainingFraction dihilangkan oleh API Google, kuota model habis (0%)
    if (resetTime) {
      return {
        modelId,
        remainingFraction: 0,
        remainingPercent: 0,
        resetTime,
      }
    }

    return {
      modelId,
      remainingFraction: null,
      remainingPercent: null,
      resetTime: null,
    }
  })
}

async function runQuotaCheckInner(
  account: AntigravityAccount,
  env: WorkerEnv
): Promise<AccountQuotaResult> {
  const checkedAt = new Date().toISOString()

  try {
    let accessToken = await getAccessTokenForAccount(account, env, false, 3500)

    const callFetchModels = (token: string) =>
      fetchWithTimeout(
        CLOUDCODE_FETCH_MODELS_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': ANTIGRAVITY_USER_AGENT,
          },
          body: JSON.stringify({ project: account.projectId }),
        },
        3500
      )

    let res = await callFetchModels(accessToken)
    if (res.status === 401) {
      await kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(account))
      accessToken = await getAccessTokenForAccount(account, env, true, 3500)
      res = await callFetchModels(accessToken)
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return {
        email: account.email,
        maskedEmail: maskEmail(account.email),
        projectId: account.projectId,
        isActive: account.isActive !== false,
        authStatus: res.status === 401 || res.status === 403 ? 'revoked' : 'error',
        errorMessage: `Google Cloud Code HTTP ${res.status}: ${errBody.slice(0, 140)}`,
        checkedAt,
        models: [],
      }
    }

    const data = (await res.json().catch(() => ({}))) as FetchAvailableModelsResponse
    return {
      email: account.email,
      maskedEmail: maskEmail(account.email),
      projectId: account.projectId,
      isActive: account.isActive !== false,
      authStatus: 'ok',
      checkedAt,
      models: parseTrackedModelsQuota(data),
    }
  } catch (err) {
    if (err instanceof OAuthRevokedError) {
      return {
        email: account.email,
        maskedEmail: maskEmail(account.email),
        projectId: account.projectId,
        isActive: account.isActive !== false,
        authStatus: 'revoked',
        errorMessage:
          'Token OAuth kedaluwarsa atau dicabut (invalid_grant). Perlu login ulang.',
        checkedAt,
        models: [],
      }
    }

    return {
      email: account.email,
      maskedEmail: maskEmail(account.email),
      projectId: account.projectId,
      isActive: account.isActive !== false,
      authStatus: 'error',
      errorMessage:
        err instanceof Error ? err.message : 'Gagal mengambil status kuota akun',
      checkedAt,
      models: [],
    }
  }
}

export async function fetchAntigravityQuota(
  account: AntigravityAccount,
  env: WorkerEnv,
  timeoutMs = QUOTA_PER_ACCOUNT_TIMEOUT_MS
): Promise<AccountQuotaResult> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      runQuotaCheckInner(account, env),
      new Promise<AccountQuotaResult>((resolve) => {
        timer = setTimeout(() => {
          resolve({
            email: account.email,
            maskedEmail: maskEmail(account.email),
            projectId: account.projectId,
            isActive: account.isActive !== false,
            authStatus: 'error',
            errorMessage: `Timeout pengecekan kuota melebihi ${timeoutMs}ms`,
            checkedAt: new Date().toISOString(),
            models: [],
          })
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

export async function fetchAllAccountsQuota(
  accounts: AntigravityAccount[],
  env: WorkerEnv
): Promise<AccountQuotaResult[]> {
  const settled = await Promise.allSettled(
    accounts.map((account) =>
      fetchAntigravityQuota(account, env, QUOTA_PER_ACCOUNT_TIMEOUT_MS)
    )
  )

  return settled.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    const acc = accounts[idx]
    return {
      email: acc.email,
      maskedEmail: maskEmail(acc.email),
      projectId: acc.projectId,
      isActive: acc.isActive !== false,
      authStatus: 'error',
      errorMessage:
        result.reason instanceof Error
          ? result.reason.message
          : 'Pengecekan kuota akun gagal',
      checkedAt: new Date().toISOString(),
      models: [],
    }
  })
}
