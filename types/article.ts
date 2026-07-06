// types/article.ts
export interface Article {
  slug: string
  judul: string
  ringkasan: string
  konten: string
  gambar: string
  kategori: string
  tags: string[]
  penulis: string
  tanggal: string
  diperbarui?: string
  seoTitle?: string
  seoDesc?: string
  status: 'draft' | 'terjadwal' | 'published'
  jadwalPublish?: string
}

export interface AfiliasiLink {
  teks: string
  url: string
  produk: string
  komisi?: number
}

export interface GenerateRequest {
  topik: string
  kategori: string
  keywords: string[]
  panjang: 'pendek' | 'sedang' | 'panjang'
  tone: 'informatif' | 'tutorial' | 'berita'
  generateGambar: boolean
}

export interface GenerateResult {
  judul: string
  ringkasan: string
  konten: string
  tags: string[]
  seoTitle: string
  seoDesc: string
  slug: string
  gambarUrl?: string
}
