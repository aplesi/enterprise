-- Migration 0004: Tambah kolom gambar_url ke tabel berita
-- Kolom ini menyimpan URL gambar thumbnail yang diambil dari RSS feed
-- atau hasil generate AI (FLUX-1) via Cloudflare Workers AI

ALTER TABLE berita ADD COLUMN gambar_url TEXT DEFAULT '';
