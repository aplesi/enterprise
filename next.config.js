/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatibility
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.aplesi.my.id' },
    ],
  },

  // SEO: redirect trailing slash
  trailingSlash: false,

  // Environment variables exposed to client
  env: {
    SITE_NAME: 'Aplesi',
    SITE_URL: 'https://www.aplesi.my.id',
    SITE_DESCRIPTION: 'Portal Budidaya Lele Terlengkap di Indonesia',
  },
}

module.exports = nextConfig
