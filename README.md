# 🐟 Aplesi Enterprise

Portal Budidaya Lele — Next.js + Cloudflare + Groq AI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Hosting**: Cloudflare Pages
- **AI Artikel**: Groq API (LLaMA 3.3 70B) — gratis & super cepat
- **AI Gambar**: Cloudflare Workers AI (Stable Diffusion XL)
- **Database**: Cloudflare D1 (SQLite) + KV
- **Email**: Resend
- **Auto-post**: GitHub Actions (cron harian)

---

## 🚀 Setup Awal

### 1. Clone & Install

```bash
git clone https://github.com/USERNAME/aplesi-enterprise.git
cd aplesi-enterprise
npm install
```

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

---

## 🌐 Deploy ke Cloudflare Pages

### Langkah 1 — Push ke GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Langkah 2 — Connect Cloudflare Pages

1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pilih **Workers & Pages** → **Create Application** → **Pages**
3. Connect ke GitHub repo ini
4. Build settings:
   - **Framework**: Next.js
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Output directory**: `.vercel/output/static`
5. Tambahkan semua environment variables dari `.env.example`

### Langkah 3 — Setup Domain

1. Di Cloudflare Pages → Custom domains
2. Tambahkan `aplesi.my.id` dan `www.aplesi.my.id`

---

## 🤖 Setup Auto-Post GitHub Actions

### Tambahkan Secrets di GitHub

Buka repo → **Settings** → **Secrets and variables** → **Actions**

Tambahkan secrets berikut:
- `GROQ_API_KEY`
- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`
- `RESEND_API_KEY`

### Jadwal Auto-Post

Edit `.github/workflows/auto-post.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # Setiap hari jam 07:00 WIB
```

Atau jalankan manual dari tab **Actions** di GitHub.

---

## 📁 Struktur Folder

```
aplesi-enterprise/
├── app/
│   ├── (blog)/          # Halaman publik
│   └── admin/           # Panel admin
├── content/
│   └── artikel/         # File .md artikel
├── lib/
│   ├── ai/              # Groq & Cloudflare AI
│   ├── db/              # Baca/tulis artikel & GitHub API
│   └── seo/             # Auto-generate meta tags
├── scripts/
│   └── auto-post.mjs    # Script GitHub Actions
└── .github/
    └── workflows/
        └── auto-post.yml
```

---

## 🔐 Admin Panel

Akses: `https://aplesi.my.id/admin`

Fitur:
- ✅ Generate artikel dengan Groq AI
- ✅ Generate gambar dengan Cloudflare AI  
- ✅ Jadwal auto-post harian
- ✅ Manajemen kategori & tag
- ✅ Dashboard analytics
- ✅ Manajemen afiliasi
- ✅ Manajemen pengguna (Super Admin)

---

## 💰 Estimasi Biaya Bulanan

| Layanan | Biaya |
|---------|-------|
| Cloudflare Pages | **Gratis** |
| Cloudflare Workers | **Gratis** (100k/hari) |
| Cloudflare AI | **Gratis** (ada limit) |
| Groq API | **Gratis** (rate limit cukup) |
| GitHub | **Gratis** |
| Resend (email) | **Gratis** (3000 email/bulan) |
| **Total** | **~Rp 0/bulan** 🎉 |
