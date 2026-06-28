// app/api/generate/artikel/publish/route.ts
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { simpanArtikelLokal } from '@/lib/db/artikel'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import { generateFrontmatter } from '@/lib/utils'
import type { GenerateArtikelResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { artikel, kategori }: { artikel: GenerateArtikelResponse; kategori: string } =
      await req.json()

    const tanggal = new Date().toISOString().split('T')[0]

    const frontmatter = generateFrontmatter({
      judul: artikel.judul,
      slug: artikel.slug,
      ringkasan: artikel.ringkasan,
      gambar: artikel.gambarUrl || '/images/og-default.png',
      kategori,
      tags: artikel.tags,
      penulis: 'Aplesi AI',
      tanggal,
      status: 'published',
      seoTitle: artikel.seoTitle,
      seoDesc: artikel.seoDesc,
    })

    const kontenLengkap = `${frontmatter}\n\n${artikel.konten}`

    // Simpan lokal (untuk dev & Cloudflare Pages build)
    simpanArtikelLokal(artikel.slug, kontenLengkap)

    // Commit ke GitHub (agar auto-deploy Cloudflare Pages terpicu)
    if (process.env.GITHUB_TOKEN) {
      await simpanArtikelKeGitHub(
        artikel.slug,
        kontenLengkap,
        `feat: tambah artikel "${artikel.judul}"`
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublish',
      url: `/artikel/${artikel.slug}`,
    })
  } catch (err: unknown) {
    console.error('Publish artikel error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Gagal publish' },
      { status: 500 }
    )
  }
}
