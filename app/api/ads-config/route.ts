// app/api/ads-config/route.ts
// Endpoint PUBLIK (tanpa login) untuk ambil konfigurasi iklan yang boleh
// diketahui browser -- Publisher ID AdSense memang selalu tampil apa adanya
// di source HTML tiap situs yang pasang iklan Google, jadi bukan data rahasia.
// JANGAN tambahkan key sensitif (API token, password, dll) ke endpoint ini.

import { NextResponse } from 'next/server'
import { kvGet } from '@/lib/cloudflare/kv'

export const runtime = 'edge'

export async function GET() {
  let publisherId = ''

  try {
    publisherId = (await kvGet('settings:NEXT_PUBLIC_ADSENSE_ID')) || ''
  } catch {
    // abaikan, fallback ke env di bawah
  }

  if (!publisherId) {
    publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID || ''
  }

  // Validasi format dasar supaya tidak ada value aneh yang lolos ke browser
  const valid = /^ca-pub-\d{10,}$/.test(publisherId)

  return NextResponse.json(
    { success: true, data: { publisherId: valid ? publisherId : '' } },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  )
}
