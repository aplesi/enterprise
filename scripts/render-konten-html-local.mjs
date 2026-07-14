// scripts/render-konten-html-local.mjs
// Backfill konten_html via Wrangler D1 (tanpa perlu CF_API_TOKEN manual)
//
// Cara pakai:
// 1. Ambil semua artikel: npx wrangler d1 execute aplesi-db --remote --command "SELECT id, slug, konten FROM artikel WHERE konten_html IS NULL" --json > /tmp/artikel-kosong.json
// 2. Jalankan: node scripts/render-konten-html-local.mjs
//
// Script ini membaca /tmp/artikel-kosong.json, render markdown→HTML via marked,
// lalu generate SQL UPDATE untuk dijalankan lewat wrangler.

import { readFile, writeFile } from 'fs/promises'
import { marked } from 'marked'

async function main() {
  console.log('📖 Membaca /tmp/artikel-kosong.json...')

  let raw
  try {
    raw = await readFile('/tmp/artikel-kosong.json', 'utf8')
  } catch {
    console.error('❌ File /tmp/artikel-kosong.json tidak ditemukan.')
    console.log('   Jalankan dulu:')
    console.log('   npx wrangler d1 execute aplesi-db --remote --command "SELECT id, slug, konten FROM artikel WHERE konten_html IS NULL" --json > /tmp/artikel-kosong.json')
    process.exit(1)
  }

  const data = JSON.parse(raw)
  const results = data?.[0]?.results || []

  if (results.length === 0) {
    console.log('✅ Semua artikel sudah punya konten_html!')
    return
  }

  console.log(`📝 ${results.length} artikel perlu di-render...\n`)

  // Generate satu file SQL dengan semua UPDATE
  const sqlStatements = []

  for (const row of results) {
    const kontenHtml = await marked(row.konten || '')
    // Escape single quotes untuk SQL
    const escaped = kontenHtml.replace(/'/g, "''")
    sqlStatements.push(`UPDATE artikel SET konten_html = '${escaped}' WHERE id = ${row.id};`)
    console.log(`  ✅ Rendered: ${row.slug}`)
  }

  const sqlFile = '/tmp/backfill-konten-html.sql'
  await writeFile(sqlFile, sqlStatements.join('\n'))

  console.log(`\n📄 SQL file disimpan di: ${sqlFile}`)
  console.log(`\n🚀 Jalankan perintah ini untuk apply:`)
  console.log(`   npx wrangler d1 execute aplesi-db --remote --file=${sqlFile}`)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
