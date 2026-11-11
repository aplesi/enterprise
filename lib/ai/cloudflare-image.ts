// lib/ai/cloudflare-image.ts
// Generate gambar menggunakan Cloudflare Workers AI atau AI Image Router eksternal (9Router dsb.)
// Edge-compatible: tidak menggunakan fs atau path
// Fallback: placeholder image jika Cloudflare AI / Router gagal

import { kvGet } from '@/lib/cloudflare/kv'
import { enhanceImagePromptToRealPhoto, type ImagePromptContext } from '@/lib/ai/skills/image-prompt-skill'
import { optimizeImageForWeb } from '@/lib/image/compressor'

export const DEFAULT_ROUTER_MODEL = 'ag/gemini-3.1-flash-image-16x9'
const CF_FALLBACK_MODEL = '@cf/black-forest-labs/flux-1-schnell'
const REQUEST_TIMEOUT_MS = 30000 // 30 detik per request

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export interface ImageRouterConfig {
  enabled: boolean
  url: string
  key: string
  model: string
}

/**
 * Membaca konfigurasi AI Image Router secara dinamis:
 * Memeriksa KV (settings:IMAGE_ROUTER_*) dengan fallback ke process.env.
 * Pada mode development lokal, LOCAL_IMAGE_ROUTER_URL di .env.local diprioritaskan
 * agar pengujian 9Router lokal tidak menimpa konfigurasi production di Cloudflare KV.
 */
export async function getImageRouterConfig(): Promise<ImageRouterConfig> {
  const localOverrideUrl =
    process.env.NODE_ENV === 'development'
      ? (process.env.LOCAL_IMAGE_ROUTER_URL || '').trim()
      : ''

  try {
    const [kvEnabled, kvUrl, kvKey, kvModel] = await Promise.all([
      kvGet('settings:IMAGE_ROUTER_ENABLED'),
      kvGet('settings:IMAGE_ROUTER_URL'),
      kvGet('settings:IMAGE_ROUTER_KEY'),
      kvGet('settings:IMAGE_ROUTER_MODEL'),
    ])

    const enabled = kvEnabled !== null
      ? (kvEnabled === 'true' || kvEnabled === '1')
      : (process.env.IMAGE_ROUTER_ENABLED === 'true' || process.env.IMAGE_ROUTER_ENABLED === '1')

    const url = (localOverrideUrl || kvUrl || process.env.IMAGE_ROUTER_URL || '').trim()
    const key = (kvKey || process.env.IMAGE_ROUTER_KEY || '').trim()
    const model = (kvModel || process.env.IMAGE_ROUTER_MODEL || DEFAULT_ROUTER_MODEL).trim()

    return { enabled, url, key, model }
  } catch {
    return {
      enabled: process.env.IMAGE_ROUTER_ENABLED === 'true' || process.env.IMAGE_ROUTER_ENABLED === '1',
      url: (localOverrideUrl || process.env.IMAGE_ROUTER_URL || '').trim(),
      key: (process.env.IMAGE_ROUTER_KEY || '').trim(),
      model: (process.env.IMAGE_ROUTER_MODEL || DEFAULT_ROUTER_MODEL).trim(),
    }
  }
}

/**
 * Mendeteksi ekstensi file gambar dari magic bytes buffer
 */
export function detectImageExtension(buffer: ArrayBuffer): 'jpg' | 'png' | 'webp' | 'gif' {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpg'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'webp'
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'gif'
  }
  return 'jpg'
}

/**
 * Mendeteksi MIME type gambar dari magic bytes buffer
 */
export function detectImageMimeType(buffer: ArrayBuffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const ext = detectImageExtension(buffer)
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    default:
      return 'image/jpeg'
  }
}

/**
 * Generate gambar via Image Router eksternal (9Router, Cloudflare Gateway, LiteLLM, dsb.)
 */
export async function generateViaRouter(
  prompt: string,
  routerUrl: string,
  routerKey: string,
  model: string = DEFAULT_ROUTER_MODEL,
  context?: ImagePromptContext
): Promise<ArrayBuffer> {
  let targetUrl = routerUrl.trim().replace(/\/+$/, '')

  // Resolusi alias model (misal: "gemini" -> "ag/gemini-3.1-flash-image-16x9" untuk 9Router)
  let resolvedModel = model.trim()
  if (resolvedModel.toLowerCase() === 'gemini' || resolvedModel.toLowerCase() === 'gemini-image') {
    resolvedModel = DEFAULT_ROUTER_MODEL
  }

  // Resolusi endpoint: jika URL belum mencakup path endpoint gambar
  if (targetUrl.includes('gateway.ai.cloudflare.com')) {
    if (!targetUrl.includes('/workers-ai')) {
      targetUrl = `${targetUrl}/workers-ai`
    }
    if (!targetUrl.includes(resolvedModel) && !targetUrl.includes('@cf/')) {
      targetUrl = `${targetUrl}/${resolvedModel}`
    }
  } else if (!targetUrl.includes('/images/generations') && !targetUrl.includes(resolvedModel) && !targetUrl.includes('@cf/')) {
    if (targetUrl.includes('/workers-ai')) {
      targetUrl = `${targetUrl}/${resolvedModel}`
    } else {
      // Standar OpenAI-compatible router (9Router, LiteLLM, OneAPI)
      targetUrl = `${targetUrl}/images/generations`
    }
  }

  const enhancedPrompt = enhanceImagePromptToRealPhoto(prompt, context)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (routerKey) {
    headers['Authorization'] = `Bearer ${routerKey}`
  }

  // Cloudflare Workers AI endpoint hanya menerima { prompt }, sedangkan OpenAI-compatible menerima opsi lengkap
  const isWorkersAiEndpoint = targetUrl.includes('gateway.ai.cloudflare.com') || targetUrl.includes('/workers-ai')
  const is16x9Model = resolvedModel.includes('16x9')
  const defaultSize = is16x9Model ? '1280x720' : '1024x1024'
  const body = isWorkersAiEndpoint
    ? JSON.stringify({ prompt: enhancedPrompt })
    : JSON.stringify({
        prompt: enhancedPrompt,
        model: resolvedModel,
        response_format: 'b64_json',
        n: 1,
        size: defaultSize,
      })

  let response = await fetchWithTimeout(
    targetUrl,
    {
      method: 'POST',
      headers,
      body,
    },
    REQUEST_TIMEOUT_MS
  )

  // Jika 404 pada /images/generations, coba alternatif path model langsung (Workers AI style)
  if (response.status === 404 && targetUrl.endsWith('/images/generations')) {
    const altUrl = `${routerUrl.trim().replace(/\/+$/, '')}/${model}`
    try {
      const altRes = await fetchWithTimeout(
        altUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: enhancedPrompt }),
        },
        REQUEST_TIMEOUT_MS
      )
      if (altRes.ok) {
        response = altRes
      }
    } catch {
      // Biarkan respons awal untuk pesan error
    }
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Image Router error (${response.status} ${response.statusText}): ${errText.slice(0, 300)}`)
  }

  // Jika router mengembalikan binary image langsung (content-type: image/*)
  const contentType = response.headers.get('content-type') || ''
  if (contentType.startsWith('image/')) {
    const buf = await response.arrayBuffer()
    if (buf.byteLength === 0) {
      throw new Error('Data binary gambar dari router kosong (0 bytes)')
    }
    return buf
  }

  // Parse JSON response
  const result = (await response.json()) as Record<string, unknown>
  let base64Image: string | undefined

  // 1. Format Cloudflare Workers AI: { result: { image: string } }
  if (result.result && typeof result.result === 'object' && 'image' in (result.result as Record<string, unknown>)) {
    base64Image = (result.result as { image?: string }).image
  }
  // 2. Format OpenAI-compatible: { data: [{ b64_json?: string, url?: string }] } atau { data: [ string ] }
  else if (Array.isArray(result.data) && result.data.length > 0) {
    const firstItem = result.data[0]
    if (typeof firstItem === 'string') {
      if (firstItem.startsWith('http://') || firstItem.startsWith('https://')) {
        const imgRes = await fetchWithTimeout(firstItem, {}, REQUEST_TIMEOUT_MS)
        if (!imgRes.ok) throw new Error(`Gagal mengunduh gambar dari URL router: ${imgRes.status}`)
        return await imgRes.arrayBuffer()
      }
      base64Image = firstItem
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      const item = firstItem as { b64_json?: string; url?: string }
      if (item.b64_json) {
        base64Image = item.b64_json
      } else if (item.url) {
        const imgRes = await fetchWithTimeout(item.url, {}, REQUEST_TIMEOUT_MS)
        if (!imgRes.ok) {
          throw new Error(`Gagal mengunduh gambar dari URL OpenAI router: ${imgRes.status}`)
        }
        return await imgRes.arrayBuffer()
      }
    }
  }
  // 3. Format array gambar: { images: [...] } (Automatic1111 / Fal.ai / Together)
  else if (Array.isArray(result.images) && result.images.length > 0) {
    const firstItem = result.images[0]
    if (typeof firstItem === 'string') {
      if (firstItem.startsWith('http://') || firstItem.startsWith('https://')) {
        const imgRes = await fetchWithTimeout(firstItem, {}, REQUEST_TIMEOUT_MS)
        if (!imgRes.ok) throw new Error(`Gagal mengunduh gambar dari URL router: ${imgRes.status}`)
        return await imgRes.arrayBuffer()
      }
      base64Image = firstItem
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      const item = firstItem as { b64_json?: string; url?: string; image?: string }
      if (item.b64_json) base64Image = item.b64_json
      else if (item.image) base64Image = item.image
      else if (item.url) {
        const imgRes = await fetchWithTimeout(item.url, {}, REQUEST_TIMEOUT_MS)
        if (!imgRes.ok) throw new Error(`Gagal mengunduh gambar dari URL router: ${imgRes.status}`)
        return await imgRes.arrayBuffer()
      }
    }
  }
  // 4. Format output array (Replicate): { output: [...] }
  else if (Array.isArray(result.output) && result.output.length > 0) {
    const firstItem = result.output[0]
    if (typeof firstItem === 'string') {
      if (firstItem.startsWith('http://') || firstItem.startsWith('https://')) {
        const imgRes = await fetchWithTimeout(firstItem, {}, REQUEST_TIMEOUT_MS)
        if (!imgRes.ok) throw new Error(`Gagal mengunduh gambar dari URL router: ${imgRes.status}`)
        return await imgRes.arrayBuffer()
      }
      base64Image = firstItem
    }
  }
  // 5. Format langsung: { image: string } atau { b64_json: string }
  else if (typeof result.image === 'string') {
    base64Image = result.image
  } else if (typeof result.b64_json === 'string') {
    base64Image = result.b64_json
  }

  if (!base64Image || typeof base64Image !== 'string') {
    throw new Error(`Format respons router tidak dikenali (tidak ada data gambar): ${JSON.stringify(result).slice(0, 200)}`)
  }

  // Hapus prefix data URL scheme jika ada
  if (base64Image.includes(',')) {
    base64Image = base64Image.split(',')[1]
  }

  // Bersihkan whitespace/newlines
  base64Image = base64Image.replace(/\s+/g, '')
  if (!base64Image) {
    throw new Error('Data gambar base64 dari router kosong')
  }

  const binaryString = atob(base64Image)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  if (bytes.length === 0) {
    throw new Error('Data gambar hasil decode kosong (0 bytes)')
  }

  return bytes.buffer
}

/**
 * Generate gambar langsung via Cloudflare Workers AI (menggunakan CF_ACCOUNT_ID & CF_API_TOKEN)
 */
export async function generateViaCloudflare(
  prompt: string,
  model: string = CF_FALLBACK_MODEL,
  context?: ImagePromptContext
): Promise<ArrayBuffer> {
  let cfAccountId = process.env.CF_ACCOUNT_ID
  let cfApiToken = process.env.CF_API_TOKEN

  try {
    const [kvAcc, kvTok] = await Promise.all([
      kvGet('settings:CF_ACCOUNT_ID'),
      kvGet('settings:CF_API_TOKEN'),
    ])
    if (kvAcc) cfAccountId = kvAcc
    if (kvTok) cfApiToken = kvTok
  } catch {
    // Abaikan jika KV belum siap
  }

  if (!cfAccountId || !cfApiToken) {
    throw new Error('CF_ACCOUNT_ID atau CF_API_TOKEN belum diset di environment / settings KV')
  }

  // Cloudflare Workers AI hanya menerima model berawalan @cf/ atau @hf/
  const cfModel = (model.startsWith('@cf/') || model.startsWith('@hf/')) ? model : CF_FALLBACK_MODEL

  const enhancedPrompt = enhanceImagePromptToRealPhoto(prompt, context)

  const response = await fetchWithTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
      }),
    },
    REQUEST_TIMEOUT_MS
  )

  if (!response.ok) {
    const err = await response.text()
    if (response.status === 429) {
      throw new Error(`Cloudflare AI 429 Quota Exceeded (10,000 neurons daily limit reached): ${err}`)
    }
    throw new Error(`Cloudflare AI error (${response.status} ${response.statusText}): ${err}`)
  }

  const result = (await response.json()) as { result?: { image?: string }; errors?: unknown[] }

  if (!result.result?.image) {
    throw new Error(`Cloudflare AI no image in response: ${JSON.stringify(result.errors || result).slice(0, 200)}`)
  }

  let base64 = result.result.image
  if (base64.includes(',')) {
    base64 = base64.split(',')[1]
  }

  base64 = base64.replace(/\s+/g, '')
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

export async function generateGambar(
  prompt: string,
  overrideModel?: string,
  context?: ImagePromptContext
): Promise<ArrayBuffer> {
  const routerConfig = await getImageRouterConfig()
  const modelToUse = overrideModel || routerConfig.model || DEFAULT_ROUTER_MODEL

  // 1. Coba Image Router jika aktif dan URL terisi
  if (routerConfig.enabled && routerConfig.url) {
    try {
      console.log(`[ImageGen] Mencoba Image Router (${routerConfig.url}, model: ${modelToUse})...`)
      return await generateViaRouter(prompt, routerConfig.url, routerConfig.key, modelToUse, context)
    } catch (routerErr) {
      console.warn(
        '[ImageGen] Router gambar gagal, beralih (fallback) ke direct Cloudflare Workers AI:',
        routerErr instanceof Error ? routerErr.message : String(routerErr)
      )
    }
  }

  // 2. Direct Cloudflare Workers AI (gunakan fallback model Cloudflare jika modelToUse bukan @cf/ model)
  const cfModel = (modelToUse.startsWith('@cf/') || modelToUse.startsWith('@hf/')) ? modelToUse : CF_FALLBACK_MODEL
  console.log(`[ImageGen] Menjalankan direct Cloudflare Workers AI (model: ${cfModel})...`)
  return await generateViaCloudflare(prompt, cfModel, context)
}


/**
 * Dapatkan URL gambar fallback kontekstual berbasis topik/slug saat AI FLUX-1 kuotanya habis.
 * Menghasilkan visual fotografi akuakultur asli dan relevan, bukan sekadar banner generik.
 */
export function getContextualAquacultureFallback(slug: string): string {
  const s = slug.toLowerCase()

  // 1. Commodity-aware check
  if (s.includes('vaname') || s.includes('vannamei') || s.includes('udang') || s.includes('tambak')) {
    return '/images/fallbacks/biofloc-pond.jpg'
  }
  if (s.includes('lobster') || s.includes('crayfish') || s.includes('kepiting') || s.includes('crab')) {
    return '/images/fallbacks/biofloc-pond.jpg'
  }
  if (s.includes('lele') && (s.includes('indukan') || s.includes('pembenihan') || s.includes('benih') || s.includes('gonad') || s.includes('pemijahan'))) {
    return '/images/fallbacks/catfish-breeding.jpg'
  }

  // 2. Topical categories
  if (s.includes('pakan') || s.includes('nutrisi') || s.includes('pelet') || s.includes('maggot') || s.includes('feeding')) {
    return '/images/fallbacks/pond-feeding.jpg'
  }
  if (s.includes('pembenihan') || s.includes('bibit') || s.includes('larva') || s.includes('indukan') || s.includes('gonad') || s.includes('pemijahan') || s.includes('telur')) {
    return '/images/fallbacks/catfish-breeding.jpg'
  }
  if (s.includes('penyakit') || s.includes('kesehatan') || s.includes('jamur') || s.includes('air') || s.includes('probiotik') || s.includes('bakteri') || s.includes('moncong') || s.includes('strepto')) {
    return '/images/fallbacks/water-testing.jpg'
  }
  if (s.includes('panen') || s.includes('bisnis') || s.includes('pasar') || s.includes('asap') || s.includes('jual') || s.includes('bep') || s.includes('harga') || s.includes('grading')) {
    return '/images/fallbacks/catfish-harvest.jpg'
  }
  return '/images/fallbacks/biofloc-pond.jpg'
}

/**
 * Generate gambar dengan fallback ke placeholder
 * TIDAK PERNAH THROW — selalu return result
 * Returns: { url: string, source: 'ai' | 'placeholder' }
 */
export async function generateGambarDenganFallback(
  prompt: string,
  slug: string,
  context?: ImagePromptContext
): Promise<{ url: string; source: 'ai' | 'placeholder' }> {
  // 1. Try AI image generation (router or Cloudflare AI, with timeout)
  try {
    console.log('[ImageGen] Starting image generation...')
    const arrayBuffer = await generateGambar(prompt, undefined, context)
    console.log(`[ImageGen] AI image success, raw size: ${arrayBuffer.byteLength} bytes`)

    // Optimasi kompresi WebP (1200x675 max / 16:9) via Sharp
    const opt = await optimizeImageForWeb(arrayBuffer)
    console.log(
      `[ImageGen] Optimized: ${(opt.sizeBefore / 1024).toFixed(1)} KB -> ${(opt.sizeAfter / 1024).toFixed(1)} KB (-${opt.savingsPercent}%) [${opt.ext}]`
    )

    // Save image to GitHub repo (public/images/artikel/)
    const fileName = `${slug}-${Date.now()}.${opt.ext}`
    const filePath = `public/images/artikel/${fileName}`
    
    console.log(`[ImageGen] Saving to GitHub: ${filePath}...`)
    
    // Encode image to base64 for GitHub API
    const base64Content = opt.buffer.toString('base64')
    
    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER
    const githubRepo = process.env.GITHUB_REPO
    
    if (githubToken && githubOwner && githubRepo) {
      const ghResponse = await fetchWithTimeout(
        `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken}`,
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
        },
        30000
      )

      if (ghResponse.ok) {
        // Return relative path for same-origin Cloudflare Pages serving
        const localPath = `/images/artikel/${fileName}`
        console.log(`[ImageGen] GitHub save success: ${localPath}`)
        return { url: localPath, source: 'ai' }
      } else {
        const ghErr = await ghResponse.text()
        console.warn(`[ImageGen] GitHub upload failed (${ghResponse.status}): ${ghErr.slice(0, 200)}`)
      }
    } else {
      console.warn('[ImageGen] GitHub credentials not configured, skipping image save')
    }
  } catch (err) {
    console.error('[ImageGen] Failed:', err instanceof Error ? err.message : String(err))
  }

  // 2. Final fallback: placeholder kontekstual (TIDAK PERNAH THROW)
  const fallbackUrl = getContextualAquacultureFallback(slug)
  console.log(`[ImageGen] Using contextual fallback: ${fallbackUrl}`)
  return { url: fallbackUrl, source: 'placeholder' }
}

export async function generateGambarDanSimpan(
  prompt: string,
  slug: string,
  context?: ImagePromptContext
): Promise<string> {
  const result = await generateGambarDenganFallback(prompt, slug, context)
  return result.url
}

/**
 * Download gambar dari URL eksternal (RSS feed) dan simpan ke GitHub repo.
 * Digunakan untuk hybrid image pipeline: prioritas gambar asli dari RSS.
 *
 * @param imageUrl - URL gambar dari RSS feed
 * @param slug - slug berita (untuk nama file)
 * @returns URL publik gambar yang sudah disimpan, atau string kosong jika gagal
 */
export async function downloadDanSimpanGambar(
  imageUrl: string,
  slug: string
): Promise<string> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const GITHUB_OWNER = process.env.GITHUB_OWNER
  const GITHUB_REPO = process.env.GITHUB_REPO

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.warn('[ImageDownload] GitHub credentials not configured')
    return ''
  }

  try {
    // 1. Download gambar dari URL RSS
    console.log(`[ImageDownload] Downloading from: ${imageUrl.slice(0, 80)}...`)
    const response = await fetchWithTimeout(
      imageUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AplesiNewsBot/1.0)',
          Accept: 'image/*',
        },
      },
      15000 // 15 detik timeout untuk download
    )

    if (!response.ok) {
      console.warn(`[ImageDownload] HTTP ${response.status} from source`)
      return ''
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      console.warn(`[ImageDownload] Not an image: ${contentType}`)
      return ''
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength < 1000) {
      console.warn(`[ImageDownload] Image too small (${arrayBuffer.byteLength} bytes), likely broken`)
      return ''
    }

    // 2. Optimasi kompresi gambar eksternal ke WebP
    const opt = await optimizeImageForWeb(arrayBuffer)
    console.log(
      `[ImageDownload] Optimized: ${(opt.sizeBefore / 1024).toFixed(1)} KB -> ${(opt.sizeAfter / 1024).toFixed(1)} KB (-${opt.savingsPercent}%) [${opt.ext}]`
    )

    // 3. Simpan ke GitHub
    const fileName = `news-${slug}-${Date.now()}.${opt.ext}`
    const filePath = `public/images/news/${fileName}`
    const base64Content = opt.buffer.toString('base64')

    const ghResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AplesiBot/1.0',
        },
        body: JSON.stringify({
          message: `chore: add news image for ${slug}`,
          content: base64Content,
        }),
      }
    )

    if (ghResponse.ok) {
      // Return relative path for same-origin Cloudflare Pages serving
      const localPath = `/images/news/${fileName}`
      console.log(`[ImageDownload] Saved to GitHub: ${localPath}`)
      return localPath
    } else {
      const ghErr = await ghResponse.text()
      console.warn(`[ImageDownload] GitHub upload failed (${ghResponse.status}): ${ghErr.slice(0, 200)}`)
      return ''
    }
  } catch (err) {
    console.error('[ImageDownload] Failed:', err instanceof Error ? err.message : String(err))
    return ''
  }
}
