-- migrations/0001_initial.sql
-- Skema database APLESI Enterprise
-- Dijalankan via: wrangler d1 execute aplesi-db --file=migrations/0001_initial.sql

-- ============================================
-- TABEL ARTIKEL (panduan/tutorial AI-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS artikel (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT UNIQUE NOT NULL,
  judul           TEXT NOT NULL,
  ringkasan       TEXT,
  konten          TEXT NOT NULL,
  gambar          TEXT DEFAULT '/images/og-default.png',
  kategori        TEXT DEFAULT 'Budidaya',
  tags            TEXT DEFAULT '[]',
  penulis         TEXT DEFAULT 'Tim Redaksi APLESI',
  tanggal         TEXT NOT NULL,
  diperbarui      TEXT,
  seo_title       TEXT,
  seo_desc        TEXT,
  status          TEXT DEFAULT 'draft',
  jadwal_publish  TEXT,
  sumber_berita_nama TEXT,
  sumber_berita_url  TEXT,
  tanggal_berita     TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_artikel_status ON artikel(status);
CREATE INDEX IF NOT EXISTS idx_artikel_kategori ON artikel(kategori);
CREATE INDEX IF NOT EXISTS idx_artikel_tanggal ON artikel(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_artikel_slug ON artikel(slug);

-- ============================================
-- TABEL BERITA (hasil scrape RSS + AI rewrite)
-- ============================================
CREATE TABLE IF NOT EXISTS berita (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ext_id          TEXT UNIQUE NOT NULL,
  judul           TEXT NOT NULL,
  judul_asli      TEXT NOT NULL,
  ringkasan       TEXT,
  ringkasan_asli  TEXT,
  url_sumber      TEXT NOT NULL,
  sumber_id       TEXT,
  sumber_nama     TEXT,
  asal            TEXT DEFAULT 'indonesia',
  tanggal         TEXT NOT NULL,
  sudah_jadi_artikel INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_berita_tanggal ON berita(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_berita_ext_id ON berita(ext_id);
CREATE INDEX IF NOT EXISTS idx_berita_asal ON berita(asal);

-- ============================================
-- TABEL PRODUK (afiliasi Shopee dll)
-- ============================================
CREATE TABLE IF NOT EXISTS produk (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT UNIQUE NOT NULL,
  nama            TEXT NOT NULL,
  deskripsi       TEXT,
  harga           INTEGER DEFAULT 0,
  harga_asli      INTEGER,
  gambar          TEXT DEFAULT '[]',
  kategori        TEXT DEFAULT 'Lainnya',
  platform        TEXT DEFAULT 'Shopee',
  url_afiliasi    TEXT NOT NULL,
  rating          REAL,
  terjual         INTEGER DEFAULT 0,
  aktif           INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_produk_aktif ON produk(aktif);

-- ============================================
-- TABEL KLIK AFILIASI (tracking per klik)
-- ============================================
CREATE TABLE IF NOT EXISTS klik_afiliasi (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  produk_id       INTEGER,
  slug            TEXT NOT NULL,
  ip_hash         TEXT,
  user_agent      TEXT,
  referer         TEXT,
  clicked_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (produk_id) REFERENCES produk(id)
);

CREATE INDEX IF NOT EXISTS idx_klik_slug ON klik_afiliasi(slug);
CREATE INDEX IF NOT EXISTS idx_klik_tanggal ON klik_afiliasi(clicked_at DESC);
