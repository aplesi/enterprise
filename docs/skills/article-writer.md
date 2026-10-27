# Aplesi Master Article Writer Skill — Multi-Commodity Knowledge Engine

Standard panduan resmi untuk penulisan artikel edukasi budidaya perikanan air tawar, payau, dan krustasea bernilai ekonomi tinggi di platform APLESI Enterprise.

Skill ini diintegrasikan langsung ke dalam arsitektur pembuatan artikel (`lib/ai/generator/`, `scripts/auto-post.ts`, dan workflow GitHub Actions) untuk memastikan setiap artikel memiliki otoritas tinggi (*high-authority*), akurat secara saintifik berdasar standar SNI / KKP, dan diutamakan oleh mesin pencari AI (*Google AI Overview, Perplexity, ChatGPT Search*).

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
- Pagi Berikutnya: Ikan Gurame / Ikan Patin / Ikan Gabus (Pembenihan & Penyakit)

---

## 2. Matriks Parameter Teknis Multi-Komoditas (SNI / KKP)

Setiap artikel yang dihasilkan **WAJIB** tunduk pada ambang batas parameter ilmiah spesifik komoditas yang dibahas:

### 1. Ikan Lele (*Clarias sp.*)
- **Suhu Air**: 26°C – 30°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L (Bioflok > 4.0 mg/L)
- **FCR**: 0.8 – 1.1 | **Protein**: 30%–35% (benih), 26%–30% (pembesaran)
- **Feeding Rate**: 3% – 5% biomassa/hari (pembesaran), 1% – 2% (indukan matang gonad)
- **Ukuran Panen**: 8 – 12 ekor/kg (80 – 125 g/ekor, DOC 60–75 hari) | **Harga Pasar**: Rp 20.000 – Rp 24.000/kg

### 2. Ikan Nila (*Oreochromis niloticus*)
- **Suhu Air**: 25°C – 30°C (optimal 27°C – 29°C) | **pH**: 6.5 – 8.5
- **DO**: > 4.0 mg/L (**Aerobik Ketat** — wajib aerasi kuat pada bioflok/KJA, hindari DO < 3.0 mg/L)
- **FCR**: 1.1 – 1.3 | **Protein**: 28%–32% | **Feeding Rate**: 2.5% – 3.5% biomassa/hari
- **Ukuran Panen**: 3 – 5 ekor/kg (200 – 350 g/ekor konsumsi lokal) atau 500 – 800 g (fillet ekspor) | **Harga Pasar**: Rp 26.000 – Rp 32.000/kg

### 3. Ikan Gurame (*Osphronemus goramy*)
- **Suhu Air**: 25°C – 28°C | **pH**: 6.5 – 8.0 | **DO**: > 3.0 mg/L
- **FCR**: 1.3 – 1.6 | **Protein**: 28%–32% pelet + pakan hijauan wajib (daun sente, daun talas, kangkung)
- **Ukuran Panen**: 500 – 800 g/ekor (masa budidaya 8–12 bulan) atau porsi 350–500 g | **Harga Pasar**: Rp 35.000 – Rp 45.000/kg

### 4. Udang Vaname (*Litopenaeus vannamei*)
- **Suhu Air**: 28°C – 31°C (fluktuasi harian < 2°C) | **pH**: 7.5 – 8.3 (fluktuasi harian < 0.5)
- **DO**: > 4.5 mg/L (wajib kincir air tambak paddlewheel kontinu terutama malam hari)
- **Salinitas**: 15 – 25 ppt (tambak pesisir) atau 2 – 5 ppt (low-salinity kolam darat fortifikasi mineral rasio Mg:Ca 3:1)
- **Alkalinitas**: > 120 ppm ($CaCO_3$, ideal 130–160 ppm untuk sukses molting) | **FCR**: 1.2 – 1.5 | **Protein**: 32%–38%
- **Ukuran Panen**: Size 40 – 80 ekor/kg (DOC 90–110 hari) | **Harga Pasar**: Rp 65.000 – Rp 90.000/kg

### 5. Lobster Air Tawar (*Cherax quadricarinatus - Red Claw*)
- **Suhu Air**: 24°C – 29°C | **pH**: 7.0 – 8.5 | **DO**: > 4.0 mg/L
- **Kesadahan Kalsium**: > 50 – 100 ppm $CaCO_3$ (krusial untuk pembentukan karapas baru saat molting)
- **Shelter Wajib**: Pipa paralon PVC / bata berlubang rasio 1.5x populasi untuk mencegah kanibalisme saat molting
- **FCR**: 1.2 – 1.6 | **Pakan**: Pelet tenggelam 30%–35% + pakan alami | **Panen**: 10 – 15 ekor/kg (70–100 g) | **Harga**: Rp 120.000 – Rp 180.000/kg

### 6. Komoditas Lain (Patin, Gabus, Bawal, Kepiting Bakau, Bandeng)
- **Ikan Patin**: Suhu 27–30°C, pH 6.5–8.0, FCR 1.1–1.3, protein 26–30%, panen 800–1.200g, harga Rp 18rb–23rb/kg.
- **Ikan Gabus**: Suhu 26–31°C, pH 6.5–8.0, FCR 1.2–1.5, protein 38–45% (karnivora), panen 300–600g (kaya albumin), harga Rp 50rb–75rb/kg.
- **Ikan Bawal**: Suhu 25–29°C, pH 6.5–7.5, FCR 1.1–1.4, protein 26–30%, panen 250–350g, harga Rp 22rb–27rb/kg.
- **Kepiting Bakau (Crab Box)**: Suhu 27–31°C, salinitas 15–25 ppt, apartemen vertikal RAS, panen 250–500g, harga Rp 90rb–160rb/kg.
- **Ikan Bandeng**: Suhu 27–31°C, salinitas 10–30 ppt, FCR 1.1–1.3, panen 4–6 ekor/kg, harga Rp 24rb–30rb/kg.

---

## 3. Format GEO (Generative Engine Optimization)

1. **Blok Ringkasan Inti (Key Takeaways)**:
   Wajib tepat setelah paragraf pembuka:
   ```markdown
   > [!NOTE]
   > **Ringkasan Inti (Key Takeaways):**
   > - [Parameter teknis SNI spesifik komoditas]
   > - [Rekomendasi operasional pembudidaya]
   > - [Estimasi FCR & analisa biaya pasar IDR]
   > - [Mitigasi risiko penyakit/kegagalan kolam]
   ```

2. **Direct Answer Lead-in pada Setiap `##` Heading**:
   Paragraf pertama (40–60 kata) harus berupa jawaban lugas, definisi langsung, atau kesimpulan faktual sebelum menguraikan detail.

3. **Tabel Parameter atau Komparasi Markdown**:
   Minimal 1 tabel Markdown terstruktur lengkap dengan header separator `|---|`.

4. **SOP & Formula Kalkulasi Plain Text (Tanpa LaTeX)**:
   DILARANG menggunakan LaTeX math (`\frac`, `\text`, `\[`, `\]`). Gunakan teks tebal dengan simbol aritmatika standar:
   > **Rumus FCR:** Total Pakan Diberikan (kg) ÷ Total Pertambahan Bobot Biomassa (kg)  
   > **Rumus Kebutuhan Pakan Harian:** Total Biomassa Kolam (kg) × Persentase FR (% per hari)

5. **Struktur FAQ Spesifik**:
   4–5 butir pertanyaan teknis format `### Pertanyaan?` dengan jawaban singkat 2-3 kalimat padat.

---

## 4. On-Page SEO & Anti-Hallucination Guard

- Menyisipkan 2–3 tautan internal dari database Cloudflare D1: `[Anchor Text Alami](/artikel/existing-slug)`.
- **Anti-Hallucination Guard**: Slug yang tidak terdaftar di D1 otomatis dibersihkan menjadi *plain anchor text* agar tidak menghasilkan 404 broken link.

---

## 5. Implementasi Kode Terkait

- **Skill Core**: `lib/ai/skills/article-writer-skill.ts`
- **Orchestrator V2**: `lib/ai/generator/orchestrator.ts`
- **Outline Builder**: `lib/ai/generator/outline/builder.ts`
- **Chunk Generator**: `lib/ai/generator/chunk/engine.ts`
- **Commodity-Aware Prompter**: `lib/ai/groq.ts`
- **Contextual Fallbacks**: `lib/ai/cloudflare-image.ts`
- **Auto Post Cron**: `scripts/auto-post.ts`
- **GitHub Workflow**: `.github/workflows/auto-post.yml`
