# APLESI Enterprise Theme Package

Paket ini berisi design system yang digunakan di portal APLESI Enterprise.

## Isi File

- `aplesi-theme.css` — File CSS lengkap dengan Tailwind v4 theme tokens, utilities glassmorphism, gradient, dan shadow.
- `aplesi-theme.json` — Token desain dalam format JSON untuk integrasi dengan design tool atau theme generator.

## Palet Warna

- **Navy Deep** — `oklch(0.22 0.07 255)` (background hero/primary dark)
- **Navy** — `oklch(0.32 0.11 255)` (primary brand)
- **Aqua** — `oklch(0.72 0.14 210)` (CTA/akses)
- **Aqua Glow** — `oklch(0.82 0.13 200)` (akses cerah / glow)

## Tipografi

- **Font**: Inter
- **Smoothing**: antialiased
- **Font features**: `cv11`, `ss01`

## Utilities

- `glass` — Efek blur transparan untuk latar terang
- `glass-dark` — Efek blur transparan untuk latar gelap
- `gradient-hero` — Gradient hero section
- `gradient-aqua` — Gradient aqua untuk CTA
- `text-gradient-aqua` — Teks dengan gradient aqua
- `shadow-glow`, `shadow-card`, `shadow-card-hover` — Shadow sistem

## Cara Pakai

Salin `aplesi-theme.css` ke folder styles project Anda, atau impor token dari `aplesi-theme.json` ke design tool favorit.
