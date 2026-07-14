// scripts/migrate-md-to-d1.mjs
// Script one-time: baca semua .md di content/artikel/, parse frontmatter,
// lalu INSERT ke D1 database via REST API.
//
// Jalankan: node scripts/migrate-md-to-d1.mjs

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_D1_DATABASE_ID) {
  console.error('❌ Set CF_ACCOUNT_ID, CF_API_TOKEN, CF_D1_DATABASE_ID di env!')
  process.exit(1)
}

const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`

async function d1Query(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`D1 error (${res.status}): ${err}`)
  }
  return res.json()
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta = {}
  const lines = match[1].split('\n')
  let currentKey = null

  for (const line of lines) {
    // Handle sumberBerita (nested YAML)
    if (line.match(/^\s{2}\w+:/)) {
      if (currentKey === 'sumberBerita') {
        const nestedMatch = line.match(/^\s{2}(\w+):\s*"?(.+?)"?\s*$/)
        if (nestedMatch) {
          if (!meta.sumberBerita) meta.sumberBerita = {}
          meta.sumberBerita[nestedMatch[1]] = nestedMatch[2]
        }
      }
      continue
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (!kvMatch) continue

    const [, key, rawVal] = kvMatch
    currentKey = key

    // Handle arrays: tags: ["tag1", "tag2"]
    if (rawVal.startsWith('[')) {
      try {
        meta[key] = JSON.parse(rawVal)
      } catch {
        meta[key] = rawVal.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
      }
      continue
    }

    // Handle sumberBerita: (nested object start)
    if (key === 'sumberBerita' && !rawVal.trim()) {
      meta.sumberBerita = {}
      continue
    }

    // Clean quoted strings
    meta[key] = rawVal.replace(/^"(.*)"$/, '$1').trim()
  }

  return { meta, body: match[2].trim() }
}

async function main() {
  const dir = join(process.cwd(), 'content', 'artikel')
  let files
  try {
    files = (await readdir(dir)).filter(f => f.endsWith('.md'))
  } catch {
    console.log('⚠️ Folder content/artikel/ tidak ditemukan atau kosong.')
    return
  }

  console.log(`📂 Ditemukan ${files.length} file .md`)

  let sukses = 0
  let skip = 0

  for (const file of files) {
    const content = await readFile(join(dir, file), 'utf8')
    const { meta, body } = parseFrontmatter(content)

    if (!meta.judul || !meta.slug) {
      console.warn(`   ⚠️ Skip ${file}: tidak ada judul/slug di frontmatter`)
      skip++
      continue
    }

    try {
      await d1Query(
        `INSERT OR IGNORE INTO artikel (slug, judul, ringkasan, konten, gambar, kategori, tags, penulis, tanggal, seo_title, seo_desc, status, sumber_berita_nama, sumber_berita_url, tanggal_berita)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          meta.slug,
          meta.judul,
          meta.ringkasan || '',
          body,
          meta.gambar || '/images/og-default.png',
          meta.kategori || 'Budidaya',
          JSON.stringify(meta.tags || []),
          meta.penulis || 'Tim Redaksi APLESI',
          meta.tanggal || new Date().toISOString().split('T')[0],
          meta.seoTitle || null,
          meta.seoDesc || null,
          meta.status || 'published',
          meta.sumberBerita?.nama || null,
          meta.sumberBerita?.url || null,
          meta.tanggalBerita || null,
        ]
      )
      console.log(`   ✅ ${file} → D1`)
      sukses++
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        console.log(`   ⏭️ ${file} sudah ada di D1, skip`)
        skip++
      } else {
        console.error(`   ❌ ${file}:`, err.message)
      }
    }
  }

  console.log(`\n🎉 Migrasi selesai: ${sukses} berhasil, ${skip} di-skip`)
}

main().catch(err => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
