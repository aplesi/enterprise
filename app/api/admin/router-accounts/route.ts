import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import {
  deleteRouterAccount,
  listRouterAccounts,
  routerAdminErrorResponse,
  syncRouterAccountsFromEnv,
  unauthorizedAdminResponse,
  updateRouterAccount,
} from '@/lib/ai/router-admin'

export async function GET() {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const data = await listRouterAccounts()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      mode?: 'merge' | 'reset'
    }

    if (body.action && body.action !== 'sync-env') {
      return NextResponse.json(
        { success: false, error: 'Aksi POST tidak dikenali' },
        { status: 400 }
      )
    }

    const mode = body.mode === 'reset' ? 'reset' : 'merge'
    const data = await syncRouterAccountsFromEnv(mode)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      email?: string
      isActive?: boolean
      priority?: number
    } | null

    if (!body?.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email akun wajib disertakan' },
        { status: 400 }
      )
    }

    const data = await updateRouterAccount({
      email: body.email.trim(),
      isActive: body.isActive,
      priority: body.priority,
    })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    return unauthorizedAdminResponse()
  }

  try {
    const urlEmail = request.nextUrl.searchParams.get('email')?.trim()
    const body = (await request.json().catch(() => ({}))) as { email?: string }
    const email = urlEmail || body.email?.trim() || ''

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Parameter email wajib diisi' },
        { status: 400 }
      )
    }

    const data = await deleteRouterAccount(email)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return routerAdminErrorResponse(err)
  }
}
