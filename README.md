# 🐟 Aplesi Enterprise

Portal Budidaya Ikan — Next.js + Cloudflare Workers + Groq AI

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Hosting**: Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare) — bukan Cloudflare Pages)
- **AI Artikel & Berita**: Groq API (LLaMA 3.3 70B) — gratis & super cepat
- **AI Gambar**: Cloudflare Workers AI (Stable Diffusion XL)
- **Penyimpanan data**: Cloudflare KV (settings, cache, afiliasi) + file Markdown (`content/artikel/`) — tidak pakai database D1
- **Render konten**: react-markdown (bukan next-mdx-remote — next-mdx-remote memakai `eval`/`new Function()` internal yang dilarang Cloudflare Workers runtime)
- **Auth admin**: implementasi custom (`lib/auth/`), bukan next-auth
- **Email**: Resend (via REST API langsung, bukan SDK)
- **Auto-post artikel**: GitHub Actions (cron harian)
- **Auto-generate artikel dari berita**: GitHub Actions (cron tiap 3 jam, maks 5 artikel/siklus)

---

## 🚀 Setup Awal

### 1. Clone & Install

```bash
git clone https://github.com/aplesi/enterprise.git
cd enterprise
npm install
```

> Proyek ini butuh `legacy-peer-deps=true` (sudah ada di `.npmrc`) karena beberapa dependency belum merilis peer-dependency resmi untuk React 19.

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local dan isi semua nilai yang dibutuhkan
```

### 3. Jalankan Development

```bash
npm run dev
# Buka http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

### 4. Preview mode Workers (opsional, paling akurat mendekati production)

```bash
npm run preview
# Build + jalan di runtime workerd asli (bukan next dev biasa)
```

---

## 🌐 Deploy ke Cloudflare Workers

### Langkah 1 — Push ke GitHub

```bash
git add .
git commit -m "commit message"
git push origin main
```

### Langkah 2 — Tambahkan GitHub Actions Secrets

Buka repo → **Settings** → **Secrets and variables** → **Actions**, tambahkan:
- `GROQ_API_KEY`
- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`
- `RESEND_API_KEY`

Workflow `.github/workflows/deploy.yml` otomatis jalan tiap push ke `main`: build artikel → build OpenNext → `wrangler deploy` ke Cloudflare Workers.

### Langkah 3 — Setup Domain Custom

Berbeda dari Cloudflare Pages: domain custom untuk Workers diatur di **Workers & Pages → [nama worker] → Settings → Domains & Routes**, bukan di bagian "Custom domains" ala Pages.

1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → pilih worker (nama sesuai `wrangler.jsonc`)
3. **Settings → Domains & Routes** → tambahkan `aplesi.my.id` dan `www.aplesi.my.id`

### Langkah 4 — Deploy manual (kalau perlu, tanpa GitHub Actions)

```bash
npm run deploy
# = opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

---

## 🤖 Setup Cron Otomatis

### Auto-post artikel evergreen

`.github/workflows/auto-post.yml` — jadwal default tiap hari jam 07:00 WIB:

```yaml
schedule:
  - cron: '0 0 * * *'
```

### Auto-generate artikel dari berita (kategori "Berita Terkini")

`.github/workflows/generate-berita.yml` — jadwal tiap 3 jam, scrape 10 sumber RSS perikanan (nasional + internasional), rewrite & analisis via Groq, maks 5 artikel baru per siklus (anti-spam & kendali biaya).

Kedua workflow juga bisa dijalankan manual dari tab **Actions** di GitHub.

---

## 📁 Struktur Folder

```
aplesi-enterprise/
├── app/
│   ├── (public)/          # Halaman publik (artikel, berita, kategori, produk, cari)
│   ├── admin/             # Panel admin
│   ├── api/               # API routes (settings, ads-config, afiliasi, news, dll)
│   └── go/[slug]/         # Redirect + tracking klik afiliasi
├── config/
│   └── kategori.ts        # Satu-satunya sumber taksonomi kategori artikel
├── content/
│   └── artikel/           # File .md artikel (termasuk hasil auto-generate dari berita)
├── lib/
│   ├── ai/                # Groq (artikel, berita, rewrite) & Cloudflare Workers AI (gambar)
│   ├── cloudflare/        # Wrapper KV (REST API, bukan native binding)
│   ├── news/              # Scraper RSS + parser untuk agregator berita
│   ├── db/                # Baca/tulis artikel & GitHub API
│   └── seo/               # Auto-generate meta tags, FAQ, HowTo schema
├── scripts/
│   ├── auto-post.mjs                  # Cron artikel evergreen harian
│   └── generate-berita-artikel.mjs    # Cron artikel dari berita tiap 3 jam
├── open-next.config.ts    # Config adapter OpenNext
├── wrangler.jsonc         # Config Cloudflare Workers (bukan format Pages lama)
└── .github/workflows/
    ├── deploy.yml
    ├── auto-post.yml
    └── generate-berita.yml
```

---

## 🔐 Admin Panel

Akses: `https://aplesi.my.id/admin`

Fitur:
- ✅ Generate artikel dengan Groq AI
- ✅ Generate gambar dengan Cloudflare Workers AI
- ✅ Jadwal auto-post harian
- ✅ Manajemen kategori & tag
- ✅ Dashboard analytics
- ✅ Manajemen afiliasi (klik & komisi, anti-race-condition)
- ✅ Ads — pengaturan Google AdSense Auto Ads
- ✅ Manajemen pengguna (Super Admin)

---

## 💰 Estimasi Biaya Bulanan

| Layanan | Biaya |
|---------|-------|
| Cloudflare Workers | **Gratis** (100k request/hari) |
| Cloudflare KV | **Gratis** (ada limit baca/tulis harian) |
| Cloudflare Workers AI | **Gratis** (ada limit neuron/hari — perhatikan penggunaan generate gambar dari 2 cron sekaligus) |
| Groq API | **Gratis** (rate limit cukup, tapi volume naik sejak ada cron generate-berita) |
| GitHub Actions | **Gratis** (untuk repo publik/dalam limit menit repo privat) |
| Resend (email) | **Gratis** (3000 email/bulan) |
| **Total** | **~Rp 0/bulan**, selama masih dalam limit gratis 🎉 |

> ⚠️ Dengan 2 cron generate konten otomatis (auto-post harian + generate-berita tiap 3 jam), pantau penggunaan neuron Workers AI & rate limit Groq API — volume generate gambar & teks jauh lebih tinggi dari versi awal proyek.
