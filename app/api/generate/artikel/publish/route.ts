// app/api/generate/artikel/publish/route.ts
// PERBAIKAN: Hapus fs.writeFileSync() — tidak bisa di Cloudflare Pages serverless
// Production: hanya commit ke GitHub → CF Pages auto-rebuild
// Development: tetap bisa simpan lokal via flag IS_DEV

import { NextRequest, NextResponse } from 'next/server'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import { generateFrontmatter } from '@/lib/utils'
import { insertArtikel } from '@/lib/db/artikel'
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

    // Simpan juga ke D1 agar artikel LANGSUNG muncul tanpa menunggu rebuild
    try {
      await insertArtikel({
        slug: artikel.slug,
        judul: artikel.judul,
        ringkasan: artikel.ringkasan,
        konten: artikel.konten,
        gambar: artikel.gambarUrl || '/images/og-default.png',
        kategori,
        tags: artikel.tags,
        penulis: 'Tim Redaksi APLESI',
        tanggal,
        seoTitle: artikel.seoTitle,
        seoDesc: artikel.seoDesc,
        status: 'published',
      })
    } catch (d1err) {
      // D1 insert gagal bukan fatal — artikel tetap tersimpan di GitHub
      console.warn('D1 insert gagal (artikel tetap ada di GitHub):', d1err)
    }

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublish! Langsung muncul di website.',
      url: `/artikel/${artikel.slug}`,
      githubUrl,
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
