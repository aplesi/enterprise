// app/robots.ts
// Izinkan semua crawler termasuk AI (GPTBot, PerplexityBot, ClaudeBot)

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Izinkan semua crawler untuk konten publik
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/go/'],
      },
      // Izinkan GPT/OpenAI crawler (untuk rekomendasi ChatGPT)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Izinkan Perplexity crawler
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Izinkan Claude/Anthropic crawler
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Izinkan Bing/Microsoft AI
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
    ],
    sitemap: 'https://www.aplesi.my.id/sitemap.xml',
    host: 'https://www.aplesi.my.id',
  }
}
