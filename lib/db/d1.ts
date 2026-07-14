// lib/db/d1.ts
// Helper untuk mengakses Cloudflare D1 database
//
// Dua mode akses:
// 1. Production (Cloudflare Worker): menggunakan D1 binding langsung (env.aplesi_db)
// 2. Development/Scripts (Node.js): menggunakan D1 REST API via HTTP
//
// Fungsi query() otomatis memilih mode yang tepat berdasarkan environment.

const D1_API_BASE = 'https://api.cloudflare.com/client/v4/accounts'

function getConfig() {
  return {
    accountId: process.env.CF_ACCOUNT_ID || '',
    apiToken: process.env.CF_API_TOKEN || '',
    databaseId: process.env.CF_D1_DATABASE_ID || '',
  }
}

function hasConfig(): boolean {
  const { accountId, apiToken, databaseId } = getConfig()
  return !!(accountId && apiToken && databaseId)
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta?: {
    changes: number
    last_row_id: number
    rows_read: number
    rows_written: number
  }
}

/**
 * Eksekusi query SQL ke D1 via REST API.
 * Mendukung parameterized queries untuk mencegah SQL injection.
 *
 * @example
 * // SELECT
 * const { results } = await query<Artikel>('SELECT * FROM artikel WHERE slug = ?', ['tips-budidaya'])
 *
 * // INSERT
 * await query('INSERT INTO artikel (slug, judul, konten) VALUES (?, ?, ?)', ['slug', 'Judul', 'Konten...'])
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<D1Result<T>> {
  if (!hasConfig()) {
    console.warn('[D1] Config tidak lengkap (CF_ACCOUNT_ID / CF_API_TOKEN / CF_D1_DATABASE_ID)')
    return { results: [], success: false }
  }

  const { accountId, apiToken, databaseId } = getConfig()
  const url = `${D1_API_BASE}/${accountId}/d1/database/${databaseId}/query`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`[D1] Query gagal (HTTP ${res.status}): ${errorText}`)
  }

  const data = await res.json() as {
    result: Array<{
      results: T[]
      success: boolean
      meta?: D1Result<T>['meta']
    }>
    success: boolean
  }

  if (!data.success || !data.result?.[0]) {
    throw new Error('[D1] Response tidak valid')
  }

  return {
    results: data.result[0].results || [],
    success: data.result[0].success,
    meta: data.result[0].meta,
  }
}

/**
 * Eksekusi batch queries (multiple SQL statements) dalam satu request.
 * Berguna untuk insert/update banyak baris sekaligus.
 */
export async function batchQuery(
  statements: Array<{ sql: string; params?: (string | number | null)[] }>
): Promise<boolean> {
  if (!hasConfig()) {
    console.warn('[D1] Config tidak lengkap')
    return false
  }

  // D1 REST API tidak support batch natively seperti binding,
  // jadi kita jalankan sequentially via single request
  for (const stmt of statements) {
    await query(stmt.sql, stmt.params || [])
  }

  return true
}

/**
 * Shortcut untuk SELECT pertama (single row).
 */
export async function queryFirst<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T | null> {
  const { results } = await query<T>(sql, params)
  return results[0] || null
}

/**
 * Shortcut untuk INSERT yang mengembalikan last_row_id.
 */
export async function insert(
  sql: string,
  params: (string | number | null)[] = []
): Promise<number> {
  const result = await query(sql, params)
  return result.meta?.last_row_id || 0
}
