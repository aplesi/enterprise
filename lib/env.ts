// lib/env.ts
// Validasi environment variables saat startup
// Mencegah silent bug karena env tidak diset

const required = [
  'GROQ_API_KEY',
  'CF_ACCOUNT_ID',
  'CF_API_TOKEN',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'NEXTAUTH_SECRET',
] as const

type RequiredEnv = typeof required[number]

function getEnv(key: RequiredEnv): string {
  const value = process.env[key]
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`❌ Environment variable ${key} belum diset!`)
  }
  return value || ''
}

export const env = {
  groqApiKey: getEnv('GROQ_API_KEY'),
  cfAccountId: getEnv('CF_ACCOUNT_ID'),
  cfApiToken: getEnv('CF_API_TOKEN'),
  adminEmail: getEnv('ADMIN_EMAIL'),
  adminPassword: getEnv('ADMIN_PASSWORD'),
  nextauthSecret: getEnv('NEXTAUTH_SECRET'),

  // Optional
  githubToken: process.env.GITHUB_TOKEN || '',
  githubOwner: process.env.GITHUB_OWNER || '',
  githubRepo: process.env.GITHUB_REPO || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@aplesi.my.id',
  nextPublicGaId: process.env.NEXT_PUBLIC_GA_ID || '',
  nextPublicAdsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || '',
  affiliateSecret: process.env.AFFILIATE_SECRET || '',
  siteUrl: process.env.SITE_URL || 'https://www.aplesi.my.id',

  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const
