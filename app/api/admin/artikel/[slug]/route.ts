import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getArtikelBySlug, updateArtikel } from '@/lib/db/artikel'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import matter from 'gray-matter'

// GET: Ambil detail artikel untuk form edit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const artikel = await getArtikelBySlug(slug)
    
    if (!artikel) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: artikel })
  } catch (error: unknown) {
    console.error('Error fetching article details:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: Simpan perubahan artikel (Update D1 & GitHub Markdown)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    
    // 1. Ambil artikel lama dari D1 untuk memastikan file masih ada
    const artikelLama = await getArtikelBySlug(slug)
    if (!artikelLama) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // 2. Ambil konten Markdown asli dari GitHub untuk diupdate frontmatternya
    const path = `content/artikel/${slug}.md`
    const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`
    
    const existing = await fetch(repoUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'aplesi-enterprise'
      }
    })

    if (!existing.ok) {
      return NextResponse.json({ success: false, error: 'Gagal mengambil file Markdown dari GitHub' }, { status: 500 })
    }

    const mdContentLama = await existing.text()
    
    // 3. Parsing file md lama dengan gray-matter
    const parsed = matter(mdContentLama)
    
    // 4. Update frontmatter dengan data baru dari form
    const newData = { ...parsed.data }
    if (body.judul !== undefined) newData.judul = body.judul
    if (body.ringkasan !== undefined) newData.ringkasan = body.ringkasan
    if (body.kategori !== undefined) newData.kategori = body.kategori
    if (body.tags !== undefined) {
      // Tags dikirim sebagai string array
      newData.tags = Array.isArray(body.tags) ? body.tags : [body.tags]
    }
    if (body.seoTitle !== undefined) newData.seoTitle = body.seoTitle
    if (body.seoDesc !== undefined) newData.seoDesc = body.seoDesc
    if (body.status !== undefined) newData.status = body.status
    
    // Pastikan slug tidak berubah
    newData.slug = slug

    // 5. Update konten
    const newKonten = body.konten !== undefined ? body.konten : parsed.content

    // 6. Generate file Markdown baru
    const newMarkdown = matter.stringify(newKonten, newData)

    // 7. Simpan ke GitHub
    await simpanArtikelKeGitHub(slug, newMarkdown, `update: edit artikel ${slug} via CMS admin`)

    // 8. Update database D1
    const updateData = {
      judul: body.judul,
      ringkasan: body.ringkasan,
      kategori: body.kategori,
      tags: newData.tags,
      seoTitle: body.seoTitle,
      seoDesc: body.seoDesc,
      status: body.status,
      konten: newKonten
    }
    
    // Hapus field yang undefined agar tidak error
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    await updateArtikel(slug, updateData)

    // 9. Revalidate (Purge Cache) agar website update secara real-time tanpa menunggu build!
    revalidatePath(`/artikel/${slug}`)
    revalidatePath('/artikel')
    revalidatePath('/')

    return NextResponse.json({ success: true, message: 'Artikel berhasil diperbarui' })
  } catch (error: unknown) {
    console.error('Error updating article:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Gagal memperbarui artikel' 
    }, { status: 500 })
  }
}
