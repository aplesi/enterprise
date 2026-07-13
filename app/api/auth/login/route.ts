// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionToken } from '@/lib/auth/crypto'

// Simple in-memory rate limiting (Note: in serverless/edge environments this is isolated per instance, 
// but still provides basic brute-force mitigation).
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000 // 1 minute

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown-ip'
  
  // Rate limiting check
  const attempts = loginAttempts.get(ip)
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    if (Date.now() - attempts.lastAttempt < LOCKOUT_MS) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    } else {
      // Reset after lockout period
      loginAttempts.set(ip, { count: 0, lastAttempt: Date.now() })
    }
  }

  const { email, password } = await req.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (email !== adminEmail || password !== adminPassword) {
    // Record failed attempt
    const currentAttempts = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() }
    loginAttempts.set(ip, {
      count: currentAttempts.count + 1,
      lastAttempt: Date.now(),
    })
    
    return NextResponse.json(
      { error: 'Email atau password salah' },
      { status: 401 }
    )
  }

  // Clear attempts on success
  loginAttempts.delete(ip)

  // Generate secure session token
  let sessionData: { token: string; hashedToken: string }
  try {
    sessionData = await createSessionToken()
  } catch (err) {
    console.error('Login gagal -- masalah konfigurasi server:', err)
    return NextResponse.json(
      { error: 'Konfigurasi server bermasalah. Hubungi administrator.' },
      { status: 500 }
    )
  }

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set('aplesi_admin_session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
  })

  return NextResponse.json({ success: true })
}
