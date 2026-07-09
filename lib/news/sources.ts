// lib/news/sources.ts
// Daftar sumber berita perikanan & akuakultur, Indonesia + internasional.
//
// Sebagian besar lewat Google News RSS search (stabil, tidak butuh API key,
// tidak perlu scraping HTML mentah situs orang) yang di-scope pakai query
// spesifik perikanan/akuakultur per bahasa & region. Ditambah beberapa feed
// resmi media akuakultur internasional yang memang RSS-nya publik.

export interface SumberBerita {
  id: string
  nama: string
  url: string
  asal: 'indonesia' | 'internasional'
}

export const SUMBER_BERITA: SumberBerita[] = [
  // ---------- Indonesia ----------
  {
    id: 'gnews-id-perikanan',
    nama: 'Google News — Perikanan & Budidaya Ikan',
    url: 'https://news.google.com/rss/search?q=%22budidaya%20ikan%22%20OR%20perikanan%20OR%20nelayan%20when:2d&hl=id&gl=ID&ceid=ID:id',
    asal: 'indonesia',
  },
  {
    id: 'gnews-id-kkp',
    nama: 'Google News — Kebijakan KKP',
    url: 'https://news.google.com/rss/search?q=%22Kementerian%20Kelautan%20dan%20Perikanan%22%20OR%20KKP%20when:3d&hl=id&gl=ID&ceid=ID:id',
    asal: 'indonesia',
  },
  {
    id: 'gnews-id-udang-tambak',
    nama: 'Google News — Udang & Tambak',
    url: 'https://news.google.com/rss/search?q=%22budidaya%20udang%22%20OR%20tambak%20when:3d&hl=id&gl=ID&ceid=ID:id',
    asal: 'indonesia',
  },
  {
    id: 'gnews-id-ekspor',
    nama: 'Google News — Ekspor Hasil Laut RI',
    url: 'https://news.google.com/rss/search?q=%22ekspor%20perikanan%22%20OR%20%22ekspor%20udang%22%20Indonesia%20when:5d&hl=id&gl=ID&ceid=ID:id',
    asal: 'indonesia',
  },

  // ---------- Internasional ----------
  {
    id: 'gnews-en-aquaculture',
    nama: 'Google News — Aquaculture Industry',
    url: 'https://news.google.com/rss/search?q=aquaculture%20when:2d&hl=en-US&gl=US&ceid=US:en',
    asal: 'internasional',
  },
  {
    id: 'gnews-en-fisheries',
    nama: 'Google News — Fisheries & Seafood',
    url: 'https://news.google.com/rss/search?q=%22fisheries%22%20OR%20%22seafood%20industry%22%20when:2d&hl=en-US&gl=US&ceid=US:en',
    asal: 'internasional',
  },
  {
    id: 'gnews-en-shrimp',
    nama: 'Google News — Shrimp Farming',
    url: 'https://news.google.com/rss/search?q=%22shrimp%20farming%22%20OR%20%22shrimp%20aquaculture%22%20when:5d&hl=en-US&gl=US&ceid=US:en',
    asal: 'internasional',
  },
  {
    id: 'aquaculturemag',
    nama: 'Aquaculture Magazine',
    url: 'https://aquaculturemag.com/feed/',
    asal: 'internasional',
  },
  {
    id: 'worldwideaquaculture',
    nama: 'WorldWide Aquaculture',
    url: 'https://worldwideaquaculture.com/feed/',
    asal: 'internasional',
  },
  {
    id: 'aquaculturists',
    nama: 'The Aquaculturists',
    url: 'https://theaquaculturists.blogspot.com/feeds/posts/default?alt=rss',
    asal: 'internasional',
  },
]
