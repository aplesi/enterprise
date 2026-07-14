// app/api/groq/status/route.ts
// API endpoint untuk menampilkan status pool API key Groq di admin panel

import { NextResponse } from 'next/server'
import { getPoolStatus, getPoolSize } from '@/lib/ai/groq-pool'

export const dynamic = 'force-dynamic'

export async function GET() {
  const keys = getPoolStatus()
  const totalKeys = getPoolSize()
  const available = keys.filter((k) => k.isAvailable).length
  const rateLimited = keys.filter((k) => !k.isAvailable).length

  return NextResponse.json({
    success: true,
    data: {
      totalKeys,
      available,
      rateLimited,
      keys,
    },
  })
}
