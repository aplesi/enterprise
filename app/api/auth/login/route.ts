// app/api/auth/login/route.ts
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json(
      { error: 'Email atau password salah' },
      { status: 401 }
    )
  }

  // Set session cookie (simple — gunakan NextAuth untuk production)
  const cookieStore = cookies()
  cookieStore.set('aplesi_admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
  })

  return NextResponse.json({ success: true })
}
