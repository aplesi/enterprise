// scripts/generate-artikel-data.mjs
// Dijalankan sebelum build (prebuild). Membaca semua file .md di content/artikel/
// dan menghasilkan content/artikel-data.generated.json agar lib/db/artikel.ts
// tidak perlu memanggil `fs` saat runtime (wajib untuk kompatibilitas Cloudflare edge).

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const ARTIKEL_DIR = path.join(process.cwd(), 'content', 'artikel')
const OUTPUT_FILE = path.join(process.cwd(), 'content', 'artikel-data.generated.json')

function main() {
  if (!fs.existsSync(ARTIKEL_DIR)) {
    fs.mkdirSync(ARTIKEL_DIR, { recursive: true })
  }

  const files = fs.readdirSync(ARTIKEL_DIR).filter((f) => f.endsWith('.md'))

  const artikelList = files.map((file) => {
    const raw = fs.readFileSync(path.join(ARTIKEL_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    return {
      slug: data.slug || file.replace('.md', ''),
      judul: data.judul || '',
      ringkasan: data.ringkasan || '',
      konten: content,
      gambar: data.gambar || '',
      kategori: data.kategori || 'Umum',
      tags: data.tags || [],
      penulis: data.penulis || 'Tim Redaksi APLESI',
      tanggal: data.tanggal || new Date().toISOString().split('T')[0],
      diperbarui: data.diperbarui || null,
      seoTitle: data.seoTitle || null,
      seoDesc: data.seoDesc || null,
      status: data.status || 'published',
      jadwalPublish: data.jadwalPublish || null,
    }
  })

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(artikelList, null, 2), 'utf-8')
  console.log(`[generate-artikel-data] ${artikelList.length} artikel ditulis ke ${OUTPUT_FILE}`)
}

main()
