import { loadManagedAccounts } from './accounts-store'
import {
  ANTIGRAVITY_USER_AGENT,
  MIN_KV_TTL_SEC,
  fetchWithTimeout,
  getAccessTokenForAccount,
  getKvCooldownKey,
  getKvTokenKey,
  kvDeleteSafe,
  kvGetSafe,
  kvPutSafe,
  maskEmail,
  parseAntigravityAccounts,
  toKvSafeId,
} from './shared'
import type {
  AntigravityAccount,
  AntigravityChatResult,
  AntigravityImageResult,
  ChatCompletionRequestBody,
  ChatMessageInput,
  WorkerEnv,
} from './types'

export { maskEmail, parseAntigravityAccounts, toKvSafeId }

const ANTIGRAVITY_BASE_URLS = [
  'https://daily-cloudcode-pa.googleapis.com',
  'https://daily-cloudcode-pa.sandbox.googleapis.com',
] as const

const ANTIGRAVITY_DEFAULT_SYSTEM =
  'You are Antigravity, a powerful agentic AI coding assistant designed by the Google Deepmind team working on Advanced Agentic Coding.You are pair programming with a USER to solve their coding task. The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question.**Absolute paths only****Proactiveness**'

const TOTAL_IMAGE_DEADLINE_MS = 24000
const MAX_SINGLE_IMAGE_ATTEMPT_MS = 18000
const MIN_REMAINING_BUDGET_MS = 4000
const MAX_ACCOUNTS_TO_TRY_IMAGE = 4
const MAX_ACCOUNTS_TO_TRY_CHAT = 5
const CHAT_REQUEST_TIMEOUT_MS = 45000

interface GeminiInlineData {
  data?: string
  mimeType?: string
  mime_type?: string
}

interface GeminiPart {
  text?: string
  thought?: boolean
  thoughtSignature?: string
  inlineData?: GeminiInlineData
  inline_data?: GeminiInlineData
}

interface GeminiCandidate {
  content?: {
    role?: string
    parts?: GeminiPart[]
  }
  finishReason?: string
}

interface GeminiUsageMetadata {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
}

interface GeminiGenerateContentResponse {
  response?: {
    candidates?: GeminiCandidate[]
    usageMetadata?: GeminiUsageMetadata
    modelVersion?: string
    responseId?: string
  }
  candidates?: GeminiCandidate[]
  usageMetadata?: GeminiUsageMetadata
  modelVersion?: string
  responseId?: string
}

export const SUPPORTED_ANTIGRAVITY_MODELS = [
  { id: 'ag/gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/gemini-3.1-flash-image-16x9', name: 'Gemini 3.1 Flash Image 16:9 (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/gemini-3.1-flash-image-4x3', name: 'Gemini 3.1 Flash Image 4:3 (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'gemini', name: 'Gemini 3.1 Flash Image (Alias Antigravity)', owned_by: 'antigravity' },
  { id: 'ag/gemini-3-flash', name: 'Gemini 3 Flash (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/gemini-3-flash-agent', name: 'Gemini 3.5 Flash High (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/gemini-pro-agent', name: 'Gemini 3.1 Pro High (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Antigravity 24/7)', owned_by: 'antigravity' },
  { id: 'ag/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking (Antigravity 24/7)', owned_by: 'antigravity' },
] as const

export function stripProviderPrefix(model: string): string {
  return model.trim().replace(/^ag\//i, '')
}

export function isAntigravityImageModel(requestedModel: string): boolean {
  const model = requestedModel.trim()
  if (!model || model.toLowerCase() === 'gemini') return true
  if (model.startsWith('@cf/')) return false
  const clean = stripProviderPrefix(model)
  return /image|imagen|gemini/i.test(clean)
}

export function isAntigravityChatModel(requestedModel: string): boolean {
  const model = requestedModel.trim()
  if (!model || model.startsWith('@cf/')) return false
  if (/^ag\//i.test(model)) return !/image|imagen/i.test(model)
  return /^(gemini|claude|gpt-oss)/i.test(model) && !/image|imagen/i.test(model)
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const temp = x % y
    x = y
    y = temp
  }
  return x || 1
}

export function parseImageConfig(
  requestedModel: string,
  requestedSize?: string
): { cleanModel: string; aspectRatio: string } {
  const baseModel = stripProviderPrefix(requestedModel) || 'gemini-3.1-flash-image'
  const normalizedModel = baseModel.toLowerCase() === 'gemini' ? 'gemini-3.1-flash-image' : baseModel

  const modelSuffixMatch = normalizedModel.match(/-(\d+)x(\d+)$/)
  if (modelSuffixMatch) {
    const w = parseInt(modelSuffixMatch[1], 10)
    const h = parseInt(modelSuffixMatch[2], 10)
    const cleanModel = normalizedModel.replace(/-(\d+)x(\d+)$/, '')
    if (w > 0 && h > 0) {
      if (w <= 21 && h <= 21) {
        return { cleanModel, aspectRatio: `${w}:${h}` }
      }
      const divisor = gcd(w, h)
      return { cleanModel, aspectRatio: `${w / divisor}:${h / divisor}` }
    }
    return { cleanModel, aspectRatio: '1:1' }
  }

  if (requestedSize) {
    const sizeMatch = requestedSize.trim().match(/^(\d+)x(\d+)$/i)
    if (sizeMatch) {
      const w = parseInt(sizeMatch[1], 10)
      const h = parseInt(sizeMatch[2], 10)
      if (w > 0 && h > 0) {
        const divisor = gcd(w, h)
        return { cleanModel: normalizedModel, aspectRatio: `${w / divisor}:${h / divisor}` }
      }
    }
  }

  return { cleanModel: normalizedModel, aspectRatio: '1:1' }
}

export function parseRetryDelayMs(status: number, headers: Headers, bodyText: string): number {
  const retryAfter = headers.get('retry-after')
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10)
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 3600_000)
    }
    const parsedDate = new Date(retryAfter).getTime()
    if (Number.isFinite(parsedDate) && parsedDate > Date.now()) {
      return Math.min(parsedDate - Date.now(), 3600_000)
    }
  }

  const resetAfter = headers.get('x-ratelimit-reset-after')
  if (resetAfter) {
    const seconds = parseInt(resetAfter, 10)
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 3600_000)
    }
  }

  const bodyMatch = bodyText.match(/reset after (\d+h)?(\d+m)?(\d+s)?/i)
  if (bodyMatch) {
    let totalMs = 0
    if (bodyMatch[1]) totalMs += parseInt(bodyMatch[1], 10) * 3600_000
    if (bodyMatch[2]) totalMs += parseInt(bodyMatch[2], 10) * 60_000
    if (bodyMatch[3]) totalMs += parseInt(bodyMatch[3], 10) * 1000
    if (totalMs > 0) return Math.min(totalMs, 3600_000)
  }

  if (status === 429) return 300_000
  if (status === 403 || status === 404) return 300_000
  if (status >= 500) return 60_000
  return 60_000
}

async function selectOrderedAccounts(
  accounts: AntigravityAccount[],
  env: WorkerEnv
): Promise<AntigravityAccount[]> {
  const now = Date.now()
  const cooldownStates = await Promise.all(
    accounts.map(async (account) => {
      const cooldownKey = getKvCooldownKey(account)
      const raw = await kvGetSafe(env.ROUTER_KV, cooldownKey)
      const untilMs = raw ? Number(raw) : 0
      const isCooling = Number.isFinite(untilMs) && untilMs > now
      return { account, isCooling }
    })
  )

  const healthy = cooldownStates.filter((entry) => !entry.isCooling)
  const cooling = cooldownStates.filter((entry) => entry.isCooling)

  const rotateOffset = healthy.length > 1 ? Math.floor(Date.now() / 60_000) % healthy.length : 0
  const rotatedHealthy =
    rotateOffset > 0 ? [...healthy.slice(rotateOffset), ...healthy.slice(0, rotateOffset)] : healthy

  return [...rotatedHealthy, ...cooling].map(({ account }) => account)
}

async function markAccountCooldown(
  account: AntigravityAccount,
  env: WorkerEnv,
  delayMs: number
): Promise<void> {
  const ttlSec = Math.max(MIN_KV_TTL_SEC, Math.ceil(delayMs / 1000))
  const cooldownKey = getKvCooldownKey(account)
  const untilMs = Date.now() + ttlSec * 1000
  await kvPutSafe(env.ROUTER_KV, cooldownKey, String(untilMs), ttlSec)
}

function buildAntigravityHeaders(accessToken: string, sessionId: string, stream: boolean): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': ANTIGRAVITY_USER_AGENT,
    'x-request-source': 'local',
    'X-Machine-Session-Id': sessionId,
    Accept: stream ? 'text/event-stream' : 'application/json',
  }
}

function createSessionId(): string {
  return `${crypto.randomUUID()}${Date.now()}`
}

function buildAntigravityImagePayload(
  account: AntigravityAccount,
  cleanModel: string,
  aspectRatio: string,
  prompt: string,
  sessionId: string
): Record<string, unknown> {
  return {
    project: account.projectId,
    model: cleanModel,
    userAgent: 'antigravity',
    requestType: 'image_gen',
    requestId: `agent-${crypto.randomUUID()}`,
    request: {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        imageConfig: { aspectRatio },
      },
      sessionId,
    },
  }
}

function extractInlineImageFromResponse(
  body: GeminiGenerateContentResponse
): { b64Json: string; mimeType: string } | null {
  const candidates = body.response?.candidates || body.candidates || []
  const parts = candidates[0]?.content?.parts || []
  for (const part of parts) {
    const inlineData = part.inlineData || part.inline_data
    if (inlineData?.data) {
      return {
        b64Json: inlineData.data,
        mimeType: inlineData.mimeType || inlineData.mime_type || 'image/jpeg',
      }
    }
  }
  return null
}

async function callAntigravityWithAuthRetry(
  url: string,
  buildPayload: (sessionId: string) => Record<string, unknown>,
  account: AntigravityAccount,
  env: WorkerEnv,
  stream: boolean,
  timeoutMs: number
): Promise<Response> {
  const sessionId = createSessionId()
  const payload = JSON.stringify(buildPayload(sessionId))
  let accessToken = await getAccessTokenForAccount(account, env, false)

  let response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: buildAntigravityHeaders(accessToken, sessionId, stream),
      body: payload,
    },
    timeoutMs
  )

  if (response.status === 401) {
    const tokenKey = getKvTokenKey(account)
    await kvDeleteSafe(env.ROUTER_KV, tokenKey)
    accessToken = await getAccessTokenForAccount(account, env, true)
    response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: buildAntigravityHeaders(accessToken, sessionId, stream),
        body: payload,
      },
      timeoutMs
    )
  }

  return response
}

export async function generateAntigravityImage(
  prompt: string,
  requestedModel: string,
  requestedSize: string | undefined,
  env: WorkerEnv
): Promise<AntigravityImageResult> {
  const { accounts: managedAccounts } = await loadManagedAccounts(env)
  const accounts = managedAccounts.filter((acc) => acc.isActive !== false)
  if (accounts.length === 0) {
    throw new Error('Tidak ada akun Antigravity aktif di konfigurasi Worker')
  }

  const { cleanModel, aspectRatio } = parseImageConfig(requestedModel, requestedSize)
  const ordered = (await selectOrderedAccounts(accounts, env)).slice(0, MAX_ACCOUNTS_TO_TRY_IMAGE)
  const deadlineMs = Date.now() + TOTAL_IMAGE_DEADLINE_MS
  const errors: string[] = []

  for (const account of ordered) {
    const remainingMs = deadlineMs - Date.now()
    if (remainingMs < MIN_REMAINING_BUDGET_MS) {
      errors.push('Batas waktu Antigravity habis, alihkan ke fallback')
      break
    }

    const attemptTimeoutMs = Math.min(MAX_SINGLE_IMAGE_ATTEMPT_MS, remainingMs)

    for (const baseUrl of ANTIGRAVITY_BASE_URLS) {
      const remainingForUrl = deadlineMs - Date.now()
      if (remainingForUrl < MIN_REMAINING_BUDGET_MS) break

      const url = `${baseUrl}/v1internal:generateContent`
      try {
        const response = await callAntigravityWithAuthRetry(
          url,
          (sessionId) => buildAntigravityImagePayload(account, cleanModel, aspectRatio, prompt, sessionId),
          account,
          env,
          false,
          Math.min(attemptTimeoutMs, remainingForUrl)
        )

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          errors.push(`${maskEmail(account.email)} [${response.status}]`)
          if (response.status === 429 || response.status >= 500) {
            // Coba sandbox base URL jika base URL utama rate-limited / 5xx
            if (baseUrl === ANTIGRAVITY_BASE_URLS[0]) continue
          }
          await markAccountCooldown(account, env, parseRetryDelayMs(response.status, response.headers, errText))
          break
        }

        const json = (await response.json()) as GeminiGenerateContentResponse
        const extracted = extractInlineImageFromResponse(json)
        if (!extracted) {
          errors.push(`${maskEmail(account.email)} [empty inlineData]`)
          await markAccountCooldown(account, env, 60_000)
          break
        }

        return {
          b64Json: extracted.b64Json,
          mimeType: extracted.mimeType,
          model: cleanModel,
          maskedAccount: maskEmail(account.email),
          endpoint: baseUrl,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        errors.push(`${maskEmail(account.email)} [${msg}]`)
        break
      }
    }
  }

  throw new Error(`Semua percobaan Antigravity gagal: ${errors.join('; ')}`)
}

function extractChatTextContent(content: ChatMessageInput['content']): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
}

function buildAntigravityChatPayload(
  account: AntigravityAccount,
  cleanModel: string,
  reqBody: ChatCompletionRequestBody,
  sessionId: string
): Record<string, unknown> {
  const systemParts: Array<{ text: string }> = [
    { text: ANTIGRAVITY_DEFAULT_SYSTEM },
    { text: `Please ignore the following [ignore]${ANTIGRAVITY_DEFAULT_SYSTEM}[/ignore]` },
  ]

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

  for (const msg of reqBody.messages || []) {
    const text = extractChatTextContent(msg.content)
    if (!text) continue

    if (msg.role === 'system') {
      systemParts.push({ text })
      continue
    }

    const geminiRole: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user'
    const lastTurn = contents[contents.length - 1]
    if (lastTurn && lastTurn.role === geminiRole) {
      lastTurn.parts.push({ text })
    } else {
      contents.push({ role: geminiRole, parts: [{ text }] })
    }
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: Math.min(reqBody.max_tokens || 8192, 16384),
  }
  if (typeof reqBody.temperature === 'number') generationConfig.temperature = reqBody.temperature
  if (typeof reqBody.top_p === 'number') generationConfig.topP = reqBody.top_p
  if (typeof reqBody.top_k === 'number') generationConfig.topK = reqBody.top_k

  return {
    project: account.projectId,
    model: cleanModel,
    userAgent: 'antigravity',
    requestType: 'agent',
    requestId: `agent-${crypto.randomUUID()}`,
    request: {
      sessionId,
      systemInstruction: { role: 'user', parts: systemParts },
      contents,
      generationConfig,
    },
  }
}

function mapFinishReason(reason?: string): string {
  if (!reason || reason === 'STOP') return 'stop'
  if (reason === 'MAX_TOKENS') return 'length'
  if (reason === 'SAFETY' || reason === 'RECITATION') return 'content_filter'
  return 'stop'
}

function extractChatAssistantParts(parts: GeminiPart[]): { content: string; reasoning: string } {
  let content = ''
  let reasoning = ''
  for (const part of parts) {
    if (!part.text) continue
    if (part.thought === true) {
      reasoning += part.text
    } else {
      content += part.text
    }
  }
  return { content, reasoning }
}

function toOpenAIChatCompletion(
  geminiBody: GeminiGenerateContentResponse,
  requestedModel: string
): Record<string, unknown> {
  const resp = geminiBody.response || geminiBody
  const candidate = resp.candidates?.[0]
  const parts = candidate?.content?.parts || []
  const { content, reasoning } = extractChatAssistantParts(parts)
  const usage = resp.usageMetadata

  return {
    id: `chatcmpl-${resp.responseId || crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
          ...(reasoning ? { reasoning_content: reasoning } : {}),
        },
        finish_reason: mapFinishReason(candidate?.finishReason),
      },
    ],
    usage: {
      prompt_tokens: usage?.promptTokenCount || 0,
      completion_tokens: usage?.candidatesTokenCount || 0,
      total_tokens: usage?.totalTokenCount || 0,
    },
  }
}

function createAntigravitySseToOpenAiStream(
  upstreamBody: ReadableStream<Uint8Array>,
  requestedModel: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''
  let sentRole = false
  const chunkId = `chatcmpl-${crypto.randomUUID()}`

  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader()
      activeReader = reader
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const rawLine of lines) {
            const line = rawLine.trim()
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') continue

            try {
              const parsed = JSON.parse(payload) as GeminiGenerateContentResponse
              const resp = parsed.response || parsed
              const candidate = resp.candidates?.[0]
              if (!candidate) continue

              const created = Math.floor(Date.now() / 1000)

              if (!sentRole) {
                sentRole = true
                const roleChunk = {
                  id: chunkId,
                  object: 'chat.completion.chunk',
                  created,
                  model: requestedModel,
                  choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(roleChunk)}\n\n`))
              }

              const { content, reasoning } = extractChatAssistantParts(candidate.content?.parts || [])
              if (reasoning) {
                const reasoningChunk = {
                  id: chunkId,
                  object: 'chat.completion.chunk',
                  created,
                  model: requestedModel,
                  choices: [{ index: 0, delta: { reasoning_content: reasoning }, finish_reason: null }],
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(reasoningChunk)}\n\n`))
              }

              if (content) {
                const contentChunk = {
                  id: chunkId,
                  object: 'chat.completion.chunk',
                  created,
                  model: requestedModel,
                  choices: [{ index: 0, delta: { content }, finish_reason: null }],
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(contentChunk)}\n\n`))
              }

              if (candidate.finishReason) {
                const finishChunk = {
                  id: chunkId,
                  object: 'chat.completion.chunk',
                  created,
                  model: requestedModel,
                  choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(candidate.finishReason) }],
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`))
              }
            } catch {
              // Abaikan event SSE malformed parsial
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
    async cancel() {
      await activeReader?.cancel().catch(() => undefined)
    },
  })
}

export async function generateAntigravityChat(
  reqBody: ChatCompletionRequestBody,
  requestedModel: string,
  env: WorkerEnv
): Promise<AntigravityChatResult> {
  const { accounts: managedAccounts } = await loadManagedAccounts(env)
  const accounts = managedAccounts.filter((acc) => acc.isActive !== false)
  if (accounts.length === 0) {
    throw new Error('Tidak ada akun Antigravity aktif di konfigurasi Worker')
  }

  const cleanModel = stripProviderPrefix(requestedModel)
  const stream = Boolean(reqBody.stream)
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent'
  const ordered = (await selectOrderedAccounts(accounts, env)).slice(0, MAX_ACCOUNTS_TO_TRY_CHAT)
  const errors: string[] = []

  for (const account of ordered) {
    for (const baseUrl of ANTIGRAVITY_BASE_URLS) {
      const url = `${baseUrl}/v1internal:${action}`
      try {
        const response = await callAntigravityWithAuthRetry(
          url,
          (sessionId) => buildAntigravityChatPayload(account, cleanModel, reqBody, sessionId),
          account,
          env,
          stream,
          CHAT_REQUEST_TIMEOUT_MS
        )

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          errors.push(`${maskEmail(account.email)} [${response.status}]`)
          if ((response.status === 429 || response.status >= 500) && baseUrl === ANTIGRAVITY_BASE_URLS[0]) {
            continue
          }
          await markAccountCooldown(account, env, parseRetryDelayMs(response.status, response.headers, errText))
          break
        }

        if (stream && response.body) {
          const sseStream = createAntigravitySseToOpenAiStream(response.body, requestedModel)
          return {
            response: new Response(sseStream, {
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
              },
            }),
            model: cleanModel,
            maskedAccount: maskEmail(account.email),
            endpoint: baseUrl,
          }
        }

        const geminiJson = (await response.json()) as GeminiGenerateContentResponse
        const openAiPayload = toOpenAIChatCompletion(geminiJson, requestedModel)
        return {
          response: new Response(JSON.stringify(openAiPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
          model: cleanModel,
          maskedAccount: maskEmail(account.email),
          endpoint: baseUrl,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        errors.push(`${maskEmail(account.email)} [${msg}]`)
        break
      }
    }
  }

  throw new Error(`Semua akun Antigravity chat gagal: ${errors.join('; ')}`)
}
