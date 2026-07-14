// app/go/[slug]/route.ts
// Tracking klik afiliasi + redirect ke URL produk
//
// REFAKTOR: sekarang menggunakan D1 database (tabel produk + klik_afiliasi)
// menggantikan KV yang sebelumnya rentan race condition dan sulit di-query.

import { NextRequest, NextResponse } from 'next/server'
import { getProdukBySlug, catatKlikAfiliasi } from '@/lib/db/produk'
import { createHash } from 'crypto'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + 'aplesi-salt').digest('hex').slice(0, 16)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const fallbackUrl = 'https://www.aplesi.my.id/produk'

  try {
    const produk = await getProdukBySlug(slug)

    if (produk && produk.aktif) {
      // Catat klik ke D1 (non-blocking, tidak menghambat redirect)
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
      const userAgent = req.headers.get('user-agent') || ''
      const referer = req.headers.get('referer') || ''

      // Fire-and-forget: jangan await agar redirect tetap cepat
      catatKlikAfiliasi(produk.id, slug, hashIp(ip), userAgent.slice(0, 200), referer.slice(0, 500))
        .catch((err) => console.error('[Afiliasi] Gagal catat klik:', err))

      return NextResponse.redirect(produk.urlAfiliasi, { status: 302 })
    }
  } catch (err) {
    console.error('[Afiliasi] Error:', err)
  }

  return NextResponse.redirect(fallbackUrl, { status: 302 })
}
