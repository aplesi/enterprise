import {
  AccountNotFoundError,
  deleteManagedAccount,
  listSanitizedAccounts,
  loadManagedAccounts,
  mergeAccountsFromEnv,
  patchManagedAccount,
  upsertManagedAccount,
} from './accounts-store'
import {
  SUPPORTED_ANTIGRAVITY_MODELS,
  generateAntigravityChat,
  generateAntigravityImage,
  isAntigravityChatModel,
  isAntigravityImageModel,
  maskEmail,
  stripProviderPrefix,
} from './antigravity'
import { resolveEncryptionSecret } from './crypto'
import {
  buildAntigravityAuthUrl,
  consumeOAuthState,
  exchangeAntigravityCode,
  fetchAllAccountsQuota,
  fetchGoogleUserEmail,
  loadAndOnboardProject,
  parseCallbackInput,
} from './oauth'
import type {
  ChatCompletionRequestBody,
  ImageGenerationRequestBody,
  WorkerEnv,
} from './types'

export type { WorkerEnv as Env } from './types'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const DEFAULT_CF_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'
const DEFAULT_CF_CHAT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

const CLOUDFLARE_AI_MODELS = [
  { id: '@cf/black-forest-labs/flux-1-schnell', name: 'FLUX-1 Schnell (Cloudflare Workers AI)', owned_by: 'cloudflare' },
  { id: '@cf/leonardoai/phoenix-1.0', name: 'Leonardo Phoenix (Cloudflare Workers AI)', owned_by: 'cloudflare' },
  { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL (Cloudflare Workers AI)', owned_by: 'cloudflare' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B Fast (Cloudflare Workers AI)', owned_by: 'cloudflare' },
] as const

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

function withCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function streamToBase64(streamOrBytes: ReadableStream<Uint8Array> | Uint8Array): Promise<string> {
  if (streamOrBytes instanceof Uint8Array) {
    return uint8ArrayToBase64(streamOrBytes)
  }

  const reader = streamOrBytes.getReader()
  const chunks: Uint8Array[] = []
  let totalLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      totalLength += value.length
    }
  }

  const merged = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return uint8ArrayToBase64(merged)
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function validateApiKey(request: Request, env: WorkerEnv): boolean {
  if (!env.ROUTER_API_KEY) return true
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  return timingSafeEqualString(token, env.ROUTER_API_KEY)
}

function validateAdminKey(request: Request, env: WorkerEnv): boolean {
  const expected = (env.ROUTER_ADMIN_KEY || env.ROUTER_API_KEY || '').trim()
  if (!expected) return false
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  return token.length > 0 && timingSafeEqualString(token, expected)
}

async function runCloudflareAiImage(
  prompt: string,
  requestedModel: string,
  env: WorkerEnv
): Promise<{ b64Json: string; cfModel: string }> {
  const cfModel = requestedModel.startsWith('@cf/') ? requestedModel : DEFAULT_CF_IMAGE_MODEL

  const aiResult = await env.AI.run(cfModel, {
    prompt: `${prompt}, sharp focus, well-lit, realistic photojournalism style, high resolution`,
  })

  let base64Image: string | null = null

  if (aiResult instanceof ReadableStream || aiResult instanceof Uint8Array) {
    base64Image = await streamToBase64(aiResult)
  } else if (typeof aiResult === 'object' && aiResult !== null && 'image' in aiResult) {
    const imgVal = aiResult.image
    if (typeof imgVal === 'string' && imgVal) {
      base64Image = imgVal.replace(/^data:image\/[^;]+;base64,/i, '')
    }
  }

  if (!base64Image) {
    throw new Error('Gagal membuat gambar via Cloudflare Workers AI')
  }

  return { b64Json: base64Image, cfModel }
}

async function handleImageGeneration(request: Request, env: WorkerEnv): Promise<Response> {
  if (!validateApiKey(request, env)) {
    return jsonResponse({ error: { message: 'API key tidak valid' } }, 401)
  }

  try {
    const body = (await request.json()) as ImageGenerationRequestBody
    const prompt = body.prompt?.trim()
    if (!prompt) {
      return jsonResponse({ error: { message: 'Field prompt wajib diisi' } }, 400)
    }

    const requestedModel = (body.model || 'ag/gemini-3.1-flash-image').trim()
    const allowFallback = body.fallback !== false && env.ALLOW_FLUX_FALLBACK !== 'false'
    let antigravityError: string | null = null

    if (isAntigravityImageModel(requestedModel)) {
      try {
        const result = await generateAntigravityImage(prompt, requestedModel, body.size, env)
        return jsonResponse({
          created: Math.floor(Date.now() / 1000),
          data: [
            {
              b64_json: result.b64Json,
              revised_prompt: prompt,
            },
          ],
          provider: `antigravity (${result.model})`,
          account: result.maskedAccount,
          mime_type: result.mimeType,
        })
      } catch (err) {
        antigravityError = err instanceof Error ? err.message : 'Antigravity gagal'
        if (!allowFallback) {
          return jsonResponse({ error: { message: antigravityError } }, 502)
        }
      }
    }

    const fallbackResult = await runCloudflareAiImage(prompt, requestedModel, env)
    return jsonResponse({
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          b64_json: fallbackResult.b64Json,
          revised_prompt: prompt,
        },
      ],
      provider: `cloudflare-workers-ai (${fallbackResult.cfModel})`,
      ...(antigravityError ? { fallback_reason: antigravityError } : {}),
    })
  } catch (err) {
    return jsonResponse(
      {
        error: {
          message: err instanceof Error ? err.message : 'Internal Server Error pada AI Router',
        },
      },
      500
    )
  }
}

async function handleChatCompletion(request: Request, env: WorkerEnv): Promise<Response> {
  if (!validateApiKey(request, env)) {
    return jsonResponse({ error: { message: 'API key tidak valid' } }, 401)
  }

  try {
    const body = (await request.json()) as ChatCompletionRequestBody
    const requestedModel = (body.model || 'ag/gemini-3-flash').trim()

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonResponse({ error: { message: 'Field messages wajib berupa array tidak kosong' } }, 400)
    }

    if (isAntigravityChatModel(requestedModel)) {
      try {
        const result = await generateAntigravityChat(body, requestedModel, env)
        const corsResp = withCorsHeaders(result.response)
        corsResp.headers.set('X-Router-Provider', `antigravity (${stripProviderPrefix(result.model)})`)
        corsResp.headers.set('X-Router-Account', result.maskedAccount)
        return corsResp
      } catch (err) {
        const allowFallback = env.ALLOW_FLUX_FALLBACK !== 'false'
        if (!allowFallback) {
          return jsonResponse(
            {
              error: {
                message: err instanceof Error ? err.message : 'Antigravity chat gagal',
              },
            },
            502
          )
        }
      }
    }

    const cfModel = requestedModel.startsWith('@cf/') ? requestedModel : DEFAULT_CF_CHAT_MODEL
    const stream = Boolean(body.stream)
    const aiResult = await env.AI.run(cfModel, {
      messages: body.messages,
      stream,
      ...(typeof body.max_tokens === 'number' ? { max_tokens: body.max_tokens } : {}),
      ...(typeof body.temperature === 'number' ? { temperature: body.temperature } : {}),
    })

    if (stream && aiResult instanceof ReadableStream) {
      return new Response(aiResult, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          ...CORS_HEADERS,
        },
      })
    }

    const replyText =
      typeof aiResult === 'object' && aiResult !== null && 'response' in aiResult && typeof aiResult.response === 'string'
        ? aiResult.response
        : JSON.stringify(aiResult)

    return jsonResponse({
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: cfModel,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: replyText },
          finish_reason: 'stop',
        },
      ],
    })
  } catch (err) {
    return jsonResponse(
      {
        error: {
          message: err instanceof Error ? err.message : 'Internal Server Error pada Chat Router',
        },
      },
      500
    )
  }
}

async function readJsonBodySafe<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

async function handleAdminAccountsRoute(
  pathname: string,
  url: URL,
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (!validateAdminKey(request, env)) {
    return jsonResponse(
      { error: { message: 'Unauthorized: Admin API key tidak valid' } },
      401
    )
  }

  try {
    if (pathname === '/admin/accounts' && request.method === 'GET') {
      const { accounts, storageSource } = await listSanitizedAccounts(env)
      const activeAccounts = accounts.filter((acc) => acc.isActive).length
      return jsonResponse({
        accounts,
        totalAccounts: accounts.length,
        activeAccounts,
        storageSource,
      })
    }

    if (pathname === '/admin/accounts/oauth-url' && request.method === 'POST') {
      const body = await readJsonBodySafe<{ redirectUri?: string }>(request)
      const redirectUri =
        typeof body?.redirectUri === 'string' && body.redirectUri.trim()
          ? body.redirectUri.trim()
          : 'http://localhost:8080/callback'
      const result = await buildAntigravityAuthUrl(redirectUri, env)
      return jsonResponse(result)
    }

    if (pathname === '/admin/accounts/exchange' && request.method === 'POST') {
      const body = await readJsonBodySafe<{
        callbackUrl?: string
        code?: string
        state?: string
      }>(request)
      if (!body) {
        return jsonResponse({ error: { message: 'Body JSON tidak valid' } }, 400)
      }

      const rawInput =
        (typeof body.callbackUrl === 'string' && body.callbackUrl.trim()) ||
        (typeof body.code === 'string' && body.code.trim()) ||
        ''

      const { code, state } = parseCallbackInput(rawInput, body.state)
      const storedState = await consumeOAuthState(state, env)
      const tokens = await exchangeAntigravityCode(code, storedState.redirectUri, env)
      const email = await fetchGoogleUserEmail(tokens.accessToken)
      const projectId = await loadAndOnboardProject(tokens.accessToken)
      const { account, action } = await upsertManagedAccount(
        {
          email,
          projectId,
          refreshToken: tokens.refreshToken,
          isActive: true,
        },
        env
      )

      return jsonResponse(
        {
          action,
          account: {
            email: account.email,
            maskedEmail: maskEmail(account.email),
            projectId: account.projectId,
            priority: account.priority ?? 1,
            isActive: account.isActive !== false,
            addedAt: account.addedAt,
            updatedAt: account.updatedAt,
            cooldownUntilMs: null,
          },
        },
        action === 'created' ? 201 : 200
      )
    }

    if (pathname === '/admin/accounts/quota' && request.method === 'POST') {
      const body = await readJsonBodySafe<{ email?: string }>(request)
      const targetEmail =
        typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

      const { accounts } = await loadManagedAccounts(env)
      const targets = targetEmail
        ? accounts.filter((acc) => acc.email.trim().toLowerCase() === targetEmail)
        : accounts

      if (targetEmail && targets.length === 0) {
        return jsonResponse(
          { error: { message: `Akun ${maskEmail(targetEmail)} tidak ditemukan` } },
          404
        )
      }

      const results = await fetchAllAccountsQuota(targets, env)
      return jsonResponse({
        checkedAt: new Date().toISOString(),
        totalChecked: results.length,
        results,
      })
    }

    if (pathname === '/admin/accounts/sync-env' && request.method === 'POST') {
      const body = await readJsonBodySafe<{ mode?: 'merge' | 'reset' }>(request)
      const mode = body?.mode === 'reset' ? 'reset' : 'merge'
      const syncResult = await mergeAccountsFromEnv(env, mode)
      const { accounts, storageSource } = await listSanitizedAccounts(env)
      return jsonResponse({
        mode,
        added: syncResult.added,
        updated: syncResult.updated,
        total: syncResult.total,
        activeAccounts: accounts.filter((acc) => acc.isActive).length,
        storageSource,
        accounts,
      })
    }

    if (pathname === '/admin/accounts' && request.method === 'PATCH') {
      const body = await readJsonBodySafe<{
        email?: string
        isActive?: boolean
        priority?: number
      }>(request)
      const email = typeof body?.email === 'string' ? body.email.trim() : ''
      if (!email) {
        return jsonResponse({ error: { message: 'Field email wajib diisi' } }, 400)
      }
      if (typeof body?.isActive !== 'boolean' && typeof body?.priority !== 'number') {
        return jsonResponse(
          { error: { message: 'Sertakan minimal isActive atau priority untuk diperbarui' } },
          400
        )
      }

      const { account } = await patchManagedAccount(
        email,
        {
          isActive: body?.isActive,
          priority: body?.priority,
        },
        env
      )

      return jsonResponse({
        account: {
          email: account.email,
          maskedEmail: maskEmail(account.email),
          projectId: account.projectId,
          priority: account.priority ?? 1,
          isActive: account.isActive !== false,
          addedAt: account.addedAt,
          updatedAt: account.updatedAt,
          cooldownUntilMs: null,
        },
      })
    }

    if (pathname === '/admin/accounts' && request.method === 'DELETE') {
      const body = await readJsonBodySafe<{ email?: string }>(request)
      const email =
        url.searchParams.get('email')?.trim() ||
        (typeof body?.email === 'string' ? body.email.trim() : '')
      if (!email) {
        return jsonResponse({ error: { message: 'Parameter email wajib diisi' } }, 400)
      }

      const { deletedEmail, accounts } = await deleteManagedAccount(email, env)
      return jsonResponse({
        deletedEmail,
        maskedEmail: maskEmail(deletedEmail),
        remainingCount: accounts.length,
      })
    }

    return jsonResponse({ error: { message: 'Endpoint admin tidak ditemukan' } }, 404)
  } catch (err) {
    if (err instanceof AccountNotFoundError) {
      return jsonResponse({ error: { message: err.message } }, 404)
    }

    const message =
      err instanceof Error ? err.message : 'Terjadi kesalahan pada manajemen akun'
    const status =
      pathname === '/admin/accounts/exchange' ||
      pathname === '/admin/accounts/oauth-url' ||
      message.includes('wajib') ||
      message.includes('Format') ||
      message.includes('Sesi OAuth')
        ? 400
        : 500
    return jsonResponse({ error: { message } }, status)
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      let totalAccounts = 0
      let activeAccounts = 0
      let storageSource: 'kv' | 'env_secret_fallback' = 'env_secret_fallback'

      try {
        const managed = await loadManagedAccounts(env)
        totalAccounts = managed.accounts.length
        activeAccounts = managed.accounts.filter((acc) => acc.isActive !== false).length
        storageSource = managed.storageSource
      } catch {
        storageSource = env.ROUTER_KV ? 'kv' : 'env_secret_fallback'
      }

      return jsonResponse({
        status: 'online',
        service: 'aplesi-ai-router',
        edge: 'cloudflare-workers-24/7',
        version: '3.0.0',
        antigravityAccounts: activeAccounts,
        antigravityAccountsActive: activeAccounts,
        antigravityAccountsTotal: totalAccounts,
        storageSource,
        encryptionConfigured: Boolean(resolveEncryptionSecret(env)),
        kvCacheEnabled: Boolean(env.ROUTER_KV),
        oauthConfigured: Boolean(env.ANTIGRAVITY_CLIENT_ID && env.ANTIGRAVITY_CLIENT_SECRET),
        timestamp: new Date().toISOString(),
      })
    }

    const normalizedPath = url.pathname.startsWith('/v1/')
      ? url.pathname.slice(3)
      : url.pathname

    if (normalizedPath === '/admin/accounts' || normalizedPath.startsWith('/admin/accounts/')) {
      return handleAdminAccountsRoute(normalizedPath, url, request, env)
    }

    if (url.pathname === '/v1/models' || url.pathname === '/models') {
      return jsonResponse({
        object: 'list',
        data: [...SUPPORTED_ANTIGRAVITY_MODELS, ...CLOUDFLARE_AI_MODELS],
      })
    }

    if (
      (url.pathname === '/v1/images/generations' || url.pathname === '/images/generations') &&
      request.method === 'POST'
    ) {
      return handleImageGeneration(request, env)
    }

    if (
      (url.pathname === '/v1/chat/completions' || url.pathname === '/chat/completions') &&
      request.method === 'POST'
    ) {
      return handleChatCompletion(request, env)
    }

    return jsonResponse({ error: { message: 'Endpoint tidak ditemukan' } }, 404)
  },
}
