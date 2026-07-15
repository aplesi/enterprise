-- Migration: Tabel riwayat generate artikel (observability)
-- Digunakan untuk tracking sukses/gagal generate, waktu proses, dan error detail
-- Dipanggil otomatis oleh API generate — tidak perlu insert manual

CREATE TABLE IF NOT EXISTS generate_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  topik           TEXT NOT NULL,
  kategori        TEXT DEFAULT 'Budidaya',
  panjang         TEXT DEFAULT 'sedang',
  tone            TEXT DEFAULT 'informatif',
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'success' | 'error' | 'partial'
  -- Detail hasil
  slug            TEXT,                              -- slug artikel (jika sukses)
  judul           TEXT,                              -- judul artikel (jika sukses)
  word_count      INTEGER DEFAULT 0,                 -- jumlah kata konten
  has_gambar      INTEGER DEFAULT 0,                 -- 1 jika gambar berhasil
  -- Error tracking
  error_message   TEXT,                              -- pesan error (jika gagal)
  error_stage     TEXT,                              -- tahap gagal: 'generate' | 'gambar' | 'publish'
  -- Performance
  duration_ms     INTEGER DEFAULT 0,                 -- waktu proses total (ms)
  groq_tokens     INTEGER DEFAULT 0,                 -- token usage (jika tersedia)
  -- Metadata
  created_at      TEXT DEFAULT (datetime('now')),
  published_at    TEXT                               -- waktu publish (jika sukses)
);

CREATE INDEX IF NOT EXISTS idx_generate_log_status ON generate_log(status);
CREATE INDEX IF NOT EXISTS idx_generate_log_created ON generate_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generate_log_kategori ON generate_log(kategori);
