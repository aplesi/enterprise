// scripts/import-blogger.mjs
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { XMLParser } from 'fast-xml-parser'
import TurndownService from 'turndown'
import slugify from 'slugify'

const XML_PATH = process.argv[2]
if (!XML_PATH) {
  console.error('❌ Harap sertakan path ke file XML Blogger.')
  console.log('Contoh: node scripts/import-blogger.mjs "/Users/febrinanda/Downloads/Takeout 2/Blogger/Blogs/Aplesi/feed.atom"')
  process.exit(1)
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

// D1 Helper
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID

const D1_URL = CF_D1_DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`
  : null

async function d1Insert(slug, judul, ringkasan, konten, gambarPath, kategori, tags, tanggal) {
  if (!D1_URL) return
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: `INSERT OR IGNORE INTO artikel (slug, judul, ringkasan, konten, gambar, kategori, tags, penulis, tanggal, seo_title, seo_desc, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        slug,
        judul,
        ringkasan,
        konten,
        gambarPath,
        kategori,
        JSON.stringify(tags),
        'Admin',
        tanggal,
        judul, // seo_title
        ringkasan.slice(0, 160), // seo_desc
        'published',
      ],
    }),
  })
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`)
}

async function main() {
  console.log(`📂 Membaca file XML: ${XML_PATH}`)
  const xmlData = await readFile(XML_PATH, 'utf8')

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text"
  })

  console.log('🔄 Parsing XML...')
  const result = parser.parse(xmlData)
  
  if (!result.feed || !result.feed.entry) {
    console.error('❌ Format XML tidak dikenali (bukan Blogger Atom feed).')
    process.exit(1)
  }

  // Handle jika entry cuma 1 (object) atau banyak (array)
  const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry]
  
  // Filter hanya post (bukan page/setting/comment)
  const posts = entries.filter(e => {
    // Cek blogger:type (biasanya "POST")
    if (e['blogger:type'] === 'POST') return true
    
    // Atau cek category dengan scheme kind#post
    let isPost = false
    const categories = Array.isArray(e.category) ? e.category : (e.category ? [e.category] : [])
    for (const cat of categories) {
      if (cat['@_term'] === 'http://schemas.google.com/blogger/2008/kind#post') {
        isPost = true
        break
      }
    }
    return isPost
  })

  console.log(`📝 Ditemukan ${posts.length} artikel. Mulai konversi...`)

  let sukses = 0
  let gagal = 0

  for (const post of posts) {
    try {
      const judulObj = post.title
      const judul = typeof judulObj === 'object' ? judulObj['#text'] : judulObj
      if (!judul || typeof judul !== 'string') continue

      const slug = slugify(judul, { lower: true, strict: true })
      
      const contentObj = post.content
      const htmlContent = typeof contentObj === 'object' ? contentObj['#text'] : contentObj
      if (!htmlContent) continue

      // Ekstrak gambar pertama untuk frontmatter
      let gambarPath = '/images/og-default.png'
      const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/)
      if (imgMatch && imgMatch[1]) {
        gambarPath = imgMatch[1]
      }

      // Convert ke Markdown
      const markdown = turndownService.turndown(htmlContent)
      const ringkasan = markdown.replace(/[#*\[\]()]/g, '').slice(0, 150).replace(/\s+/g, ' ') + '...'

      // Ekstrak kategori/tags
      const tags = []
      const categories = Array.isArray(post.category) ? post.category : (post.category ? [post.category] : [])
      for (const cat of categories) {
        const term = cat['@_term']
        // Abaikan scheme internal blogger
        if (term && !term.includes('schemas.google.com')) {
          tags.push(term)
        }
      }
      const kategoriUtama = tags.length > 0 ? tags[0] : 'Blog'

      const tanggalRaw = post.published
      const tanggal = new Date(tanggalRaw).toISOString().split('T')[0]

      const frontmatter = `---
judul: "${judul.replace(/"/g, '\\"')}"
slug: "${slug}"
ringkasan: "${ringkasan.replace(/"/g, '\\"')}"
gambar: "${gambarPath}"
kategori: "${kategoriUtama}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
penulis: "Admin"
tanggal: "${tanggal}"
status: "published"
seoTitle: "${judul.replace(/"/g, '\\"')}"
seoDesc: "${ringkasan.replace(/"/g, '\\"')}"
---

${markdown}
`
      // Simpan .md
      const artikelDir = join(process.cwd(), 'content', 'artikel')
      await mkdir(artikelDir, { recursive: true })
      await writeFile(join(artikelDir, `${slug}.md`), frontmatter)

      // Simpan ke D1
      if (D1_URL) {
        try {
          await d1Insert(slug, judul, ringkasan, markdown, gambarPath, kategoriUtama, tags, tanggal)
        } catch (d1Err) {
          if (!d1Err.message.includes('UNIQUE constraint failed')) {
            console.warn(`   ⚠️ D1 insert error untuk ${slug}:`, d1Err.message)
          }
        }
      }

      console.log(`✅ Berhasil: ${judul}`)
      sukses++
    } catch (err) {
      console.error(`❌ Gagal:`, err.message)
      gagal++
    }
  }

  console.log(`\n🎉 Proses selesai! ${sukses} berhasil, ${gagal} gagal.`)
}

main().catch(console.error)
