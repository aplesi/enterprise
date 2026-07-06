// app/(blog)/layout.tsx
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Schema global — untuk brand authority di AI */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 w-full pt-20">{children}</main>
        <Footer />
      </div>
    </>
  )
}
