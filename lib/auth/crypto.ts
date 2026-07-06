// lib/auth/crypto.ts
// Pure cryptographic functions compatible with Edge Runtime (Middleware)

export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifySessionToken(token: string, hashedToken: string): Promise<boolean> {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-if-missing'
  const expectedHash = await hashText(`${token}-${secret}`)
  return expectedHash === hashedToken
}

export async function createSessionToken(): Promise<{ token: string; hashedToken: string }> {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-if-missing'
  const token = `aplesi-${Date.now()}`
  const hashedToken = await hashText(`${token}-${secret}`)
  return { token, hashedToken }
}
