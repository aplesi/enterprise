import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Konfigurasi default OpenNext untuk Cloudflare Workers.
// Bisa dikembangkan nanti (misal incrementalCache pakai R2) kalau perlu ISR
// cache yang lebih tahan lama -- untuk sekarang default sudah cukup karena
// konten Aplesi (artikel, kategori) mostly statis via SSG / commit ke GitHub.
export default defineCloudflareConfig({})
