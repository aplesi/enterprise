# HANDOFF DOKUMEN — APLESI ENTERPRISE
# Tanggal: 6 Juli 2026
# File ini juga disimpan di disk kamu untuk referensi

Lihat file lengkap di: /mnt/user-data/outputs/HANDOFF-SESI-CHAT.md

## STATUS CEPAT

Website    : aplesi.my.id → 404 (BELUM DEPLOY)
Disk lokal : /Users/febrinanda/aplesi (sudah ada semua kode)
Masalah #1 : Tidak ada .github/workflows/ = belum pernah deploy
Masalah #2 : config/site.ts nama masih "Lele" bukan "Ikan Seluruh Indonesia"
Masalah #3 : lib/db/artikel.ts pakai fs (Node.js) = tidak bisa di edge

## LANGKAH DEPLOY TERCEPAT

cd /Users/febrinanda/aplesi
npm install
npm run pages:build
wrangler login
wrangler pages deploy .vercel/output/static --project-name=aplesi-enterprise

## FIX YANG SUDAH DILAKUKAN DI SESI INI

1. wrangler.jsonc → pages_build_output_dir = .vercel/output/static
2. open-next.config.ts → dikosongkan (tidak pakai OpenNext)
3. ArticleSearch.tsx → suggestions APLESI-spesifik
4. artikel/page.tsx → filter kategori + reading time + pagination
5. page.tsx → stats bar + reading time cards
