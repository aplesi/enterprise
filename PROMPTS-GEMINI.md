# 📋 KUMPULAN PROMPT KETAT UNTUK AGEN GEMINI
# Google Antigravity — Project Aplesi Enterprise
# Copy-paste prompt sesuai kebutuhan

================================================================
## PROMPT 1 — SETUP AWAL (JALANKAN PERTAMA KALI)
================================================================

Kamu adalah agen developer senior yang bertugas melakukan setup project Next.js enterprise bernama "Aplesi Enterprise". 

BACA file AGENTS.md di root folder terlebih dahulu sebelum melakukan apapun. Ikuti semua instruksi di dalamnya dengan ketat.

Tugasmu sekarang adalah FASE 1 — Setup & Jalankan Lokal:

1. Baca AGENTS.md dan pahami seluruh struktur project
2. Jalankan `npm install` untuk install semua dependencies
3. Buat file `.env.local` dengan menyalin dari `.env.example`
4. Tampilkan isi `.env.example` ke saya dan tanyakan API keys mana yang sudah saya miliki
5. Isi `.env.local` dengan nilai yang saya berikan
6. Jalankan `npm run dev`
7. Konfirmasi apakah dev server berhasil berjalan di http://localhost:3000

ATURAN:
- Jangan install library tambahan apapun
- Jangan ubah kode yang sudah ada
- Jangan commit apapun ke git dulu
- Jika ada error, tampilkan pesan error lengkap dan tunggu instruksi saya

Mulai sekarang.

================================================================
## PROMPT 2 — SETUP GITHUB & PUSH KODE
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu.

Tugasmu adalah FASE 2 — Setup GitHub Repository:

1. Inisialisasi git repository: `git init`
2. Tambahkan .gitignore yang sudah ada
3. Pastikan file .env.local TIDAK masuk ke dalam commit (cek .gitignore)
4. Buat initial commit: `git add . && git commit -m "feat: initial setup aplesi enterprise"`
5. Tanyakan kepada saya: username GitHub dan nama repo yang ingin digunakan
6. Tambahkan remote origin
7. Push ke branch main
8. Konfirmasi push berhasil

Setelah push berhasil, tampilkan checklist secrets yang harus saya tambahkan di:
GitHub repo → Settings → Secrets and variables → Actions

ATURAN KERAS:
- PASTIKAN .env.local tidak ikut ter-commit, cek dengan `git status` sebelum commit
- Jika .env.local ada di staging, jalankan `git reset HEAD .env.local` dulu
- Jangan lanjut ke step berikutnya tanpa konfirmasi saya

================================================================
## PROMPT 3 — DEPLOY KE CLOUDFLARE PAGES
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu.

Tugasmu adalah FASE 3 — mempersiapkan deployment ke Cloudflare Pages.

1. Cek apakah `next.config.js` sudah menggunakan `output: 'standalone'`
2. Jalankan `npm run build` dan pastikan build berhasil tanpa error
3. Jika ada error build, perbaiki error tersebut (jangan ubah logika bisnis, hanya perbaiki error TypeScript/import)
4. Tampilkan kepada saya pengaturan yang harus diisi di Cloudflare Pages:
   - Framework preset
   - Build command
   - Output directory
   - Semua environment variables yang dibutuhkan (dari .env.example)
5. Setelah build berhasil, konfirmasi ke saya

ATURAN:
- Deployment target adalah Cloudflare Pages, BUKAN Vercel atau Netlify
- Jangan ubah next.config.js kecuali ada error build yang mengharuskan
- Jika ada TypeScript error, perbaiki dengan type yang benar (bukan `any`)

================================================================
## PROMPT 4 — GENERATE ARTIKEL PERTAMA (TEST AI)
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu.

Tugasmu adalah melakukan test end-to-end pipeline generate artikel AI:

1. Pastikan dev server sudah berjalan (`npm run dev`)
2. Buka http://localhost:3000/admin/generate di browser (gunakan browser subagent)
3. Screenshot halaman tersebut dan tampilkan ke saya
4. Isi form dengan:
   - Topik: "cara mengatasi penyakit white spot pada lele dumbo"
   - Kategori: "Penyakit & Pengobatan"
   - Keywords: "white spot, bintik putih, lele sakit, obat lele"
   - Panjang: Sedang (1000-1500 kata)
   - Tone: Informatif
   - Generate gambar: centang
5. Klik "Generate Artikel Sekarang"
6. Tunggu sampai hasil muncul (max 30 detik)
7. Screenshot hasil dan tampilkan ke saya
8. Klik "Publish Artikel"
9. Verifikasi artikel muncul di http://localhost:3000/artikel/

JIKA ADA ERROR:
- Jika error GROQ_API_KEY: tampilkan pesan dan minta saya isi API key
- Jika error CF AI (gambar): lanjutkan tanpa gambar, article tetap dipublish
- Jika error lain: tampilkan error lengkap dan tunggu instruksi

================================================================
## PROMPT 5 — TAMBAH HALAMAN PRODUK (TOKO)
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu. Perhatikan aturan di bagian "CARA MENAMBAH FITUR BARU".

Tugasmu adalah membuat halaman produk/toko di `app/(blog)/produk/`:

Buat file-file berikut:
1. `app/(blog)/produk/page.tsx` — halaman daftar produk dengan:
   - Grid produk 3 kolom
   - Filter kategori (Pakan, Bibit, Peralatan, Obat)
   - Setiap produk card menampilkan: gambar, nama, harga, rating, tombol beli
   - Tombol beli → redirect ke link afiliasi via /go/[slug]

2. `app/(blog)/produk/[slug]/page.tsx` — halaman detail produk dengan:
   - Gambar produk
   - Nama, deskripsi, harga
   - Schema markup: Product (JSON-LD)
   - Tombol "Beli Sekarang" → /go/[slug]
   - Produk terkait

3. Update `app/sitemap.ts` — tambahkan URL produk

4. Update `app/(blog)/layout.tsx` — pastikan link "Produk" di nav sudah aktif

ATURAN:
- Gunakan TypeScript strict
- Gunakan Tailwind CSS yang sudah ada (jangan tambah library CSS baru)
- Gunakan komponen dari `components/ui/` jika tersedia
- Data produk sementara hardcode sebagai array, bukan database
- Semua teks dalam Bahasa Indonesia

================================================================
## PROMPT 6 — SETUP AUTO-POST GITHUB ACTIONS
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu, khususnya bagian CARA KERJA AI PIPELINE.

Tugasmu adalah memverifikasi dan mengoptimasi GitHub Actions auto-post:

1. Buka dan baca file `.github/workflows/auto-post.yml`
2. Baca file `scripts/auto-post.mjs`
3. Verifikasi bahwa:
   - Cron schedule sudah benar (07:00 WIB = 00:00 UTC)
   - Semua environment variables sudah direferensikan dari GitHub Secrets
   - Script bisa dijalankan manual via `workflow_dispatch`
4. Test jalankan script secara lokal:
   ```bash
   GROQ_API_KEY=[dari env] node scripts/auto-post.mjs
   ```
5. Jika berhasil, tampilkan file .md yang dihasilkan
6. Jika gagal, perbaiki error dan coba lagi

Setelah berhasil, tampilkan instruksi untuk saya:
- Cara trigger manual dari GitHub Actions tab
- Cara ubah jadwal posting
- Cara tambah/ubah daftar topik rotasi

ATURAN:
- Jangan ubah jadwal cron tanpa konfirmasi saya
- Jangan commit API keys ke kode
- Topik rotasi ada di array TOPIK_ROTASI di scripts/auto-post.mjs — boleh ditambah

================================================================
## PROMPT 7 — AUDIT SEO LENGKAP
================================================================

Kamu adalah agen SEO dan developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu, khususnya bagian SEO & AI CRAWLING.

Tugasmu adalah melakukan audit SEO lengkap:

1. Jalankan dev server jika belum berjalan
2. Cek setiap URL berikut dan verifikasi hasilnya:

   a. http://localhost:3000/sitemap.xml
      → Harus ada minimal 10+ URL, format XML valid
   
   b. http://localhost:3000/robots.txt
      → Harus ada allow untuk GPTBot, PerplexityBot, ClaudeBot
   
   c. http://localhost:3000/rss.xml
      → Harus ada RSS feed valid dengan minimal 1 item
   
   d. http://localhost:3000/og?judul=Test+Artikel&kategori=Tips
      → Harus tampil gambar OG 1200x630px
   
   e. http://localhost:3000/artikel/cara-budidaya-lele-dumbo-pemula
      → Cek ada JSON-LD Article schema di source HTML
      → Cek ada JSON-LD FAQPage schema di source HTML
      → Cek ada meta og:image

3. Untuk setiap URL, tampilkan: ✅ OK atau ❌ ERROR + detail masalah

4. Jika ada yang ERROR, perbaiki dan verifikasi ulang

5. Buat laporan akhir: 
   - Berapa % halaman sudah SEO-ready
   - Apa yang masih perlu diperbaiki
   - Rekomendasi untuk meningkatkan ranking di Google dan direkomendasikan AI

ATURAN:
- Jangan ubah logika SEO yang sudah ada di lib/seo/
- Jika ada perbaikan, jelaskan alasannya dulu sebelum mengubah kode

================================================================
## PROMPT 8 — FIX ERROR / DEBUG
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu.

Saya mengalami error berikut:

[PASTE ERROR DI SINI]

Tugasmu adalah:
1. Analisa error tersebut
2. Identifikasi file dan baris yang bermasalah
3. Jelaskan penyebab error dalam 2-3 kalimat
4. Tampilkan solusi yang akan kamu terapkan (diff/perubahan kode)
5. Tunggu konfirmasi saya sebelum mengubah kode
6. Setelah saya setuju, terapkan perubahan
7. Verifikasi error sudah teratasi

ATURAN:
- Jangan ubah kode lain selain yang berkaitan langsung dengan error
- Jangan downgrade TypeScript strict ke `any` untuk menghindari error
- Jika error di file config (next.config.js, tsconfig.json), tunjukkan perubahan minimal yang diperlukan
- Selalu jelaskan dampak perubahan sebelum mengeksekusi

================================================================
## PROMPT 9 — TAMBAH FITUR BARU (TEMPLATE UMUM)
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu. Pahami seluruh struktur project sebelum mulai.

Saya ingin menambahkan fitur:
[DESKRIPSIKAN FITUR DI SINI]

Sebelum mulai coding, lakukan hal berikut:
1. Tampilkan daftar file yang akan kamu buat atau ubah
2. Jelaskan pendekatan implementasi (max 5 poin)
3. Identifikasi apakah ada dependency baru yang dibutuhkan
4. Tunggu konfirmasi saya

Setelah saya konfirmasi:
1. Implement fitur sesuai rencana
2. Pastikan TypeScript tidak ada error
3. Pastikan semua teks UI dalam Bahasa Indonesia
4. Update file terkait (layout nav, sitemap, dll) jika perlu
5. Test fitur di browser dan screenshot hasilnya
6. Laporkan apakah fitur berjalan dengan baik

ATURAN KERAS:
- IKUTI struktur folder di AGENTS.md
- JANGAN install library baru tanpa izin
- JANGAN ubah file yang tidak berkaitan dengan fitur ini
- JANGAN gunakan localStorage/sessionStorage

================================================================
## PROMPT 10 — MIGRASI KONTEN DARI BLOGGER
================================================================

Kamu adalah agen developer senior untuk project Aplesi Enterprise.

BACA AGENTS.md terlebih dahulu.

Saya ingin memindahkan artikel dari website lama (aplesi.my.id — Blogger) ke project ini.

Tugasmu adalah:

1. Ambil daftar artikel dari https://www.aplesi.my.id (gunakan browser subagent atau fetch)
2. Untuk setiap artikel yang ditemukan, convert ke format Markdown dengan frontmatter yang benar:

Format frontmatter yang HARUS digunakan:
```
---
judul: "[judul artikel]"
slug: "[slug-dari-judul]"
ringkasan: "[ringkasan max 160 karakter]"
gambar: "/images/artikel/[slug].jpg"
kategori: "[kategori yang sesuai]"
tags: ["tag1", "tag2"]
penulis: "Tim Aplesi"
tanggal: "[tanggal-publish-asli]"
status: "published"
seoTitle: "[judul seo max 60 karakter]"
seoDesc: "[deskripsi seo max 160 karakter]"
---
[konten markdown]
```

3. Simpan setiap artikel ke `content/artikel/[slug].md`
4. Laporkan berapa artikel berhasil dikonversi

ATURAN:
- Pertahankan tanggal publish asli dari Blogger
- Slug harus lowercase, tanpa karakter khusus, spasi ganti dengan -
- Jika tidak bisa ambil konten asli, generate ulang dengan Groq AI berdasarkan judul
