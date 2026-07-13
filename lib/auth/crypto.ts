// lib/auth/crypto.ts
// Pure cryptographic functions compatible with Edge Runtime (Middleware)

export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// PENTING: jangan fallback ke string default kalau NEXTAUTH_SECRET tidak ada.
// Repo ini publik -- fallback string apa pun akan terlihat siapa saja di kode
// sumber, artinya sesi admin bisa dipalsukan dengan gampang. Lebih baik gagal
// jelas (throw) daripada diam-diam pakai secret yang predictable.
function ambilSecretAtauLempar(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET belum di-set di environment. Set sebagai Cloudflare ' +
      'Worker secret (wrangler secret put NEXTAUTH_SECRET) sebelum admin ' +
      'panel bisa dipakai di production.'
    )
  }
  return secret
}

export async function verifySessionToken(token: string, hashedToken: string): Promise<boolean> {
  const secret = ambilSecretAtauLempar()
  const expectedHash = await hashText(`${token}-${secret}`)
  return expectedHash === hashedToken
}

export async function createSessionToken(): Promise<{ token: string; hashedToken: string }> {
  const secret = ambilSecretAtauLempar()
  const token = `aplesi-${Date.now()}`
  const hashedToken = await hashText(`${token}-${secret}`)
  return { token, hashedToken }
}
