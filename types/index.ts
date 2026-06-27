// ============================================
// APLESI ENTERPRISE - Type Definitions
// ============================================

// --- Artikel ---
export interface Artikel {
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
  afiliasi?: AfiliasiLink[]
}

export interface AfiliasiLink {
  teks: string
  url: string
  produk: string
  komisi?: number
}

// --- Kategori ---
export interface Kategori {
  slug: string
  nama: string
  deskripsi: string
  gambar?: string
  jumlahArtikel?: number
}

// --- Produk ---
export interface Produk {
  slug: string
  nama: string
  deskripsi: string
  harga: number
  gambar: string[]
  kategori: string
  stok: number
  afiliasi?: string
  status: 'aktif' | 'nonaktif'
}

// --- User / Role ---
export type UserRole = 'super_admin' | 'admin' | 'editor'

export interface User {
  id: string
  nama: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: string
  lastLogin?: string
}

// --- Generate Request ---
export interface GenerateArtikelRequest {
  topik: string
  kategori: string
  keywords: string[]
  panjang: 'pendek' | 'sedang' | 'panjang'
  tone: 'informatif' | 'tutorial' | 'berita'
  generateGambar: boolean
}

export interface GenerateArtikelResponse {
  judul: string
  ringkasan: string
  konten: string
  tags: string[]
  seoTitle: string
  seoDesc: string
  gambarUrl?: string
  slug: string
}

// --- Jadwal ---
export interface JadwalPost {
  id: string
  artikelSlug: string
  artikelJudul: string
  waktuPublish: string
  status: 'menunggu' | 'proses' | 'selesai' | 'gagal'
  createdAt: string
}

// --- Subscriber ---
export interface Subscriber {
  id: string
  email: string
  nama?: string
  aktif: boolean
  subscribedAt: string
}

// --- Analytics ---
export interface AnalyticsData {
  pengunjungHarian: number
  pengunjungMingguan: number
  pengunjungBulanan: number
  artikelTerpopuler: { slug: string; judul: string; views: number }[]
  sumberTraffic: { sumber: string; persentase: number }[]
  pendapatan: {
    iklan: number
    afiliasi: number
    total: number
  }
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
