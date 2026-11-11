import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import {
  checkRouterAccountsQuota,
  routerAdminErrorResponse,
  unauthorizedAdminResponse,
} from '@/lib/ai/router-admin'

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string }
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : undefined
    const data = await checkRouterAccountsQuota(email)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}
