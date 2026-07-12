// app/api/news/route.ts
// GET /api/news?kategori=nasional|internasional|semua&limit=20&refresh=1

import { NextRequest, NextResponse } from 'next/server'
import { getBeritaPerikanan } from '@/lib/news/scraper'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('refresh') === '1'
    const kategori = searchParams.get('kategori')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10) || 30, 100)

    const { data, fromCache, updatedAt } = await getBeritaPerikanan({ forceRefresh })

    const filtered =
      kategori && kategori !== 'semua'
        ? data.filter((n) => n.kategori === kategori)
        : data

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, limit),
      meta: {
        total: filtered.length,
        totalNasional: data.filter((n) => n.kategori === 'nasional').length,
        totalInternasional: data.filter((n) => n.kategori === 'internasional').length,
        fromCache,
        updatedAt,
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
