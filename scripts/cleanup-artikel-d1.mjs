// scripts/cleanup-artikel-d1.mjs
// Menghapus artikel placeholder, terlalu pendek (<400 kata), dan duplikat dari tabel `artikel` di Cloudflare D1

import fs from 'fs'
import path from 'path'

// Load .env.local atau .dev.vars secara manual tanpa perlu package tambahan
function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.dev.vars')

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID || 'b7deb98b-151f-4d82-82c8-2eaa61c8cd7b'

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('❌ Pastikan CF_ACCOUNT_ID dan CF_API_TOKEN tersedia di .env.local atau .dev.vars')
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
    throw new Error(`D1 HTTP ${res.status}: ${errText}`)
  }
  const data = await res.json()
  if (!data.success) {
    throw new Error(`D1 Query Failed: ${JSON.stringify(data.errors)}`)
  }
  return data.result[0]
}

const SLUGS_TO_DELETE = [
  // Placeholder fiktif
  'hubungi-kami',
  // Artikel terlalu pendek (<350 kata)
  'manajemen-kualitas-air-kolam-lele',
  'cara-budidaya-lele-dumbo-untuk-pemula',
  'bisnis-lele-asap-peluang-usaha-menjanjikan',
  'pakan-lele-organik-hemat-biaya',
  'suplemen-probiotik-untuk-pertumbuhan-lele',
  'kolam-terpal-vs-kolam-tanah-untuk-lele',
  'mengatasi-penyakit-white-spot-pada-lele',
  'panen-lele-yang-menguntungkan',
  // Artikel duplikat topik kembar
  'bioflock',
  'sytem-bioflock',
  'budidaya-lele-dengan-system-bioflock',
  'probitok-biofloc',
  'probiotik-bioflok-untuk-lele',
  'cara-mengatasi-kolam-lele-berbusa',
  'akibat-dari-pemberian-pakan-lele-yang-berlebih',
  'penkondisian-kolam-beton-yang-baru-untuk-lele',
  'cara-membuat-kolam-menggunakan-terpal',
  'pembuatan-dan-perisapan-kolam-terpal',
  'ikan-lele-masamo',
  'lele-masamo',
  'jual-bibit-lele-masamo',
]

async function main() {
  console.log(`🚀 Memeriksa ${SLUGS_TO_DELETE.length} slug artikel bermasalah di Cloudflare D1...`)

  const placeholders = SLUGS_TO_DELETE.map(() => '?').join(',')
  const beforeCheck = await d1Query(
    `SELECT slug, judul FROM artikel WHERE slug IN (${placeholders})`,
    SLUGS_TO_DELETE
  )

  const foundRows = beforeCheck.results || []
  console.log(`📊 Ditemukan ${foundRows.length} dari ${SLUGS_TO_DELETE.length} artikel tersebut di D1:`)
  for (const r of foundRows) {
    console.log(`   - ${r.slug}: ${r.judul}`)
  }

  if (foundRows.length > 0) {
    const delRes = await d1Query(
      `DELETE FROM artikel WHERE slug IN (${placeholders})`,
      SLUGS_TO_DELETE
    )
    console.log(`🗑️ Berhasil menghapus ${delRes.meta?.changes ?? foundRows.length} baris dari tabel artikel di D1.`)
  } else {
    console.log('ℹ️ Tidak ada baris yang perlu dihapus (sudah bersih).')
  }

  const totalAfter = await d1Query(`SELECT COUNT(*) as total FROM artikel WHERE status = 'published'`)
  console.log(`✨ Total artikel published di Cloudflare D1 sekarang: ${totalAfter.results?.[0]?.total ?? 'N/A'}`)
}

main().catch((err) => {
  console.error('❌ Gagal menjalankan sinkronisasi D1:', err.message)
  process.exit(1)
})
