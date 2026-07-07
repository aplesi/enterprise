# HANDOFF DOKUMEN — APLESI ENTERPRISE
# Tanggal terakhir update: 7 Juli 2026

## STATUS CEPAT

Website    : aplesi.my.id → cek status deploy terbaru setelah push
Disk lokal : /Users/febrinanda/aplesi (sudah ada semua kode)
Masalah #1 : ✅ SELESAI — .github/workflows/deploy.yml sudah ada (deploy otomatis tiap push ke main)
Masalah #2 : ✅ SELESAI — config/site.ts & konten sudah "Ikan Seluruh Indonesia", bukan "Lele"
Masalah #3 : ✅ SELESAI — lib/db/artikel.ts sudah edge-compatible (baca dari JSON hasil build, bukan fs)

## YANG MASIH PERLU DILAKUKAN MANUAL (tidak bisa lewat kode)

1. **Tambahkan GitHub Secrets** di Settings → Secrets and variables → Actions:
   - `CF_API_TOKEN` (Cloudflare API token dengan izin edit Pages)
   - `CF_ACCOUNT_ID`
   - `GROQ_API_KEY` (untuk auto-post.yml)
   - `RESEND_API_KEY` (kalau fitur email dipakai)
   - `GITHUB_TOKEN` biasanya sudah otomatis tersedia di Actions, tapi
     app/api/generate/artikel/publish/route.ts butuh token dengan izin
     push (bisa pakai secrets.GITHUB_TOKEN bawaan atau PAT terpisah)
2. **Push ke GitHub** (`git push origin main`) — begitu di-push,
   `.github/workflows/deploy.yml` akan otomatis build & deploy ke
   Cloudflare Pages.
3. Jika project Cloudflare Pages `aplesi-enterprise` belum pernah dibuat,
   deploy pertama lewat workflow ini akan otomatis membuatnya (wrangler
   pages deploy auto-create project kalau belum ada).
4. Setup custom domain `aplesi.my.id` di Cloudflare Pages dashboard →
   Custom domains (langkah manual di dashboard, tidak bisa via kode).

## LANGKAH DEPLOY MANUAL (kalau mau trigger dari lokal, bukan lewat CI)

cd /Users/febrinanda/aplesi
npm install
npm run generate:artikel
npm run pages:build
wrangler login
wrangler pages deploy .vercel/output/static --project-name=aplesi-enterprise

## FIX YANG SUDAH DILAKUKAN (kumulatif, terbaru di atas)

### Sesi 7 Juli 2026
1. `.github/workflows/deploy.yml` — deploy otomatis ke Cloudflare Pages tiap push ke main
2. `content/artikel/*.md` — 2 artikel tipis (416 & 332 kata) diperdalam jadi 1.114 & 805 kata sesuai patokan GEO (section 150-200 kata, format answer-first, tambah FAQ)
3. `lib/ai/groq.ts` — prompt AI generator diupdate dengan aturan answer-first, panjang section 150-200 kata, panjang paragraf 60-100 kata
4. `lib/seo/howto.ts` + `components/seo/JsonLd.tsx` — tambah schema HowTo untuk artikel panduan langkah-demi-langkah
5. Penulis diganti dari "Aplesi AI" → "Tim Redaksi APLESI" (E-E-A-T) + halaman profil `/penulis/[nama]` baru dibuat
6. `lib/db/artikel.ts` — rewrite total, tidak pakai `fs` lagi, baca dari `content/artikel-data.generated.json` (di-generate `scripts/generate-artikel-data.mjs` saat prebuild) → edge-compatible

### Sesi 6 Juli 2026
1. wrangler.jsonc → pages_build_output_dir = .vercel/output/static
2. open-next.config.ts → dikosongkan (tidak pakai OpenNext)
3. ArticleSearch.tsx → suggestions APLESI-spesifik
4. artikel/page.tsx → filter kategori + reading time + pagination
5. page.tsx → stats bar + reading time cards
6. config/site.ts & 21 file lain → koreksi nama dari "Lele" ke "Ikan Seluruh Indonesia"

## PEKERJAAN LANJUTAN (belum dikerjakan, butuh strategi konten)

- **Struktur pilar-klaster**: baru ada 3 artikel, semua soal lele dumbo.
  Kategori lain (Nila, Udang, dst) di `KATEGORI_LIST` masih kosong.
  Perlu artikel pilar per jenis ikan + artikel klaster yang saling
  link internal.
- Internal linking sistematis antar-artikel berdasarkan topik (saat
  ini "artikel terkait" cuma filter kategori generik).
