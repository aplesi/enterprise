import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // OpenNext Cloudflare adapter mendukung image optimization via binding
    // "IMAGES" di wrangler.jsonc -- tapi untuk sekarang tetap unoptimized:true
    // (konsisten dengan setup lama, bisa dievaluasi terpisah nanti)
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

// Mengaktifkan akses ke Cloudflare bindings (KV, D1, dll) versi lokal saat
// `next dev` -- pengganti setupDevPlatform() dari @cloudflare/next-on-pages lama
initOpenNextCloudflareForDev()

export default nextConfig
