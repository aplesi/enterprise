// app/api/jadwal/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'


export async function GET() {
  try {
    const data = await kvGet('aplesi_autopost')
    if (data) {
      return NextResponse.json({ success: true, data: JSON.parse(data) })
    }
    // Default fallback
    return NextResponse.json({ success: true, data: { aktif: true, jam: '07:00', hari: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil pengaturan autopost' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await kvSet('aplesi_autopost', JSON.stringify(body))
    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan pengaturan autopost' }, { status: 500 })
  }
}
