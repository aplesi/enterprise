// app/api/news/process-images/route.ts
// POST /api/news/process-images — Dual-Stage pipeline reprocess gambar untuk berita yang belum punya gambar_url
// Stage 1: Fast & Free — Scrape og:image dari situs penerbit asli (didahului Google News/Bing resolve)
// Stage 2: AI Fallback — Cloudflare Workers AI (FLUX-1) jika Stage 1 gagal

import { NextRequest, NextResponse } from 'next/server'
import { getBeritaTanpaGambar, updateGambarUrl, countBeritaTanpaGambar } from '@/lib/db/berita'
import { scrapeOgImage } from '@/lib/news/scraper'
import { generateGambarDanSimpan } from '@/lib/ai/cloudflare-image'
import { buildFallbackImagePrompt } from '@/lib/ai/groq'

export const maxDuration = 60 // 60s timeout for Next.js

export async function GET(req: NextRequest) {
  try {
    const remainingEmpty = await countBeritaTanpaGambar()
    const sample = await getBeritaTanpaGambar(5)
    return NextResponse.json({
      success: true,
      remainingEmpty,
      sample,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const batchSize = 10
    const beritaList = await getBeritaTanpaGambar(batchSize)
    console.log(`[ProcessImages] Mengambil ${beritaList.length} berita tanpa gambar...`)

    if (beritaList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua berita sudah memiliki gambar!',
        processed: 0,
        scrapedCount: 0,
        aiGeneratedCount: 0,
        remainingEmpty: 0,
        total: 0,
      })
    }

    let scrapedCount = 0
    let aiGeneratedCount = 0
    let fallbackCount = 0

    // Jalankan per item dengan timeout per-item agar tidak exceed execution limit
    const results = await Promise.allSettled(
      beritaList.map(async (berita) => {
        let gambarUrl = ''
        let source: 'scraped' | 'ai' | 'fallback' | null = null

        // --- STAGE 1: Fast & Free (Scrape og:image dari situs asli) ---
        try {
          if (berita.url_sumber) {
            const ogImage = await scrapeOgImage(berita.url_sumber)
            if (ogImage && ogImage.startsWith('http')) {
              gambarUrl = ogImage
              source = 'scraped'
            }
          }
        } catch (stage1Err) {
          console.warn(`[ProcessImages] Stage 1 error (${berita.ext_id}):`, stage1Err)
        }

        // --- STAGE 2: AI Fallback (FLUX-1) jika Stage 1 nihil ---
        if (!gambarUrl) {
          try {
            console.log(`[ProcessImages] Stage 2 AI trigger untuk "${berita.judul.slice(0, 30)}..."`)
            const prompt = buildFallbackImagePrompt(berita.judul, 'berita')
            const aiImage = await generateGambarDanSimpan(prompt, `news-${berita.ext_id}`)
            if (aiImage && (aiImage.startsWith('http') || aiImage.startsWith('/'))) {
              gambarUrl = aiImage
              source = aiImage.startsWith('http') ? 'ai' : 'fallback'
            }
          } catch (stage2Err) {
            console.warn(`[ProcessImages] Stage 2 AI error (${berita.ext_id}):`, stage2Err)
          }
        }

        // --- STAGE 3: Permanent Fallback Handler ---
        // Jika Stage 1 dan Stage 2 sama-sama gagal (misal situs asli mati dan AI quota limit),
        // tandai dengan 'fallback:visual' agar baris ini tidak diproses ulang secara tak terhingga (infinite loop).
        // Frontend akan langsung merender container gradient dan icon tema tanpa broken image.
        if (!gambarUrl) {
          console.warn(`[ProcessImages] Permanen fallback untuk (${berita.ext_id}): "${berita.judul.slice(0, 35)}..."`)
          gambarUrl = 'fallback:visual'
          source = 'fallback'
        }

        // Selalu simpan status resolusi ke Cloudflare D1
        await updateGambarUrl(berita.ext_id, gambarUrl)
        return { id: berita.ext_id, source, gambarUrl }
      })
    )

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value) {
        if (res.value.source === 'scraped') scrapedCount++
        else if (res.value.source === 'ai') aiGeneratedCount++
        else if (res.value.source === 'fallback') fallbackCount++
      }
    }

    const processed = scrapedCount + aiGeneratedCount + fallbackCount
    const remainingEmpty = await countBeritaTanpaGambar()

    console.log(
      `[ProcessImages] Selesai batch: ${processed}/${beritaList.length} (Scraped: ${scrapedCount}, AI: ${aiGeneratedCount}, Fallback: ${fallbackCount}, Sisa kosong: ${remainingEmpty})`
    )

    return NextResponse.json({
      success: true,
      processed,
      scrapedCount,
      aiGeneratedCount,
      fallbackCount,
      remainingEmpty,
      total: beritaList.length,
    })
  } catch (err) {
    console.error('[ProcessImages] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Gagal memproses gambar berita', details: String(err) },
      { status: 500 }
    )
  }
}
