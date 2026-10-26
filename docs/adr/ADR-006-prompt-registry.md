# ADR 006: Prompt Registry untuk Sentralisasi Instruksi AI

## Status
**Accepted**

## Context
APLESI menggunakan arsitektur *AI-First Content* di mana *prompt* LLM merupakan jantung dari *pipeline* pembuatan konten. Saat ini, *prompt* utama yang mendikte struktur artikel ("12 SECTION AI-FIRST") diduplikasi secara *hardcode* di empat lokasi berbeda (tiga skrip Node.js Native `.mjs` dan satu API Route Next.js `.ts`). 
Kondisi ini menciptakan *Technical Debt* yang signifikan. Jika struktur artikel perlu diubah atau aturan anti-halusinasi perlu ditambahkan, tim developer harus mengingat untuk memperbarui keempat file tersebut. Kegagalan melakukan ini akan menghasilkan *output* artikel yang tidak konsisten dan dapat merusak logika parser *section-scoped* kita.

## Problem
Bagaimana cara memusatkan (*centralize*) AI *prompt* menjadi *Single Source of Truth* yang dapat diakses dengan mudah oleh:
1. Skrip Native Node.js (`.mjs`) untuk proses otomatisasi (Cron)
2. Next.js App Router API (`.ts`)
3. Lingkungan *Edge Computing* (Cloudflare Pages)

Semua ini harus dicapai tanpa menambah beban *runtime* (misalnya proses I/O baca file) dan tanpa memerlukan instalasi transpilator tambahan untuk menjalankan skrip Node.js.

## Decision
Kami memutuskan untuk memperlakukan *Prompt* AI sebagai **Configuration Asset** kelas satu (*First-Class Citizen*) dan membuat sebuah **Prompt Registry** sentral.
Registry ini disimpan di *root level* proyek pada direktori baru:
`/prompts/index.mjs`

File ini menggunakan standar *ECMAScript Module* (ESM) yang mengekspor *Template Literal* panjang:
`export const AI_STRUCTURE_PROMPT = \`...\``

## Alternatives Considered
1. **Markdown/Text File (`/prompts/structure.md`) + `fs.readFileSync`**
   - *Pro:* Sangat mudah dikelola, murni teks.
   - *Kontra:* API `fs` (File System) bawaan Node.js sering kali bermasalah atau tidak didukung penuh saat dikompilasi ke lingkungan **Cloudflare Edge Runtime**. Ini dapat menyebabkan mogok (*crash*) saat *production*.
2. **JSON File (`/prompts/index.json`)**
   - *Pro:* Kompatibel di semua *runtime* secara *native*.
   - *Kontra:* JSON tidak mendukung penulisan *multiline string* secara alami. Menulis *prompt* panjang harus disambung dengan `\n`, yang menjadikan proses iterasi/tuning sangat buruk (*developer experience* rendah).
3. **TypeScript File (`/lib/ai/prompts.ts`)**
   - *Pro:* Menjaga konsistensi bahasa dengan ekosistem Next.js.
   - *Kontra:* Skrip utilitas `.mjs` native (seperti *auto-post*) tidak dapat mengimpor `.ts` secara langsung tanpa dieksekusi melalui perantara seperti `tsx` atau Babel, yang memperumit *pipeline* GitHub Actions.

## Trade-offs
- **Kelebihan:** Kita mendapatkan kompatibilitas absolut di seluruh ekosistem (Next.js dan Node.js Native memahami `.mjs`). Turbopack/Webpack dari Next.js akan mem- *bundle* *string* ini secara statis ke dalam *Worker* sehingga tidak ada biaya *I/O (Zero Overhead)*.
- **Kekurangan:** Menulis *prompt* di dalam *file* JavaScript (sebagai variabel) masih kurang murni dibandingkan menulis di dalam *file* teks/Markdown biasa. Namun, *template literal* (*backtick*) sudah cukup memberikan keleluasaan spasi dan *newline*.

## Consequences
- Perubahan apa pun pada instruksi struktural AI kini hanya perlu dilakukan di satu tempat: `/prompts/index.mjs`.
- Semua skrip dan API *route* kini mengimpor (*import*) variabel dari *registry* tersebut.
- Arsitektur *codebase* menjadi lebih *cohesive*, mengukuhkan *prompt* sebagai aset konfigurasi utama APLESI.

## Future Evolution
Saat ini, *registry* statis berbasis ESM adalah solusi terbaik (V1). Di masa depan, jika aktivitas *prompt tuning* semakin intensif dan dilakukan oleh Editor non-teknis, kita dapat mempertimbangkan untuk mengekstrak *prompt* ini ke dalam layanan basis data terkelola (Cloudflare D1 atau KV) atau *Headless CMS*. *Prompt* tersebut nantinya akan di-*fetch* sekali saat *build-time* (SSG), memisahkan *lifecycle* kode sepenuhnya dari *lifecycle* konten instruksional.
