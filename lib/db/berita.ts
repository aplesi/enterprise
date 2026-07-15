// lib/db/berita.ts
// CRUD berita (hasil scrape RSS) menggunakan Cloudflare D1
//
// Berita disimpan proaktif oleh cron script (bukan on-demand saat pengunjung
// buka /news). Halaman publik tinggal SELECT dari tabel ini.

import { query, queryFirst, insert } from '@/lib/db/d1'
import type { NewsItem } from '@/types'

interface BeritaRow {
  id: number
  ext_id: string
  judul: string
  judul_asli: string
  ringkasan: string
  ringkasan_asli: string
  url_sumber: string
  sumber_id: string
  sumber_nama: string
  asal: string
  tanggal: string
  gambar_url: string
  sudah_jadi_artikel: number
  created_at: string
}

function rowToNewsItem(row: BeritaRow): NewsItem {
  return {
    judul: row.judul,
    ringkasan: row.ringkasan || '',
    url: row.url_sumber,
    sumber: row.sumber_nama || '',
    tanggal: row.tanggal,
    kategori: row.asal === 'indonesia' ? 'nasional' : 'internasional',
    imageUrl: row.gambar_url || '',
  }
}

// --- READ ---

export async function getBeritaTerbaru(limit = 30): Promise<NewsItem[]> {
  const { results } = await query<BeritaRow>(
    `SELECT * FROM berita ORDER BY tanggal DESC LIMIT ?`,
    [limit]
  )
  return results.map(rowToNewsItem)
}

export async function getBeritaByKategori(
  asal: 'indonesia' | 'internasional',
  limit = 20
): Promise<NewsItem[]> {
  const { results } = await query<BeritaRow>(
    `SELECT * FROM berita WHERE asal = ? ORDER BY tanggal DESC LIMIT ?`,
    [asal, limit]
  )
  return results.map(rowToNewsItem)
}

export async function cekBeritaSudahAda(extId: string): Promise<boolean> {
  const row = await queryFirst<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM berita WHERE ext_id = ?`,
    [extId]
  )
  return (row?.cnt || 0) > 0
}

export async function getBeritaBelumJadiArtikel(limit = 5): Promise<BeritaRow[]> {
  const { results } = await query<BeritaRow>(
    `SELECT * FROM berita WHERE sudah_jadi_artikel = 0 ORDER BY tanggal DESC LIMIT ?`,
    [limit]
  )
  return results
}

export async function countBerita(): Promise<number> {
  const row = await queryFirst<{ total: number }>(
    `SELECT COUNT(*) as total FROM berita`
  )
  return row?.total || 0
}

// --- WRITE ---

export interface InsertBeritaData {
  extId: string
  judul: string
  judulAsli: string
  ringkasan: string
  ringkasanAsli: string
  urlSumber: string
  sumberId: string
  sumberNama: string
  asal: 'indonesia' | 'internasional'
  tanggal: string
  gambarUrl?: string
}

export async function insertBerita(data: InsertBeritaData): Promise<number> {
  return insert(
    `INSERT OR IGNORE INTO berita (ext_id, judul, judul_asli, ringkasan, ringkasan_asli, url_sumber, sumber_id, sumber_nama, asal, tanggal, gambar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.extId,
      data.judul,
      data.judulAsli,
      data.ringkasan,
      data.ringkasanAsli,
      data.urlSumber,
      data.sumberId,
      data.sumberNama,
      data.asal,
      data.tanggal,
      data.gambarUrl || '',
    ]
  )
}

export async function insertBeritaBatch(items: InsertBeritaData[]): Promise<number> {
  let inserted = 0
  for (const item of items) {
    try {
      const id = await insertBerita(item)
      if (id > 0) inserted++
    } catch {
      // INSERT OR IGNORE — duplikat di-skip
    }
  }
  return inserted
}

export async function tandaiSudahJadiArtikel(extId: string): Promise<boolean> {
  const result = await query(
    `UPDATE berita SET sudah_jadi_artikel = 1 WHERE ext_id = ?`,
    [extId]
  )
  return result.success
}

export async function updateGambarUrl(extId: string, gambarUrl: string): Promise<boolean> {
  const result = await query(
    `UPDATE berita SET gambar_url = ? WHERE ext_id = ?`,
    [gambarUrl, extId]
  )
  return result.success
}

export async function hapusBeritaLama(hariKebelakang = 30): Promise<number> {
  const result = await query(
    `DELETE FROM berita WHERE tanggal < datetime('now', ? || ' days')`,
    [`-${hariKebelakang}`]
  )
  return result.meta?.changes || 0
}

/**
 * Ambil berita yang belum punya gambar_url (untuk backfill)
 */
export async function getBeritaTanpaGambar(limit = 10): Promise<Array<{ ext_id: string; judul: string; url_sumber: string }>> {
  const result = await query<{ ext_id: string; judul: string; url_sumber: string }>(
    `SELECT ext_id, judul, url_sumber FROM berita WHERE (gambar_url IS NULL OR gambar_url = '') ORDER BY tanggal DESC LIMIT ?`,
    [limit]
  )
  return result.results || []
}
