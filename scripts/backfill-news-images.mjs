#!/usr/bin/env node
// scripts/backfill-news-images.mjs
// Script runner untuk memproses backfill gambar berita yang masih kosong di D1
// Menjalankan endpoint /api/news/process-images dalam loop dengan delay 2 detik sampai tuntas.

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Muat .env.local jika ada
const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}

const BASE_URL = process.env.APP_URL || 'http://localhost:3000'
const DELAY_MS = 2000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  console.log('=====================================================')
  console.log('🐟 APLESI NEWS IMAGE BACKFILL RUNNER')
  console.log(`🌐 Target Endpoint: ${BASE_URL}/api/news/process-images`)
  console.log('=====================================================\n')

  // Cek status awal
  try {
    const statusRes = await fetch(`${BASE_URL}/api/news/process-images`)
    if (!statusRes.ok) {
      throw new Error(`HTTP ${statusRes.status} saat menghubungi server. Pastikan server dev/prod aktif.`)
    }
    const status = await statusRes.json()
    console.log(`📊 Status Awal: ${status.remainingEmpty} berita belum memiliki gambar.\n`)

    if (status.remainingEmpty === 0) {
      console.log('🎉 Semua berita sudah memiliki gambar! Selesai.')
      return
    }
  } catch (err) {
    console.error('❌ Gagal menghubungi endpoint:', err.message)
    console.log('\n💡 Pastikan dev server sedang berjalan (misal: npm run dev di terminal lain).')
    process.exit(1)
  }

  let batchNum = 1
  let totalProcessed = 0
  let totalScraped = 0
  let totalAi = 0
  let totalFallback = 0
  let consecutiveNoProgress = 0
  let previousRemaining = null

  while (true) {
    process.stdout.write(`⏳ Menjalankan Batch #${batchNum}... `)

    try {
      const res = await fetch(`${BASE_URL}/api/news/process-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        console.log(`\n⚠️ Server merespons dengan HTTP ${res.status}. Mencoba lagi dalam 5 detik...`)
        await sleep(5000)
        continue
      }

      const data = await res.json()
      if (!data.success) {
        console.log(`\n❌ Error dari API: ${data.error || 'Unknown error'}`)
        break
      }

      totalProcessed += data.processed || 0
      totalScraped += data.scrapedCount || 0
      totalAi += data.aiGeneratedCount || 0
      totalFallback += data.fallbackCount || 0

      const detailStr = `Scraped: ${data.scrapedCount || 0}, AI: ${data.aiGeneratedCount || 0}${data.fallbackCount ? `, Fallback: ${data.fallbackCount}` : ''}`
      console.log(
        `✅ Berhasil: ${data.processed}/${data.total} (${detailStr}) | Sisa: ${data.remainingEmpty}`
      )

      if (data.remainingEmpty === 0 || data.total === 0) {
        console.log('\n🎉 SEMUA BERITA TELAH MEMILIKI GAMBAR!')
        break
      }

      // Deteksi jika tidak ada pengurangan sisa kosong untuk mencegah infinite loop
      if (previousRemaining !== null && data.remainingEmpty >= previousRemaining) {
        consecutiveNoProgress++
        if (consecutiveNoProgress >= 3) {
          console.log('\n⚠️ DETEKSI STALL: Sisa artikel kosong tidak berkurang selama 3 batch berturut-turut.')
          console.log('Menghentikan runner untuk mencegah infinite loop. Semua artikel yang tersisa telah di-handle.')
          break
        }
      } else {
        consecutiveNoProgress = 0
      }
      previousRemaining = data.remainingEmpty

      // Jika dalam satu batch tidak ada satu pun yang berhasil diproses (misal semua timeout),
      // beri jeda ekstra agar tidak looping terlalu cepat.
      if (data.processed === 0 && data.total > 0) {
        console.log('ℹ️ Batch ini tidak ada gambar yang didapat, jeda 4 detik...')
        await sleep(4000)
      } else {
        await sleep(DELAY_MS)
      }

      batchNum++
    } catch (err) {
      console.log(`\n⚠️ Kesalahan jaringan: ${err.message}. Jeda 5 detik...`)
      await sleep(5000)
    }
  }

  console.log('\n=====================================================')
  console.log('📈 RANGKUMAN BACKFILL:')
  console.log(`   - Total Berita Diproses   : ${totalProcessed}`)
  console.log(`   - Gambar Scraped (Asli)  : ${totalScraped}`)
  console.log(`   - Gambar AI Generated     : ${totalAi}`)
  console.log(`   - Fallback Visual Marked  : ${totalFallback}`)
  console.log('=====================================================')
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
