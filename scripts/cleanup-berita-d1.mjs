// scripts/cleanup-berita-d1.mjs
// Script migrasi & sanitasi data berita di Cloudflare D1.
// 1. Membersihkan tag HTML mentah (<a href...>, <font>, &nbsp;, dll) dari kolom ringkasan.
// 2. Menghapus data duplikat berdasarkan judul yang sama persis/ternormalisasi.

import 'dotenv/config'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN

if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
  console.error('❌ Harap pastikan env CF_ACCOUNT_ID, CF_D1_DATABASE_ID, dan CF_API_TOKEN tersedia.')
  process.exit(1)
}

const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`

async function d1Query(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`D1 Query Error: HTTP ${res.status} - ${errText}`)
  }
  const data = await res.json()
  if (!data.success) {
    throw new Error(`D1 Query Failed: ${JSON.stringify(data.errors)}`)
  }
  return data.result[0]?.results || []
}

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function bersihkanTeks(raw) {
  if (!raw) return ''
  let text = decodeEntities(raw)
  // 1. Strip complete tags
  text = text.replace(/<[^>]+>/g, ' ')
  // 2. Strip unclosed tag e.g. <a href="...
  text = text.replace(/<[^>]*$/g, ' ')
  // 3. Strip any unclosed tag from start if broken e.g. <font color=...
  text = text.replace(/^[^<]*>/g, ' ')
  // 4. Decode entities lagi
  text = decodeEntities(text)
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/<[^>]*$/g, ' ')
  // 5. Strip sisa url mentah jika tersisa
  text = text.replace(/https?:\/\/[^\s]+/g, ' ')
  return text.replace(/\s+/g, ' ').trim()
}

function normalisasiJudul(judul) {
  return (judul || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

async function main() {
  console.log('🚀 Memulai audit & pembersihan data tabel `berita` di Cloudflare D1...')

  // --- LANGKAH 1: Sanitasi Ringkasan Kotor ---
  console.log('\n--- 1. Sanitasi Ringkasan HTML ---')
  const dirtyRows = await d1Query(
    `SELECT id, judul, ringkasan FROM berita WHERE ringkasan LIKE '%<%' OR ringkasan LIKE '%&lt;%' OR ringkasan LIKE '%&nbsp;%'`
  )
  console.log(`📊 Ditemukan ${dirtyRows.length} baris dengan ringkasan kotor.`)

  let cleanedCount = 0
  for (const row of dirtyRows) {
    const cleanRingkasan = bersihkanTeks(row.ringkasan) || row.judul
    await d1Query(`UPDATE berita SET ringkasan = ? WHERE id = ?`, [cleanRingkasan, row.id])
    cleanedCount++
    if (cleanedCount % 50 === 0 || cleanedCount === dirtyRows.length) {
      console.log(`   ✅ Dibersihkan: ${cleanedCount}/${dirtyRows.length}`)
    }
  }

  // --- LANGKAH 2: Hapus Duplikasi Berita ---
  console.log('\n--- 2. Deteksi & Hapus Duplikasi Berita ---')
  const allRows = await d1Query(
    `SELECT id, judul, gambar_url, slug, tanggal, created_at FROM berita ORDER BY id DESC`
  )
  console.log(`📊 Total berita terdaftar: ${allRows.length}`)

  const mapNorm = new Map()
  const idToDelete = []

  for (const row of allRows) {
    const norm = normalisasiJudul(row.judul)
    if (!norm) continue

    if (mapNorm.has(norm)) {
      const existing = mapNorm.get(norm)
      // Pertahankan yang memiliki gambar_url atau slug, atau yang paling baru
      if (!existing.gambar_url && row.gambar_url) {
        idToDelete.push(existing.id)
        mapNorm.set(norm, row)
      } else if (!existing.slug && row.slug) {
        idToDelete.push(existing.id)
        mapNorm.set(norm, row)
      } else {
        idToDelete.push(row.id)
      }
    } else {
      mapNorm.set(norm, row)
    }
  }

  console.log(`🗑️ Ditemukan ${idToDelete.length} baris duplikat yang akan dihapus.`)

  // Hapus per batch 50 ID
  let deletedCount = 0
  const BATCH_SIZE = 50
  for (let i = 0; i < idToDelete.length; i += BATCH_SIZE) {
    const chunk = idToDelete.slice(i, i + BATCH_SIZE)
    const placeholders = chunk.map(() => '?').join(',')
    await d1Query(`DELETE FROM berita WHERE id IN (${placeholders})`, chunk)
    deletedCount += chunk.length
    console.log(`   🗑️ Dihapus: ${deletedCount}/${idToDelete.length}`)
  }

  // --- LANGKAH 3: Verifikasi Hasil Akhir ---
  console.log('\n--- 3. Verifikasi Akhir ---')
  const remainingDirty = await d1Query(
    `SELECT COUNT(*) as c FROM berita WHERE ringkasan LIKE '%<a %' OR ringkasan LIKE '%<font%' OR ringkasan LIKE '%&lt;%'`
  )
  const remainingTotal = await d1Query(`SELECT COUNT(*) as total FROM berita`)

  console.log(`✨ Status Database D1 Sekarang:`)
  console.log(`   - Total Berita Bersih: ${remainingTotal[0]?.total || 0}`)
  console.log(`   - Sisa Baris Kotor: ${remainingDirty[0]?.c || 0}`)
  console.log('🎉 Pembersihan database D1 selesai dengan sukses!')
}

main().catch((err) => {
  console.error('❌ Gagal menjalankan pembersihan D1:', err)
  process.exit(1)
})
