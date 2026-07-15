// lib/db/generate-log.ts
// CRUD riwayat generate artikel — fondasi observability untuk keputusan retry (P2-A)

import { query, queryFirst, insert } from '@/lib/db/d1'

export interface GenerateLog {
  id: number
  topik: string
  kategori: string
  panjang: string
  tone: string
  status: 'pending' | 'success' | 'error' | 'partial'
  slug: string | null
  judul: string | null
  wordCount: number
  hasGambar: boolean
  errorMessage: string | null
  errorStage: string | null
  durationMs: number
  groqTokens: number
  createdAt: string
  publishedAt: string | null
}

function rowToLog(row: Record<string, unknown>): GenerateLog {
  return {
    id: row.id as number,
    topik: row.topik as string,
    kategori: (row.kategori as string) || 'Budidaya',
    panjang: (row.panjang as string) || 'sedang',
    tone: (row.tone as string) || 'informatif',
    status: (row.status as GenerateLog['status']) || 'pending',
    slug: (row.slug as string) || null,
    judul: (row.judul as string) || null,
    wordCount: (row.word_count as number) || 0,
    hasGambar: (row.has_gambar as number) === 1,
    errorMessage: (row.error_message as string) || null,
    errorStage: (row.error_stage as string) || null,
    durationMs: (row.duration_ms as number) || 0,
    groqTokens: (row.groq_tokens as number) || 0,
    createdAt: (row.created_at as string) || '',
    publishedAt: (row.published_at as string) || null,
  }
}

// --- INSERT ---

/** Buat log baru, kembalikan ID-nya */
export async function createGenerateLog(data: {
  topik: string
  kategori: string
  panjang: string
  tone: string
}): Promise<number> {
  const lastRowId = await insert(
    `INSERT INTO generate_log (topik, kategori, panjang, tone, status) VALUES (?, ?, ?, ?, 'pending')`,
    [data.topik, data.kategori, data.panjang, data.tone]
  )
  return lastRowId
}

/** Update log setelah generate selesai (sukses) */
export async function markLogSuccess(logId: number, data: {
  slug: string
  judul: string
  wordCount: number
  hasGambar: boolean
  durationMs: number
}): Promise<void> {
  await query(
    `UPDATE generate_log SET status = 'success', slug = ?, judul = ?, word_count = ?, has_gambar = ?, duration_ms = ? WHERE id = ?`,
    [data.slug, data.judul, data.wordCount, data.hasGambar ? 1 : 0, data.durationMs, logId]
  )
}

/** Update log setelah publish berhasil */
export async function markLogPublished(logId: number): Promise<void> {
  await query(
    `UPDATE generate_log SET published_at = datetime('now') WHERE id = ?`,
    [logId]
  )
}

/** Update log setelah generate gagal */
export async function markLogError(logId: number, data: {
  errorMessage: string
  errorStage: string
  durationMs: number
}): Promise<void> {
  await query(
    `UPDATE generate_log SET status = 'error', error_message = ?, error_stage = ?, duration_ms = ? WHERE id = ?`,
    [data.errorMessage, data.errorStage, data.durationMs, logId]
  )
}

/** Update log untuk partial success (artikel sukses, gambar gagal) */
export async function markLogPartial(logId: number, data: {
  slug: string
  judul: string
  wordCount: number
  durationMs: number
  gambarError?: string
}): Promise<void> {
  await query(
    `UPDATE generate_log SET status = 'partial', slug = ?, judul = ?, word_count = ?, duration_ms = ?, error_message = ?, error_stage = 'gambar' WHERE id = ?`,
    [data.slug, data.judul, data.wordCount, data.durationMs, data.gambarError || null, logId]
  )
}

// --- READ ---

/** Ambil semua log, terbaru dulu, dengan pagination */
export async function getGenerateLogs(opts: {
  limit?: number
  offset?: number
  status?: string
} = {}): Promise<{ logs: GenerateLog[]; total: number }> {
  const { limit = 20, offset = 0, status } = opts

  let where = '1=1'
  const params: (string | number)[] = []

  if (status) {
    where += ' AND status = ?'
    params.push(status)
  }

  // Hitung total
  const countRow = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM generate_log WHERE ${where}`,
    params
  )
  const total = countRow?.total || 0

  // Ambil data
  params.push(limit, offset)
  const { results } = await query(
    `SELECT * FROM generate_log WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  )

  return { logs: results.map(rowToLog), total }
}

/** Ambil statistik generate (untuk dashboard) */
export async function getGenerateStats(): Promise<{
  total: number
  success: number
  error: number
  partial: number
  avgDurationMs: number
  successRate: number
  topErrors: { message: string; count: number }[]
}> {
  const stats = await queryFirst<{
    total: number
    success: number
    error: number
    partial: number
    avg_duration: number
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
      AVG(CASE WHEN status != 'pending' THEN duration_ms ELSE NULL END) as avg_duration
    FROM generate_log`
  )

  const total = stats?.total || 0
  const success = stats?.success || 0
  const error = stats?.error || 0
  const partial = stats?.partial || 0
  const avgDurationMs = Math.round(stats?.avg_duration || 0)
  const successRate = total > 0 ? Math.round(((success + partial) / total) * 100) : 0

  // Top 5 error messages
  const { results: topErrorRows } = await query<{ message: string; count: number }>(
    `SELECT error_message as message, COUNT(*) as count FROM generate_log WHERE status = 'error' AND error_message IS NOT NULL GROUP BY error_message ORDER BY count DESC LIMIT 5`
  )

  return { total, success, error, partial, avgDurationMs, successRate, topErrors: topErrorRows }
}

/** Ambil log berdasarkan ID */
export async function getGenerateLogById(id: number): Promise<GenerateLog | null> {
  const row = await queryFirst<Record<string, unknown>>(
    `SELECT * FROM generate_log WHERE id = ?`,
    [id]
  )
  return row ? rowToLog(row) : null
}

/** Hapus log lama (>30 hari) — bisa dijadwalkan via cron */
export async function cleanupOldLogs(): Promise<number> {
  const result = await query(
    `DELETE FROM generate_log WHERE created_at < datetime('now', '-30 days')`
  )
  return result.meta?.changes || 0
}
