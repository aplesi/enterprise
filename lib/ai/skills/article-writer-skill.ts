// lib/ai/skills/article-writer-skill.ts
// Skill Otomatis Penulis Artikel Master APLESI
// Menggabungkan 3 Pilar:
// 1. Akurasi Teknis Akuakultur SNI / KKP
// 2. Format GEO (Generative Engine Optimization) untuk AI Search Engines (Perplexity, ChatGPT, SGE)
// 3. On-Page SEO & Validasi Internal Linking Bebas Halusinasi

export interface AquacultureStandards {
  catfish: {
    temperature: string
    pH: string
    dissolvedOxygen: string
    tanAmmonia: string
    nitrite: string
    flocVolume: string
    fcr: string
    proteinNursery: string
    proteinGrowout: string
    bioflocCnRatio: string
    saltDosage: string
  }
  pricingIDR: {
    feedPerSack: string
    fingerlings57cm: string
    fingerlings79cm: string
    harvestMarketPrice: string
  }
}

export const AQUACULTURE_STANDARDS: AquacultureStandards = {
  catfish: {
    temperature: '26°C – 30°C',
    pH: '6.5 – 8.0 (optimal 7.0 – 7.5)',
    dissolvedOxygen: '> 3.0 mg/L (Sistem Bioflok > 4.0 mg/L)',
    tanAmmonia: '< 0.1 mg/L (NH3)',
    nitrite: '< 0.2 mg/L (NO2)',
    flocVolume: '15 – 40 mL/L (diukur menggunakan Kerucut Imhoff)',
    fcr: '0.8 – 1.1 (manajemen pakan berkualitas terkontrol)',
    proteinNursery: '30% – 35% (benih ukuran 2-3 cm hingga 7-9 cm)',
    proteinGrowout: '26% – 30% (tahap pembesaran hingga panen konsumsi)',
    bioflocCnRatio: '12:1 sampai 15:1 (sumber karbon molase/tetes tebu + inokulan Bacillus sp.)',
    saltDosage: '1 – 2 kg/m³ garam krosok non-yodium untuk antiseptik & osmoregulasi',
  },
  pricingIDR: {
    feedPerSack: 'Rp 320.000 – Rp 380.000 per sak 30 kg (protein 30-32%)',
    fingerlings57cm: 'Rp 180 – Rp 250 per ekor',
    fingerlings79cm: 'Rp 250 – Rp 350 per ekor',
    harvestMarketPrice: 'Rp 20.000 – Rp 24.000 per kg di tingkat kolam pembudidaya (size 8-10 ekor/kg)',
  },
}

export interface InternalLinkTarget {
  slug: string
  judul: string
}

export interface WriterSkillContext {
  topik: string
  kategori: string
  keywords: string[]
  existingTitles?: string[]
  internalLinkTargets?: InternalLinkTarget[]
}

/**
 * Menyusun batasan domain pengetahuan standar SNI / KKP untuk prompt AI.
 */
export function buildTechnicalDomainBounds(): string {
  const s = AQUACULTURE_STANDARDS
  return `=== STANDAR TEKNIS AKUAKULTUR INDONESIA (SNI / KKP) — WAJIB DIPATUHI ===
1. Parameter Kualitas Air Ikan Lele (Clarias sp.):
   - Suhu Air: ${s.catfish.temperature}
   - pH Air: ${s.catfish.pH}
   - Oksigen Terlarut (DO): ${s.catfish.dissolvedOxygen}
   - Amonia Bebas (TAN / NH3): ${s.catfish.tanAmmonia}
   - Nitrit (NO2): ${s.catfish.nitrite}
   - Volume Flok Bioflok: ${s.catfish.flocVolume}
2. Produksi, Nutrisi & FCR:
   - Target FCR Ideal: ${s.catfish.fcr}
   - Kadar Protein Pakan Benih: ${s.catfish.proteinNursery}
   - Kadar Protein Pembesaran: ${s.catfish.proteinGrowout}
   - Rasio C/N Bioflok: ${s.catfish.bioflocCnRatio}
   - Dosis Garam Krosok: ${s.catfish.saltDosage}
3. Acuan Biaya Riil Pasar Indonesia (Rupiah):
   - Pakan Pabrikan: ${s.pricingIDR.feedPerSack}
   - Benih Lele Ukur 5-7 cm: ${s.pricingIDR.fingerlings57cm}
   - Benih Lele Ukur 7-9 cm: ${s.pricingIDR.fingerlings79cm}
   - Harga Jual Panen Pembudidaya: ${s.pricingIDR.harvestMarketPrice}

DILARANG KERAS MENGHALUSINASIKAN parameter di luar ambang batas ilmiah di atas!`
}

/**
 * Menyusun instruksi format GEO (Generative Engine Optimization)
 */
export function buildGeoFormattingRules(linkTargets?: InternalLinkTarget[]): string {
  let linkInstruction = ''
  if (linkTargets && linkTargets.length > 0) {
    linkInstruction = `\n5. ON-PAGE SEO & TAUTAN INTERNAL (INTERNAL LINKS):
   Sisipkan secara natural 2-3 tautan internal dari daftar artikel resmi APLESI berikut ke dalam paragraf pembahasan yang relevan.
   Format Markdown: [Teks Anchor Alami](/artikel/slug-artikel)
   Daftar artikel yang tersedia untuk ditautkan:
${linkTargets.slice(0, 5).map(t => `   - [${t.judul}](/artikel/${t.slug})`).join('\n')}
   DILARANG KERAS membuat link ke slug yang tidak ada di daftar di atas!`
  }

  return `=== ATURAN FORMAT GEO (GENERATIVE ENGINE OPTIMIZATION) UNTUK SEARCH ENGINE AI ===
1. BLOK RINGKASAN INTI (KEY TAKEAWAYS):
   Tepat di bagian awal setelah paragraf pembuka, WAJIB sertakan callout blok berikut:
   > [!NOTE]
   > **Ringkasan Inti (Key Takeaways):**
   > - [Data kunci 1: Parameter teknis / angka acuan SNI]
   > - [Rekomendasi praktis 2: Tindakan operasional pembudidaya]
   > - [Estimasi biaya / FCR 3: Efisiensi produksi]
   > - [Mitigasi risiko 4: Solusi pencegahan kegagalan]

2. DIRECT ANSWER LEAD-INS:
   Setiap section heading ## WAJIB dibuka dengan paragraf pertama (40–60 kata) yang langsung memberikan jawaban lugas, definisi, atau kesimpulan faktual sebelum menguraikan langkah teknis lebih detail.

3. TABEL PARAMETER / KOMPARASI MARKDOWN:
   Wajib memiliki minimal satu tabel Markdown terstruktur (| Parameter | Standar Ideal | Dampak Buruk | Solusi Koreksi | atau tabel analisa biaya).

4. SOP & FORMULA KALKULASI KONKRET:
   Wajib mencantumkan minimal satu rumus atau SOP perhitungan matematis praktis (contoh: rumus FCR = Total Pakan / (Bobot Panen - Bobot Awal), atau rumus penambahan molase C/N, atau feeding rate 3-5% biomassa).

5. STRUKTUR FAQ SPESIFIK:
   Pada section FAQ, buat 4–5 pertanyaan teknis menggunakan heading ### Pertanyaan? diikuti jawaban langsung 2-3 kalimat padat.${linkInstruction}`
}

/**
 * Membangun system prompt komprehensif untuk generator AI
 */
export function buildMasterWriterSystemPrompt(context: WriterSkillContext): string {
  return `Kamu adalah "Master Fisheries Specialist & Senior Technical Writer" dari APLESI (Asosiasi Peternak Lele Seluruh Indonesia).
Tugasmu adalah menyusun artikel panduan budidaya perikanan air tawar Indonesia yang sangat otoritatif, akurat secara SNI/KKP, komprehensif (in-depth), dan teroptimasi untuk Google AI Overview, Perplexity, dan ChatGPT Search.

${buildTechnicalDomainBounds()}

${buildGeoFormattingRules(context.internalLinkTargets)}

GAYA PENULISAN:
- Bahasa Indonesia baku teknis profesional, lugas, mengalir, dan mudah dipahami pembudidaya lapangan.
- Zero-fluff: Hindari kalimat basa-basi seperti "Dalam era modern ini...", "Perlu kita ketahui bersama...", atau "Semoga artikel ini bermanfaat".
- Fokus pada solusi aplikatif, data metrik, prosedur bertahap, dan mitigasi kegagalan kolam.`
}

export interface ValidationReport {
  valid: boolean
  errors: string[]
  sanitizedContent: string
  stats: {
    wordCount: number
    hasTable: boolean
    internalLinkCount: number
    faqCount: number
    strippedHallucinatedLinks: number
  }
}

/**
 * Validasi ketat artikel hasil generate sebelum publish ke D1/Markdown:
 * 1. Memeriksa jumlah kata (minimal 1.200 kata).
 * 2. Memeriksa keberadaan tabel Markdown.
 * 3. Memeriksa keberadaan FAQ.
 * 4. Memverifikasi internal links: Link ke /artikel/(slug) yang tidak ada di validSlugs
 *    otomatis dibersihkan menjadi plain text agar tidak menghasilkan 404 broken link!
 */
export function validateAndSanitizeArticle(
  content: string,
  validSlugs: Set<string>
): ValidationReport {
  const errors: string[] = []

  // 1. Hitung jumlah kata
  const words = content.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  if (wordCount < 1200) {
    errors.push(`Jumlah kata (${wordCount}) di bawah batas minimum 1.200 kata`)
  }

  // 2. Cek tabel markdown (| Header | Header |)
  const hasTable = /\|.+?\|[\r\n]+\|[-:| ]+\|/m.test(content)
  if (!hasTable) {
    errors.push('Artikel belum memiliki tabel Markdown terstruktur')
  }

  // 3. Cek FAQ
  const faqMatches = content.match(/###\s+[^?\n]+\?/g) || []
  const faqCount = faqMatches.length
  if (faqCount < 3) {
    errors.push(`Jumlah pertanyaan FAQ (${faqCount}) kurang dari minimal 3 pertanyaan`)
  }

  // 4. Validasi dan Sanitasi Internal Links
  // Pola: [Anchor Text](/artikel/slug-target)
  let internalLinkCount = 0
  let strippedHallucinatedLinks = 0

  const sanitizedContent = content.replace(
    /\[([^\]]+)\]\((\/artikel\/([a-zA-Z0-9_-]+))\)/g,
    (match, anchorText, fullPath, slug) => {
      // Jika slug terdaftar di D1, pertahankan link
      if (validSlugs.has(slug)) {
        internalLinkCount++
        return match
      }

      // Cek apakah ada slug yang sangat mirip (substring match)
      const potentialMatch = Array.from(validSlugs).find(
        (vs) => vs.includes(slug) || slug.includes(vs)
      )
      if (potentialMatch) {
        internalLinkCount++
        return `[${anchorText}](/artikel/${potentialMatch})`
      }

      // Jika slug tidak valid dan halusinasi LLM, bersihkan menjadi plain anchor text agar tidak 404
      strippedHallucinatedLinks++
      return anchorText
    }
  )

  return {
    valid: errors.length === 0,
    errors,
    sanitizedContent,
    stats: {
      wordCount,
      hasTable,
      internalLinkCount,
      faqCount,
      strippedHallucinatedLinks,
    },
  }
}
