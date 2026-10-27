// lib/seo/indexer.ts
// Layanan Notifikasi Pengindeksan Instan (Instant Indexing Service)
// Mendukung:
// 1. IndexNow Protocol (Bing, Yandex, Seznam, Naver, ChatGPT Search, Perplexity)
// 2. Google Sitemap & News Sitemap Ping
// 3. Google Indexing API (Opsional via Google Service Account)

import crypto from 'crypto'

export const SITE_URL = 'https://www.aplesi.my.id'
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'aplesi9f8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a'

function base64UrlEncode(input: string | Buffer): string {
  const base64 = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64')
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/**
 * Mendapatkan OAuth2 Access Token untuk Google Indexing API jika kredensial tersedia
 */
async function getGoogleIndexingAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const claim = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    const encodedHeader = base64UrlEncode(JSON.stringify(header))
    const encodedClaim = base64UrlEncode(JSON.stringify(claim))
    const signatureInput = `${encodedHeader}.${encodedClaim}`

    const signer = crypto.createSign('RSA-SHA256')
    signer.update(signatureInput)
    // Handle newline escape characters jika disimpan di env single-line
    const formattedKey = privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey
    const signature = signer.sign(formattedKey, 'base64')
    const encodedSignature = base64UrlEncode(Buffer.from(signature, 'base64'))

    const jwt = `${signatureInput}.${encodedSignature}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    if (!res.ok) {
      console.warn('[Indexer] Google OAuth2 gagal:', res.status, await res.text())
      return null
    }

    const data = (await res.json()) as { access_token?: string }
    return data.access_token || null
  } catch (err: any) {
    console.warn('[Indexer] Error membuat token Google Indexing:', err.message)
    return null
  }
}

/**
 * Mengirim notifikasi ke IndexNow Protocol (Bing, Yandex, ChatGPT Search, Perplexity)
 */
export async function pingIndexNow(urls: string[]): Promise<boolean> {
  if (!urls || urls.length === 0) return false

  const sanitizedUrls = urls.map((u) => (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`))

  const payload = {
    host: 'www.aplesi.my.id',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: sanitizedUrls,
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 200 || res.status === 202) {
      console.log(`[Indexer] ✅ IndexNow sukses untuk ${sanitizedUrls.length} URL (Status ${res.status})`)
      return true
    } else {
      console.warn(`[Indexer] ⚠️ IndexNow status ${res.status}:`, await res.text())
      return false
    }
  } catch (err: any) {
    console.warn('[Indexer] ⚠️ Gagal menghubungi IndexNow:', err.message)
    return false
  }
}

/**
 * Melakukan ping sitemap ke Google dan Bing
 */
export async function pingSitemaps(): Promise<void> {
  const sitemaps = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/news-sitemap.xml`,
  ]

  for (const sm of sitemaps) {
    try {
      // Ping Google
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`).catch(() => {})
      // Ping Bing
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sm)}`).catch(() => {})
    } catch {
      // Fail silent
    }
  }
  console.log('[Indexer] 📡 Sitemap ping terkirim ke Google & Bing')
}

/**
 * Mengirim update ke Google Indexing API jika service account dikonfigurasi
 */
export async function pingGoogleIndexingApi(urls: string[]): Promise<void> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    // Opsional: kredensial belum ada, fallback ke IndexNow dan Sitemap
    return
  }

  const token = await getGoogleIndexingAccessToken(clientEmail, privateKey)
  if (!token) return

  for (const url of urls) {
    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
    try {
      const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullUrl,
          type: 'URL_UPDATED',
        }),
      })
      if (res.ok) {
        console.log(`[Indexer] ✅ Google Indexing API sukses: ${fullUrl}`)
      } else {
        console.warn(`[Indexer] ⚠️ Google Indexing API status ${res.status}:`, await res.text())
      }
    } catch (err: any) {
      console.warn(`[Indexer] ⚠️ Gagal ping Google Indexing API untuk ${fullUrl}:`, err.message)
    }
  }
}

/**
 * Fungsi Utama: Mengirim notifikasi publikasi ke seluruh search engine
 */
export async function notifySearchEngines(targetUrls: string | string[]): Promise<void> {
  const urls = Array.isArray(targetUrls) ? targetUrls : [targetUrls]
  if (urls.length === 0) return

  console.log(`[Indexer] 🚀 Memulai instant indexing untuk ${urls.length} URL...`)

  await Promise.allSettled([
    pingIndexNow(urls),
    pingSitemaps(),
    pingGoogleIndexingApi(urls),
  ])
}
