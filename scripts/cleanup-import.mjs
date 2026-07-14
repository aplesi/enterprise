import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// D1 Helper
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID

const D1_URL = CF_D1_DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`
  : null

async function d1Update(slug, ringkasan, seoDesc) {
  if (!D1_URL) return
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: `UPDATE artikel SET ringkasan = ?, seo_desc = ? WHERE slug = ?`,
      params: [ringkasan, seoDesc, slug],
    }),
  })
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`)
}

async function main() {
  const dir = join(process.cwd(), 'content', 'artikel')
  const files = await readdir(dir)
  
  let diperbaiki = 0

  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const filePath = join(dir, file)
    const content = await readFile(filePath, 'utf8')
    
    // Cari ringkasan yang mengandung URL gambar berantakan
    // Format yang salah: ringkasan: " !https://blogger..."
    if (content.includes('!http')) {
      const slug = file.replace('.md', '')
      
      // Bersihkan frontmatter
      const newContent = content.replace(/(ringkasan|seoDesc):\s*"([^"]*!https?:\/\/[^"]*)"/g, (match, field, value) => {
        // Hapus URL yang diawali tanda seru
        const cleaned = value.replace(/!?https?:\/\/[^\s"]+/g, '').trim()
        return `${field}: "${cleaned}"`
      })

      // Jika ada perubahan, simpan file dan update D1
      if (newContent !== content) {
        await writeFile(filePath, newContent)
        
        // Ekstrak ringkasan dan seoDesc baru
        const ringkasanMatch = newContent.match(/ringkasan:\s*"([^"]*)"/)
        const seoDescMatch = newContent.match(/seoDesc:\s*"([^"]*)"/)
        
        const ringkasanBaru = ringkasanMatch ? ringkasanMatch[1] : ''
        const seoDescBaru = seoDescMatch ? seoDescMatch[1] : ''

        try {
          await d1Update(slug, ringkasanBaru, seoDescBaru)
          console.log(`✅ Diperbaiki: ${slug}`)
          diperbaiki++
        } catch (err) {
          console.error(`❌ Gagal update D1 ${slug}:`, err.message)
        }
      }
    }
  }
  console.log(`\n🎉 Selesai! ${diperbaiki} artikel berhasil dibersihkan.`)
}

main().catch(console.error)
