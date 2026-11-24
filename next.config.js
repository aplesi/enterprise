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
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },

  trailingSlash: false,

  env: {
    SITE_NAME: 'Aplesi',
    SITE_URL: 'https://aplesi.my.id',
    SITE_DESCRIPTION: 'Portal Budidaya Lele Terlengkap di Indonesia',
  },

  async redirects() {
    return [
      {
        source: '/:year(\\d{4})/:month(\\d{2})/:slug([a-zA-Z0-9_-]+).html',
        destination: '/artikel/:slug',
        permanent: true,
      },
      {
        source: '/:slug([a-zA-Z0-9_-]+).html',
        destination: '/artikel/:slug',
        permanent: true,
      },
      {
        source: '/search/label/:label*',
        destination: '/artikel',
        permanent: true,
      },
      {
        source: '/feeds/posts/default',
        destination: '/rss.xml',
        permanent: true,
      },
    ]
  },
}

// Mengaktifkan akses ke Cloudflare bindings (KV, D1, dll) versi lokal saat
// `next dev` -- pengganti setupDevPlatform() dari @cloudflare/next-on-pages lama.
// Sengaja dibungkus kondisi (konsisten dengan pola lama) supaya `next build`
// di CI/production tidak ikut spin up Miniflare yang tidak perlu.
if (process.env.NODE_ENV !== 'production') {
  initOpenNextCloudflareForDev()
}

export default nextConfig
