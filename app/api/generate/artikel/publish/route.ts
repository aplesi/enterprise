export const runtime = 'edge';
// app/api/generate/artikel/publish/route.ts
// PERBAIKAN: Hapus fs.writeFileSync() — tidak bisa di Cloudflare Pages serverless
// Production: hanya commit ke GitHub → CF Pages auto-rebuild
// Development: tetap bisa simpan lokal via flag IS_DEV

import { NextRequest, NextResponse } from 'next/server'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import { generateFrontmatter } from '@/lib/utils'
import type { GenerateArtikelResponse } from '@/types'


export async function POST(req: NextRequest) {
  try {
    const { artikel, kategori }: { artikel: GenerateArtikelResponse; kategori: string } =
      await req.json()

    if (!artikel?.judul || !artikel?.slug || !artikel?.konten) {
      return NextResponse.json(
        { success: false, error: 'Data artikel tidak lengkap' },
        { status: 400 }
      )
    }

    const tanggal = new Date().toISOString().split('T')[0]

    const frontmatter = generateFrontmatter({
      judul: artikel.judul,
      slug: artikel.slug,
      ringkasan: artikel.ringkasan,
      gambar: artikel.gambarUrl || '/images/og-default.png',
      kategori,
      tags: artikel.tags,
      penulis: 'Tim Redaksi APLESI',
      tanggal,
      status: 'published',
      seoTitle: artikel.seoTitle,
      seoDesc: artikel.seoDesc,
    })

    const kontenLengkap = `${frontmatter}\n\n${artikel.konten}`

    // PRODUCTION & DEVELOPMENT: commit ke GitHub
    // Ini men-trigger auto-deploy Cloudflare Pages secara otomatis
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GITHUB_TOKEN belum diset. Tambahkan di environment variables Cloudflare Pages.' 
        },
        { status: 500 }
      )
    }

    const githubUrl = await simpanArtikelKeGitHub(
      artikel.slug,
      kontenLengkap,
      `feat: tambah artikel "${artikel.judul}"`
    )

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublish ke GitHub. Cloudflare Pages sedang rebuild otomatis...',
      url: `/artikel/${artikel.slug}`,
      githubUrl,
      estimasiLive: '1-2 menit (Cloudflare Pages auto-deploy)',
    })

  } catch (err: unknown) {
    console.error('Publish artikel error:', err)
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : 'Gagal publish artikel' 
      },
      { status: 500 }
    )
  }
}
