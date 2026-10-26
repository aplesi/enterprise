// scripts/render-konten-html.mjs
// Backfill: render konten markdown → HTML untuk semua artikel yang sudah ada di D1
// yang belum punya konten_html.
//
// Jalankan:
//   node scripts/render-konten-html.mjs
//
// Memerlukan env: CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN

import { marked } from 'marked'

function renderMarkdown(markdown) {
  const tokens = marked.lexer(markdown)
  const groupedTokens = []
  let currentGroup = []

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      if (currentGroup.length > 0) groupedTokens.push(currentGroup)
      currentGroup = [token]
    } else {
      currentGroup.push(token)
    }
  }
  if (currentGroup.length > 0) groupedTokens.push(currentGroup)

  let finalHtml = ''
  for (const group of groupedTokens) {
    const firstToken = group[0]
    group.links = tokens.links
    const groupHtml = marked.parser(group)
    
    if (firstToken && firstToken.type === 'heading' && firstToken.depth === 2) {
      const id = firstToken.text.toLowerCase().replace(/[^\w]+/g, '-')
      finalHtml += `<section id="${id}">\n${groupHtml}</section>\n`
    } else {
      finalHtml += groupHtml
    }
  }
  return finalHtml
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN

if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
  console.error('❌ Env vars wajib: CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN')
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
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.result?.[0] || { results: [] }
}

async function main() {
  console.log('🔍 Mengambil artikel yang belum punya konten_html...')

  const { results } = await d1Query(
    'SELECT id, slug, konten FROM artikel WHERE konten_html IS NULL'
  )

  if (!results || results.length === 0) {
    console.log('✅ Semua artikel sudah punya konten_html. Tidak ada yang perlu di-render.')
    return
  }

  console.log(`📝 ${results.length} artikel perlu di-render...\n`)

  let berhasil = 0
  let gagal = 0

  for (const row of results) {
    try {
      const kontenHtml = renderMarkdown(row.konten || '')

      await d1Query(
        'UPDATE artikel SET konten_html = ? WHERE id = ?',
        [kontenHtml, row.id]
      )

      berhasil++
      console.log(`  ✅ [${berhasil}/${results.length}] ${row.slug}`)
    } catch (err) {
      gagal++
      console.error(`  ❌ Gagal render "${row.slug}":`, err.message)
    }
  }

  console.log(`\n🎉 Selesai! Berhasil: ${berhasil}, Gagal: ${gagal}`)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
