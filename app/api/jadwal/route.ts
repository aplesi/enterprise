export const runtime = 'edge';
// app/api/jadwal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'

export async function GET() {
  try {
    const data = await kvGet('aplesi_jadwal')
    if (data) {
      return NextResponse.json({ success: true, data: JSON.parse(data) })
    }
    return NextResponse.json({ success: true, data: [] })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil jadwal' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body expected to be an array of JadwalItem
    await kvSet('aplesi_jadwal', JSON.stringify(body))
    return NextResponse.json({ success: true, message: 'Jadwal berhasil disimpan' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan jadwal' }, { status: 500 })
  }
}
