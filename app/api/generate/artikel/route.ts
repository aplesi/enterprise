// app/api/generate/artikel/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateArtikel } from '@/lib/ai/groq'
import { generateGambarDenganFallback } from '@/lib/ai/cloudflare-image'
import {
  createGenerateLog,
  markLogSuccess,
  markLogPartial,
  markLogError,
} from '@/lib/db/generate-log'
import type { GenerateArtikelRequest } from '@/types'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let logId = 0

  try {
    const body: GenerateArtikelRequest = await req.json()

    if (!body.topik?.trim()) {
      return NextResponse.json({ success: false, error: 'Topik wajib diisi' }, { status: 400 })
    }

    // Buat log awal (status: pending)
    try {
      logId = await createGenerateLog({
        topik: body.topik,
        kategori: body.kategori,
        panjang: body.panjang,
        tone: body.tone,
      })
    } catch (logErr) {
      console.warn('Gagal membuat generate log:', logErr)
      // Lanjutkan generate meski log gagal — bukan blocker
    }

    // 1. Generate artikel dengan Groq
    const artikel = await generateArtikel(body)

    // Hitung jumlah kata konten
    const wordCount = artikel.konten ? artikel.konten.split(/\s+/).filter(Boolean).length : 0

    // 2. Generate gambar dengan Cloudflare AI + placeholder fallback
    // generateGambarDenganFallback TIDAK PERNAH throw — selalu return result
    let imageSource = 'none'
    if (body.generateGambar) {
      const imgResult = await generateGambarDenganFallback(
        artikel.imagePrompt,
        artikel.slug,
      )
      artikel.gambarUrl = imgResult.url
      imageSource = imgResult.source
      if (imgResult.source !== 'ai') {
        console.warn(`Image from fallback source: ${imgResult.source}`)
      }
    }

    const durationMs = Date.now() - startTime

    // Update log: success (gambar selalu ada minimal placeholder)
    if (logId > 0) {
      try {
        await markLogSuccess(logId, {
          slug: artikel.slug,
          judul: artikel.judul,
          wordCount,
          hasGambar: !!artikel.gambarUrl,
          durationMs,
        })
      } catch (logErr) {
        console.warn('Gagal update generate log:', logErr)
      }
    }

    return NextResponse.json({ success: true, data: artikel })
  } catch (err: unknown) {
    console.error('Generate artikel error:', err)

    const errMsg = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startTime

    // Update log: error
    if (logId > 0) {
      try {
        const errorStage = errMsg.includes('JSON') || errMsg.includes('Unexpected token')
          ? 'generate'
          : errMsg.includes('GroqPoolExhaustedError') || errMsg.includes('rate limit')
            ? 'generate'
            : 'generate'
        await markLogError(logId, { errorMessage: errMsg, errorStage, durationMs })
      } catch (logErr) {
        console.warn('Gagal update generate log (error):', logErr)
      }
    }

    // Klasifikasi error agar pesan di UI lebih jelas
    if (errMsg.includes('GroqPoolExhaustedError') || errMsg.includes('rate limit')) {
      return NextResponse.json(
        { success: false, error: `Semua API key Groq sedang rate-limited. Tunggu beberapa menit lalu coba lagi. Detail: ${errMsg}` },
        { status: 429 }
      )
    }

    if (errMsg.includes('fetch failed') || errMsg.includes('ECONNREFUSED') || errMsg.includes('ENOTFOUND') || errMsg.includes('UND_ERR_CONNECT_TIMEOUT')) {
      return NextResponse.json(
        { success: false, error: 'Gagal terhubung ke Groq AI. Kemungkinan koneksi internet terputus atau server Groq sedang down. Coba lagi dalam beberapa saat.' },
        { status: 502 }
      )
    }

    if (errMsg.includes('JSON') || errMsg.includes('Unexpected token')) {
      return NextResponse.json(
        { success: false, error: 'Groq AI mengembalikan respons yang tidak valid (bukan JSON). Coba generate ulang.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { success: false, error: errMsg || 'Internal server error', debug: { name: err instanceof Error ? err.name : 'Unknown', stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined } },
      { status: 500 }
    )
  }
}
