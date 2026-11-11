// scripts/generate-article-cli.ts
// CLI tool untuk membuat dan mempublikasikan artikel APLESI Enterprise
// Mendukung kompresi WebP 16:9, sanitasi SNI/KKP, dan sinkronisasi Cloudflare D1 + GitHub

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

import { writeFile, mkdir } from 'fs/promises'
import { generateArtikel } from '@/lib/ai/groq'
import { generateGambarDenganFallback, getContextualAquacultureFallback } from '@/lib/ai/cloudflare-image'
import { insertArtikel, generateUniqueSlug } from '@/lib/db/artikel'
import { simpanArtikelKeGitHub } from '@/lib/db/github'
import { renderMarkdown } from '@/lib/markdown'
import { generateFrontmatter } from '@/lib/utils'
import { sanitizeLatexMath } from '@/lib/ai/skills/article-writer-skill'
import { truncateAtWordBoundary } from '@/lib/ai/groq'

function parseArgs(): { topik: string; kategori: string; panjang: 'pendek' | 'sedang' | 'panjang'; tone: string } {
  const args = process.argv.slice(2)
  let topik = 'Cara Pembibitan Ikan Nila dari Nol sampai Panen'
  let kategori = 'Pembenihan'
  let panjang: 'pendek' | 'sedang' | 'panjang' = 'panjang'
  let tone = 'informatif'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topik' && args[i + 1]) {
      topik = args[++i]
    } else if (args[i] === '--kategori' && args[i + 1]) {
      kategori = args[++i]
    } else if (args[i] === '--panjang' && args[i + 1]) {
      const val = args[++i].toLowerCase()
      if (val === 'pendek' || val === 'sedang' || val === 'panjang') {
        panjang = val
      }
    } else if (args[i] === '--tone' && args[i + 1]) {
      tone = args[++i]
    }
  }

  return { topik, kategori, panjang, tone }
}

async function main() {
  const { topik, kategori, panjang, tone } = parseArgs()
  console.log('=====================================================')
  console.log(`🚀 [APLESI GENERATOR] Memulai pembuatan artikel:`)
  console.log(`   Topik   : "${topik}"`)
  console.log(`   Kategori: "${kategori}" | Panjang: "${panjang}"`)
  console.log('=====================================================')

  const startTime = Date.now()

  // 1. Generate konten teks via Groq LLaMA 3.3 70B
  console.log('📝 [1/4] Memproses teks via Groq LLaMA 3.3 70B...')
  const rawResult = await generateArtikel({
    topik,
    kategori,
    panjang,
    tone,
  })

  console.log(`✅ [1/4] Teks selesai dalam ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
  console.log(`   Judul    : ${rawResult.judul}`)
  console.log(`   SEO Title: ${rawResult.seoTitle} (${rawResult.seoTitle.length} char)`)
  console.log(`   SEO Desc : ${rawResult.seoDesc} (${rawResult.seoDesc.length} char)`)

  // 2. Tentukan slug unik di Cloudflare D1
  const finalSlug = await generateUniqueSlug(rawResult.slug)
  console.log(`   Unique Slug: ${finalSlug}`)

  // 3. Generate gambar banner 16:9 WebP via Antigravity Image Router
  console.log('🎨 [2/4] Memproses gambar banner 16:9 WebP via Antigravity Router...')
  const imgStart = Date.now()
  const imagePrompt = rawResult.imagePrompt || `Dokumentasi budidaya pembibitan ${topik} di kolam perikanan Indonesia pagi hari`
  const imgResult = await generateGambarDenganFallback(
    imagePrompt,
    finalSlug,
    { judul: rawResult.judul, kategori }
  )
  console.log(`✅ [2/4] Gambar selesai dalam ${((Date.now() - imgStart) / 1000).toFixed(1)}s`)
  console.log(`   Gambar URL: ${imgResult.url} (Source: ${imgResult.source})`)

  // 4. Sanitasi konten & metadata deterministik
  const cleanKonten = sanitizeLatexMath(rawResult.konten)
  const cleanRingkasan = truncateAtWordBoundary(rawResult.ringkasan || '', 160)
  const cleanSeoTitle = truncateAtWordBoundary(rawResult.seoTitle || rawResult.judul, 60)
  const cleanSeoDesc = truncateAtWordBoundary(rawResult.seoDesc || cleanRingkasan, 160)

  const wordCount = cleanKonten ? cleanKonten.split(/\s+/).filter(Boolean).length : 0
  const waktuBaca = Math.max(1, Math.ceil(wordCount / 200))
  const tanggal = new Date().toISOString().split('T')[0]
  const finalImage = imgResult.url || getContextualAquacultureFallback(finalSlug)

  console.log(`📊 [3/4] Statistik Konten: ${wordCount} kata, Reading Time: ~${waktuBaca} menit`)

  const frontmatter = generateFrontmatter({
    judul: rawResult.judul,
    slug: finalSlug,
    ringkasan: cleanRingkasan,
    gambar: finalImage,
    kategori,
    tags: rawResult.tags || [kategori.toLowerCase(), 'budidaya', 'akuakultur'],
    penulis: 'Tim Redaksi APLESI',
    tanggal,
    waktu_baca: waktuBaca,
    status: 'published',
    seoTitle: cleanSeoTitle,
    seoDesc: cleanSeoDesc,
  })

  const kontenLengkap = `${frontmatter}\n\n${cleanKonten}`

  // 5. Publikasikan ke Cloudflare D1
  console.log('💾 [4/4] Menyimpan artikel ke Cloudflare D1...')
  const kontenHtml = renderMarkdown(cleanKonten)
  await insertArtikel({
    slug: finalSlug,
    judul: rawResult.judul,
    ringkasan: cleanRingkasan,
    konten: cleanKonten,
    kontenHtml,
    gambar: finalImage,
    kategori,
    tags: rawResult.tags || [kategori.toLowerCase(), 'budidaya', 'akuakultur'],
    penulis: 'Tim Redaksi APLESI',
    tanggal,
    waktuBaca,
    seoTitle: cleanSeoTitle,
    seoDesc: cleanSeoDesc,
    status: 'published',
  })
  console.log('✅ Sukses tersimpan di Cloudflare D1 (Live seketika)!')

  // Simpan file markdown secara lokal di content/artikel/
  const localFilePath = path.join(process.cwd(), 'content', 'artikel', `${finalSlug}.md`)
  await mkdir(path.dirname(localFilePath), { recursive: true })
  await writeFile(localFilePath, kontenLengkap, 'utf-8')
  console.log(`✅ File markdown lokal tersimpan di: ${localFilePath}`)

  // Commit file markdown ke GitHub repository
  if (process.env.GITHUB_TOKEN) {
    try {
      console.log('📤 Melakukan commit artikel ke GitHub...')
      const ghUrl = await simpanArtikelKeGitHub(
        finalSlug,
        kontenLengkap,
        `feat: tambah artikel "${rawResult.judul}"`
      )
      console.log(`✅ Sukses commit ke GitHub: ${ghUrl}`)
    } catch (ghErr: unknown) {
      console.warn('⚠️ Gagal commit ke GitHub:', ghErr instanceof Error ? ghErr.message : String(ghErr))
    }
  }

  console.log('\n🎉 PUBLIKASI BERHASIL!')
  console.log('=====================================================')
  console.log('Judul       :', rawResult.judul)
  console.log('Slug        :', finalSlug)
  console.log('Kategori    :', kategori)
  console.log('Jumlah Kata :', wordCount)
  console.log('Gambar      :', finalImage)
  console.log('URL Live    : https://www.aplesi.my.id/artikel/' + finalSlug)
  console.log('=====================================================')
}

main().catch((err: unknown) => {
  console.error('❌ Terjadi kesalahan fatal:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
