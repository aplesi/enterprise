// lib/db/artikel.ts
// CRUD artikel menggunakan Cloudflare D1 database
//
// SEBELUM: membaca dari JSON bundle statis (artikel-data.generated.json)
// SESUDAH: query langsung ke D1 — artikel muncul instan tanpa rebuild

import { query, queryFirst, insert } from '@/lib/db/d1'
import type { Artikel } from '@/types'

// Row D1 → Artikel type
function rowToArtikel(row: Record<string, unknown>): Artikel {
  return {
    slug: row.slug as string,
    judul: row.judul as string,
    ringkasan: (row.ringkasan as string) || '',
    konten: (row.konten as string) || '',
    kontenHtml: (row.konten_html as string) || undefined,
    gambar: (row.gambar as string) || '/images/og-default.png',
    kategori: (row.kategori as string) || 'Budidaya',
    tags: safeParseJson<string[]>(row.tags as string, []),
    penulis: (row.penulis as string) || 'Tim Redaksi APLESI',
    tanggal: (row.tanggal as string) || '',
    diperbarui: (row.diperbarui as string) || undefined,
    seoTitle: (row.seo_title as string) || undefined,
    seoDesc: (row.seo_desc as string) || undefined,
    status: (row.status as Artikel['status']) || 'draft',
    jadwalPublish: (row.jadwal_publish as string) || undefined,
    sumberBerita: row.sumber_berita_nama
      ? { nama: row.sumber_berita_nama as string, url: (row.sumber_berita_url as string) || '' }
      : undefined,
    tanggalBerita: (row.tanggal_berita as string) || undefined,
    waktuBaca: (row.waktu_baca as number) || 0,
  }
}

function safeParseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

// --- READ ---

export async function getAllArtikel(): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT * FROM artikel WHERE status = 'published' ORDER BY tanggal DESC`
  )
  return results.map(rowToArtikel)
}

// Kolom ringan untuk halaman listing (TANPA konten — hemat CPU Worker)
const LISTING_COLUMNS = `slug, judul, ringkasan, gambar, kategori, tags, penulis, tanggal, waktu_baca, seo_title, seo_desc, status, sumber_berita_nama, sumber_berita_url, tanggal_berita`

// Query ringan untuk halaman daftar artikel — tanpa konten, dengan pagination SQL
export async function getArtikelListing(opts: {
  kategori?: string
  limit: number
  offset: number
}): Promise<Artikel[]> {
  const params: (string | number)[] = []
  let where = `status = 'published'`

  if (opts.kategori) {
    where += ` AND kategori = ?`
    params.push(opts.kategori)
  }

  params.push(opts.limit, opts.offset)

  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE ${where} ORDER BY tanggal DESC LIMIT ? OFFSET ?`,
    params
  )
  return results.map(rowToArtikel)
}

// Hitung total artikel (dengan optional filter kategori) — untuk pagination
export async function countArtikelFiltered(kategori?: string): Promise<number> {
  if (kategori) {
    const row = await queryFirst<{ total: number }>(
      `SELECT COUNT(*) as total FROM artikel WHERE status = 'published' AND kategori = ?`,
      [kategori]
    )
    return row?.total || 0
  }
  const row = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM artikel WHERE status = 'published'`
  )
  return row?.total || 0
}

export async function getArtikelTerbaru(n = 6): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE status = 'published' ORDER BY tanggal DESC LIMIT ?`,
    [n]
  )
  return results.map(rowToArtikel)
}

export async function getArtikelBySlug(slug: string): Promise<Artikel | undefined> {
  const row = await queryFirst(
    `SELECT * FROM artikel WHERE slug = ?`,
    [slug]
  )
  return row ? rowToArtikel(row) : undefined
}

export async function getArtikelByKategori(kategori: string): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE kategori = ? AND status = 'published' ORDER BY tanggal DESC`,
    [kategori]
  )
  return results.map(rowToArtikel)
}

export async function getArtikelTerkait(kategori: string, excludeSlug: string, limit = 3): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE kategori = ? AND slug != ? AND status = 'published' ORDER BY tanggal DESC LIMIT ?`,
    [kategori, excludeSlug, limit]
  )
  return results.map(rowToArtikel)
}

export async function getArtikelByPenulis(penulis: string): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE penulis = ? AND status = 'published' ORDER BY tanggal DESC`,
    [penulis]
  )
  return results.map(rowToArtikel)
}

export async function getSitemapData(): Promise<Array<{ slug: string; tanggal: string }>> {
  const { results } = await query<{ slug: string; tanggal: string }>(
    `SELECT slug, tanggal FROM artikel WHERE status = 'published' ORDER BY tanggal DESC`
  )
  return results
}

export async function getRssData(): Promise<Artikel[]> {
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE status = 'published' ORDER BY tanggal DESC LIMIT 50`
  )
  return results.map(rowToArtikel)
}

export async function getAllSlugs(): Promise<string[]> {
  const { results } = await query<{ slug: string }>(
    `SELECT slug FROM artikel WHERE status = 'published'`
  )
  return results.map((r) => r.slug)
}

export async function getAllKategori(): Promise<string[]> {
  const { results } = await query<{ kategori: string }>(
    `SELECT DISTINCT kategori FROM artikel WHERE status = 'published' ORDER BY kategori`
  )
  return results.map((r) => r.kategori)
}

export async function searchArtikel(q: string): Promise<Artikel[]> {
  const like = `%${q}%`
  const { results } = await query(
    `SELECT ${LISTING_COLUMNS} FROM artikel WHERE status = 'published' AND (judul LIKE ? OR ringkasan LIKE ? OR tags LIKE ?) ORDER BY tanggal DESC LIMIT 20`,
    [like, like, like]
  )
  return results.map(rowToArtikel)
}

export async function countArtikel(): Promise<number> {
  const row = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM artikel WHERE status = 'published'`
  )
  return row?.total || 0
}

export async function countArtikelByKategori(): Promise<Array<{ kategori: string; jumlah: number }>> {
  const { results } = await query<{ kategori: string; jumlah: number }>(
    `SELECT kategori, COUNT(*) as jumlah FROM artikel WHERE status = 'published' GROUP BY kategori ORDER BY jumlah DESC`
  )
  return results
}

// --- WRITE ---

export interface InsertArtikelData {
  slug: string
  judul: string
  ringkasan: string
  konten: string
  kontenHtml?: string
  gambar?: string
  kategori?: string
  tags?: string[]
  penulis?: string
  tanggal: string
  seoTitle?: string
  seoDesc?: string
  status?: 'draft' | 'terjadwal' | 'published'
  jadwalPublish?: string
  sumberBeritaNama?: string
  sumberBeritaUrl?: string
  tanggalBerita?: string
  waktuBaca?: number
}

export async function insertArtikel(data: InsertArtikelData): Promise<number> {
  const waktuBaca = data.waktuBaca || Math.ceil((data.konten || '').split(/\s+/).length / 200)

  return insert(
    `INSERT INTO artikel (slug, judul, ringkasan, konten, konten_html, gambar, kategori, tags, penulis, tanggal, waktu_baca, seo_title, seo_desc, status, jadwal_publish, sumber_berita_nama, sumber_berita_url, tanggal_berita)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.slug,
      data.judul,
      data.ringkasan,
      data.konten,
      data.kontenHtml || null,
      data.gambar || '/images/og-default.png',
      data.kategori || 'Budidaya',
      JSON.stringify(data.tags || []),
      data.penulis || 'Tim Redaksi APLESI',
      data.tanggal,
      waktuBaca,
      data.seoTitle || null,
      data.seoDesc || null,
      data.status || 'published',
      data.jadwalPublish || null,
      data.sumberBeritaNama || null,
      data.sumberBeritaUrl || null,
      data.tanggalBerita || null,
    ]
  )
}

export async function updateArtikel(
  slug: string,
  data: Partial<InsertArtikelData>
): Promise<boolean> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.judul !== undefined) { fields.push('judul = ?'); values.push(data.judul) }
  if (data.ringkasan !== undefined) { fields.push('ringkasan = ?'); values.push(data.ringkasan) }
  if (data.konten !== undefined) { fields.push('konten = ?'); values.push(data.konten) }
  if (data.kontenHtml !== undefined) { fields.push('konten_html = ?'); values.push(data.kontenHtml) }
  if (data.gambar !== undefined) { fields.push('gambar = ?'); values.push(data.gambar) }
  if (data.kategori !== undefined) { fields.push('kategori = ?'); values.push(data.kategori) }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)) }
  if (data.penulis !== undefined) { fields.push('penulis = ?'); values.push(data.penulis) }
  if (data.tanggal !== undefined) { fields.push('tanggal = ?'); values.push(data.tanggal) }
  if (data.seoTitle !== undefined) { fields.push('seo_title = ?'); values.push(data.seoTitle) }
  if (data.seoDesc !== undefined) { fields.push('seo_desc = ?'); values.push(data.seoDesc) }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status) }

  if (fields.length === 0) return false

  fields.push("updated_at = datetime('now')")
  values.push(slug)

  const result = await query(
    `UPDATE artikel SET ${fields.join(', ')} WHERE slug = ?`,
    values
  )
  return result.success
}

export async function deleteArtikel(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM artikel WHERE slug = ?', [slug])
  return result.success
}
