// app/go/[slug]/route.ts
// Tracking klik afiliasi + redirect ke URL asli
//
// PENTING soal cara hitung klik: setiap klik ditulis sebagai KEY BARU YANG
// UNIK (klik-log:{slug}:{timestamp}-{random}), BUKAN dengan baca-ubah-tulis
// ulang satu angka counter di dalam array 'aplesi_afiliasi'.
//
// Kenapa: kalau 2 pembaca klik link yang sama nyaris bersamaan, model
// baca-ubah-tulis lama punya race condition -- request A baca totalKlik=10,
// request B juga baca totalKlik=10 (belum sempat lihat tulisan A), lalu
// keduanya sama-sama tulis 11 -- padahal seharusnya jadi 12. Salah satu
// klik hilang.
//
// Dengan tiap klik nulis ke KEY-NYA SENDIRI (bukan baca+ubah value yang
// sama), tidak ada lagi "tulisan saling tabrak" -- setiap klik selalu
// berhasil tercatat sebagai entri terpisah. Total klik dihitung belakangan
// dengan menghitung jumlah key (lihat app/api/afiliasi/route.ts).

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
        nama: string
        url: string
        aktif: boolean
      }
      const links: LinkAfiliasi[] = JSON.parse(data)
      const link = links.find((l) => slugLink(l.nama) === slug)

      if (link && link.aktif) {
        // Catat klik sebagai entri log baru yang unik -- tidak menyentuh
        // data link manapun, jadi tidak ada race condition sama sekali.
        const logKey = `klik-log:${slug}:${Date.now()}-${crypto.randomUUID()}`
        await kvSet(logKey, '1')

        console.log(`[Afiliasi] Klik: ${slug} redirect ke ${link.url}`)
        return NextResponse.redirect(link.url, { status: 302 })
      }
    }
  } catch (err) {
    console.error('[Afiliasi] Gagal tracking:', err)
  }

  console.log(`[Afiliasi] Klik: ${slug} tidak ditemukan atau error, fallback ke produk`)
  return NextResponse.redirect(fallbackUrl, { status: 302 })
}
