export interface KvNamespaceLike {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
  delete: (key: string) => Promise<void>
}

export interface AiBindingLike {
  run: (
    model: string,
    inputs: Record<string, unknown>
  ) => Promise<ReadableStream<Uint8Array> | Uint8Array | Record<string, unknown>>
}

export interface WorkerEnv {
  AI: AiBindingLike
  ROUTER_KV?: KvNamespaceLike
  ROUTER_API_KEY?: string
  ROUTER_ADMIN_KEY?: string
  ACCOUNTS_ENCRYPTION_KEY?: string
  ANTIGRAVITY_ACCOUNTS?: string
  ANTIGRAVITY_CLIENT_ID?: string
  ANTIGRAVITY_CLIENT_SECRET?: string
  ALLOW_FLUX_FALLBACK?: string
}

export interface AntigravityAccount {
  email: string
  projectId: string
  refreshToken: string
  priority?: number
  isActive?: boolean
  addedAt?: string
  updatedAt?: string
}

export type StorageSource = 'kv' | 'env_secret_fallback'

export interface ManagedAccountsLoadResult {
  accounts: AntigravityAccount[]
  storageSource: StorageSource
}

export interface SanitizedAntigravityAccount {
  email: string
  maskedEmail: string
  projectId: string
  priority: number
  isActive: boolean
  addedAt?: string
  updatedAt?: string
  cooldownUntilMs: number | null
}

export interface ModelQuotaInfo {
  modelId: string
  remainingFraction: number | null
  remainingPercent: number | null
  resetTime: string | null
}

export interface AccountQuotaResult {
  email: string
  maskedEmail: string
  projectId: string
  isActive: boolean
  authStatus: 'ok' | 'revoked' | 'error'
  errorMessage?: string
  checkedAt: string
  models: ModelQuotaInfo[]
}

export interface ImageGenerationRequestBody {
  prompt?: string
  model?: string
  size?: string
  n?: number
  response_format?: string
  image?: string
  images?: string[]
  fallback?: boolean
}

export interface ChatMessagePartInput {
  type?: string
  text?: string
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant' | 'tool' | string
  content: string | ChatMessagePartInput[] | null
}

export interface ChatCompletionRequestBody {
  model?: string
  messages?: ChatMessageInput[]
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
  max_tokens?: number
}

export interface AntigravityImageResult {
  b64Json: string
  mimeType: string
  model: string
  maskedAccount: string
  endpoint: string
}

export interface AntigravityChatResult {
  response: Response
  model: string
  maskedAccount: string
  endpoint: string
}
