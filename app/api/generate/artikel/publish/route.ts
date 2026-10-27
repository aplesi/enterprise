// app/api/generate/artikel/publish/route.ts
// PERBAIKAN: Hapus fs.writeFileSync() — tidak bisa di Cloudflare Pages serverless
// Production: hanya commit ke GitHub → CF Pages auto-rebuild
// Development: tetap bisa simpan lokal via flag IS_DEV

import { NextRequest, NextResponse } from 'next/server'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import { generateFrontmatter } from '@/lib/utils'
import { insertArtikel, generateUniqueSlug } from '@/lib/db/artikel'
import { renderMarkdown } from '@/lib/markdown'
import { getContextualAquacultureFallback } from '@/lib/ai/cloudflare-image'
import { notifySearchEngines } from '@/lib/seo/indexer'
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

    // Pastikan slug terjamin 100% unik di Cloudflare D1
    const finalSlug = await generateUniqueSlug(artikel.slug)

    // Hitung reading time: ~200 kata per menit
    const wordCount = artikel.konten ? artikel.konten.split(/\s+/).filter(Boolean).length : 0
    const waktuBaca = Math.max(1, Math.ceil(wordCount / 200))

    const finalImage = artikel.gambarUrl || getContextualAquacultureFallback(finalSlug)

    const frontmatter = generateFrontmatter({
      judul: artikel.judul,
      slug: finalSlug,
      ringkasan: artikel.ringkasan,
      gambar: finalImage,
      kategori,
      tags: artikel.tags,
      penulis: 'Tim Redaksi APLESI',
      tanggal,
      waktu_baca: waktuBaca,
      status: 'published',
      seoTitle: artikel.seoTitle,
      seoDesc: artikel.seoDesc,
    })

    const kontenLengkap = `${frontmatter}\n\n${artikel.konten}`

    // 1. Simpan ke Cloudflare D1 terlebih dahulu (sehingga artikel LANGSUNG LIVE seketika)
    let d1Success = false
    try {
      // Pre-render markdown → HTML sekali di sini (eliminasi react-markdown CPU di render-time)
      const kontenHtml = renderMarkdown(artikel.konten)

      await insertArtikel({
        slug: finalSlug,
        judul: artikel.judul,
        ringkasan: artikel.ringkasan,
        konten: artikel.konten,
        kontenHtml,
        gambar: finalImage,
        kategori,
        tags: artikel.tags,
        penulis: 'Tim Redaksi APLESI',
        tanggal,
        waktuBaca,
        seoTitle: artikel.seoTitle,
        seoDesc: artikel.seoDesc,
        status: 'published',
      })
      d1Success = true
    } catch (d1err) {
      console.warn('D1 insert gagal:', d1err)
    }

    // 2. Commit ke GitHub (Auto-deploy & Static Backup)
    let githubUrl = ''
    const githubToken = process.env.GITHUB_TOKEN
    if (githubToken) {
      try {
        githubUrl = await simpanArtikelKeGitHub(
          finalSlug,
          kontenLengkap,
          `feat: tambah artikel "${artikel.judul}"`
        )
      } catch (ghErr) {
        console.warn('⚠️ Gagal sinkronisasi ke GitHub repo:', ghErr)
      }
    } else {
      console.warn('ℹ️ GITHUB_TOKEN tidak diset, artikel tersimpan langsung di database D1.')
    }

    if (!d1Success && !githubUrl) {
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan artikel ke D1 database dan GitHub.' },
        { status: 500 }
      )
    }

    // 3. Instant Search Engine Ping (IndexNow, Google Sitemap, Bing, Perplexity)
    const liveArticleUrl = `https://www.aplesi.my.id/artikel/${finalSlug}`
    notifySearchEngines(liveArticleUrl).catch((err) => {
      console.warn('[Indexer] Gagal trigger ping dari admin publish:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublish! Langsung muncul di website.',
      url: `/artikel/${finalSlug}`,
      githubUrl: githubUrl || undefined,
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
