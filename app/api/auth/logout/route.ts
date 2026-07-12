// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  // Menghapus session cookie
  const cookieStore = await cookies()
  cookieStore.delete('aplesi_admin_session')
  
  // Redirect ke halaman login
  return NextResponse.redirect(new URL('/admin/login', req.url))
}
