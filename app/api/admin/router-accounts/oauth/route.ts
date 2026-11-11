import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import {
  createRouterOAuthUrl,
  exchangeRouterOAuthCallback,
  routerAdminErrorResponse,
  unauthorizedAdminResponse,
} from '@/lib/ai/router-admin'

const PRODUCTION_FALLBACK_REDIRECT_URI = 'http://localhost:8080/callback'

function resolveOAuthRedirectTarget(request: NextRequest): {
  redirectUri: string
  mode: 'auto_popup' | 'manual_copy'
} {
  const hostHeader =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host

  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  const isLoopback =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'

  if (isLoopback) {
    const proto = request.nextUrl.protocol === 'https:' ? 'https:' : 'http:'
    return {
      redirectUri: `${proto}//${hostHeader}/callback`,
      mode: 'auto_popup',
    }
  }

  return {
    redirectUri: PRODUCTION_FALLBACK_REDIRECT_URI,
    mode: 'manual_copy',
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      action?: 'authorize' | 'exchange'
      callbackUrl?: string
      code?: string
      state?: string
    } | null

    if (!body?.action) {
      return NextResponse.json(
        { success: false, error: 'Parameter action ("authorize" atau "exchange") wajib diisi' },
        { status: 400 }
      )
    }

    if (body.action === 'authorize') {
      const { redirectUri, mode } = resolveOAuthRedirectTarget(request)
      const oauthData = await createRouterOAuthUrl(redirectUri)
      return NextResponse.json({
        success: true,
        data: {
          ...oauthData,
          mode,
        },
      })
    }

    if (body.action === 'exchange') {
      const hasInput = Boolean(body.callbackUrl?.trim() || body.code?.trim())
      if (!hasInput) {
        return NextResponse.json(
          { success: false, error: 'URL callback atau authorization code wajib diisi' },
          { status: 400 }
        )
      }

      const exchanged = await exchangeRouterOAuthCallback({
        callbackUrl: body.callbackUrl,
        code: body.code,
        state: body.state,
      })

      return NextResponse.json({
        success: true,
        data: exchanged,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Action OAuth tidak valid' },
      { status: 400 }
    )
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}
