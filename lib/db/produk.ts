// lib/db/produk.ts
// CRUD produk (afiliasi Shopee dll) menggunakan Cloudflare D1

import { query, queryFirst, insert } from '@/lib/db/d1'
import { slugify } from '@/lib/utils'

export interface ProdukRow {
  id: number
  slug: string
  nama: string
  deskripsi: string | null
  harga: number
  harga_asli: number | null
  gambar: string  // JSON array
  kategori: string
  platform: string
  url_afiliasi: string
  rating: number | null
  terjual: number
  aktif: number
  created_at: string
  updated_at: string
}

export interface ProdukDisplay {
  id: number
  slug: string
  nama: string
  deskripsi: string
  harga: number
  hargaAsli: number | null
  gambar: string[]
  kategori: string
  platform: string
  urlAfiliasi: string
  rating: number | null
  terjual: number
  aktif: boolean
  createdAt: string
}

function safeParseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

function rowToProduk(row: ProdukRow): ProdukDisplay {
  return {
    id: row.id,
    slug: row.slug,
    nama: row.nama,
    deskripsi: row.deskripsi || '',
    harga: row.harga,
    hargaAsli: row.harga_asli,
    gambar: safeParseJson<string[]>(row.gambar, []),
    kategori: row.kategori || 'Lainnya',
    platform: row.platform || 'Shopee',
    urlAfiliasi: row.url_afiliasi,
    rating: row.rating,
    terjual: row.terjual || 0,
    aktif: row.aktif === 1,
    createdAt: row.created_at,
  }
}

// --- READ ---

export async function getAllProduk(): Promise<ProdukDisplay[]> {
  const { results } = await query<ProdukRow>(
    `SELECT * FROM produk WHERE aktif = 1 ORDER BY created_at DESC`
  )
  return results.map(rowToProduk)
}

export async function getAllProdukAdmin(): Promise<ProdukDisplay[]> {
  const { results } = await query<ProdukRow>(
    `SELECT * FROM produk ORDER BY created_at DESC`
  )
  return results.map(rowToProduk)
}

export async function getProdukBySlug(slug: string): Promise<ProdukDisplay | null> {
  const row = await queryFirst<ProdukRow>(
    `SELECT * FROM produk WHERE slug = ?`,
    [slug]
  )
  return row ? rowToProduk(row) : null
}

export async function getProdukByKategori(kategori: string): Promise<ProdukDisplay[]> {
  const { results } = await query<ProdukRow>(
    `SELECT * FROM produk WHERE aktif = 1 AND kategori = ? ORDER BY created_at DESC`,
    [kategori]
  )
  return results.map(rowToProduk)
}

export async function countProduk(): Promise<number> {
  const row = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM produk WHERE aktif = 1`
  )
  return row?.total || 0
}

export async function getKategoriProduk(): Promise<string[]> {
  const { results } = await query<{ kategori: string }>(
    `SELECT DISTINCT kategori FROM produk WHERE aktif = 1 ORDER BY kategori`
  )
  return results.map((r) => r.kategori)
}

// --- WRITE ---

export interface InsertProdukData {
  nama: string
  deskripsi?: string
  harga: number
  hargaAsli?: number
  gambar?: string[]
  kategori?: string
  platform?: string
  urlAfiliasi: string
  rating?: number
  terjual?: number
}

export async function insertProduk(data: InsertProdukData): Promise<number> {
  const slug = slugify(data.nama)
  return insert(
    `INSERT INTO produk (slug, nama, deskripsi, harga, harga_asli, gambar, kategori, platform, url_afiliasi, rating, terjual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug,
      data.nama,
      data.deskripsi || null,
      data.harga,
      data.hargaAsli || null,
      JSON.stringify(data.gambar || []),
      data.kategori || 'Lainnya',
      data.platform || 'Shopee',
      data.urlAfiliasi,
      data.rating || null,
      data.terjual || 0,
    ]
  )
}

export async function updateProduk(
  id: number,
  data: Partial<InsertProdukData> & { aktif?: boolean }
): Promise<boolean> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.nama !== undefined) {
    fields.push('nama = ?', 'slug = ?')
    values.push(data.nama, slugify(data.nama))
  }
  if (data.deskripsi !== undefined) { fields.push('deskripsi = ?'); values.push(data.deskripsi) }
  if (data.harga !== undefined) { fields.push('harga = ?'); values.push(data.harga) }
  if (data.hargaAsli !== undefined) { fields.push('harga_asli = ?'); values.push(data.hargaAsli) }
  if (data.gambar !== undefined) { fields.push('gambar = ?'); values.push(JSON.stringify(data.gambar)) }
  if (data.kategori !== undefined) { fields.push('kategori = ?'); values.push(data.kategori) }
  if (data.platform !== undefined) { fields.push('platform = ?'); values.push(data.platform) }
  if (data.urlAfiliasi !== undefined) { fields.push('url_afiliasi = ?'); values.push(data.urlAfiliasi) }
  if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating) }
  if (data.terjual !== undefined) { fields.push('terjual = ?'); values.push(data.terjual) }
  if (data.aktif !== undefined) { fields.push('aktif = ?'); values.push(data.aktif ? 1 : 0) }

  if (fields.length === 0) return false

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await query(
    `UPDATE produk SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
  return result.success
}

export async function deleteProduk(id: number): Promise<boolean> {
  const result = await query('DELETE FROM produk WHERE id = ?', [id])
  return result.success
}

// --- KLIK TRACKING ---

export async function catatKlikAfiliasi(
  produkId: number | null,
  slug: string,
  ipHash: string,
  userAgent: string,
  referer: string
): Promise<void> {
  await insert(
    `INSERT INTO klik_afiliasi (produk_id, slug, ip_hash, user_agent, referer) VALUES (?, ?, ?, ?, ?)`,
    [produkId, slug, ipHash, userAgent, referer]
  )
}

export async function getKlikCount(slug: string): Promise<number> {
  const row = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM klik_afiliasi WHERE slug = ?`,
    [slug]
  )
  return row?.total || 0
}

export async function getKlikStats(): Promise<Array<{ slug: string; total: number }>> {
  const { results } = await query<{ slug: string; total: number }>(
    `SELECT slug, COUNT(*) as total FROM klik_afiliasi GROUP BY slug ORDER BY total DESC`
  )
  return results
}
