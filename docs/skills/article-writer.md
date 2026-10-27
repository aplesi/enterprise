# Aplesi Master Article Writer Skill — Dokumentasi Teknis

Standard panduan resmi untuk penulisan artikel edukasi budidaya perikanan air tawar (khususnya ikan lele / *Clarias sp.*) di platform APLESI (Asosiasi Peternak Lele Seluruh Indonesia).

Skill ini diintegrasikan langsung ke dalam pipeline pembuatan artikel (`lib/ai/generator/`, `scripts/auto-post.ts`, dan workflow GitHub Actions) untuk memastikan setiap artikel memiliki otoritas tinggi (high-authority), akurat secara saintifik, dan diutamakan oleh mesin pencari AI (Google AI Overview, Perplexity, ChatGPT Search).

---

## 1. Jadwal Publikasi 2x Sehari (12-Hour Interval)

Artikel dipublikasikan secara otomatis 2 kali per hari melalui cron GitHub Actions (`.github/workflows/auto-post.yml`):

| Sesi | Jadwal UTC | Jadwal WIB | Kluster Kategori Prioritas | Fokus Konten |
| :--- | :--- | :--- | :--- | :--- |
| **Morning Batch** | `0 0 * * *` | 07:00 WIB | `Manajemen Kolam`, `Pembenihan`, `Pakan`, `Penyakit & Pengobatan` | Operasional kolam, kualitas air, SOP pakan, diagnosis penyakit |
| **Evening Batch** | `0 12 * * *` | 19:00 WIB | `Bisnis & Pemasaran`, `Teknologi`, `Panen & Pascapanen`, `Tips & Trik` | Analisis modal/BEP, kemitraan pasar, hilirisasi, otomatisasi IoT |

Pemisahan kluster ini menjamin diversitas konten harian agar pembudidaya dan audiens bisnis mendapatkan variasi topik yang seimbang.

---

## 2. Tiga Pilar Standar Penulisan

### Pilar A: Akurasi Teknis & Batasan Saintifik (SNI / KKP)
Setiap artikel yang dihasilkan **WAJIB** tunduk pada ambang batas parameter ilmiah akuakultur Indonesia. Dilarang keras merekomendasikan angka atau takaran yang berpotensi menyebabkan kematian massal ikan:

1. **Parameter Air Ikan Lele (*Clarias sp.*)**:
   - **Suhu Air**: 26°C – 30°C (toleransi kritis 24°C – 32°C).
   - **pH Air**: 6.5 – 8.0 (optimal 7.0 – 7.5).
   - **Oksigen Terlarut (DO)**: > 3.0 mg/L (pada kolam bioflok intensif > 4.0 mg/L).
   - **Amonia Bebas (TAN / $NH_3$)**: < 0.1 mg/L.
   - **Nitrit ($NO_2$)**: < 0.2 mg/L.
   - **Volume Flok Bioflok**: 15 – 40 mL/L (diukur menggunakan Kerucut Imhoff setelah sedimentasi 30 menit).

2. **Nutrisi, Pakan & FCR**:
   - **Target FCR (Feed Conversion Ratio)**: 0.8 – 1.1 pada kolam terpal/bioflok terkontrol.
   - **Kadar Protein Pakan Benih (2-3 cm s.d 7-9 cm)**: 30% – 35%.
   - **Kadar Protein Pakan Pembesaran**: 26% – 30%.
   - **Rasio C/N Bioflok**: 12:1 hingga 15:1 (menggunakan sumber karbon molase/tetes tebu + inokulan probiotik *Bacillus sp.*).
   - **Dosis Garam Krosok**: 1 – 2 kg/$m^3$ air kolam untuk pencegahan jamur/parasit dan stabilisasi osmoregulasi saat pergantian cuaca.

3. **Acuan Biaya Riil Pasar Indonesia (Rupiah)**:
   - **Pakan Pabrikan Apung**: Rp 320.000 – Rp 380.000 per sak 30 kg (protein 30-32%).
   - **Benih Lele Ukuran 5-7 cm**: Rp 180 – Rp 250 per ekor.
   - **Benih Lele Ukuran 7-9 cm**: Rp 250 – Rp 350 per ekor.
   - **Harga Jual Panen Pembudidaya**: Rp 20.000 – Rp 24.000 per kg di tingkat kolam (size 8-10 ekor/kg).

---

### Pilar B: Format GEO (Generative Engine Optimization)
AI Search Engines mengindeks dokumen berdasarkan kerapatan fakta (fact-density) dan keteraturan semantik:

1. **Blok Ringkasan Inti (Key Takeaways)**:
   Tepat setelah paragraf pembuka (sebelum heading `##` pertama), WAJIB mencantumkan callout block GitHub-style:
   ```markdown
   > [!NOTE]
   > **Ringkasan Inti (Key Takeaways):**
   > - [Data kunci 1: Parameter teknis / angka acuan SNI]
   > - [Rekomendasi praktis 2: Tindakan operasional pembudidaya]
   > - [Estimasi biaya / FCR 3: Efisiensi produksi]
   > - [Mitigasi risiko 4: Solusi pencegahan kegagalan]
   ```

2. **Direct Answer Lead-in pada Setiap `##` Heading**:
   Paragraf pertama (40–60 kata) di bawah setiap heading `##` harus berupa jawaban lugas, definisi langsung, atau kesimpulan berbasis data sebelum masuk ke uraian langkah teknis.

3. **Tabel Parameter atau Komparasi Markdown**:
   Minimal 1 tabel Markdown terstruktur lengkap dengan header separator `|---|`.

4. **SOP & Formula Kalkulasi Konkret**:
   Mencantumkan rumus matematis aplikatif, contoh:
   $$\text{FCR} = \frac{\text{Total Pakan Diberikan (kg)}}{\text{Bobot Total Panen (kg)} - \text{Bobot Awal Benih (kg)}}$$

5. **Struktur Pertanyaan FAQ Spesifik**:
   4–5 butir pertanyaan teknis format `### Pertanyaan?` dengan jawaban singkat 2-3 kalimat padat.

---

### Pilar C: On-Page SEO & Tautan Internal Dinamis dari Cloudflare D1
Untuk memperkuat *internal topical authority*:
- Mengambil 3–5 artikel relevan yang sudah ada dari database Cloudflare D1.
- Menyisipkan 2–3 tautan alami dengan format `[Anchor Text Alami](/artikel/existing-slug)`.
- **Anti-Hallucination Guard**: Sistem secara otomatis memvalidasi slug yang ditautkan. Jika LLM membuat link ke slug fiktif yang tidak ada di D1, tautan otomatis dibersihkan menjadi *plain anchor text* agar tidak menimbulkan *HTTP 404 Broken Link*.

---

## 3. Pre-Publish Quality Gate & Validator

Sebelum artikel disimpan ke database D1 atau file `.md`, fungsi `validateAndSanitizeArticle()` di `lib/ai/skills/article-writer-skill.ts` melakukan validasi otomatis:

- **Word Count**: Memastikan panjang konten minimal 1.200 kata.
- **Tabel Markdown**: Memvalidasi regex `|.+?|[\r\n]+\|[-:| ]+\|`.
- **Jumlah FAQ**: Memvalidasi minimal 3 pertanyaan bertanda `?`.
- **Link Sanitizer**: Membersihkan slug halusinasi tanpa merusak keterbacaan artikel.

---

## 4. Implementasi Kode Terkait

- **Skill Core**: `lib/ai/skills/article-writer-skill.ts`
- **Orchestrator V2**: `lib/ai/generator/orchestrator.ts`
- **Outline Builder**: `lib/ai/generator/outline/builder.ts`
- **Chunk Generator**: `lib/ai/generator/chunk/engine.ts`
- **Auto Post Cron**: `scripts/auto-post.ts`
- **GitHub Workflow**: `.github/workflows/auto-post.yml`
