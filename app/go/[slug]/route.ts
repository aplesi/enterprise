// app/go/[slug]/route.ts
// Tracking klik afiliasi + redirect ke URL asli

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // Di production: ambil URL dari Cloudflare KV / D1
  // Sementara: redirect ke halaman produk
  // TODO: simpan data klik ke Cloudflare Analytics

  console.log(`[Afiliasi] Klik: ${slug} dari ${req.headers.get('referer') || 'direct'}`)

  // Simulasi lookup — production: query dari database
  const fallbackUrl = `https://www.aplesi.my.id/produk`

  return NextResponse.redirect(fallbackUrl, { status: 302 })
}
