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

    // 2. Generate gambar dengan Cloudflare AI (opsional)
    if (body.generateGambar) {
      try {
        const gambarUrl = await generateGambarDanSimpan(
          `${artikel.judul}, budidaya lele, fish farming`,
          artikel.slug
        )
        artikel.gambarUrl = gambarUrl
      } catch (imgErr) {
        console.warn('Generate gambar gagal:', imgErr)
        // Tetap lanjut meski gambar gagal
      }
    }

    return NextResponse.json({ success: true, data: artikel })
  } catch (err: unknown) {
    console.error('Generate artikel error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
