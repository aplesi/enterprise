// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AdsenseAutoAds } from '@/components/ads/AdsenseAutoAds'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Aplesi - Portal Budidaya Ikan Terlengkap',
    template: '%s | Aplesi',
  },
  description: 'Portal budidaya ikan terlengkap di Indonesia. Tips, tutorial, dan panduan lengkap untuk peternak ikan pemula hingga profesional.',
  keywords: ['budidaya ikan', 'ternak ikan', 'ikan air tawar', 'ikan konsumsi', 'kolam ikan', 'pakan ikan'],
  metadataBase: new URL('https://www.aplesi.my.id'),
  openGraph: {
    siteName: 'Aplesi',
    type: 'website',
    locale: 'id_ID',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      ...(process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : {}),
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
      </head>
      <body className={inter.className}>
        <AdsenseAutoAds />
        {children}
      </body>
    </html>
  )
}
