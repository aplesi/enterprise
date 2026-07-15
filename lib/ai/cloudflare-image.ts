// lib/ai/cloudflare-image.ts
// Generate gambar menggunakan Cloudflare Workers AI (gratis)
// Edge-compatible: tidak menggunakan fs atau path
// Fallback: placeholder image jika Cloudflare AI gagal

const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'
const REQUEST_TIMEOUT_MS = 30000 // 30 detik per request (FLUX butuh waktu lebih)

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

export async function generateGambar(prompt: string): Promise<ArrayBuffer> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  // FLUX-1 works best with detailed, descriptive prompts
  // Only add quality suffix, NOT generic fish farming terms that dilute specificity
  const enhancedPrompt = `${prompt}, sharp focus, well-lit, realistic photojournalism style, high resolution`

  const response = await fetchWithTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${IMAGE_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        num_inference_steps: 8, // Ditingkatkan dari 4 ke 8 agar AI punya waktu menggambar detail spesifik ikan
      }),
    },
    REQUEST_TIMEOUT_MS
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Cloudflare AI error: ${err}`)
  }

  const result = await response.json() as { result?: { image?: string }; errors?: unknown[] }
  
  if (!result.result?.image) {
    throw new Error(`FLUX-1 no image in response: ${JSON.stringify(result.errors || result).slice(0, 200)}`)
  }

  // Decode base64 to ArrayBuffer
  const base64 = result.result.image
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

/**
 * Generate gambar dengan fallback ke placeholder
 * TIDAK PERNAH THROW — selalu return result
 * Returns: { url: string, source: 'ai' | 'placeholder' }
 */
export async function generateGambarDenganFallback(
  prompt: string,
  slug: string,
): Promise<{ url: string; source: 'ai' | 'placeholder' }> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  // 1. Try Cloudflare AI (single attempt, with timeout)
  try {
    console.log('[ImageGen] Starting FLUX-1 generation...')
    const arrayBuffer = await generateGambar(prompt)
    console.log(`[ImageGen] FLUX-1 success, image size: ${arrayBuffer.byteLength} bytes`)

    // Save image to GitHub repo (public/images/artikel/)
    // FLUX-1 outputs JPEG, so use .jpg extension to match actual content type
    // (Next.js /_next/image rejects files where extension doesn't match content)
    const fileName = `${slug}-${Date.now()}.jpg`
    const filePath = `public/images/artikel/${fileName}`
    
    console.log(`[ImageGen] Saving to GitHub: ${filePath}...`)
    
    // Encode image to base64 for GitHub API
    // Use chunked encoding to avoid call stack overflow with large images
    const bytes = new Uint8Array(arrayBuffer)
    const CHUNK_SIZE = 8192
    let binaryString = ''
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length))
      binaryString += String.fromCharCode(...chunk)
    }
    const base64Content = btoa(binaryString)
    
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
        // Return jsDelivr CDN URL — correct content-type, unlike raw.githubusercontent.com (text/plain)
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${githubOwner}/${githubRepo}@main/public/images/artikel/${fileName}`
        console.log(`[ImageGen] GitHub save success: ${cdnUrl}`)
        return { url: cdnUrl, source: 'ai' }
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

  // 2. Final fallback: placeholder (TIDAK PERNAH THROW)
  console.log('[ImageGen] Using placeholder fallback')
  return { url: '/images/og-default.png', source: 'placeholder' }
}

export async function generateGambarDanSimpan(
  prompt: string,
  slug: string
): Promise<string> {
  const result = await generateGambarDenganFallback(prompt, slug)
  return result.url
}

// Upload ke Cloudflare Images (production)
export async function uploadKeCloudflareImages(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<string> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  const formData = new FormData()
  const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'image/png' })
  formData.append('file', blob, fileName)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: formData,
    }
  )

  const data = await response.json() as { result: { variants: string[] } }
  return data.result.variants[0]
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

    // 2. Tentukan ekstensi dari content-type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = extMap[contentType.split(';')[0].trim()] || 'jpg'

    // 3. Simpan ke GitHub
    const fileName = `news-${slug}-${Date.now()}.${ext}`
    const filePath = `public/images/news/${fileName}`

    // Encode ke base64 (chunked untuk hindari stack overflow)
    const bytes = new Uint8Array(arrayBuffer)
    const CHUNK_SIZE = 8192
    let binaryString = ''
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length))
      binaryString += String.fromCharCode(...chunk)
    }
    const base64Content = btoa(binaryString)

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
      // Return jsDelivr CDN URL — correct content-type, unlike raw.githubusercontent.com (text/plain)
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/public/images/news/${fileName}`
      console.log(`[ImageDownload] Saved to GitHub: ${cdnUrl}`)
      return cdnUrl
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
