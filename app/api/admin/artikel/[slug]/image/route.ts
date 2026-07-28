import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { generateGambarDanSimpan } from '@/lib/ai/cloudflare-image'
import { getArtikelBySlug, updateArtikel } from '@/lib/db/artikel'
import { simpanArtikelKeGitHub } from '@/lib/db/github'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt gambar tidak boleh kosong' }, { status: 400 })
    }

    // 1. Dapatkan data artikel saat ini (untuk validasi)
    const artikel = await getArtikelBySlug(slug)
    if (!artikel) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // 2. Generate gambar via Cloudflare AI & simpan otomatis
    // generateGambarDanSimpan sudah melakukan upload ke GitHub untuk gambar tersebut.
    const gambarUrl = await generateGambarDanSimpan(prompt, slug)
    if (!gambarUrl) {
      throw new Error('Gagal melakukan generate gambar')
    }

    // 3. Update database D1
    const dbUpdated = await updateArtikel(slug, { gambar: gambarUrl })
    if (!dbUpdated) {
      throw new Error('Gagal update gambar di database')
    }
    
    // Purge cache agar realtime
    revalidatePath(`/artikel/${slug}`)
    revalidatePath('/artikel')
    revalidatePath('/')

    // 4. Update file Markdown di GitHub Repo
    try {
      const path = `content/artikel/${slug}.md`
      const repoUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`
      
      const existing = await fetch(repoUrl, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.raw',
          'User-Agent': 'aplesi-enterprise'
        }
      })

      if (existing.ok) {
        let mdContent = await existing.text()
        
        // Ganti nilai baris gambar: "..."
        mdContent = mdContent.replace(/^gambar:\s*".*"$/m, `gambar: "${gambarUrl}"`)
        
        await simpanArtikelKeGitHub(slug, mdContent, `update: ubah gambar artikel ${slug} via AI`)
      }
    } catch (e) {
      console.error('Gagal update Markdown di GitHub:', e)
      // Kita tidak melempar error agar response tetap sukses (karena DB dan Gambar sudah berhasil)
    }

    return NextResponse.json({ 
      success: true, 
      data: { gambarUrl } 
    })

  } catch (error: any) {
    console.error('Error in API /api/admin/artikel/[slug]/image:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal server' }, 
      { status: 500 }
    )
  }
}
