// app/api/generate/artikel/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateArtikel } from '@/lib/ai/groq'
import { generateGambarDanSimpan } from '@/lib/ai/cloudflare-image'
import type { GenerateArtikelRequest } from '@/types'



export async function POST(req: NextRequest) {
  try {
    const body: GenerateArtikelRequest = await req.json()

    if (!body.topik?.trim()) {
      return NextResponse.json({ success: false, error: 'Topik wajib diisi' }, { status: 400 })
    }

    // 1. Generate artikel dengan Groq
    const artikel = await generateArtikel(body)

    // 2. Generate gambar dengan Cloudflare AI, pakai imagePrompt spesifik
    // yang dibuat Groq berdasarkan isi artikel (bukan judul/kata generik)
    if (body.generateGambar) {
      try {
        const gambarUrl = await generateGambarDanSimpan(
          artikel.imagePrompt,
          artikel.slug
        )
        artikel.gambarUrl = gambarUrl
      } catch (imgErr) {
        console.warn('Generate gambar gagal:', imgErr)
        // Tetap lanjut meski gambar gagal -- publish route akan pakai
        // fallback og-default.png kalau gambarUrl tetap kosong
      }
    }

    return NextResponse.json({ success: true, data: artikel })
  } catch (err: unknown) {
    console.error('Generate artikel error:', err)

    const errMsg = err instanceof Error ? err.message : String(err)

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
      { success: false, error: errMsg || 'Internal server error' },
      { status: 500 }
    )
  }
}
