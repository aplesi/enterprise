// app/go/[slug]/route.ts
// Tracking klik afiliasi + redirect ke URL asli

import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'

export const runtime = 'edge'

function slugLink(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const fallbackUrl = `https://www.aplesi.my.id/produk`

  try {
    const data = await kvGet('aplesi_afiliasi')
    if (data) {
      interface LinkAfiliasi {
        nama: string;
        url: string;
        aktif: boolean;
        totalKlik: number;
      }
      const links: LinkAfiliasi[] = JSON.parse(data)
      const linkIndex = links.findIndex((l) => slugLink(l.nama) === slug)
      
      if (linkIndex !== -1) {
        const link = links[linkIndex]
        if (link.aktif) {
          // Increment klik
          links[linkIndex].totalKlik += 1
          await kvSet('aplesi_afiliasi', JSON.stringify(links))
          
          console.log(`[Afiliasi] Klik: ${slug} redirect ke ${link.url}`)
          return NextResponse.redirect(link.url, { status: 302 })
        }
      }
    }
  } catch (err) {
    console.error('[Afiliasi] Gagal tracking:', err)
  }

  console.log(`[Afiliasi] Klik: ${slug} tidak ditemukan atau error, fallback ke produk`)
  return NextResponse.redirect(fallbackUrl, { status: 302 })
}
