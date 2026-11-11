import { decryptPayload, encryptPayload, resolveEncryptionSecret } from './crypto'
import {
  getKvCooldownKey,
  getKvTokenKey,
  kvDeleteSafe,
  kvGetSafe,
  kvPutSafe,
  maskEmail,
  parseAntigravityAccounts,
  sortAntigravityAccounts,
} from './shared'
import type {
  AntigravityAccount,
  ManagedAccountsLoadResult,
  SanitizedAntigravityAccount,
  WorkerEnv,
} from './types'

export const AG_ACCOUNTS_KV_KEY = 'ag:accounts:v1'

export class AccountNotFoundError extends Error {
  constructor(email: string) {
    super(`Akun ${maskEmail(email)} tidak ditemukan`)
    this.name = 'AccountNotFoundError'
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeStoredAccounts(rawList: unknown): AntigravityAccount[] {
  if (!Array.isArray(rawList)) {
    return []
  }

  const normalized: AntigravityAccount[] = []
  for (let i = 0; i < rawList.length; i += 1) {
    const item = rawList[i]
    if (!item || typeof item !== 'object') {
      continue
    }
    const record = item as Record<string, unknown>
    const email = typeof record.email === 'string' ? record.email.trim() : ''
    const projectId = typeof record.projectId === 'string' ? record.projectId.trim() : ''
    const refreshToken =
      typeof record.refreshToken === 'string' ? record.refreshToken.trim() : ''

    if (!email || !projectId || !refreshToken) {
      continue
    }

    const priority =
      typeof record.priority === 'number' && Number.isFinite(record.priority)
        ? record.priority
        : i + 1
    const isActive = typeof record.isActive === 'boolean' ? record.isActive : true
    const addedAt = typeof record.addedAt === 'string' ? record.addedAt : undefined
    const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : undefined

    normalized.push({
      email,
      projectId,
      refreshToken,
      priority,
      isActive,
      ...(addedAt ? { addedAt } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    })
  }

  return sortAntigravityAccounts(normalized)
}

function requireWritableStore(env: WorkerEnv): {
  kv: NonNullable<WorkerEnv['ROUTER_KV']>
  secret: string
} {
  if (!env.ROUTER_KV) {
    throw new Error('Binding ROUTER_KV belum terpasang pada Worker')
  }
  const secret = resolveEncryptionSecret(env)
  if (!secret) {
    throw new Error(
      'Kunci enkripsi akun (ACCOUNTS_ENCRYPTION_KEY / ROUTER_ADMIN_KEY) belum dikonfigurasi'
    )
  }
  return { kv: env.ROUTER_KV, secret }
}

/**
 * Memuat daftar akun Antigravity terkelola dari ROUTER_KV (terenkripsi AES-256-GCM).
 * Jika KV masih kosong (`null`) dan `env.ANTIGRAVITY_ACCOUNTS` tersedia, lakukan auto-seed
 * dan persist terenkripsi ke KV satu kali. Array kosong eksplisit (`[]`) di KV dihormati.
 */
export async function loadManagedAccounts(
  env: WorkerEnv
): Promise<ManagedAccountsLoadResult> {
  const rawKv = await kvGetSafe(env.ROUTER_KV, AG_ACCOUNTS_KV_KEY)
  const secret = resolveEncryptionSecret(env)

  if (rawKv !== null) {
    let serialized = rawKv.trim()
    if (serialized.startsWith('v1:')) {
      if (!secret) {
        throw new Error(
          'Data akun di KV terenkripsi tetapi kunci enkripsi tidak tersedia'
        )
      }
      serialized = await decryptPayload(serialized, secret)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Format JSON daftar akun di ROUTER_KV tidak valid')
    }

    return {
      accounts: normalizeStoredAccounts(parsed),
      storageSource: 'kv',
    }
  }

  const nowIso = new Date().toISOString()
  const seeded = parseAntigravityAccounts(env.ANTIGRAVITY_ACCOUNTS).map((acc, index) => ({
    ...acc,
    priority: acc.priority ?? index + 1,
    isActive: acc.isActive !== false,
    addedAt: acc.addedAt ?? nowIso,
    updatedAt: acc.updatedAt ?? nowIso,
  }))

  if (env.ROUTER_KV && secret && seeded.length > 0) {
    try {
      const encrypted = await encryptPayload(JSON.stringify(seeded), secret)
      await kvPutSafe(env.ROUTER_KV, AG_ACCOUNTS_KV_KEY, encrypted)
      return {
        accounts: seeded,
        storageSource: 'kv',
      }
    } catch {
      // Tetap fallback ke daftar in-memory jika gagal menulis ke KV
    }
  }

  return {
    accounts: seeded,
    storageSource: 'env_secret_fallback',
  }
}

export async function saveManagedAccounts(
  accounts: AntigravityAccount[],
  env: WorkerEnv
): Promise<AntigravityAccount[]> {
  const { kv, secret } = requireWritableStore(env)
  const normalized = normalizeStoredAccounts(accounts)
  const encrypted = await encryptPayload(JSON.stringify(normalized), secret)
  await kv.put(AG_ACCOUNTS_KV_KEY, encrypted)
  return normalized
}

export interface UpsertAccountInput {
  email: string
  projectId: string
  refreshToken: string
  priority?: number
  isActive?: boolean
}

export async function upsertManagedAccount(
  input: UpsertAccountInput,
  env: WorkerEnv
): Promise<{
  account: AntigravityAccount
  accounts: AntigravityAccount[]
  action: 'created' | 'updated'
}> {
  const targetEmail = input.email.trim()
  const targetProjectId = input.projectId.trim()
  const targetRefreshToken = input.refreshToken.trim()

  if (!targetEmail || !targetProjectId || !targetRefreshToken) {
    throw new Error('Email, projectId, dan refreshToken wajib diisi')
  }

  const { accounts } = await loadManagedAccounts(env)
  const targetKey = normalizeEmail(targetEmail)
  const existingIndex = accounts.findIndex(
    (item) => normalizeEmail(item.email) === targetKey
  )
  const nowIso = new Date().toISOString()

  let nextList: AntigravityAccount[]
  let updatedAccount: AntigravityAccount
  let action: 'created' | 'updated'

  if (existingIndex >= 0) {
    const prev = accounts[existingIndex]
    updatedAccount = {
      email: targetEmail,
      projectId: targetProjectId,
      refreshToken: targetRefreshToken,
      priority: input.priority ?? prev.priority ?? existingIndex + 1,
      isActive: input.isActive ?? true,
      addedAt: prev.addedAt ?? nowIso,
      updatedAt: nowIso,
    }
    nextList = accounts.map((item, idx) => (idx === existingIndex ? updatedAccount : item))
    action = 'updated'

    // Bersihkan cache token & cooldown lama agar akun langsung segar setelah re-login
    await Promise.all([
      kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(prev)),
      kvDeleteSafe(env.ROUTER_KV, getKvCooldownKey(prev)),
    ])
  } else {
    const maxPriority = accounts.reduce(
      (max, item, idx) => Math.max(max, item.priority ?? idx + 1),
      0
    )
    updatedAccount = {
      email: targetEmail,
      projectId: targetProjectId,
      refreshToken: targetRefreshToken,
      priority: input.priority ?? maxPriority + 1,
      isActive: input.isActive ?? true,
      addedAt: nowIso,
      updatedAt: nowIso,
    }
    nextList = [...accounts, updatedAccount]
    action = 'created'
  }

  const saved = await saveManagedAccounts(nextList, env)
  await Promise.all([
    kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(updatedAccount)),
    kvDeleteSafe(env.ROUTER_KV, getKvCooldownKey(updatedAccount)),
  ])

  const finalAccount =
    saved.find((item) => normalizeEmail(item.email) === targetKey) ?? updatedAccount

  return {
    account: finalAccount,
    accounts: saved,
    action,
  }
}

export async function toggleManagedAccount(
  email: string,
  isActive: boolean,
  env: WorkerEnv
): Promise<{ account: AntigravityAccount; accounts: AntigravityAccount[] }> {
  return patchManagedAccount(email, { isActive }, env)
}

export async function updateAccountPriority(
  email: string,
  priority: number,
  env: WorkerEnv
): Promise<{ account: AntigravityAccount; accounts: AntigravityAccount[] }> {
  return patchManagedAccount(email, { priority }, env)
}

export async function patchManagedAccount(
  email: string,
  updates: { isActive?: boolean; priority?: number },
  env: WorkerEnv
): Promise<{ account: AntigravityAccount; accounts: AntigravityAccount[] }> {
  const targetKey = normalizeEmail(email)
  if (!targetKey) {
    throw new Error('Email akun wajib diisi')
  }

  const { accounts } = await loadManagedAccounts(env)
  const existing = accounts.find((item) => normalizeEmail(item.email) === targetKey)
  if (!existing) {
    throw new AccountNotFoundError(email)
  }

  const nowIso = new Date().toISOString()
  const nextPriority =
    typeof updates.priority === 'number' && Number.isFinite(updates.priority)
      ? Math.max(1, Math.round(updates.priority))
      : existing.priority

  const updatedAccount: AntigravityAccount = {
    ...existing,
    isActive: typeof updates.isActive === 'boolean' ? updates.isActive : existing.isActive !== false,
    ...(nextPriority !== undefined ? { priority: nextPriority } : {}),
    updatedAt: nowIso,
  }

  const nextList = accounts.map((item) =>
    normalizeEmail(item.email) === targetKey ? updatedAccount : item
  )
  const saved = await saveManagedAccounts(nextList, env)
  const finalAccount =
    saved.find((item) => normalizeEmail(item.email) === targetKey) ?? updatedAccount

  return { account: finalAccount, accounts: saved }
}

export async function deleteManagedAccount(
  email: string,
  env: WorkerEnv
): Promise<{ deletedEmail: string; accounts: AntigravityAccount[] }> {
  const targetKey = normalizeEmail(email)
  if (!targetKey) {
    throw new Error('Email akun wajib diisi')
  }

  const { accounts } = await loadManagedAccounts(env)
  const existing = accounts.find((item) => normalizeEmail(item.email) === targetKey)
  if (!existing) {
    throw new AccountNotFoundError(email)
  }

  const nextList = accounts.filter((item) => normalizeEmail(item.email) !== targetKey)
  const saved = await saveManagedAccounts(nextList, env)

  await Promise.all([
    kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(existing)),
    kvDeleteSafe(env.ROUTER_KV, getKvCooldownKey(existing)),
  ])

  return {
    deletedEmail: existing.email,
    accounts: saved,
  }
}

export async function mergeAccountsFromEnv(
  env: WorkerEnv,
  mode: 'merge' | 'reset' = 'merge'
): Promise<{
  added: number
  updated: number
  total: number
  accounts: AntigravityAccount[]
}> {
  const envAccounts = parseAntigravityAccounts(env.ANTIGRAVITY_ACCOUNTS)
  if (envAccounts.length === 0) {
    throw new Error('Secret ANTIGRAVITY_ACCOUNTS di Worker kosong atau tidak valid')
  }

  const nowIso = new Date().toISOString()

  if (mode === 'reset') {
    const prev = await loadManagedAccounts(env).catch(() => ({
      accounts: [] as AntigravityAccount[],
    }))
    await Promise.all(
      prev.accounts.flatMap((acc) => [
        kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(acc)),
        kvDeleteSafe(env.ROUTER_KV, getKvCooldownKey(acc)),
      ])
    )
    const freshList = envAccounts.map((acc, index) => ({
      ...acc,
      priority: acc.priority ?? index + 1,
      isActive: acc.isActive !== false,
      addedAt: nowIso,
      updatedAt: nowIso,
    }))
    const saved = await saveManagedAccounts(freshList, env)
    return {
      added: saved.length,
      updated: 0,
      total: saved.length,
      accounts: saved,
    }
  }

  const { accounts: current } = await loadManagedAccounts(env)
  const byEmail = new Map<string, AntigravityAccount>()
  for (const acc of current) {
    byEmail.set(normalizeEmail(acc.email), acc)
  }

  let added = 0
  let updated = 0
  let maxPriority = current.reduce(
    (max, item, idx) => Math.max(max, item.priority ?? idx + 1),
    0
  )

  for (const envAcc of envAccounts) {
    const key = normalizeEmail(envAcc.email)
    const existing = byEmail.get(key)
    if (!existing) {
      maxPriority += 1
      byEmail.set(key, {
        ...envAcc,
        priority: envAcc.priority ?? maxPriority,
        isActive: envAcc.isActive !== false,
        addedAt: nowIso,
        updatedAt: nowIso,
      })
      added += 1
    } else if (
      existing.projectId !== envAcc.projectId ||
      existing.refreshToken !== envAcc.refreshToken
    ) {
      byEmail.set(key, {
        ...existing,
        projectId: envAcc.projectId,
        refreshToken: envAcc.refreshToken,
        updatedAt: nowIso,
      })
      updated += 1
      await Promise.all([
        kvDeleteSafe(env.ROUTER_KV, getKvTokenKey(existing)),
        kvDeleteSafe(env.ROUTER_KV, getKvCooldownKey(existing)),
      ])
    }
  }

  const saved = await saveManagedAccounts(Array.from(byEmail.values()), env)
  return {
    added,
    updated,
    total: saved.length,
    accounts: saved,
  }
}

export async function listSanitizedAccounts(env: WorkerEnv): Promise<{
  accounts: SanitizedAntigravityAccount[]
  storageSource: ManagedAccountsLoadResult['storageSource']
}> {
  const { accounts, storageSource } = await loadManagedAccounts(env)
  const now = Date.now()

  const cooldownValues = await Promise.all(
    accounts.map((acc) => kvGetSafe(env.ROUTER_KV, getKvCooldownKey(acc)))
  )

  const sanitized: SanitizedAntigravityAccount[] = accounts.map((acc, index) => {
    const rawUntil = cooldownValues[index]
    const parsedUntil = rawUntil ? Number(rawUntil) : 0
    const cooldownUntilMs =
      Number.isFinite(parsedUntil) && parsedUntil > now ? parsedUntil : null

    return {
      email: acc.email,
      maskedEmail: maskEmail(acc.email),
      projectId: acc.projectId,
      priority: acc.priority ?? index + 1,
      isActive: acc.isActive !== false,
      ...(acc.addedAt ? { addedAt: acc.addedAt } : {}),
      ...(acc.updatedAt ? { updatedAt: acc.updatedAt } : {}),
      cooldownUntilMs,
    }
  })

  return {
    accounts: sanitized,
    storageSource,
  }
}
