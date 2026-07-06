// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
