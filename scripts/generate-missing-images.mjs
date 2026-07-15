#!/usr/bin/env node
// scripts/generate-missing-images.mjs
// Generate AI images for articles that still use og-default.png
// Usage: node scripts/generate-missing-images.mjs

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, basename } from 'path'

// Load .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'aplesi'
const GITHUB_REPO = process.env.GITHUB_REPO || 'enterprise'
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'

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
  const data = await res.json()
  if (!data.success) console.error('  ⚠ D1 errors:', JSON.stringify(data.errors))
  return data
}

// Build image prompt based on article topic
function buildImagePrompt(judul, kategori) {
  const base = 'Professional aquaculture photography, Indonesian fish farming scene'
  const topicMap = {
    'bioflok': 'biofloc system with green water and aeration in concrete pond, catfish swimming',
    'bioflock': 'biofloc system with green water and aeration in concrete pond, catfish swimming',
    'nila': 'tilapia fish in clear pond, aquaculture farm, tropical setting',
    'lele': 'catfish (clarias) in aquaculture pond, close-up, Indonesian fish farm',
    'pemijahan': 'fish breeding and spawning process, hatchery facility, fish eggs',
    'penyakit': 'fish health examination, veterinarian checking fish, disease treatment',
    'white spot': 'white spot disease on fish, close-up of fish skin with white spots, treatment',
    'pakan': 'fish feeding process, fish pellets and alternative feed, aquaculture nutrition',
    'gizi': 'fresh catfish fillet on plate, nutrition facts, healthy seafood meal',
    'probiotik': 'probiotic culture preparation for aquaculture, laboratory bottles, bacterial culture',
    'cacing sutra': 'tubifex worms for fish feed, aquaculture live feed preparation',
    'insang': 'fish gills examination, healthy vs diseased gills, water quality testing',
    'pertumbuhan': 'fish growth stages comparison, size chart, aquaculture growth monitoring',
    'sangkuriang': 'sangkuriang catfish breed, premium quality catfish, Indonesian aquaculture',
    'sukhoi': 'large catfish broodstock, premium catfish breed, fish breeding facility',
    'kolam terpal': 'tarpaulin pond for catfish farming, backyard aquaculture, Indonesian village',
    'asean': 'ASEAN aquaculture certification, professional fish farming industry, export quality',
    'ternak': 'catfish farming operation, multiple ponds, Indonesian aquaculture business',
  }

  let specific = base
  const judulLower = judul.toLowerCase()
  for (const [keyword, desc] of Object.entries(topicMap)) {
    if (judulLower.includes(keyword)) {
      specific = desc
      break
    }
  }

  return `${specific}, ${base}, natural lighting, no text, no watermark`
}

async function generateImage(prompt) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${IMAGE_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_inference_steps: 4,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`CF AI error ${response.status}: ${err.slice(0, 200)}`)
  }

  const result = await response.json()
  if (!result.result?.image) {
    throw new Error('No image in response')
  }

  // Decode base64
  const binaryString = atob(result.result.image)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

async function uploadToGithub(fileName, imageBytes, slug) {
  const filePath = `public/images/artikel/${fileName}`
  
  // Encode to base64 in chunks
  const CHUNK_SIZE = 8192
  let binaryString = ''
  for (let i = 0; i < imageBytes.length; i += CHUNK_SIZE) {
    const chunk = imageBytes.subarray(i, Math.min(i + CHUNK_SIZE, imageBytes.length))
    binaryString += String.fromCharCode(...chunk)
  }
  const base64Content = btoa(binaryString)

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'aplesi-enterprise',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `chore: add AI-generated image for ${slug}`,
        content: base64Content,
        branch: 'main',
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub upload failed ${response.status}: ${err.slice(0, 200)}`)
  }

  return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/${filePath}`
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/)
    if (m) fm[m[1]] = m[2]
  }
  return fm
}

async function main() {
  console.log('=== Generate Missing Images ===\n')

  // Find articles with og-default.png
  const artikelDir = join(process.cwd(), 'content', 'artikel')
  const files = readdirSync(artikelDir).filter(f => f.endsWith('.md'))

  const articles = []
  for (const file of files) {
    const content = readFileSync(join(artikelDir, file), 'utf-8')
    const fm = parseFrontmatter(content)
    if (fm.gambar && fm.gambar.includes('og-default')) {
      const slug = basename(file, '.md')
      if (slug === 'hubungi-kami') continue // skip halaman kontak
      articles.push({ file, slug, judul: fm.judul || slug, kategori: fm.kategori || 'Blog', content })
    }
  }

  console.log(`Found ${articles.length} articles needing images\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i]
    const prompt = buildImagePrompt(art.judul, art.kategori)
    console.log(`[${i + 1}/${articles.length}] ${art.slug}`)
    console.log(`  Prompt: ${prompt.slice(0, 80)}...`)

    try {
      // 1. Generate image
      console.log('  Generating image...')
      const imageBytes = await generateImage(prompt)
      console.log(`  Image size: ${(imageBytes.length / 1024).toFixed(1)} KB`)

      // 2. Upload to GitHub
      const fileName = `${art.slug}-${Date.now()}.jpg`
      console.log(`  Uploading to GitHub as ${fileName}...`)
      const imageUrl = await uploadToGithub(fileName, imageBytes, art.slug)
      console.log(`  URL: ${imageUrl}`)

      // 3. Update frontmatter in .md file
      const newContent = art.content.replace(
        /gambar:\s*".*?"/,
        `gambar: "${imageUrl}"`
      )
      writeFileSync(join(artikelDir, art.file), newContent, 'utf-8')
      console.log(`  ✅ Updated frontmatter`)

      // 4. Update D1 database (production reads from D1, not .md files)
      const d1Result = await d1Query(
        'UPDATE artikel SET gambar = ? WHERE slug = ?',
        [imageUrl, art.slug]
      )
      if (d1Result.success) {
        console.log(`  ✅ D1 database updated\n`)
      } else {
        console.log(`  ⚠ D1 update failed (will sync on next deploy)\n`)
      }
      success++

      // Rate limit: wait 2 seconds between requests
      if (i < articles.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`)
      failed++
      // Wait a bit longer on failure
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Success: ${success}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${articles.length}`)
}

main().catch(console.error)
