---
name: aplesi-master-article-writer
description: Aplesi Master Article Writer Skill enforcing strict SNI/KKP aquaculture accuracy for multi-commodity fish & crustaceans, GEO structures, on-page SEO internal linking, anti-AI prose standards, and pre-publish quality gates.
---

# Aplesi Master Article Writer Skill — Multi-Commodity Knowledge Engine

Standard panduan resmi untuk penulisan artikel edukasi budidaya perikanan air tawar, payau, dan krustasea bernilai ekonomi tinggi di platform APLESI Enterprise.

Skill ini diintegrasikan langsung ke dalam arsitektur pembuatan artikel (`lib/ai/generator/`, `lib/ai/skills/article-writer-skill.ts`, `scripts/auto-post.ts`, dan workflow GitHub Actions) untuk memastikan setiap artikel memiliki otoritas setara penyuluh perikanan/praktisi KKP (*high-authority*), akurat secara saintifik berdasar standar SNI / KKP, bebas dari gaya bahasa robot AI, dan diutamakan oleh mesin pencari AI (*Google AI Overview, Perplexity, ChatGPT Search*).

---

## 1. Jadwal Publikasi 2x Sehari (12-Hour Interval) & Rotasi Komoditas

Artikel dipublikasikan secara otomatis 2 kali per hari melalui cron GitHub Actions (`.github/workflows/auto-post.yml`):

| Sesi | Jadwal UTC | Jadwal WIB | Kluster Kategori Prioritas | Fokus Konten |
| :--- | :--- | :--- | :--- | :--- |
| **Morning Batch** | `0 0 * * *` | 07:00 WIB | `Manajemen Kolam`, `Pembenihan`, `Pakan`, `Penyakit & Pengobatan` | Operasional kolam, kualitas air, SOP pakan, diagnosis penyakit |
| **Evening Batch** | `0 12 * * *` | 19:00 WIB | `Bisnis & Pemasaran`, `Teknologi`, `Panen & Pascapanen`, `Tips & Trik` | Analisis modal/BEP, kemitraan pasar, hilirisasi, otomatisasi IoT |

### Rotasi Multi-Komoditas Otomatis
Sistem secara cerdas mendeteksi komoditas artikel sebelumnya di Cloudflare D1 agar artikel pagi dan malam selalu membahas **spesies yang berbeda**, misalnya:
- Pagi: Ikan Lele / Ikan Nila (Teknis Pakan & Kolam Bioflok)
- Malam: Udang Vaname / Lobster Air Tawar (Analisa Bisnis & Teknologi Apartemen)
- Pagi Berikutnya: Udang Galah / Kakap Putih / Ikan Gurame (Pembenihan & Manajemen Kualitas Air)

---

## 2. Matriks Parameter Teknis Multi-Komoditas (SNI / KKP)

Setiap artikel yang dihasilkan **WAJIB** tunduk pada ambang batas parameter ilmiah spesifik komoditas yang dibahas:

### Ambang Batas Toksisitas Air Wajib (Seluruh Komoditas SNI)
- **Amonia Bebas (NH3)**: < 0.02 mg/L (pembenihan/krustasea) hingga < 0.05 mg/L (pembesaran ikan air tawar)
- **Nitrit (NO2)**: < 0.2 mg/L (air tawar) | < 0.1 mg/L (udang vaname & krustasea)
- **Kepadatan Flok (Khusus Sistem Bioflok)**: 20 – 40 mL/L (Lele) dan 15 – 30 mL/L (Nila) diukur menggunakan kerucut Imhoff (*Imhoff cone*) setelah pengendapan 20 menit.

### 1. Ikan Lele (*Clarias sp.*)
- **Suhu Air**: 26°C – 30°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L (Bioflok > 4.0 mg/L)
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.2 mg/L
- **FCR**: 0.8 – 1.1 | **Protein**: 30%–35% (benih), 26%–30% (pembesaran)
- **Feeding Rate**: 3% – 5% biomassa/hari (pembesaran), 1% – 2% (indukan matang gonad)
- **Ukuran Panen**: 8 – 12 ekor/kg (80 – 125 g/ekor, DOC 60–75 hari) | **Estimasi Harga Farm Gate**: Rp 20.000 – Rp 24.000/kg

### 2. Ikan Nila (*Oreochromis niloticus*)
- **Suhu Air**: 25°C – 30°C (optimal 27°C – 29°C) | **pH**: 6.5 – 8.5
- **DO**: > 4.0 mg/L (**Aerobik Ketat** — wajib aerasi kuat pada bioflok/KJA, hindari DO < 3.0 mg/L)
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.1 mg/L
- **FCR**: 1.1 – 1.3 | **Protein**: 28%–32% | **Feeding Rate**: 2.5% – 3.5% biomassa/hari
- **Ukuran Panen**: 3 – 5 ekor/kg (200 – 350 g/ekor konsumsi lokal) atau 500 – 800 g (fillet ekspor) | **Estimasi Harga Farm Gate**: Rp 26.000 – Rp 32.000/kg

### 3. Ikan Gurame (*Osphronemus goramy*)
- **Suhu Air**: 25°C – 28°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.1 mg/L
- **FCR**: 1.3 – 1.6 | **Protein**: 28%–32% pelet + pakan hijauan wajib (daun sente, daun talas, kangkung)
- **Ukuran Panen**: 500 – 800 g/ekor (masa budidaya 8–12 bulan) atau porsi 350–500 g | **Estimasi Harga Farm Gate**: Rp 35.000 – Rp 45.000/kg

### 4. Udang Vaname (*Litopenaeus vannamei*)
- **Suhu Air**: 28°C – 31°C (fluktuasi harian < 2°C) | **pH**: 7.5 – 8.3 (fluktuasi harian < 0.5)
- **DO**: > 4.5 mg/L (wajib kincir air tambak paddlewheel kontinu terutama malam hari)
- **Salinitas**: 15 – 25 ppt (tambak pesisir) atau 2 – 5 ppt (low-salinity kolam darat fortifikasi mineral rasio Mg:Ca 3:1)
- **Alkalinitas**: > 120 ppm (CaCO3, ideal 130–160 ppm untuk sukses molting) | **Amonia (NH3)**: < 0.02 mg/L | **Nitrit (NO2)**: < 0.1 mg/L
- **FCR**: 1.2 – 1.5 | **Protein**: 32%–38% | **Feeding Rate**: Sesuai pemantauan anco per 2–2.5 jam
- **Ukuran Panen**: Size 40 – 80 ekor/kg (DOC 90–110 hari) | **Estimasi Harga Farm Gate**: Rp 65.000 – Rp 90.000/kg

### 5. Lobster Air Tawar (*Cherax quadricarinatus - Red Claw*)
- **Suhu Air**: 24°C – 29°C | **pH**: 7.0 – 8.5 | **DO**: > 4.0 mg/L
- **Kesadahan Kalsium**: > 50 – 100 ppm CaCO3 (krusial untuk pembentukan karapas baru saat molting)
- **Amonia (NH3)**: < 0.02 mg/L | **Nitrit (NO2)**: < 0.05 mg/L
- **Shelter Wajib**: Pipa paralon PVC / roster berlubang rasio 1.5x populasi untuk mencegah kanibalisme saat molting
- **FCR**: 1.2 – 1.6 | **Pakan**: Pelet tenggelam 30%–35% + pakan segar alami
- **Ukuran Panen**: 10 – 15 ekor/kg (70–100 g, DOC 6–8 bulan) | **Estimasi Harga Farm Gate**: Rp 120.000 – Rp 180.000/kg

### 6. Ikan Patin (*Pangasius sp.*)
- **Suhu Air**: 27°C – 30°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.2 mg/L | **FCR**: 1.1 – 1.3 | **Protein**: 26%–30%
- **Ukuran Panen**: 800 – 1.200 g/ekor (fillet industri) | **Estimasi Harga Farm Gate**: Rp 18.000 – Rp 23.000/kg

### 7. Ikan Gabus (*Channa striata*)
- **Suhu Air**: 26°C – 31°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L (organ labirin tambahan)
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.2 mg/L | **FCR**: 1.2 – 1.5 | **Protein**: 38%–45% (karnivora)
- **Ukuran Panen**: 300 – 600 g/ekor (usia 6–8 bulan, kadar albumin optimal) | **Estimasi Harga Farm Gate**: Rp 50.000 – Rp 75.000/kg

### 8. Udang Galah (*Macrobrachium rosenbergii*)
- **Suhu Air**: 28°C – 31°C | **pH**: 7.0 – 8.5 | **DO**: > 4.0 mg/L
- **Salinitas**: 10 – 12 ppt (fase larva pembenihan wajib air payau) | 0 – 2 ppt (fase pendederan & pembesaran air tawar)
- **Kesadahan (Hardness)**: 60 – 120 ppm CaCO3 | **Amonia (NH3)**: < 0.02 mg/L | **Nitrit (NO2)**: < 0.05 mg/L
- **FCR**: 1.3 – 1.6 | **Protein**: 32%–38% (benih), 28%–32% (pembesaran)
- **Ukuran Panen**: 15 – 30 ekor/kg (DOC 120–150 hari, sistem sortir bertahap/panen selektif) | **Estimasi Harga Farm Gate**: Rp 75.000 – Rp 110.000/kg

### 9. Ikan Kakap Putih / Barramundi (*Lates calcarifer*)
- **Suhu Air**: 27°C – 31°C | **pH**: 7.5 – 8.5 | **DO**: > 4.5 mg/L (KJA laut/tambak intensif)
- **Salinitas**: 15 – 32 ppt (euryhaline, optimal 20–30 ppt) | **FCR**: 1.2 – 1.5 (pelet karnivora slow-sinking)
- **Protein**: 42%–48% (pendederan), 38%–42% (pembesaran) — wajib *grading* ketat tiap 2 minggu pada fase fingerling untuk mencegah kanibalisme
- **Ukuran Panen**: 500 – 800 g/ekor (porsi restoran, DOC 5–7 bulan) atau 1.5 – 3.0 kg (fillet) | **Estimasi Harga Farm Gate**: Rp 55.000 – Rp 75.000/kg

### 10. Ikan Bawal Air Tawar (*Colossoma macropomum*)
- **Suhu Air**: 25°C – 29°C | **pH**: 6.5 – 7.5 | **DO**: > 3.5 mg/L | **FCR**: 1.1 – 1.4 | **Protein**: 26%–30%
- **Ukuran Panen**: 3 – 4 ekor/kg (250 – 350 g/ekor, DOC 90–110 hari) | **Estimasi Harga Farm Gate**: Rp 22.000 – Rp 27.000/kg

### 11. Kepiting Bakau (*Scylla serrata* - Crab Box / Apartemen Vertikal)
- **Suhu Air**: 27°C – 31°C | **pH**: 7.5 – 8.5 | **DO**: > 4.0 mg/L | **Salinitas**: 15 – 25 ppt (RAS sintetis/tambak)
- **Amonia (NH3)**: < 0.05 mg/L | **Nitrit (NO2)**: < 0.05 mg/L | **Pakan**: Ikan rucah segar / keong mas 3%–5% bobot tubuh
- **Ukuran Panen**: 250 – 500 g/ekor (fattening 20–30 hari atau soka 15–20 hari) | **Estimasi Harga Farm Gate**: Rp 90.000 – Rp 160.000/kg

### 12. Ikan Bandeng (*Chanos chanos*)
- **Suhu Air**: 27°C – 31°C | **pH**: 7.5 – 8.5 | **DO**: > 3.5 mg/L | **Salinitas**: 10 – 30 ppt | **FCR**: 1.1 – 1.3
- **Ukuran Panen**: 4 – 6 ekor/kg (160 – 250 g/ekor, DOC 90–120 hari) | **Estimasi Harga Farm Gate**: Rp 24.000 – Rp 30.000/kg

---

## 3. Format GEO (Generative Engine Optimization)

1. **Blok Ringkasan Inti (Key Takeaways)**:
   Wajib tepat setelah paragraf pembuka:
   ```markdown
   > [!NOTE]
   > **Ringkasan Inti (Key Takeaways):**
   > - [Parameter teknis SNI spesifik komoditas: Suhu, pH, DO, NH3/NO2]
   > - [Rekomendasi operasional pembudidaya: Dosis pakan, aerasi, pergantian air]
   > - [Estimasi FCR & analisa biaya farm gate riil IDR]
   > - [Mitigasi risiko penyakit/kegagalan kolam]
   ```

2. **Direct Answer Lead-in pada Setiap `##` Heading**:
   Paragraf pertama (40–60 kata) harus berupa jawaban lugas, definisi langsung, atau kesimpulan faktual sebelum menguraikan detail.

3. **Tabel Parameter atau Komparasi Markdown**:
   Minimal 1 tabel Markdown terstruktur lengkap dengan header separator `|---|`.

4. **SOP & Formula Kalkulasi Plain Text (Tanpa LaTeX)**:
   DILARANG KERAS menggunakan sintaks LaTeX math (`\frac`, `\text`, `\[`, `\]`, `$$`, `$`). Tuliskan rumus menggunakan teks tebal dengan simbol aritmatika standar (÷, ×, +, -, /):
   > **Rumus FCR:** Total Pakan Diberikan (kg) ÷ Total Pertambahan Bobot Biomassa (kg)  
   > **Rumus Kebutuhan Pakan Harian:** Total Biomassa Kolam (kg) × Persentase FR (% per hari)

5. **Struktur FAQ Spesifik**:
   4–5 butir pertanyaan teknis format `### Pertanyaan?` dengan jawaban singkat 2–3 kalimat padat.

---

## 4. Standar Gaya Bahasa Praktisi & Larangan Klise AI (Anti-AI Prose Gate)

1. **Zero-Fluff Opening (Tanpa Basa-Basi Pembuka)**:
   - Kalimat pertama paragraf pembuka **WAJIB** langsung mengangkat masalah operasional, angka biaya pakan/mortalitas, atau fakta biologis spesies.
   - **DILARANG KERAS** membuka artikel atau sub-bab dengan frasa klise AI seperti:
     - *"Di era modern ini..."* / *"Dalam dunia akuakultur yang terus berkembang..."*
     - *"Budidaya [komoditas] bukan sekadar..., melainkan..."*
     - *"Mari kita selami lebih dalam..."* / *"Penting untuk diingat bahwa..."*
     - *"Sebagai kesimpulan..."* / *"Dengan menerapkan langkah-langkah di atas, kesuksesan menanti Anda."*
     - *"Tidak dapat dipungkiri bahwa..."* / *"Perlu kita ketahui bersama..."*
     - *"Menjanjikan keuntungan yang menggiurkan..."* / *"Langkah pertama yang harus diambil adalah..."*

2. **Terminologi Lapangan Akuakultur Indonesia**:
   Gunakan istilah teknis yang nyata dipakai pembudidaya dan teknisi KKP:
   - Manajemen air: *sipon lumpur dasar*, *kocok air*, *aplikasi kapur dolomit (CaMg(CO3)2) atau kapur tohor (CaO)*, *fermentasi probiotik (Bacillus sp. + molase/tetes tebu)*, *pergantian air (water exchange)*, *kerucut Imhoff (Imhoff cone)*.
   - Manajemen pakan & populasi: *pemuasaan (puasa pakan 24 jam sebelum sortir/panen)*, *sampling bobot rata-rata (ABW - Average Body Weight)*, *tingkat kelangsungan hidup (SR - Survival Rate)*, *padat tebar*, *grading ukuran*, *pakan tenggelam (sinking) vs terapung (floating)*, *cek anco (feeding tray)*.

3. **Konsistensi Kalkulasi Ekonomi (Sesi Evening Batch)**:
   Setiap artikel `Bisnis & Pemasaran` yang menyertakan analisa usaha **WAJIB** memiliki angka yang konsisten secara matematis antara:
   - `Populasi Panen = Jumlah Tebar × SR (%)`
   - `Total Tonase Panen (kg) = Populasi Panen ÷ Size Panen (ekor/kg)`
   - `Total Kebutuhan Pakan (kg) = Total Tonase Panen (kg) × FCR`
   - `Biaya Pakan (Rp) = Total Kebutuhan Pakan (kg) × Harga Pakan per kg`
   - `Pendapatan Kotor (Rp) = Total Tonase Panen (kg) × Estimasi Harga Farm Gate per kg`
   - Cantumkan keterangan bahwa harga jual dan harga pakan merupakan **estimasi tingkat pembudidaya (*farm gate*)** yang dapat bervariasi antar-wilayah.

---

## 5. On-Page SEO & Anti-Hallucination Guard

- Menyisipkan 2–3 tautan internal dari database Cloudflare D1: `[Anchor Text Alami](/artikel/existing-slug)`.
- **Anti-Hallucination Guard**: Slug yang tidak terdaftar di D1 otomatis dibersihkan menjadi *plain anchor text* oleh `validateAndSanitizeArticle()` agar tidak menghasilkan 404 broken link.

---

## 6. Pre-Publish Quality Gates (Pagar Validasi Produksi)

Setiap artikel sebelum di-commit ke GitHub dan disimpan ke Cloudflare D1 **WAJIB** lolos 6 pintu verifikasi otomatis (*Quality Gates*):

1. **Word Count Gate**:
   - Total kata artikel minimal **1.200 kata** (rekomendasi 1.500 – 2.500 kata untuk panduan teknis mendalam).
2. **Anti-LaTeX & Chemical Syntax Gate**:
   - Zero-tolerance untuk sintaks LaTeX (`\frac`, `\text`, `$$`, `\[`, `\]`, `$`).
   - Seluruh rumus kimia wajib berformat plain text (`CaCO3`, `NH3`, `NO2`, `H2S`, `CaO`). Dilarang memakai `$CaCO_3$`.
3. **Anti-AI Prose & Fluff Filter Gate**:
   - Dilarang keras mengandung frasa klise robot AI (*"Di era modern ini"*, *"Mari kita selami"*, *"Bukan sekadar"*, dll.). Kalimat pembuka wajib langsung teknis operasional.
4. **Markdown Structure & GEO Gate**:
   - Wajib ada Callout Ringkasan Inti (`> [!NOTE] **Ringkasan Inti (Key Takeaways):**`).
   - Minimal 1 tabel Markdown terstruktur (`|---|`).
   - Minimal 3–5 butir FAQ spesifik berformat `### Pertanyaan?` dengan jawaban lugas 2–3 kalimat.
   - Direct Answer Lead-in pada setiap `##` heading (40–60 kata).
5. **D1 Anti-Hallucination Internal Link Gate**:
   - Setiap link internal `[Anchor Text](/artikel/slug)` diverifikasi terhadap set slug Cloudflare D1. Slug yang tidak ada otomatis di-strip menjadi plain anchor text agar tidak menimbulkan 404 broken link.
6. **Mathematical & Economic Consistency Gate**:
   - Analisa usaha/BEP wajib konsisten antara padat tebar, SR (%), FCR, tonase panen, dan estimasi harga *farm gate*.

---

## 7. Implementasi Kode Terkait

- **Skill Core**: `lib/ai/skills/article-writer-skill.ts`
- **Image Prompt Skill**: `lib/ai/skills/image-prompt-skill.ts` (12 komoditas tersinkronisasi)
- **Orchestrator V2**: `lib/ai/generator/orchestrator.ts`
- **Outline Builder**: `lib/ai/generator/outline/builder.ts`
- **Chunk Generator**: `lib/ai/generator/chunk/engine.ts`
- **Chunk Validator**: `lib/ai/generator/chunk/validator.ts`
- **Editorial Review Engine**: `lib/ai/editor/engine.ts`
- **Commodity-Aware Prompter**: `lib/ai/groq.ts`
- **Auto Post Cron**: `scripts/auto-post.ts`
- **GitHub Workflow**: `.github/workflows/auto-post.yml`
