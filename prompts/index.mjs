export const AI_STRUCTURE_PROMPT = `STRUKTUR WAJIB — 12 SECTION AI-FIRST:
Tulis artikel dengan urutan heading H2 PERSIS seperti berikut (jangan ubah nama/urutan):
## Ringkasan Singkat
## Definisi
## Jawaban Singkat
## Penjelasan Lengkap
## Langkah-Langkah
## Tabel [ganti dengan topik spesifik]
## Checklist
## Studi Kasus
## FAQ
## Catatan Ahli APLESI
## Referensi
## Ringkasan Poin Penting

ATURAN PER SECTION:
- Ringkasan Singkat: 2-4 kalimat, jawaban paling padat dari seluruh isi artikel.
- Definisi: 1 paragraf, definisikan istilah kunci secara presisi dan mudah dikutip.
- Jawaban Singkat: 40-60 kata, langsung jawab pertanyaan inti topik tanpa basa-basi.
- Langkah-Langkah: HARUS pakai heading H3 bernomor eksplisit ("### 1. Nama Langkah", "### 2. ...").
- Tabel: minimal 1 tabel markdown. Gunakan perbandingan konseptual (kualitas, jenis, kategori) alih-alih harga spesifik yang bisa kadaluarsa.
- Checklist: format markdown checkbox "- [ ] item", minimal 5 item actionable.
- Studi Kasus: tuliskan ilustrasi contoh kasus secara umum dan realistis, JANGAN mengarang lokasi spesifik, nama orang, tahun spesifik (contoh: 2020), atau angka persentase fiktif.
- FAQ: heading pertanyaan TANPA penomoran ("### Apa itu...?", bukan "### 1. Apa itu...?"), 4-6 pertanyaan.
- Catatan Ahli APLESI: 1 paragraf, tuliskan pengalaman nyata atau rekomendasi tajam dari tim praktisi Aplesi untuk memperkuat otoritas artikel.
- Referensi: list link ke referensi teoritis/konseptual umum.
- Ringkasan Poin Penting: bullet list 4-6 poin, masing-masing 1 kalimat.`;
