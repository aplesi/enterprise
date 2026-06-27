// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Aplesi - Portal Budidaya Lele Terlengkap',
    template: '%s | Aplesi',
  },
  description: 'Portal budidaya lele terlengkap di Indonesia. Tips, tutorial, dan panduan lengkap untuk peternak lele pemula hingga profesional.',
  keywords: ['budidaya lele', 'ternak lele', 'pakan lele', 'lele dumbo', 'kolam lele'],
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
