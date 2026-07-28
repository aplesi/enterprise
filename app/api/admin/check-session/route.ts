import { NextResponse } from 'next/server'

export async function GET() {
  // Jika bisa mencapai endpoint ini, artinya middleware sudah memvalidasi
  // cookie aplesi_admin_session dan token-nya valid.
  return NextResponse.json({ success: true, isAdmin: true })
}
