import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AG_ACCOUNTS_KV_KEY,
  deleteManagedAccount,
  listSanitizedAccounts,
  loadManagedAccounts,
  mergeAccountsFromEnv,
  patchManagedAccount,
  upsertManagedAccount,
} from '@/workers/image-router/src/accounts-store'
import { decryptPayload, encryptPayload } from '@/workers/image-router/src/crypto'
import {
  OAUTH_STATE_KV_PREFIX,
  buildAntigravityAuthUrl,
  consumeOAuthState,
  fetchAllAccountsQuota,
  parseCallbackInput,
} from '@/workers/image-router/src/oauth'
import { getKvCooldownKey, getKvTokenKey } from '@/workers/image-router/src/shared'
import type { KvNamespaceLike, WorkerEnv } from '@/workers/image-router/src/types'

function createMockKv(): KvNamespaceLike & { store: Map<string, string> } {
  const store = new Map<string, string>()
  return {
    store,
    async get(key: string) {
      return store.get(key) ?? null
    },
    async put(key: string, value: string) {
      store.set(key, value)
    },
    async delete(key: string) {
      store.delete(key)
    },
  }
}

function createTestEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv & { kv: ReturnType<typeof createMockKv> } {
  const kv = createMockKv()
  return {
    kv,
    ROUTER_KV: kv,
    ROUTER_API_KEY: 'sk-test-api',
    ROUTER_ADMIN_KEY: 'sk-test-admin',
    ACCOUNTS_ENCRYPTION_KEY: 'my-short-passphrase-for-aes-gcm',
    ANTIGRAVITY_CLIENT_ID: 'client-id-abc',
    ANTIGRAVITY_CLIENT_SECRET: 'client-secret-xyz',
    ANTIGRAVITY_ACCOUNTS: JSON.stringify([
      { email: 'Seed1@Example.com', projectId: 'proj-seed-1', refreshToken: 'rt-seed-1', priority: 1 },
      { email: 'seed2@example.com', projectId: 'proj-seed-2', refreshToken: 'rt-seed-2', priority: 2 },
    ]),
    AI: { run: vi.fn() },
    ...overrides,
  }
}

describe('Worker Crypto, Managed Accounts Store & OAuth Helpers (Opsi A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AES-256-GCM crypto dengan SHA-256 key derivation', () => {
    it('mengenkripsi dan mendekripsi secret dengan panjang key sembarang menggunakan format v1', async () => {
      const secrets = ['pendek', 'passphrase-panjang-64-karakter-hex-0123456789abcdef0123456789abcd']
      for (const secret of secrets) {
        const cipher = await encryptPayload('{"secret":"rt-123"}', secret)
        expect(cipher.startsWith('v1:')).toBe(true)
        const parts = cipher.split(':')
        expect(parts).toHaveLength(3)
        expect(await decryptPayload(cipher, secret)).toBe('{"secret":"rt-123"}')
      }
    })

    it('gagal dekripsi jika menggunakan kunci yang salah', async () => {
      const cipher = await encryptPayload('data-rahasia', 'kunci-benar')
      await expect(decryptPayload(cipher, 'kunci-salah')).rejects.toThrow()
    })
  })

  describe('accounts-store.ts', () => {
    it('melakukan auto-seed ke KV terenkripsi saat ag:accounts:v1 masih null, lalu menghormati array kosong []', async () => {
      const env = createTestEnv()
      const loaded1 = await loadManagedAccounts(env)
      expect(loaded1.storageSource).toBe('kv')
      expect(loaded1.accounts).toHaveLength(2)

      const rawEncrypted = env.kv.store.get(AG_ACCOUNTS_KV_KEY)
      expect(rawEncrypted).toBeDefined()
      expect(rawEncrypted?.startsWith('v1:')).toBe(true)
      expect(rawEncrypted).not.toContain('rt-seed-1')

      await deleteManagedAccount('seed1@example.com', env)
      await deleteManagedAccount('seed2@example.com', env)

      // Setelah semua dihapus, KV berisi [] terenkripsi dan TIDAK auto-seed ulang dari env
      const loadedAfterDelete = await loadManagedAccounts(env)
      expect(loadedAfterDelete.storageSource).toBe('kv')
      expect(loadedAfterDelete.accounts).toHaveLength(0)
    })

    it('menghapus token & cooldown cache saat upsert (re-login) akun dengan email sama', async () => {
      const env = createTestEnv()
      await loadManagedAccounts(env)

      const accRef = { email: 'Seed1@Example.com', projectId: 'proj-seed-1' }
      await env.ROUTER_KV?.put(getKvTokenKey(accRef), JSON.stringify({ accessToken: 'old-at', expiresAtMs: Date.now() + 999999 }))
      await env.ROUTER_KV?.put(getKvCooldownKey(accRef), String(Date.now() + 300_000))

      const res = await upsertManagedAccount(
        {
          email: 'seed1@example.com',
          projectId: 'proj-seed-1-new',
          refreshToken: 'rt-fresh-999',
        },
        env
      )

      expect(res.action).toBe('updated')
      expect(res.account.refreshToken).toBe('rt-fresh-999')
      expect(res.account.projectId).toBe('proj-seed-1-new')
      expect(env.kv.store.has(getKvTokenKey(accRef))).toBe(false)
      expect(env.kv.store.has(getKvCooldownKey(accRef))).toBe(false)
    })

    it('mendukung patch isActive & priority, merge env aman, dan sanitasi output tanpa refreshToken', async () => {
      const env = createTestEnv()
      await upsertManagedAccount(
        { email: 'oauth-baru@example.com', projectId: 'proj-oauth', refreshToken: 'rt-oauth' },
        env
      )
      await patchManagedAccount('seed1@example.com', { isActive: false, priority: 10 }, env)
      await env.ROUTER_KV?.put(
        getKvCooldownKey({ email: 'seed2@example.com', projectId: 'proj-seed-2' }),
        String(Date.now() + 120_000)
      )

      const mergeRes = await mergeAccountsFromEnv(env, 'merge')
      expect(mergeRes.total).toBe(3)
      expect(mergeRes.added).toBe(0)

      const sanitized = await listSanitizedAccounts(env)
      expect(sanitized.accounts).toHaveLength(3)
      for (const acc of sanitized.accounts) {
        expect('refreshToken' in acc).toBe(false)
      }
      const s2 = sanitized.accounts.find((a) => a.email === 'seed2@example.com')
      expect(s2?.cooldownUntilMs).not.toBeNull()
      const s1 = sanitized.accounts.find((a) => a.email === 'Seed1@Example.com')
      expect(s1?.isActive).toBe(false)
    })
  })

  describe('oauth.ts', () => {
    it('parseCallbackInput mendukung 3 format (Full URL, query string, dan raw code)', () => {
      const full = parseCallbackInput(
        'http://localhost:8080/callback?state=st-full&code=4%2F0AfullCode&scope=email'
      )
      expect(full).toEqual({ code: '4/0AfullCode', state: 'st-full' })

      const query = parseCallbackInput('?code=4/0AqueryCode&state=st-query')
      expect(query).toEqual({ code: '4/0AqueryCode', state: 'st-query' })

      const raw = parseCallbackInput('4/0ArawOnlyCode', 'st-modal-fallback')
      expect(raw).toEqual({ code: '4/0ArawOnlyCode', state: 'st-modal-fallback' })

      expect(() =>
        parseCallbackInput('http://localhost:8080/callback?error=access_denied&state=x')
      ).toThrow(/access_denied/)
      expect(() => parseCallbackInput('4/0ArawWithoutState')).toThrow(/state OAuth/i)
    })

    it('menyimpan state + redirectUri ke KV saat authorize dan mengonsumsinya satu kali', async () => {
      const env = createTestEnv()
      const auth = await buildAntigravityAuthUrl('http://localhost:3000/callback', env)
      expect(auth.authUrl).toContain('accounts.google.com/o/oauth2/v2/auth')
      expect(auth.authUrl).toContain(encodeURIComponent('http://localhost:3000/callback'))
      expect(env.kv.store.has(`${OAUTH_STATE_KV_PREFIX}${auth.state}`)).toBe(true)

      const consumed = await consumeOAuthState(auth.state, env)
      expect(consumed.redirectUri).toBe('http://localhost:3000/callback')
      expect(env.kv.store.has(`${OAUTH_STATE_KV_PREFIX}${auth.state}`)).toBe(false)

      await expect(consumeOAuthState(auth.state, env)).rejects.toThrow(/kedaluwarsa|tidak valid/i)
    })

    it('fetchAllAccountsQuota berjalan paralel, mengisolasi invalid_grant sebagai revoked, dan membaca semua model kuota', async () => {
      const env = createTestEnv()
      const { accounts } = await loadManagedAccounts(env)

      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('oauth2.googleapis.com/token')) {
          const bodyStr = String(init?.body ?? '')
          if (bodyStr.includes('rt-seed-1')) {
            return new Response(JSON.stringify({ access_token: 'at-1', expires_in: 3600 }), {
              status: 200,
            })
          }
          return new Response(
            JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been revoked' }),
            { status: 400 }
          )
        }

        if (url.includes('fetchAvailableModels')) {
          return new Response(
            JSON.stringify({
              models: {
                'gemini-3.1-flash-image': {
                  quotaInfo: { remainingFraction: 0.75, resetTime: '2026-11-11T12:00:00Z' },
                },
                'gemini-3-flash': {
                  quotaInfo: { remainingFraction: 1, resetTime: '2026-11-11T12:00:00Z' },
                },
                'claude-sonnet-4-6': {
                  quotaInfo: { resetTime: '2026-11-11T14:00:00Z' }, // habis (0%)
                },
              },
            }),
            { status: 200 }
          )
        }

        return new Response('Not found', { status: 404 })
      })

      vi.stubGlobal('fetch', fetchMock)

      const results = await fetchAllAccountsQuota(accounts, env)
      expect(results).toHaveLength(2)

      const okAcc = results.find((r) => r.email === 'Seed1@Example.com')
      expect(okAcc?.authStatus).toBe('ok')
      const imgModel = okAcc?.models.find((m) => m.modelId === 'gemini-3.1-flash-image')
      expect(imgModel?.remainingPercent).toBe(75)
      const claudeModel = okAcc?.models.find((m) => m.modelId === 'claude-sonnet-4-6')
      expect(claudeModel?.remainingPercent).toBe(0)

      const revokedAcc = results.find((r) => r.email === 'seed2@example.com')
      expect(revokedAcc?.authStatus).toBe('revoked')
      expect(revokedAcc?.errorMessage).toContain('invalid_grant')
    })
  })
})
