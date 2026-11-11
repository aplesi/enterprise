import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import worker from '@/workers/image-router/src/index'
import {
  isAntigravityChatModel,
  isAntigravityImageModel,
  parseAntigravityAccounts,
  parseImageConfig,
  parseRetryDelayMs,
} from '@/workers/image-router/src/antigravity'
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

function createBaseEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv & { kv: ReturnType<typeof createMockKv> } {
  const kv = createMockKv()
  return {
    kv,
    ROUTER_KV: kv,
    ROUTER_API_KEY: 'sk-test-router-key',
    ANTIGRAVITY_CLIENT_ID: 'client-id-123',
    ANTIGRAVITY_CLIENT_SECRET: 'client-secret-456',
    ANTIGRAVITY_ACCOUNTS: JSON.stringify([
      { email: 'acc1@example.com', projectId: 'proj-1', refreshToken: 'rt-1', priority: 1 },
      { email: 'acc2@example.com', projectId: 'proj-2', refreshToken: 'rt-2', priority: 2 },
    ]),
    AI: {
      run: vi.fn().mockResolvedValue({ image: 'Zmx1eC1mYWxsYmFjaw==' }),
    },
    ...overrides,
  }
}

describe('Cloudflare AI Router Worker (9Router Edge Port)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_040_000) // offset % 2 === 0 -> starts at acc1
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('model & config parsers', () => {
    it('mendeteksi model image dan chat Antigravity dengan benar', () => {
      expect(isAntigravityImageModel('ag/gemini-3.1-flash-image')).toBe(true)
      expect(isAntigravityImageModel('gemini')).toBe(true)
      expect(isAntigravityImageModel('@cf/black-forest-labs/flux-1-schnell')).toBe(false)

      expect(isAntigravityChatModel('ag/gemini-3-flash')).toBe(true)
      expect(isAntigravityChatModel('ag/claude-sonnet-4-6')).toBe(true)
      expect(isAntigravityChatModel('ag/gemini-3.1-flash-image')).toBe(false)
      expect(isAntigravityChatModel('@cf/meta/llama-3.3-70b-instruct-fp8-fast')).toBe(false)
    })

    it('mem-parsing aspect ratio dari suffix model atau size', () => {
      expect(parseImageConfig('ag/gemini-3.1-flash-image')).toEqual({
        cleanModel: 'gemini-3.1-flash-image',
        aspectRatio: '1:1',
      })
      expect(parseImageConfig('ag/gemini-3.1-flash-image-16x9')).toEqual({
        cleanModel: 'gemini-3.1-flash-image',
        aspectRatio: '16:9',
      })
      expect(parseImageConfig('ag/gemini-3.1-flash-image-1024x768')).toEqual({
        cleanModel: 'gemini-3.1-flash-image',
        aspectRatio: '4:3',
      })
      expect(parseImageConfig('gemini', '1280x720')).toEqual({
        cleanModel: 'gemini-3.1-flash-image',
        aspectRatio: '16:9',
      })
    })

    it('mengurutkan akun Antigravity sesuai priority dan mengabaikan item invalid', () => {
      const parsed = parseAntigravityAccounts(
        JSON.stringify([
          { email: 'b@example.com', projectId: 'p2', refreshToken: 'rt2', priority: 5 },
          { email: 'broken@example.com', projectId: '', refreshToken: 'rt0', priority: 1 },
          { email: 'a@example.com', projectId: 'p1', refreshToken: 'rt1', priority: 2 },
        ])
      )
      expect(parsed).toHaveLength(2)
      expect(parsed[0].email).toBe('a@example.com')
      expect(parsed[1].email).toBe('b@example.com')
    })

    it('mem-parsing retry delay dari header dan pesan Google reset after', () => {
      const hdr = new Headers({ 'retry-after': '120' })
      expect(parseRetryDelayMs(429, hdr, '')).toBe(120_000)

      const noHdr = new Headers()
      expect(parseRetryDelayMs(429, noHdr, 'Your quota will reset after 15m10s')).toBe(
        (15 * 60 + 10) * 1000
      )
      expect(parseRetryDelayMs(429, noHdr, 'Your quota will reset after 2h30m')).toBe(3600_000)
    })
  })

  describe('endpoints HTTP', () => {
    it('mengembalikan status health v3.0.0 beserta jumlah akun Antigravity', async () => {
      const env = createBaseEnv()
      const res = await worker.fetch(new Request('https://ai.aplesi.my.id/health'), env)
      expect(res.status).toBe(200)
      const data = (await res.json()) as Record<string, unknown>
      expect(data.version).toBe('3.0.0')
      expect(data.antigravityAccounts).toBe(2)
      expect(data.kvCacheEnabled).toBe(true)
      expect(data.oauthConfigured).toBe(true)
    })

    it('menolak request /v1/images/generations tanpa API key yang benar', async () => {
      const env = createBaseEnv()
      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/images/generations', {
          method: 'POST',
          headers: { Authorization: 'Bearer wrong', 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'kolam lele' }),
        }),
        env
      )
      expect(res.status).toBe(401)
    })

    it('men-generate gambar via Antigravity OAuth, cache accessToken di KV, dan tidak memanggil FLUX', async () => {
      const env = createBaseEnv()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'at-1', expires_in: 3600 }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: {
                candidates: [
                  {
                    content: {
                      parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'Z2VtaW5pLWltYWdl' } }],
                    },
                  },
                ],
              },
            }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: {
                candidates: [
                  {
                    content: {
                      parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'Z2VtaW5pLTJk' } }],
                    },
                  },
                ],
              },
            }),
            { status: 200 }
          )
        )

      vi.stubGlobal('fetch', fetchMock)

      const makeReq = () =>
        new Request('https://ai.aplesi.my.id/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Pembudidaya memberi pakan lele dari luar kolam terpal',
            model: 'ag/gemini-3.1-flash-image',
          }),
        })

      const res1 = await worker.fetch(makeReq(), env)
      expect(res1.status).toBe(200)
      const json1 = (await res1.json()) as {
        data: Array<{ b64_json: string }>
        provider: string
        mime_type: string
      }
      expect(json1.data[0].b64_json).toBe('Z2VtaW5pLWltYWdl')
      expect(json1.provider).toBe('antigravity (gemini-3.1-flash-image)')
      expect(json1.mime_type).toBe('image/jpeg')
      expect(env.AI.run).not.toHaveBeenCalled()

      // Request ke-2 pada akun sama memakai accessToken dari KV tanpa hit oauth2.googleapis.com lagi
      const res2 = await worker.fetch(makeReq(), env)
      expect(res2.status).toBe(200)
      const json2 = (await res2.json()) as { data: Array<{ b64_json: string }> }
      expect(json2.data[0].b64_json).toBe('Z2VtaW5pLTJk')
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('melakukan failover ke akun Antigravity berikutnya ketika akun pertama terkena 429', async () => {
      const env = createBaseEnv()
      const fetchMock = vi
        .fn()
        // acc1 OAuth
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'at-acc1', expires_in: 3600 }), { status: 200 })
        )
        // acc1 daily-cloudcode -> 429
        .mockResolvedValueOnce(new Response('Quota reset after 5m', { status: 429 }))
        // acc1 sandbox -> 429
        .mockResolvedValueOnce(new Response('Quota reset after 5m', { status: 429 }))
        // acc2 OAuth
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'at-acc2', expires_in: 3600 }), { status: 200 })
        )
        // acc2 daily-cloudcode -> 200
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: {
                candidates: [
                  {
                    content: {
                      parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'YWNjMi1zdWNjZXNz' } }],
                    },
                  },
                ],
              },
            }),
            { status: 200 }
          )
        )

      vi.stubGlobal('fetch', fetchMock)

      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Kolam bioflok lele pagi hari',
            model: 'ag/gemini-3.1-flash-image',
          }),
        }),
        env
      )

      expect(res.status).toBe(200)
      const data = (await res.json()) as { data: Array<{ b64_json: string }>; account: string }
      expect(data.data[0].b64_json).toBe('YWNjMi1zdWNjZXNz')
      expect(data.account).toBe('ac***@example.com')
      expect(env.kv.store.get('ag:cooldown:acc1_example.com')).toBeDefined()
    })

    it('fallback ke Cloudflare Workers AI FLUX-1 jika semua akun Antigravity gagal', async () => {
      const env = createBaseEnv()
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('Upstream down', { status: 503 }))
      )

      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Kolam terpal lele',
            model: 'ag/gemini-3.1-flash-image',
          }),
        }),
        env
      )

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        data: Array<{ b64_json: string }>
        provider: string
        fallback_reason?: string
      }
      expect(data.data[0].b64_json).toBe('Zmx1eC1mYWxsYmFjaw==')
      expect(data.provider).toBe('cloudflare-workers-ai (@cf/black-forest-labs/flux-1-schnell)')
      expect(data.fallback_reason).toContain('Semua percobaan Antigravity gagal')
      expect(env.AI.run).toHaveBeenCalledTimes(1)
    })

    it('mendukung /v1/chat/completions non-streaming untuk model ag/* dan memfilter part thought', async () => {
      const env = createBaseEnv()
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ access_token: 'at-chat', expires_in: 3600 }), { status: 200 })
          )
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                response: {
                  responseId: 'resp-1',
                  candidates: [
                    {
                      finishReason: 'STOP',
                      content: {
                        parts: [
                          { thought: true, text: 'Berpikir internal...' },
                          { thoughtSignature: 'sig-1', text: 'Air hijau kecoklatan.' },
                        ],
                      },
                    },
                  ],
                  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 },
                },
              }),
              { status: 200 }
            )
          )
      )

      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'ag/gemini-3-flash',
            messages: [{ role: 'user', content: 'Apa warna air bioflok sehat?' }],
          }),
        }),
        env
      )

      expect(res.status).toBe(200)
      const data = (await res.json()) as {
        choices: Array<{ message: { content: string; reasoning_content?: string }; finish_reason: string }>
      }
      expect(data.choices[0].message.content).toBe('Air hijau kecoklatan.')
      expect(data.choices[0].message.reasoning_content).toBe('Berpikir internal...')
      expect(data.choices[0].finish_reason).toBe('stop')
    })

    it('mendukung /v1/chat/completions streaming SSE ke format OpenAI', async () => {
      const env = createBaseEnv()
      const encoder = new TextEncoder()
      const upstreamSse = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"response":{"candidates":[{"content":{"parts":[{"text":"Halo "}]}}]}}\n\n'
            )
          )
          controller.enqueue(
            encoder.encode(
              'data: {"response":{"candidates":[{"content":{"parts":[{"text":"peternak!"}]},"finishReason":"STOP"}]}}\n\n'
            )
          )
          controller.close()
        },
      })

      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ access_token: 'at-sse', expires_in: 3600 }), { status: 200 })
          )
          .mockResolvedValueOnce(
            new Response(upstreamSse, {
              status: 200,
              headers: { 'Content-Type': 'text/event-stream' },
            })
          )
      )

      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'ag/gemini-3-flash',
            stream: true,
            messages: [{ role: 'user', content: 'Sapa peternak lele' }],
          }),
        }),
        env
      )

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/event-stream')
      const bodyText = await res.text()
      expect(bodyText).toContain('"role":"assistant"')
      expect(bodyText).toContain('"content":"Halo "')
      expect(bodyText).toContain('"content":"peternak!"')
      expect(bodyText).toContain('"finish_reason":"stop"')
      expect(bodyText).toContain('data: [DONE]')
    })
  })

  describe('endpoints admin Opsi A & CORS', () => {
    it('mengizinkan method PATCH dan DELETE pada header CORS OPTIONS', async () => {
      const env = createBaseEnv()
      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts', { method: 'OPTIONS' }),
        env
      )
      expect(res.status).toBe(200)
      const methods = res.headers.get('Access-Control-Allow-Methods') ?? ''
      expect(methods).toContain('PATCH')
      expect(methods).toContain('DELETE')
    })

    it('menolak akses /v1/admin/accounts tanpa admin/router key valid', async () => {
      const env = createBaseEnv({ ROUTER_ADMIN_KEY: 'sk-super-admin' })
      const resWrong = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts', {
          headers: { Authorization: 'Bearer sk-test-router-key' },
        }),
        env
      )
      expect(resWrong.status).toBe(401)
    })

    it('menjalankan siklus oauth-url -> exchange -> list -> patch -> health dinamis -> delete', async () => {
      const env = createBaseEnv({
        ROUTER_ADMIN_KEY: 'sk-admin-opsi-a',
        ACCOUNTS_ENCRYPTION_KEY: 'kunci-aes-opsi-a',
      })
      const headers = {
        Authorization: 'Bearer sk-admin-opsi-a',
        'Content-Type': 'application/json',
      }

      // 1. Minta oauth-url
      const authUrlRes = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts/oauth-url', {
          method: 'POST',
          headers,
          body: JSON.stringify({ redirectUri: 'http://localhost:8080/callback' }),
        }),
        env
      )
      expect(authUrlRes.status).toBe(200)
      const authJson = (await authUrlRes.json()) as {
        authUrl: string
        state: string
        redirectUri: string
      }
      expect(authJson.state).toBeTruthy()
      expect(authJson.authUrl).toContain(encodeURIComponent('http://localhost:8080/callback'))

      // 2. Mock Google OAuth token exchange + userinfo + loadCodeAssist
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('oauth2.googleapis.com/token')) {
          const params = new URLSearchParams(String(init?.body ?? ''))
          expect(params.get('redirect_uri')).toBe('http://localhost:8080/callback')
          return new Response(
            JSON.stringify({
              access_token: 'at-new-user',
              refresh_token: 'rt-new-user-secret',
              expires_in: 3600,
            }),
            { status: 200 }
          )
        }
        if (url.includes('userinfo')) {
          return new Response(JSON.stringify({ email: 'NewAccount@Gmail.com' }), { status: 200 })
        }
        if (url.includes('loadCodeAssist')) {
          return new Response(
            JSON.stringify({ cloudaicompanionProject: { id: 'cloud-proj-new' } }),
            { status: 200 }
          )
        }
        return new Response('unexpected', { status: 500 })
      })
      vi.stubGlobal('fetch', fetchMock)

      // 3. Exchange memakai format raw code + fallback state
      const exchangeRes = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts/exchange', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            callbackUrl: '4/0A-sample-auth-code',
            state: authJson.state,
          }),
        }),
        env
      )
      expect(exchangeRes.status).toBe(201)
      const exchangeData = (await exchangeRes.json()) as {
        action: string
        account: Record<string, unknown>
      }
      expect(exchangeData.action).toBe('created')
      expect(exchangeData.account.email).toBe('newaccount@gmail.com')
      expect(exchangeData.account.projectId).toBe('cloud-proj-new')
      expect('refreshToken' in exchangeData.account).toBe(false)

      // 4. Health menunjukkan total 3, active 3
      const healthBeforeRes = await worker.fetch(
        new Request('https://ai.aplesi.my.id/health'),
        env
      )
      const healthBefore = (await healthBeforeRes.json()) as Record<string, unknown>
      expect(healthBefore.antigravityAccountsTotal).toBe(3)
      expect(healthBefore.antigravityAccountsActive).toBe(3)
      expect(healthBefore.storageSource).toBe('kv')

      // 5. Nonaktifkan 1 akun via PATCH -> health active turun jadi 2
      const patchRes = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ email: 'acc1@example.com', isActive: false }),
        }),
        env
      )
      expect(patchRes.status).toBe(200)

      const healthAfterPatchRes = await worker.fetch(
        new Request('https://ai.aplesi.my.id/health'),
        env
      )
      const healthAfterPatch = (await healthAfterPatchRes.json()) as Record<string, unknown>
      expect(healthAfterPatch.antigravityAccountsTotal).toBe(3)
      expect(healthAfterPatch.antigravityAccountsActive).toBe(2)

      // 6. Hapus akun baru via DELETE
      const deleteRes = await worker.fetch(
        new Request(
          'https://ai.aplesi.my.id/v1/admin/accounts?email=newaccount%40gmail.com',
          { method: 'DELETE', headers }
        ),
        env
      )
      expect(deleteRes.status).toBe(200)
      const delData = (await deleteRes.json()) as { remainingCount: number }
      expect(delData.remainingCount).toBe(2)
    })

    it('melewati akun yang berstatus nonaktif (isActive: false) saat generate gambar', async () => {
      const env = createBaseEnv({
        ROUTER_ADMIN_KEY: 'sk-admin-opsi-a',
        ACCOUNTS_ENCRYPTION_KEY: 'kunci-aes-opsi-a',
      })
      // Nonaktifkan acc1 terlebih dahulu
      await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/admin/accounts', {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer sk-admin-opsi-a',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'acc1@example.com', isActive: false }),
        }),
        env
      )

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'at-only-acc2', expires_in: 3600 }), {
            status: 200,
          })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: {
                candidates: [
                  {
                    content: {
                      parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'YWNjMi1vbmx5' } }],
                    },
                  },
                ],
              },
            }),
            { status: 200 }
          )
        )
      vi.stubGlobal('fetch', fetchMock)

      const res = await worker.fetch(
        new Request('https://ai.aplesi.my.id/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-router-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'Kolam bioflok lele bersih',
            model: 'ag/gemini-3.1-flash-image',
          }),
        }),
        env
      )
      expect(res.status).toBe(200)
      const data = (await res.json()) as { account: string }
      // Karena acc1 dinonaktifkan, acc2 dipilih langsung
      expect(data.account).toBe('ac***@example.com')
      expect(String(fetchMock.mock.calls[0]?.[1]?.body ?? '')).toContain('rt-2')
    })
  })
})
