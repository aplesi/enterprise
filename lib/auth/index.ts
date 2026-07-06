// lib/auth/index.ts
// Authentication and session logic using Web Crypto API for Edge runtime

import { cookies } from 'next/headers'
import { verifySessionToken, createSessionToken } from './crypto'

export { createSessionToken, verifySessionToken }

/**
 * Checks if the current request has a valid admin session cookie.
 */
export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('aplesi_admin_session')
  
  if (!sessionCookie || !sessionCookie.value) {
    return false
  }
  
  try {
    const { token, hashedToken } = JSON.parse(sessionCookie.value)
    if (!token || !hashedToken) return false
    
    return await verifySessionToken(token, hashedToken)
  } catch (err) {
    return false
  }
}

