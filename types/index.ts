// ============================================
// APLESI ENTERPRISE - Type Definitions
// ============================================

// --- Artikel ---
export interface Artikel {
  slug: string
  judul: string
  ringkasan: string
  konten: string
  kontenHtml?: string
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
  // (etis & schema citation/isBasedOn di lib/seo/index.ts)
  sumberBerita?: { nama: string; url: string }
  tanggalBerita?: string
  waktuBaca?: number
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
  imagePrompt: string
  gambarUrl?: string
  slug: string
  sumberAsli?: { nama: string; url: string }
}

// --- Berita (hasil scrape sumber eksternal, untuk bahan tulis-ulang artikel) ---
export interface BeritaItem {
  id: string
  judul: string
  ringkasan: string
  link: string
  sumberId: string
  sumberNama: string
  asal: 'indonesia' | 'internasional'
  tanggal: string
  imageUrl: string
}

export interface GenerateArtikelDariBeritaRequest {
  berita: BeritaItem
  kategori: string
  generateGambar: boolean
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

// --- Berita Perikanan (news scraper) ---
export interface NewsItem {
  judul: string
  ringkasan: string
  url: string
  sumber: string
  tanggal: string
  kategori: 'nasional' | 'internasional'
  imageUrl: string
  slug?: string
  kontenRecap?: string
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// --- AI Image Router Settings ---
export interface AiImageConfig {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
}

export interface AiImageTestResult {
  success: boolean
  latencyMs?: number
  previewUrl?: string
  message: string
}

// --- AI Router Managed Accounts (Opsi A) ---
export type RouterStorageSource = 'kv' | 'env_secret_fallback'

export interface SanitizedRouterAccount {
  email: string
  maskedEmail: string
  projectId: string
  priority: number
  isActive: boolean
  addedAt?: string
  updatedAt?: string
  cooldownUntilMs: number | null
}

export interface RouterHealthStatus {
  status: string
  service?: string
  version?: string
  antigravityAccountsActive: number
  antigravityAccountsTotal: number
  storageSource: RouterStorageSource
  encryptionConfigured: boolean
  kvCacheEnabled: boolean
  oauthConfigured: boolean
  timestamp?: string
}

export interface RouterModelQuotaInfo {
  modelId: string
  remainingFraction: number | null
  remainingPercent: number | null
  resetTime: string | null
}

export interface RouterAccountQuotaResult {
  email: string
  maskedEmail: string
  projectId: string
  isActive: boolean
  authStatus: 'ok' | 'revoked' | 'error'
  errorMessage?: string
  checkedAt: string
  models: RouterModelQuotaInfo[]
}

