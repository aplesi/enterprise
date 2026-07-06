// components/seo/JsonLd.tsx
// Komponen Schema Markup untuk SEO & AI Recommendation

interface BreadcrumbItem {
  name: string
  url: string
}

interface FaqItem {
  pertanyaan: string
  jawaban: string
}

// BreadcrumbList Schema — bantu AI & Google pahami struktur halaman
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQPage Schema — SANGAT penting untuk Google AI Overview & Perplexity
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: faq.pertanyaan,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.jawaban,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Organization Schema — taruh di layout root untuk brand authority
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Aplesi',
    url: 'https://www.aplesi.my.id',
    logo: 'https://www.aplesi.my.id/images/logo.png',
    description: 'Portal budidaya ikan terlengkap di Indonesia',
    sameAs: [
      'https://www.facebook.com/aplesi',
      'https://www.instagram.com/aplesi',
      'https://www.youtube.com/@aplesi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Indonesian',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// WebSite Schema dengan SearchAction — agar Google tampilkan sitelinks searchbox
export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Aplesi',
    url: 'https://www.aplesi.my.id',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.aplesi.my.id/cari?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
