-- Migration: Tambah kolom konten_html untuk pre-rendered HTML
-- Mengeliminasi react-markdown CPU overhead di Cloudflare Worker (Error 1102)
ALTER TABLE artikel ADD COLUMN konten_html TEXT;
