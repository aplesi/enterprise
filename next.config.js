import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wajib untuk @cloudflare/next-on-pages
  // JANGAN pakai output: 'standalone' — itu untuk Vercel/OpenNext

  images: {
    // Cloudflare Pages tidak support next/image optimizer
    // Gunakan unoptimized: true
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.aplesi.my.id' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },

  trailingSlash: false,

  env: {
    SITE_NAME: 'Aplesi',
    SITE_URL: 'https://www.aplesi.my.id',
    SITE_DESCRIPTION: 'Portal Budidaya Lele Terlengkap di Indonesia',
  },
}

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform()
}

export default nextConfig
