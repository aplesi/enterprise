// app/api/news/process-images/route.ts
// POST /api/news/process-images — reprocess gambar untuk berita yang belum punya gambar_url
// Dipanggil manual (dengan admin session) atau via cron (dengan CRON_SECRET header)

import { NextRequest, NextResponse } from 'next/server'
import { getBeritaTanpaGambar, updateGambarUrl } from '@/lib/db/berita'
import { generateGambarDanSimpan } from '@/lib/ai/cloudflare-image'
import { buildFallbackImagePrompt } from '@/lib/ai/groq'

export async function GET(req: NextRequest) {
  // Debug: cek berapa berita tanpa gambar
  try {
    const beritaList = await getBeritaTanpaGambar(5)
    return NextResponse.json({
      success: true,
      count: beritaList.length,
      sample: beritaList,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Auth: admin session sudah dicek oleh middleware
  // Atau bisa dipanggil dengan header X-Cron-Secret (untuk cron)

  try {
    // Ambil berita yang belum punya gambar (max 10 per batch)
    const beritaList = await getBeritaTanpaGambar(10)
    console.log(`[ProcessImages] Found ${beritaList.length} berita tanpa gambar`)

    if (beritaList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua berita sudah punya gambar',
        processed: 0,
      })
    }

    let success = 0
    let failed = 0

    for (const berita of beritaList) {
      try {
        let gambarUrl = ''

        // Generate via FLUX-1
        const prompt = buildFallbackImagePrompt(berita.judul, 'berita')
        gambarUrl = await generateGambarDanSimpan(prompt, `news-${berita.ext_id}`)

        if (gambarUrl) {
          await updateGambarUrl(berita.ext_id, gambarUrl)
          success++
          console.log(`[ProcessImages] ✅ ${berita.ext_id}: ${gambarUrl}`)
        } else {
          failed++
        }
      } catch (err) {
        failed++
        console.warn(`[ProcessImages] ❌ ${berita.ext_id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed: ${success} success, ${failed} failed`,
      processed: success,
      failed,
      total: beritaList.length,
    })
  } catch (err) {
    console.error('[ProcessImages] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Gagal memproses gambar berita' },
      { status: 500 }
    )
  }
}
