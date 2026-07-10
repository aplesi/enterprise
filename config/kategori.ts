// config/kategori.ts
// Satu-satunya sumber kebenaran untuk taksonomi kategori artikel.
//
// PENTING: field `nama` harus PERSIS SAMA dengan value `kategori` di
// frontmatter setiap file .md di content/artikel/ -- ini yang dipakai
// untuk filter & pencocokan artikel (lib/db/artikel.ts).
//
// Sebelumnya daftar ini terduplikasi di 5 tempat berbeda (artikel/page.tsx,
// kategori/[slug]/page.tsx, admin/generate, admin/jadwal, sitemap.ts) --
// itu yang menyebabkan bug filter kategori tidak pernah match (commit
// be61e68). Jangan duplikasi lagi -- semua tempat WAJIB import dari sini.

export interface KategoriInfo {
  nama: string
  slug: string
  icon: string
  deskripsi: string
}

export const KATEGORI_LIST: KategoriInfo[] = [
  {
    nama: 'Pembenihan',
    slug: 'pembenihan',
    icon: '🥚',
    deskripsi: 'Panduan lengkap pembenihan dan pembibitan ikan, dari pemilihan induk hingga penetasan telur.',
  },
  {
    nama: 'Pakan',
    slug: 'pakan',
    icon: '🌿',
    deskripsi: 'Tips pakan dan nutrisi optimal untuk pertumbuhan ikan yang cepat dan hemat biaya.',
  },
  {
    nama: 'Penyakit & Pengobatan',
    slug: 'penyakit',
    icon: '💊',
    deskripsi: 'Cara mengenali, mencegah, dan mengobati berbagai penyakit umum pada ikan.',
  },
  {
    nama: 'Manajemen Kolam',
    slug: 'kolam',
    icon: '🏊',
    deskripsi: 'Panduan pengelolaan kolam budidaya ikan, dari kolam terpal hingga bioflok.',
  },
  {
    nama: 'Panen & Pascapanen',
    slug: 'panen',
    icon: '🎣',
    deskripsi: 'Teknik panen ikan yang benar dan cara pengolahan pascapanen untuk memaksimalkan keuntungan.',
  },
  {
    nama: 'Bisnis & Pemasaran',
    slug: 'bisnis',
    icon: '💰',
    deskripsi: 'Strategi bisnis, analisa usaha, dan tips pemasaran produk ikan.',
  },
  {
    nama: 'Tips & Trik',
    slug: 'tips',
    icon: '💡',
    deskripsi: 'Tips dan trik praktis dari para peternak ikan berpengalaman.',
  },
  {
    nama: 'Teknologi',
    slug: 'teknologi',
    icon: '🔬',
    deskripsi: 'Inovasi dan teknologi terbaru dalam budidaya ikan modern.',
  },
  {
    nama: 'Berita Terkini',
    slug: 'berita-terkini',
    icon: '📰',
    deskripsi: 'Rangkuman & analisis berita perikanan terkini, dikaitkan dengan konteks pembudidaya Indonesia.',
  },
]

export function cariKategoriBySlug(slug: string): KategoriInfo | undefined {
  return KATEGORI_LIST.find((k) => k.slug === slug)
}

export function cariKategoriByNama(nama: string): KategoriInfo | undefined {
  return KATEGORI_LIST.find((k) => k.nama === nama)
}
