// app/api/kategori/tags/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'


export async function GET() {
  try {
    const data = await kvGet('aplesi_tags')
    if (data) {
      return NextResponse.json({ success: true, data: JSON.parse(data) })
    }
    return NextResponse.json({ success: true, data: [] })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await kvSet('aplesi_tags', JSON.stringify(body))
    return NextResponse.json({ success: true, message: 'Tags berhasil disimpan' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan tags' }, { status: 500 })
  }
}
