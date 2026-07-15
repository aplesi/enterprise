// app/api/generate/log/route.ts
// API untuk mengambil riwayat generate artikel (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { getGenerateLogs, getGenerateStats } from '@/lib/db/generate-log'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    // GET /api/generate/log?action=stats — statistik ringkas
    if (action === 'stats') {
      const stats = await getGenerateStats()
      return NextResponse.json({ success: true, data: stats })
    }

    // GET /api/generate/log?limit=20&offset=0&status=success — daftar log
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const status = searchParams.get('status') || undefined

    const data = await getGenerateLogs({ limit, offset, status })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    console.error('Get generate logs error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Gagal mengambil riwayat' },
      { status: 500 }
    )
  }
}
