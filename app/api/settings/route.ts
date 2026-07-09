// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet } from '@/lib/cloudflare/kv'

export const runtime = 'edge'

const ALLOWED_KEYS = [
  'GROQ_API_KEY', 'CF_ACCOUNT_ID', 'CF_API_TOKEN', 'CF_KV_NAMESPACE_ID',
  'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO',
  'RESEND_API_KEY', 'EMAIL_FROM',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_GA_ID', 'NEXT_PUBLIC_ADSENSE_ID', 'ADSENSE_SCRIPT_RAW', 'AFFILIATE_SECRET',
]

export async function GET() {
  try {
    const settings: Record<string, string> = {}
    await Promise.all(
      ALLOWED_KEYS.map(async (key) => {
        const val = await kvGet(`settings:${key}`)
        if (val) settings[key] = val
      })
    )
    return NextResponse.json({ success: true, data: settings })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal membaca settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json()
    await Promise.all(
      Object.entries(body)
        .filter(([key]) => ALLOWED_KEYS.includes(key))
        .map(([key, value]) => kvSet(`settings:${key}`, value))
    )
    return NextResponse.json({ success: true, message: 'Settings berhasil disimpan ke Cloudflare KV' })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan settings' }, { status: 500 })
  }
}
