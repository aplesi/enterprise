// lib/ai/skills/article-writer-skill.ts
// Skill Otomatis Penulis Artikel Master APLESI
// Menggabungkan 3 Pilar Multi-Komoditas Perikanan & Krustasea Indonesia:
// 1. Akurasi Teknis Akuakultur Multi-Spesies SNI / KKP (Lele, Nila, Gurame, Vaname, Lobster, Patin, Gabus, dll.)
// 2. Format GEO (Generative Engine Optimization) untuk AI Search Engines (Perplexity, ChatGPT, SGE)
// 3. On-Page SEO & Validasi Internal Linking Bebas Halusinasi

export type AquacultureCommodity =
  | 'lele'
  | 'nila'
  | 'gurame'
  | 'vaname'
  | 'lobster'
  | 'patin'
  | 'gabus'
  | 'bawal'
  | 'udang_galah'
  | 'kepiting'
  | 'bandeng'
  | 'kakap'
  | 'general'

export interface CommodityParameters {
  scientificName: string
  commonName: string
  temperature: string
  pH: string
  dissolvedOxygen: string
  salinityOrHardness?: string
  tanAmmonia: string
  nitrite: string
  fcr: string
  feedProtein: string
  feedingRate: string
  harvestSize: string
  culturePeriod: string
  marketPriceIDR: string
  keyRiskMitigation: string
}

export const COMMODITY_STANDARDS: Record<AquacultureCommodity, CommodityParameters> = {
  lele: {
    scientificName: 'Clarias sp.',
    commonName: 'Ikan Lele',
    temperature: '26°C – 30°C',
    pH: '6.5 – 8.0 (optimal 7.0 – 7.5)',
    dissolvedOxygen: '> 3.0 mg/L (Sistem Bioflok > 4.0 mg/L)',
    tanAmmonia: '< 0.1 mg/L (NH3)',
    nitrite: '< 0.2 mg/L (NO2)',
    fcr: '0.8 – 1.1 (kolam terpal/bioflok terkontrol)',
    feedProtein: '30% – 35% (benih ukur 2-7 cm), 26% – 30% (pembesaran)',
    feedingRate: '3% – 5% total biomassa/hari (pembesaran), 1% – 2% (indukan matang gonad)',
    harvestSize: '8 – 12 ekor/kg (bobot 80 – 125 gram/ekor konsumsi warung/pecel lele)',
    culturePeriod: '60 – 75 hari dari benih ukur 7-9 cm',
    marketPriceIDR: 'Rp 20.000 – Rp 24.000 per kg di tingkat kolam pembudidaya',
    keyRiskMitigation: 'Volume flok bioflok dijaga 15–40 mL/L, garam krosok 1–2 kg/m³ untuk cegah moncong putih/aeromonas, grading per 15-20 hari cegah kanibalisme.',
  },
  nila: {
    scientificName: 'Oreochromis niloticus',
    commonName: 'Ikan Nila (Nila Hitam / Nila Merah Gesit/Sultana)',
    temperature: '25°C – 30°C (optimal 27°C – 29°C)',
    pH: '6.5 – 8.5 (optimal 7.0 – 8.0)',
    dissolvedOxygen: '> 4.0 mg/L (STRICTLY AEROBIC — butuh blower/venturi intensif pada bioflok/KJA, hindari DO < 3.0 mg/L)',
    tanAmmonia: '< 0.05 mg/L',
    nitrite: '< 0.1 mg/L',
    fcr: '1.1 – 1.3 (pelet apung berkualitas)',
    feedProtein: '30% – 32% (benih), 28% – 32% (pembesaran komersial)',
    feedingRate: '2.5% – 3.5% total biomassa/hari (dibagi 2-3 kali)',
    harvestSize: '3 – 5 ekor/kg (bobot 200 – 350 gram/ekor konsumsi lokal/restoran) atau 500 – 800 gram/ekor (fillet ekspor)',
    culturePeriod: '90 – 120 hari dari benih 5-7 cm',
    marketPriceIDR: 'Rp 26.000 – Rp 32.000 per kg di tingkat pembudidaya',
    keyRiskMitigation: 'Aerasi kontinu mencegah kematian masal hipoksia malam hari, vaksinasi Streptococcus agalactiae untuk cegah penyakit mata menonjol (pop-eye/streptococcosis).',
  },
  gurame: {
    scientificName: 'Osphronemus goramy',
    commonName: 'Ikan Gurame',
    temperature: '25°C – 28°C',
    pH: '6.5 – 8.0',
    dissolvedOxygen: '> 3.0 mg/L',
    tanAmmonia: '< 0.05 mg/L',
    nitrite: '< 0.1 mg/L',
    fcr: '1.3 – 1.6 (kombinasi pelet komersial + pakan hijauan)',
    feedProtein: '28% – 32% (pelet) + pakan serat hijauan (daun sente, daun talas, kangkung, daun kimpul)',
    feedingRate: '2% – 3% biomassa pelet/hari ditambah hijauan 5%–10% bobot ikan',
    harvestSize: '500 – 800 gram/ekor (size 1-2 ekor/kg) atau porsi restoran 350–500 gram/ekor',
    culturePeriod: '8 – 12 bulan (pembesaran bertahap dengan beberapa kali pendederan)',
    marketPriceIDR: 'Rp 35.000 – Rp 45.000 per kg (komoditas kuliner bernilai tinggi)',
    keyRiskMitigation: 'Pemberian daun sente/talas melancarkan pencernaan dan mencegah infeksi Aeromonas/jamur Saprolegnia; air kolam harus tenang dengan kedalaman minimal 1–1.2 m.',
  },
  vaname: {
    scientificName: 'Litopenaeus vannamei',
    commonName: 'Udang Vaname (Whiteleg Shrimp)',
    temperature: '28°C – 31°C (fluktuasi harian ketat < 2°C)',
    pH: '7.5 – 8.3 (fluktuasi harian maksimum 0.5 unit antara pagi dan sore)',
    dissolvedOxygen: '> 4.5 mg/L (wajib kincir air tambak paddlewheel kontinu, terutama pukul 22:00 – 06:00)',
    salinityOrHardness: 'Salinitas optimal 15 – 25 ppt (tambak pesisir) atau 2 – 5 ppt (low-salinity kolam darat terpal HDPE dengan fortifikasi mineral Mg:Ca rasio 3:1)',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.1 mg/L',
    fcr: '1.2 – 1.5',
    feedProtein: '32% – 38% pelet crumble/pellet khusus udang',
    feedingRate: 'Disesuaikan hasil cek anco (feeding tray) per 2 – 2.5 jam pasca pemberian pakan',
    harvestSize: 'Size 40 – 80 ekor/kg (DOC 90 – 110 hari)',
    culturePeriod: '90 – 110 hari (Days of Culture / DOC)',
    marketPriceIDR: 'Rp 65.000 – Rp 90.000 per kg (size 40-50 bernilai premium ekspor)',
    keyRiskMitigation: 'Alkalinitas wajib > 120 ppm (CaCO3) untuk sukses ganti kulit (molting); biosekuriti ketat cegah White Spot Syndrome Virus (WSSV) dan Enterocytozoon hepatopenaei (EHP).',
  },
  lobster: {
    scientificName: 'Cherax quadricarinatus',
    commonName: 'Lobster Air Tawar (Red Claw Crayfish)',
    temperature: '24°C – 29°C (optimal 26°C – 28°C)',
    pH: '7.0 – 8.5 (cenderung alkali/basa)',
    dissolvedOxygen: '> 4.0 mg/L',
    salinityOrHardness: 'Kesadahan Kalsium (Calcium Hardness): > 50 – 100 ppm CaCO3',
    tanAmmonia: '< 0.05 mg/L',
    nitrite: '< 0.05 mg/L',
    fcr: '1.2 – 1.6',
    feedProtein: '30% – 35% pelet tenggelam (sinking pellet) + pakan alami segar (cacing beku, tauge, wortel, keong)',
    feedingRate: '2% – 3% dari biomassa populasi per hari, diberikan pada sore/malam hari (nokturnal)',
    harvestSize: '10 – 15 ekor/kg (bobot 70 – 100 gram/ekor konsumsi restoran/ekspor)',
    culturePeriod: '6 – 8 bulan dari burayak/benih 2 inci',
    marketPriceIDR: 'Rp 120.000 – Rp 180.000 per kg untuk ukuran konsumsi, indukan Rp 25.000 – Rp 50.000/set',
    keyRiskMitigation: 'SHELTER WAJIB: Sediakan potongan pipa paralon PVC / roster bata berlubang dengan rasio minimal 1.5x dari total populasi untuk cegah kanibalisme saat molting (cangkang lunak).',
  },
  patin: {
    scientificName: 'Pangasius sp.',
    commonName: 'Ikan Patin (Siam / Jambal)',
    temperature: '27°C – 30°C',
    pH: '6.5 – 8.0',
    dissolvedOxygen: '> 3.0 mg/L',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.2 mg/L',
    fcr: '1.1 – 1.3',
    feedProtein: '26% – 30% pelet apung',
    feedingRate: '2.5% – 3.5% biomassa/hari',
    harvestSize: '800 – 1.200 gram/ekor (bobot fillet industri/pasar tradisional)',
    culturePeriod: '5 – 6 bulan dari benih ukur 2 inci',
    marketPriceIDR: 'Rp 18.000 – Rp 23.000 per kg',
    keyRiskMitigation: 'Dasar kolam wajib bersih dari endapan hidrogen sulfida (H2S) agar daging ikan tidak berbau lumpur (off-flavor geosmin).',
  },
  gabus: {
    scientificName: 'Channa striata',
    commonName: 'Ikan Gabus (Haruan / Snakehead)',
    temperature: '26°C – 31°C',
    pH: '6.5 – 8.0',
    dissolvedOxygen: '> 3.0 mg/L (memiliki organ pernapasan labirin tambahan)',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.2 mg/L',
    fcr: '1.2 – 1.5',
    feedProtein: '38% – 45% (karnivora murni, pelet apung protein tinggi atau ikan rucah giling)',
    feedingRate: '3% – 5% biomassa/hari',
    harvestSize: '300 – 600 gram/ekor (usia 6–8 bulan, kadar albumin optimal)',
    culturePeriod: '6 – 8 bulan',
    marketPriceIDR: 'Rp 50.000 – Rp 75.000 per kg (bernilai tinggi untuk industri farmasi ekstrak albumin & kuliner)',
    keyRiskMitigation: 'Waring/jaring penutup kolam setinggi 50 cm wajib dipasang karena gabus sangat lincah melompat keluar kolam saat malam/hujan.',
  },
  bawal: {
    scientificName: 'Colossoma macropomum',
    commonName: 'Ikan Bawal Air Tawar',
    temperature: '25°C – 29°C',
    pH: '6.5 – 7.5',
    dissolvedOxygen: '> 3.5 mg/L',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.15 mg/L',
    fcr: '1.1 – 1.4',
    feedProtein: '26% – 30% (omnivora pemakan rakus)',
    feedingRate: '3% – 4% biomassa/hari',
    harvestSize: '3 – 4 ekor/kg (bobot 250 – 350 gram/ekor)',
    culturePeriod: '90 – 110 hari dari benih 2-3 inci',
    marketPriceIDR: 'Rp 22.000 – Rp 27.000 per kg',
    keyRiskMitigation: 'Konstruksi kolam terpal harus tebal karena gigi bawal tajam dapat merobek dinding terpal tipis saat lapar.',
  },
  udang_galah: {
    scientificName: 'Macrobrachium rosenbergii',
    commonName: 'Udang Galah (Giant Freshwater Prawn)',
    temperature: '28°C – 31°C',
    pH: '7.0 – 8.5',
    dissolvedOxygen: '> 4.0 mg/L',
    salinityOrHardness: 'Air tawar murni (larva butuh air payau 12 ppt, pembesaran 0 ppt), kesadahan > 50 ppm',
    tanAmmonia: '< 0.05 mg/L',
    nitrite: '< 0.05 mg/L',
    fcr: '1.3 – 1.6',
    feedProtein: '30% – 35%',
    feedingRate: '3% – 5% biomassa/hari (pelet tenggelam)',
    harvestSize: '20 – 30 ekor/kg (bobot 35 – 50 gram/ekor)',
    culturePeriod: '4 – 6 bulan',
    marketPriceIDR: 'Rp 80.000 – Rp 120.000 per kg',
    keyRiskMitigation: 'Pemberian ranting/waring shelter di dasar kolam mengurangi sifat agresif capit panjang (cheliped) jantan dominan.',
  },
  kepiting: {
    scientificName: 'Scylla serrata',
    commonName: 'Kepiting Bakau (Sistem Apartemen / Crab Box Indoor)',
    temperature: '27°C – 31°C',
    pH: '7.5 – 8.5',
    dissolvedOxygen: '> 4.0 mg/L',
    salinityOrHardness: 'Salinitas 15 – 25 ppt (RAS air laut/payau sintetis atau tambak)',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.1 mg/L',
    fcr: 'Efisiensi pakan segar 3% – 5% bobot tubuh',
    feedProtein: 'Ikan rucah segar, keong mas, atau kerang (protein hewani segar)',
    feedingRate: '1 kali sehari di sore hari (3%–5% bobot badan)',
    harvestSize: '250 – 500 gram/ekor (kepiting gemuk isi daging, kepiting telur, atau kepiting cangkang lunak/soka)',
    culturePeriod: '20 – 30 hari untuk fattening (penggemukan) atau 15-20 hari untuk soka',
    marketPriceIDR: 'Rp 90.000 – Rp 160.000 per kg (super jantan/telur bernilai ekspor)',
    keyRiskMitigation: 'Sistem box vertikal individual 1 box = 1 kepiting mengeliminasi kanibalisme 100%, sirkulasi air RAS dengan protein skimmer wajib aktif.',
  },
  bandeng: {
    scientificName: 'Chanos chanos',
    commonName: 'Ikan Bandeng',
    temperature: '27°C – 31°C',
    pH: '7.5 – 8.5',
    dissolvedOxygen: '> 3.5 mg/L',
    salinityOrHardness: 'Salinitas euryhaline 10 – 30 ppt (dapat diadaptasi ke air tawar)',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.1 mg/L',
    fcr: '1.1 – 1.3',
    feedProtein: '24% – 28% (memanfaatkan klekap/lumut tambak + pelet tambahan)',
    feedingRate: '2% – 3% biomassa/hari',
    harvestSize: '4 – 6 ekor/kg (bobot 160 – 250 gram/ekor)',
    culturePeriod: '90 – 120 hari',
    marketPriceIDR: 'Rp 24.000 – Rp 30.000 per kg (komoditas bandeng presto & umpan pancing)',
    keyRiskMitigation: 'Penumbuhan pakan alami klekap dengan pemupukan dasar kolam tanah/terpal menghemat biaya pakan hingga 40%.',
  },
  kakap: {
    scientificName: 'Lates calcarifer',
    commonName: 'Kakap Putih (Barramundi / Siakap)',
    temperature: '28°C – 32°C',
    pH: '7.5 – 8.5',
    dissolvedOxygen: '> 4.5 mg/L',
    salinityOrHardness: 'Salinitas 15 – 32 ppt (Keramba Jaring Apung laut/muara atau kolam darat)',
    tanAmmonia: '< 0.05 mg/L',
    nitrite: '< 0.05 mg/L',
    fcr: '1.2 – 1.5',
    feedProtein: '40% – 45% (karnivora laut, pelet laut slow-sinking)',
    feedingRate: '3% – 4% biomassa/hari',
    harvestSize: '500 – 800 gram/ekor (ukuran porsi pasar ekspor & horeka)',
    culturePeriod: '6 – 8 bulan',
    marketPriceIDR: 'Rp 65.000 – Rp 85.000 per kg',
    keyRiskMitigation: 'Grading ketat setiap 10 hari pada fase benih untuk mencegah kanibalisme ekstrem sesama anakan kakap.',
  },
  general: {
    scientificName: 'Multi-Spesies Akuakultur Indonesia',
    commonName: 'Komoditas Perikanan & Krustasea Air Tawar/Payau',
    temperature: '26°C – 30°C',
    pH: '6.5 – 8.5',
    dissolvedOxygen: '> 3.5 mg/L',
    tanAmmonia: '< 0.1 mg/L',
    nitrite: '< 0.2 mg/L',
    fcr: '0.9 – 1.4 tergantung komoditas',
    feedProtein: '28% – 38% sesuai stadium hidup',
    feedingRate: '2% – 5% dari biomassa harian',
    harvestSize: 'Sesuai spesifikasi pasar (lele: 8-12 ekor/kg, nila: 3-5 ekor/kg, vaname: 40-80 ekor/kg)',
    culturePeriod: '60 – 120 hari siklus rata-rata',
    marketPriceIDR: 'Rp 20.000 – Rp 150.000 per kg sesuai komoditas',
    keyRiskMitigation: 'Pantau parameter air harian (DO, pH, suhu), sanitasi kolam teratur, patuhi SNI/KKP.',
  },
}

/**
 * Deteksi otomatis komoditas akuakultur dari teks topik atau kata kunci.
 */
export function detectCommodity(textOrKeywords: string | string[]): AquacultureCommodity {
  const raw = Array.isArray(textOrKeywords) ? textOrKeywords.join(' ') : textOrKeywords || ''
  const t = raw.toLowerCase()

  if (t.includes('vaname') || t.includes('vannamei') || t.includes('udang putih') || t.includes('tambak udang')) {
    return 'vaname'
  }
  if (t.includes('lobster') || t.includes('crayfish') || t.includes('cherax') || t.includes('red claw')) {
    return 'lobster'
  }
  if (t.includes('kepiting') || t.includes('crab box') || t.includes('apartemen kepiting') || t.includes('scylla') || t.includes('soka')) {
    return 'kepiting'
  }
  if (t.includes('udang galah') || t.includes('macrobrachium')) {
    return 'udang_galah'
  }
  if (t.includes('nila') || t.includes('tilapia') || t.includes('oreochromis')) {
    return 'nila'
  }
  if (t.includes('gurame') || t.includes('gurami') || t.includes('osphronemus')) {
    return 'gurame'
  }
  if (t.includes('patin') || t.includes('pangasius') || t.includes('jambal')) {
    return 'patin'
  }
  if (t.includes('gabus') || t.includes('channa') || t.includes('albumin') || t.includes('haruan')) {
    return 'gabus'
  }
  if (t.includes('bawal') || t.includes('colossoma')) {
    return 'bawal'
  }
  if (t.includes('bandeng') || t.includes('chanos') || t.includes('milkfish')) {
    return 'bandeng'
  }
  if (t.includes('kakap') || t.includes('barramundi') || t.includes('lates') || t.includes('siakap')) {
    return 'kakap'
  }
  if (t.includes('lele') || t.includes('clarias') || t.includes('catfish') || t.includes('bioflok lele')) {
    return 'lele'
  }

  return 'general'
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
 * Mendukung deteksi komoditas spesifik (Nila, Gurame, Udang Vaname, Lobster, dll.)
 */
export function buildTechnicalDomainBounds(topicOrKeywords?: string | string[]): string {
  const commodityKey = detectCommodity(topicOrKeywords || '')
  const c = COMMODITY_STANDARDS[commodityKey]

  const specificSection = commodityKey !== 'general'
    ? `🎯 TARGET SPESIFIK KOMODITAS: ${c.commonName} (${c.scientificName})
1. Parameter Kualitas Air Ideal (SNI / KKP):
   - Suhu Air: ${c.temperature}
   - pH Air: ${c.pH}
   - Oksigen Terlarut (DO): ${c.dissolvedOxygen}
   ${c.salinityOrHardness ? `- Salinitas / Kesadahan (Hardness): ${c.salinityOrHardness}\n   ` : ''}- Amonia Bebas (TAN): ${c.tanAmmonia}
   - Nitrit (NO2): ${c.nitrite}
2. Nutrisi, Pakan, dan FCR Standar:
   - Target FCR Baku: ${c.fcr}
   - Kadar Protein Pakan: ${c.feedProtein}
   - Dosis Pemberian Pakan (Feeding Rate / FR): ${c.feedingRate}
   - Rumus Kebutuhan Pakan Harian Baku: Pakan Harian (kg) = Total Biomassa Kolam (kg) × Persentase FR
   - Rumus FCR yang Benar: FCR = Total Pakan Diberikan (kg) ÷ (Total Bobot Panen (kg) - Bobot Awal Tebar (kg))
   - DILARANG KERAS mengarang rumus palsu seperti (FCR x Protein%) / 100!
3. Metrik Panen & Ekonomi Pasar Indonesia:
   - Ukuran Panen Standar Pasar: ${c.harvestSize}
   - Masa Pemeliharaan (Siklus Budidaya): ${c.culturePeriod}
   - Estimasi Harga Jual Panen Pembudidaya: ${c.marketPriceIDR}
   - Mitigasi Risiko Kritis Lapangan: ${c.keyRiskMitigation}`
    : `🎯 MATRIKS STANDAR TEKNIS AKUAKULTUR MULTI-KOMODITAS INDONESIA (SNI / KKP):
- LELE (Clarias sp.): Suhu 26–30°C, pH 6.5–8.0, DO > 3.0 mg/L, FCR 0.8–1.1, panen 8–12 ekor/kg (80–125g), harga Rp 20rb–24rb/kg.
- NILA (Oreochromis niloticus): Suhu 25–30°C, pH 6.5–8.5, DO > 4.0 mg/L (aerobik ketat), FCR 1.1–1.3, protein 28–32%, panen 3–5 ekor/kg (200–350g), harga Rp 26rb–32rb/kg.
- GURAME (Osphronemus goramy): Suhu 25–28°C, pH 6.5–8.0, DO > 3.0 mg/L, FCR 1.3–1.6, pelet 28–32% + daun sente/talas, panen 500–800g/ekor, harga Rp 35rb–45rb/kg.
- UDANG VANAME (Litopenaeus vannamei): Suhu 28–31°C, pH 7.5–8.3 (fluktuasi < 0.5), DO > 4.5 mg/L, Salinitas 15–25 ppt (atau 2–5 ppt fortifikasi mineral), Alkalinitas > 120 ppm, FCR 1.2–1.5, panen size 40–80 ekor/kg, harga Rp 65rb–90rb/kg.
- LOBSTER AIR TAWAR (Cherax quadricarinatus): Suhu 24–29°C, pH 7.0–8.5, DO > 4.0 mg/L, Kesadahan Ca > 50–100 ppm, shelter PVC wajib, FCR 1.2–1.6, panen 10–15 ekor/kg, harga Rp 120rb–180rb/kg.
- PATIN (Pangasius sp.): Suhu 27–30°C, pH 6.5–8.0, FCR 1.1–1.3, protein 26–30%, panen 800–1.200g, harga Rp 18rb–23rb/kg.
- GABUS (Channa striata): Suhu 26–31°C, pH 6.5–8.0, FCR 1.2–1.5, protein 38–45%, panen 300–600g (kaya albumin), harga Rp 50rb–75rb/kg.
- KEPITING BAKAU (Scylla serrata): Suhu 27–31°C, salinitas 15–25 ppt, vertical crab box RAS, panen 250–500g, harga Rp 90rb–160rb/kg.`

  return `=== STANDAR TEKNIS AKUAKULTUR INDONESIA (SNI / KKP) — WAJIB DIPATUHI ===
${specificSection}

ATURAN UNIVERSAL AKUAKULTUR:
1. DILARANG menerapkan parameter ikan lele ke komoditas lain (misalnya: udang vaname butuh alkalinitas >120 ppm dan DO >4.5 mg/L, nila aerobik ketat butuh DO >4 mg/L, lobster air tawar wajib shelter paralon untuk cegah kanibalisme molting).
2. TAHUN SAAT INI ADALAH 2026. DILARANG KERAS mencantumkan tahun lampau (2023, 2024, 2025) pada judul, heading, slug, atau teks artikel! Gunakan '2026' jika relevan, atau tuliskan secara evergreen tanpa tahun.
3. Semua rumus matematis WAJIB menggunakan format teks biasa (plain text), DILARANG menggunakan sintaks LaTeX math (\\frac, \\text, \\[, \\], $$, dll).`
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
   > - [Data kunci 1: Parameter teknis / angka acuan SNI spesifik komoditas]
   > - [Rekomendasi praktis 2: Tindakan operasional pembudidaya]
   > - [Estimasi biaya / FCR 3: Efisiensi produksi & harga pasar riil IDR]
   > - [Mitigasi risiko 4: Solusi pencegahan kegagalan/penyakit]

2. DIRECT ANSWER LEAD-INS:
   Setiap section heading ## WAJIB dibuka dengan paragraf pertama (40–60 kata) yang langsung memberikan jawaban lugas, definisi, atau kesimpulan faktual sebelum menguraikan langkah teknis lebih detail.

3. TABEL PARAMETER / KOMPARASI MARKDOWN:
   Wajib memiliki minimal satu tabel Markdown terstruktur (| Parameter | Standar Ideal | Dampak Buruk | Solusi Koreksi | atau tabel analisa biaya).

4. SOP & FORMULA KALKULASI KONKRET (PLAIN TEXT ONLY — TANPA LATEX):
   Wajib mencantumkan minimal satu rumus atau SOP perhitungan matematis praktis.
   DILARANG MENGGUNAKAN SINTAKS LATEX MATH (\\frac, \\text, \\times, \\[, \\], $$, dll).
   Tuliskan semua rumus menggunakan teks tebal atau callout Markdown biasa dengan simbol aritmatika standar (÷, ×, +, -, /), contoh:
   > **Rumus FCR:** Total Pakan yang Diberikan (kg) ÷ Total Pertambahan Bobot Biomassa (kg)
   > **Rumus Kebutuhan Pakan Harian:** Total Biomassa Kolam (kg) × Persentase FR (% per hari)

5. STRUKTUR FAQ SPESIFIK:
   Pada section FAQ, buat 4–5 pertanyaan teknis menggunakan heading ### Pertanyaan? diikuti jawaban langsung 2-3 kalimat padat.${linkInstruction}`
}

/**
 * Membangun system prompt komprehensif untuk generator AI
 */
export function buildMasterWriterSystemPrompt(context: WriterSkillContext): string {
  const commodity = detectCommodity([context.topik, context.kategori, ...context.keywords])
  const c = COMMODITY_STANDARDS[commodity]

  return `Kamu adalah "Master Aquaculture Specialist & Senior Technical Writer" dari APLESI Enterprise.
Tugasmu adalah menyusun artikel panduan budidaya perikanan dan krustasea Indonesia (fokus komoditas: ${c.commonName}) yang sangat otoritatif, akurat secara SNI/KKP, komprehensif (in-depth), dan teroptimasi untuk Google AI Overview, Perplexity, dan ChatGPT Search.

${buildTechnicalDomainBounds([context.topik, context.kategori, ...context.keywords])}

${buildGeoFormattingRules(context.internalLinkTargets)}

GAYA PENULISAN:
- Bahasa Indonesia baku teknis profesional, lugas, mengalir, dan mudah dipahami pembudidaya lapangan.
- Zero-fluff: Hindari kalimat basa-basi seperti "Dalam era modern ini...", "Perlu kita ketahui bersama...", atau "Semoga artikel ini bermanfaat".
- Fokus pada solusi aplikatif, data metrik, prosedur bertahap, dan mitigasi kegagalan kolam.`
}

/**
 * Membersihkan sintaks LaTeX mentah (\text, \frac, \times, \[, \], $$)
 * menjadi teks biasa yang rapi dan mudah dibaca di Markdown/HTML.
 */
export function sanitizeLatexMath(content: string): string {
  if (!content) return ''
  let s = content

  // 1. Bersihkan subscript berformat _{...} menjadi _...
  s = s.replace(/_\{([^}]+)\}/g, '_$1')

  // 2. Loop unwrap \text{...}
  while (/\\+text\{/i.test(s)) {
    s = s.replace(/\\+text\{([^{}]+)\}/g, '$1')
  }

  // 3. Loop unwrap \frac{A}{B} menjadi (A ÷ B)
  while (/\\+frac\{/i.test(s)) {
    s = s.replace(/\\+frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 ÷ $2)')
  }

  // 4. Operator matematika LaTeX
  s = s.replace(/\\+times/g, '×')
  s = s.replace(/\\+cdot/g, '·')
  s = s.replace(/\\+approx/g, '≈')

  // 5. Delimiter blok matematika
  s = s.replace(/\\+\[\s*/g, '')
  s = s.replace(/\s*\\+\]/g, '')
  s = s.replace(/\\+\(\s*/g, '')
  s = s.replace(/\s*\\+\)/g, '')
  s = s.replace(/\$\$\s*/g, '')

  // 6. Sanitasi tahun usang (2024/2025) menjadi 2026
  s = s.replace(/\b(2023|2024|2025)\b/g, '2026')

  return s
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
 * 1. Sanitasi otomatis sintaks LaTeX & tahun halusinasi.
 * 2. Memeriksa jumlah kata (minimal 1.200 kata).
 * 3. Memeriksa keberadaan tabel Markdown.
 * 4. Memeriksa keberadaan FAQ.
 * 5. Memverifikasi internal links: Link ke /artikel/(slug) yang tidak ada di validSlugs
 *    otomatis dibersihkan menjadi plain text agar tidak menghasilkan 404 broken link!
 */
export function validateAndSanitizeArticle(
  content: string,
  validSlugs: Set<string>
): ValidationReport {
  const errors: string[] = []

  // 0. Bersihkan LaTeX math dan tahun usang
  const cleanLatex = sanitizeLatexMath(content)

  // 1. Hitung jumlah kata
  const words = cleanLatex.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  if (wordCount < 1200) {
    errors.push(`Jumlah kata (${wordCount}) di bawah batas minimum 1.200 kata`)
  }

  // 2. Cek tabel markdown (| Header | Header |)
  const hasTable = /\|.+?\|[\r\n]+\|[-:| ]+\|/m.test(cleanLatex)
  if (!hasTable) {
    errors.push('Artikel belum memiliki tabel Markdown terstruktur')
  }

  // 3. Cek FAQ
  const faqMatches = cleanLatex.match(/###\s+[^?\n]+\?/g) || []
  const faqCount = faqMatches.length
  if (faqCount < 3) {
    errors.push(`Jumlah pertanyaan FAQ (${faqCount}) kurang dari minimal 3 pertanyaan`)
  }

  // 4. Validasi dan Sanitasi Internal Links
  // Pola: [Anchor Text](/artikel/slug-target)
  let internalLinkCount = 0
  let strippedHallucinatedLinks = 0

  const sanitizedContent = cleanLatex.replace(
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
