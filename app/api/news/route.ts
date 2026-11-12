// app/api/news/route.ts
// GET /api/news?kategori=nasional|internasional|semua&limit=20

import { NextRequest, NextResponse } from 'next/server'
import { getBeritaTerbaru, getBeritaByKategori } from '@/lib/db/berita'
import type { NewsItem } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const kategori = searchParams.get('kategori')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10) || 30, 100)

    let data: NewsItem[] = []
    if (kategori === 'nasional') {
      data = await getBeritaByKategori('indonesia', limit)
    } else if (kategori === 'internasional') {
      data = await getBeritaByKategori('internasional', limit)
    } else {
      data = await getBeritaTerbaru(limit)
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: data.length,
        updatedAt: data[0]?.tanggal || new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[api/news] error:', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil berita perikanan' },
      { status: 500 }
    )
  }
}
