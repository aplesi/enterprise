# AGENTS.md — Aplesi Enterprise
# Instruksi ketat untuk Agen Gemini di Google Antigravity
# Letakkan file ini di ROOT folder project

---

## 🎯 IDENTITAS PROJECT

Nama project   : Aplesi Enterprise
Domain         : https://www.aplesi.my.id
Deskripsi      : Portal budidaya lele enterprise — blog AI + toko + admin panel
Repository     : github.com/[USERNAME]/aplesi-enterprise
Stack utama    : Next.js 14 (App Router) + TypeScript + Tailwind CSS
Hosting        : Cloudflare Pages
Database       : File Markdown (.md) + Cloudflare KV + D1
AI artikel     : Groq API (LLaMA 3.3 70B)
AI gambar      : Cloudflare Workers AI (Stable Diffusion XL)
Auto-post      : GitHub Actions (cron harian)

---

## 🚫 LARANGAN KERAS — JANGAN DILANGGAR

1. JANGAN ubah struktur folder yang sudah ada
2. JANGAN ganti stack (Next.js, Tailwind, TypeScript) ke framework lain
3. JANGAN install library baru tanpa izin eksplisit
4. JANGAN commit file .env atau .env.local ke GitHub
5. JANGAN hapus file yang sudah ada kecuali diminta
6. JANGAN ubah nama variable di types/index.ts tanpa update semua yang memakainya
7. JANGAN gunakan `any` di TypeScript — selalu gunakan type yang proper
8. JANGAN gunakan `<form>` HTML biasa di React component — gunakan event handler onClick/onChange
9. JANGAN gunakan localStorage atau sessionStorage di artifacts/components
10. JANGAN ubah konfigurasi Cloudflare di next.config.js tanpa izin

---

## ✅ ATURAN WAJIB

### Kode
- Selalu gunakan TypeScript strict mode
- Semua komponen React harus functional component dengan hooks
- Import path menggunakan alias `@/` (bukan relative `../../`)
- Gunakan `cn()` dari `@/lib/utils` untuk conditional className
- Server Component by default — tambahkan `'use client'` hanya jika perlu interaktivitas

### Bahasa
- Semua teks UI dalam Bahasa Indonesia
- Semua komentar kode boleh Bahasa Indonesia atau Inggris
- Semua pesan error API dalam Bahasa Indonesia

### File
- Artikel baru disimpan di `content/artikel/[slug].md`
- Gambar artikel di `public/images/artikel/`
- Komponen UI reusable di `components/ui/`
- Komponen blog di `components/blog/`
- Komponen admin di `components/admin/`

### Git
- Format commit: `feat: [deskripsi]` / `fix: [deskripsi]` / `chore: [deskripsi]`
- Selalu push ke branch `main`
- Setiap perubahan konten artikel auto-trigger deploy Cloudflare Pages

---

## 📁 STRUKTUR FOLDER (JANGAN DIUBAH)

```
aplesi-enterprise/
├── app/
│   ├── (blog)/              ← halaman publik (blog + toko)
│   │   ├── page.tsx         ← homepage
│   │   ├── layout.tsx       ← header + footer blog
│   │   ├── artikel/
│   │   │   ├── page.tsx     ← daftar artikel
│   │   │   └── [slug]/page.tsx ← detail artikel
│   │   ├── kategori/[slug]/page.tsx
│   │   ├── produk/          ← halaman toko
│   │   └── cari/page.tsx    ← pencarian
│   ├── admin/               ← panel admin (protected)
│   │   ├── layout.tsx       ← sidebar admin
│   │   ├── page.tsx         ← dashboard
│   │   ├── generate/        ← generate artikel + gambar
│   │   ├── jadwal/          ← auto-post scheduler
│   │   ├── kategori/        ← manajemen kategori + tag
│   │   ├── analytics/       ← dashboard analytics
│   │   ├── afiliasi/        ← manajemen link afiliasi
│   │   ├── pengguna/        ← manajemen user (super admin)
│   │   └── login/           ← halaman login admin
│   ├── api/                 ← API routes
│   │   ├── generate/artikel/ ← POST generate + publish
│   │   ├── auth/login/      ← POST login
│   │   └── subscriber/      ← POST daftar newsletter
│   ├── go/[slug]/route.ts   ← redirect tracking afiliasi
│   ├── og/route.tsx         ← dynamic OG image
│   ├── sitemap.ts           ← auto sitemap.xml
│   └── robots.ts            ← robots.txt
├── components/
│   ├── seo/JsonLd.tsx       ← schema markup components
│   ├── blog/                ← komponen halaman publik
│   ├── admin/               ← komponen admin panel
│   └── ui/                  ← komponen UI reusable
├── content/
│   └── artikel/*.md         ← semua artikel (frontmatter + markdown)
├── lib/
│   ├── ai/groq.ts           ← Groq API client
│   ├── ai/cloudflare-image.ts ← CF AI image generation
│   ├── db/artikel.ts        ← baca/tulis file .md
│   ├── db/github.ts         ← GitHub API untuk commit artikel
│   ├── seo/index.ts         ← meta tags + JSON-LD generator
│   ├── seo/faq.ts           ← FAQ extractor dari markdown
│   └── utils.ts             ← helper functions
├── public/images/           ← gambar statis
├── scripts/auto-post.mjs    ← script GitHub Actions
├── types/index.ts           ← semua TypeScript types
└── .github/workflows/auto-post.yml ← cron auto-posting
```

---

## 🔑 ENVIRONMENT VARIABLES (ISI DI .env.local)

```
GROQ_API_KEY=           ← dari console.groq.com (GRATIS)
CF_ACCOUNT_ID=          ← dari Cloudflare Dashboard
CF_API_TOKEN=           ← dari Cloudflare Dashboard > API Tokens
CF_D1_DATABASE_ID=      ← dari wrangler d1 create aplesi-db
CF_KV_NAMESPACE_ID=     ← dari wrangler kv:namespace create
NEXTAUTH_SECRET=        ← generate: openssl rand -base64 32
NEXTAUTH_URL=           ← http://localhost:3000 (dev) / https://aplesi.my.id (prod)
ADMIN_EMAIL=            ← email login admin
ADMIN_PASSWORD=         ← password login admin (min 12 karakter)
RESEND_API_KEY=         ← dari resend.com (GRATIS 3000 email/bulan)
EMAIL_FROM=             ← noreply@aplesi.my.id
GITHUB_TOKEN=           ← dari GitHub Settings > PAT (repo scope)
GITHUB_OWNER=           ← username GitHub
GITHUB_REPO=            ← aplesi-enterprise
NEXT_PUBLIC_GA_ID=      ← Google Analytics 4 ID (G-XXXXXXXXXX)
NEXT_PUBLIC_ADSENSE_ID= ← Google AdSense publisher ID
AFFILIATE_SECRET=       ← random string untuk HMAC tracking
```

---

## 📋 URUTAN SETUP (IKUTI PERSIS)

### FASE 1 — Install & Jalankan Lokal
```bash
# Step 1: Install dependencies
npm install

# Step 2: Buat .env.local dari template
cp .env.example .env.local

# Step 3: Isi minimal ini dulu untuk dev:
# GROQ_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, NEXTAUTH_SECRET

# Step 4: Jalankan dev server
npm run dev

# Step 5: Buka browser
# Blog  : http://localhost:3000
# Admin : http://localhost:3000/admin
```

### FASE 2 — Setup GitHub Repository
```bash
# Step 1: Buat repo baru di GitHub (nama: aplesi-enterprise)
# Step 2: Push kode
git init
git add .
git commit -m "feat: initial setup aplesi enterprise"
git remote add origin https://github.com/[USERNAME]/aplesi-enterprise.git
git push -u origin main

# Step 3: Tambahkan secrets di GitHub repo:
# Settings > Secrets and variables > Actions
# Tambahkan: GROQ_API_KEY, CF_ACCOUNT_ID, CF_API_TOKEN, RESEND_API_KEY
```

### FASE 3 — Deploy Cloudflare Pages
```bash
# Step 1: Login ke dash.cloudflare.com
# Step 2: Workers & Pages > Create Application > Pages
# Step 3: Connect GitHub repo ini
# Step 4: Build settings:
#   Framework preset : Next.js
#   Build command    : npm run build
#   Output directory : .next
# Step 5: Environment variables — tambahkan semua dari .env.example
# Step 6: Custom domain — tambahkan aplesi.my.id
```

### FASE 4 — Verifikasi
```bash
# Cek sitemap   : https://aplesi.my.id/sitemap.xml
# Cek robots    : https://aplesi.my.id/robots.txt
# Cek RSS       : https://aplesi.my.id/rss.xml
# Cek OG image  : https://aplesi.my.id/og?judul=Test&kategori=Tips
# Cek admin     : https://aplesi.my.id/admin
# Test generate : /admin/generate — coba generate 1 artikel
```

---

## 🧩 CARA MENAMBAH FITUR BARU

### Tambah halaman blog baru:
1. Buat file di `app/(blog)/[nama-halaman]/page.tsx`
2. Tambahkan link di `app/(blog)/layout.tsx` → nav
3. Tambahkan ke sitemap di `app/sitemap.ts`

### Tambah halaman admin baru:
1. Buat file di `app/admin/[nama]/page.tsx`
2. Tambahkan ke `navItems` di `app/admin/layout.tsx`
3. Tambahkan card di `app/admin/page.tsx` (dashboard)

### Tambah API route baru:
1. Buat file di `app/api/[nama]/route.ts`
2. Export fungsi `GET` atau `POST`
3. Selalu return `NextResponse.json({ success: true/false, data/error })`

### Tambah type baru:
1. Tambahkan interface di `types/index.ts`
2. Export dari sana, jangan buat file types baru

---

## 🤖 CARA KERJA AI PIPELINE

### Generate Artikel (Manual via Admin):
```
/admin/generate
  → POST /api/generate/artikel
    → lib/ai/groq.ts (Groq LLaMA 3.3 70B)
    → lib/ai/cloudflare-image.ts (CF AI SDXL)
  → POST /api/generate/artikel/publish
    → lib/db/artikel.ts (simpan lokal)
    → lib/db/github.ts (commit ke GitHub)
    → Cloudflare Pages auto-deploy
```

### Generate Artikel (Otomatis via Cron):
```
GitHub Actions (jadwal: 07:00 WIB setiap hari)
  → scripts/auto-post.mjs
    → Groq API (generate artikel)
    → Cloudflare AI (generate gambar)
    → commit ke content/artikel/[slug].md
    → Cloudflare Pages auto-deploy
```

### Format Artikel (.md):
```markdown
---
judul: "Judul Artikel"
slug: "judul-artikel"
ringkasan: "Ringkasan max 160 karakter"
gambar: "/images/artikel/nama-file.png"
kategori: "Pembenihan"
tags: ["tag1", "tag2", "tag3"]
penulis: "Aplesi AI"
tanggal: "2024-06-01"
status: "published"
seoTitle: "Judul SEO max 60 karakter"
seoDesc: "Deskripsi SEO max 160 karakter"
---

[konten markdown di sini]

## Pertanyaan yang Sering Diajukan

### Pertanyaan pertama?
Jawaban singkat 2-3 kalimat.
```

---

## 🔍 SEO & AI CRAWLING

Website ini dioptimasi untuk direkomendasikan oleh AI (ChatGPT, Perplexity, Google AI Overview):

- **Schema markup**: Article + FAQPage + BreadcrumbList + Organization + WebSite
- **Sitemap**: auto-generate di `/sitemap.xml`
- **Robots**: izinkan GPTBot, PerplexityBot, ClaudeBot, Bingbot
- **FAQ otomatis**: diekstrak dari heading berbentuk pertanyaan di artikel
- **OG image dinamis**: `/og?judul=...&kategori=...`
- **RSS Feed**: `/rss.xml` untuk 50 artikel terbaru
- **E-E-A-T**: setiap artikel punya author, tanggal publish, tanggal update

JANGAN ubah logika SEO di:
- `lib/seo/index.ts`
- `lib/seo/faq.ts`
- `components/seo/JsonLd.tsx`
- `app/robots.ts`
- `app/sitemap.ts`

---

## 🐛 TROUBLESHOOTING

| Error | Solusi |
|-------|--------|
| `GROQ_API_KEY not found` | Isi di .env.local |
| `Cannot find module '@/...'` | Cek tsconfig.json paths |
| `Build failed: CF Pages` | Cek output directory = `.next` |
| `Artikel tidak muncul` | Cek status di frontmatter = `"published"` |
| `Gambar tidak muncul` | Cek CF_ACCOUNT_ID dan CF_API_TOKEN |
| `Admin tidak bisa login` | Cek ADMIN_EMAIL dan ADMIN_PASSWORD di env |
| `Auto-post tidak jalan` | Cek GitHub Actions secrets sudah diisi |

---

## 📞 KONTEKS TAMBAHAN

- Website lama: https://www.aplesi.my.id (masih Blogger)
- Tujuan: migrasi ke Next.js enterprise dengan AI auto-content
- Target: 10+ artikel per minggu, auto-generated oleh Groq AI
- Monetisasi: Google AdSense + link afiliasi (Tokopedia/Shopee)
- Pengguna admin: 1 super admin + kemungkinan 1-2 editor
- Deployment: Cloudflare Pages (BUKAN Vercel, BUKAN Netlify)
