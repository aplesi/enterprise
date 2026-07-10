export const runtime = 'edge';
// app/api/afiliasi/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet, kvCountByPrefix } from '@/lib/cloudflare/kv'

interface LinkAfiliasi {
  id: string
  nama: string
  url: string
  platform: string
  kategori: string
  komisiPersen: number
  totalKlik: number
  totalKomisi: number
  aktif: boolean
  createdAt: string
}

function slugLink(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export async function GET() {
  try {
    const data = await kvGet('aplesi_afiliasi')
    if (!data) {
      return NextResponse.json({ success: true, data: [] })
    }

    const links: LinkAfiliasi[] = JSON.parse(data)

    // totalKlik dihitung LIVE dari jumlah log klik (bukan angka yang
    // disimpan di array) -- lihat app/go/[slug]/route.ts untuk kenapa
    // klik dicatat sebagai log terpisah, bukan counter yang diupdate
    // langsung (menghindari race condition kalau 2 klik nyaris bersamaan).
    const linksWithKlik = await Promise.all(
      links.map(async (link) => {
        const totalKlik = await kvCountByPrefix(`klik-log:${slugLink(link.nama)}:`)
        return { ...link, totalKlik }
      })
    )

    return NextResponse.json({ success: true, data: linksWithKlik })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil data afiliasi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await kvSet('aplesi_afiliasi', JSON.stringify(body))
    return NextResponse.json({ success: true, message: 'Data afiliasi berhasil disimpan' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan data afiliasi' }, { status: 500 })
  }
}
