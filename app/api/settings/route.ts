// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'



const ALLOWED_KEYS = [
  'GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3', 'GROQ_API_KEY_4', 'GROQ_API_KEY_5',
  'CF_ACCOUNT_ID', 'CF_API_TOKEN', 'CF_KV_NAMESPACE_ID',
  'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO',
  'RESEND_API_KEY', 'EMAIL_FROM',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_GA_ID', 'NEXT_PUBLIC_ADSENSE_ID', 'ADSENSE_SCRIPT_RAW', 'AFFILIATE_SECRET',
  'IMAGE_ROUTER_ENABLED', 'IMAGE_ROUTER_URL', 'IMAGE_ROUTER_KEY', 'IMAGE_ROUTER_MODEL',
]

const isLocalDevUrl = (val: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(val.trim())

export async function GET() {
  try {
    const settings: Record<string, string> = {}
    await Promise.all(
      ALLOWED_KEYS.map(async (key) => {
        const val = await kvGet(`settings:${key}`)
        if (val) settings[key] = val
      })
    )

    if (process.env.NODE_ENV === 'development' && process.env.LOCAL_IMAGE_ROUTER_URL?.trim()) {
      settings.IMAGE_ROUTER_URL = process.env.LOCAL_IMAGE_ROUTER_URL.trim()
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal membaca settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json()
    let skippedLocalRouterUrl = false

    await Promise.all(
      Object.entries(body)
        .filter(([key]) => ALLOWED_KEYS.includes(key))
        .map(([key, value]) => {
          // Cegah URL localhost menimpa KV production saat dev lokal
          if (process.env.NODE_ENV === 'development' && key === 'IMAGE_ROUTER_URL' && isLocalDevUrl(value)) {
            skippedLocalRouterUrl = true
            return Promise.resolve(true)
          }
          return kvSet(`settings:${key}`, value)
        })
    )

    const message = skippedLocalRouterUrl
      ? 'Settings disimpan ke Cloudflare KV (URL localhost diabaikan agar production tetap aman)'
      : 'Settings berhasil disimpan ke Cloudflare KV'

    return NextResponse.json({ success: true, message })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan settings' }, { status: 500 })
  }
}
