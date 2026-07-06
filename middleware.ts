import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/crypto'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Tentukan apakah ini API route yang perlu diproteksi
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicApi = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/subscriber')
  const isProtectedApi = isApiRoute && !isPublicApi

  // Proteksi semua route /admin/* kecuali /admin/login, dan semua protected API
  if ((pathname.startsWith('/admin') && pathname !== '/admin/login') || isProtectedApi) {
    const sessionCookie = req.cookies.get('aplesi_admin_session')
    let isValid = false

    if (sessionCookie && sessionCookie.value) {
      try {
        const { token, hashedToken } = JSON.parse(sessionCookie.value)
        if (token && hashedToken) {
          isValid = await verifySessionToken(token, hashedToken)
        }
      } catch (e) {
        // parsing failed or validation failed
      }
    }

    if (!isValid) {
      if (isProtectedApi) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      } else {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    }
  }

  // Tambahkan simple CSRF headers protection untuk API POST/PUT/DELETE /api/admin/* jika ada
  // Meskipun saat ini belum ada CSRF protection kompleks, kita setidaknya memastikan
  // validasi origin atau content type (opsional)

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
