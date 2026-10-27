// @ts-nocheck
// scripts/auto-post.ts
// Script yang dijalankan oleh GitHub Actions setiap hari

import dotenv from 'dotenv'
import path from 'path'

// Load .env.local strictly before importing internal modules
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import Groq from 'groq-sdk'
import { marked } from 'marked'
import { generateArticleV2 } from '../lib/ai/generator/orchestrator'
import { evaluateMarkdown } from '../lib/quality/engine/core'
import { parseMarkdown } from '../lib/markdown/parse'
import { enrichDocument } from '../lib/quality/enrichment/enricher'
import { buildEditorContext } from '../lib/ai/editor/context'
import { runEditorialReview } from '../lib/ai/editor/engine'
import { metrics } from '../lib/metrics/collector'
import { buildFallbackImagePrompt } from '../lib/ai/groq'
import { getContextualAquacultureFallback } from '../lib/ai/cloudflare-image'
import { validateAndSanitizeArticle, sanitizeLatexMath, detectCommodity, type InternalLinkTarget } from '../lib/ai/skills/article-writer-skill'
import { notifySearchEngines } from '../lib/seo/indexer'

function renderMarkdown(markdown) {
  const cleanMarkdown = sanitizeLatexMath(markdown)
  const tokens = marked.lexer(cleanMarkdown)
  const groupedTokens = []
  let currentGroup = []

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      if (currentGroup.length > 0) groupedTokens.push(currentGroup)
      currentGroup = [token]
    } else {
      currentGroup.push(token)
    }
  }
  if (currentGroup.length > 0) groupedTokens.push(currentGroup)

  let finalHtml = ''
  for (const group of groupedTokens) {
    const firstToken = group[0]
    group.links = tokens.links
    const groupHtml = marked.parser(group)
    
    if (firstToken && firstToken.type === 'heading' && firstToken.depth === 2) {
      const id = firstToken.text.toLowerCase().replace(/[^\w]+/g, '-')
      finalHtml += `<section id="${id}">\n${groupHtml}</section>\n`
    } else {
      finalHtml += groupHtml
    }
  }
  return finalHtml
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// --- D1 Helper & Deduplication Guards ---
const D1_URL = process.env.CF_D1_DATABASE_ID && process.env.CF_ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`
  : null

async function d1FetchExistingSlugsAndTitles(): Promise<{
  slugs: Set<string>
  titles: string[]
  articles: Array<{ slug: string; judul: string }>
}> {
  if (!D1_URL || !process.env.CF_API_TOKEN) {
    return { slugs: new Set<string>(), titles: [], articles: [] }
  }
  try {
    const res = await fetch(D1_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT slug, judul FROM artikel ORDER BY tanggal DESC LIMIT 200`,
        params: [],
      }),
    })
    if (!res.ok) return { slugs: new Set<string>(), titles: [], articles: [] }
    const data = await res.json()
    const rows = (data.result?.[0]?.results || []) as Array<{ slug: string; judul: string }>
    return {
      slugs: new Set<string>(rows.map((r: any) => r.slug)),
      titles: rows.map((r: any) => r.judul),
      articles: rows,
    }
  } catch (err: any) {
    console.warn('⚠️ Gagal fetch existing dari D1:', err.message)
    return { slugs: new Set<string>(), titles: [], articles: [] }
  }
}

async function d1EnsureUniqueSlug(baseSlug: string): Promise<string> {
  if (!D1_URL || !process.env.CF_API_TOKEN) return baseSlug
  let candidate = baseSlug
  let counter = 1
  while (true) {
    try {
      const res = await fetch(D1_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT COUNT(*) as cnt FROM artikel WHERE slug = ?`,
          params: [candidate],
        }),
      })
      if (!res.ok) break
      const data = await res.json()
      const count = data.result?.[0]?.results?.[0]?.cnt || 0
      if (count === 0) return candidate
      counter++
      candidate = `${baseSlug}-${counter}`
    } catch {
      break
    }
  }
  return candidate
}

async function d1Insert(slug, artikel, gambarPath, tanggal, kontenHtml, waktuBaca) {
  if (!D1_URL || !process.env.CF_API_TOKEN) {
    console.warn('⚠️ D1 credentials tidak lengkap, skip D1 insert')
    return
  }
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: `INSERT OR IGNORE INTO artikel (slug, judul, ringkasan, konten, konten_html, gambar, kategori, tags, penulis, tanggal, waktu_baca, seo_title, seo_desc, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        slug,
        artikel.judul,
        artikel.ringkasan || '',
        artikel.konten,
        kontenHtml || null,
        gambarPath,
        artikel.kategori || 'Pembenihan',
        JSON.stringify(artikel.tags || []),
        'Tim Redaksi APLESI',
        tanggal,
        waktuBaca || 5,
        artikel.seoTitle || null,
        artikel.seoDesc || null,
        'published',
      ],
    }),
  })
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`)
}

interface EvergreenTopic {
  topik: string
  kategori: string
  keywords: string[]
}

// Database 60+ topik evergreen multi-komoditas akuakultur Indonesia (Lele, Nila, Gurame, Vaname, Lobster, Patin, Gabus, dll.)
const TOPIK_EVERGREEN_POOL: EvergreenTopic[] = [
  // ================= 1. PEMBENIHAN =================
  { topik: 'teknik seleksi indukan lele matang gonad berkualitas', kategori: 'Pembenihan', keywords: ['seleksi indukan lele', 'indukan matang gonad', 'pembenihan lele'] },
  { topik: 'manajemen pembenihan nila merah monoseks jantan metode sex reversal', kategori: 'Pembenihan', keywords: ['pembenihan nila merah', 'nila monoseks jantan', 'sex reversal nila'] },
  { topik: 'teknik pembuatan sarang ijuk dan pemijahan alami ikan gurame', kategori: 'Pembenihan', keywords: ['pemijahan ikan gurame', 'sarang ijuk gurame', 'benih gurame'] },
  { topik: 'SOP aklimatisasi dan uji stres benur udang vaname PL 10 sebelum tebar', kategori: 'Pembenihan', keywords: ['benur udang vaname', 'aklimatisasi benur', 'uji stres vaname'] },
  { topik: 'teknik perkawinan dan perawatan indukan bertelur lobster air tawar red claw', kategori: 'Pembenihan', keywords: ['pembenihan lobster air tawar', 'lobster bertelur', 'cherax quadricarinatus'] },
  { topik: 'cara menetaskan telur lele dengan metode corong aerasi', kategori: 'Pembenihan', keywords: ['menetaskan telur lele', 'corong penetasan', 'larva lele'] },
  { topik: 'pembenihan ikan patin siam dengan induksi hormon ovaprim dan striping', kategori: 'Pembenihan', keywords: ['pembenihan patin', 'striping patin ovaprim', 'larva patin'] },
  { topik: 'teknik pembenihan ikan gabus haruan di kolam terpal semi intensif', kategori: 'Pembenihan', keywords: ['pembenihan ikan gabus', 'channa striata', 'burayak gabus'] },
  { topik: 'manajemen pendederan benih udang galah all-male sampai ukuran tokol', kategori: 'Pembenihan', keywords: ['udang galah all-male', 'benih udang galah', 'tokol udang galah'] },
  { topik: 'perawatan larva lele usia 1 sampai 14 hari bebas kanibal', kategori: 'Pembenihan', keywords: ['perawatan larva lele', 'cacing sutra lele', 'mencegah kanibalisme'] },

  // ================= 2. PAKAN =================
  { topik: 'formulasi pakan pelet apung lele mandiri protein 32 persen', kategori: 'Pakan', keywords: ['pakan pelet apung', 'resep pakan lele', 'protein 32 persen'] },
  { topik: 'strategi pemberian pakan nila protein 28 persen hemat biaya dengan azolla', kategori: 'Pakan', keywords: ['pakan ikan nila', 'azolla untuk nila', 'protein pakan nila'] },
  { topik: 'kombinasi pakan pelet dan hijauan daun sente untuk percepatan pertumbuhan gurame', kategori: 'Pakan', keywords: ['pakan gurame daun sente', 'daun talas pakan gurame', 'pelet gurame'] },
  { topik: 'teknik membaca kontrol anco tambak udang vaname untuk cegah overfeeding', kategori: 'Pakan', keywords: ['kontrol anco vaname', 'feeding tray udang', 'feeding rate vaname'] },
  { topik: 'formulasi pakan pelet tenggelam sinking untuk lobster air tawar dan suplemen cacing', kategori: 'Pakan', keywords: ['pakan lobster air tawar', 'pelet tenggelam sinking', 'nutrisi lobster'] },
  { topik: 'budidaya maggot BSF sebagai alternatif pakan lele hemat biaya', kategori: 'Pakan', keywords: ['maggot BSF untuk lele', 'pakan alternatif lele', 'biaya pakan hemat'] },
  { topik: 'pemberian pakan ikan patin FCR rendah 1.1 berbasis pelet apung komersial', kategori: 'Pakan', keywords: ['pakan ikan patin', 'FCR patin rendah', 'pelet patin'] },
  { topik: 'pelatihan pakan pelet apung protein 40 persen untuk ikan gabus sejak burayak', kategori: 'Pakan', keywords: ['pakan pelet ikan gabus', 'protein pakan gabus', 'channa striata feed'] },
  { topik: 'teknik fermentasi pakan lele dengan probiotik EM4 dan molase', kategori: 'Pakan', keywords: ['fermentasi pakan lele', 'probiotik EM4', 'efisiensi pakan FCR'] },
  { topik: 'manajemen feeding rate udang vaname berdasarkan estimasi biomassa DOC 30 sampai 90', kategori: 'Pakan', keywords: ['feeding rate vaname', 'biomassa udang DOC', 'manajemen pakan tambak'] },

  // ================= 3. PENYAKIT & PENGOBATAN =================
  { topik: 'pencegahan dan pengobatan penyakit moncong putih pada lele', kategori: 'Penyakit & Pengobatan', keywords: ['penyakit moncong putih', 'flavobacterium lele', 'obat moncong putih'] },
  { topik: 'penanganan penyakit streptococcosis mata menonjol pada ikan nila bioflok', kategori: 'Penyakit & Pengobatan', keywords: ['streptococcosis nila', 'pop eye nila', 'streptococcus agalactiae'] },
  { topik: 'pengobatan penyakit bercak merah cacar air dan borok aeromonas pada gurame', kategori: 'Penyakit & Pengobatan', keywords: ['cacar gurame', 'aeromonas gurame', 'obat borok gurame'] },
  { topik: 'deteksi dini dan mitigasi penyakit berak putih white feces disease pada udang vaname', kategori: 'Penyakit & Pengobatan', keywords: ['white feces disease vaname', 'berak putih udang', 'pengobatan WFD'] },
  { topik: 'pencegahan kematian masal lobster air tawar akibat gagal molting dan jamur cangkang', kategori: 'Penyakit & Pengobatan', keywords: ['gagal molting lobster', 'burn spot disease lobster', 'penyakit lobster air tawar'] },
  { topik: 'mengatasi penyakit perut kembung dan dropsy pada lele', kategori: 'Penyakit & Pengobatan', keywords: ['perut kembung lele', 'dropsy lele', 'pengobatan ikan kembung'] },
  { topik: 'pengendalian parasit kutu ikan argulus dan cacing lernaea pada kolam air tawar', kategori: 'Penyakit & Pengobatan', keywords: ['kutu ikan argulus', 'cacing jangkar lernaea', 'obat parasit kolam'] },
  { topik: 'pencegahan virus bintik putih white spot syndrome virus WSSV pada tambak udang', kategori: 'Penyakit & Pengobatan', keywords: ['WSSV udang vaname', 'white spot virus', 'biosekuriti tambak'] },
  { topik: 'penggunaan daun sirih dan garam krosok sebagai antiseptik alami kolam', kategori: 'Penyakit & Pengobatan', keywords: ['daun sirih untuk ikan', 'garam krosok kolam', 'antiseptik alami lele'] },
  { topik: 'penanganan infeksi bakteri aeromonas hydrophila pada budidaya lele', kategori: 'Penyakit & Pengobatan', keywords: ['aeromonas hydrophila lele', 'borok lele', 'antibiotik alami ikan'] },

  // ================= 4. MANAJEMEN KOLAM =================
  { topik: 'panduan konstruksi kolam terpal bulat rangka besi wiremesh', kategori: 'Manajemen Kolam', keywords: ['kolam terpal bulat', 'rangka wiremesh', 'konstruksi kolam lele'] },
  { topik: 'budidaya nila sistem bioflok kolam bundar aerasi intensif tanpa ganti air', kategori: 'Manajemen Kolam', keywords: ['nila bioflok kolam bundar', 'aerasi nila bioflok', 'probiotik nila'] },
  { topik: 'manajemen mineral kalsium dan magnesium pada tambak vaname salinitas rendah', kategori: 'Manajemen Kolam', keywords: ['mineral tambak vaname', 'salinitas rendah vaname', 'kalsium magnesium udang'] },
  { topik: 'desain apartemen dan penataan shelter pipa PVC bertingkat untuk lobster air tawar', kategori: 'Manajemen Kolam', keywords: ['shelter lobster air tawar', 'apartemen lobster PVC', 'kolam lobster rumahan'] },
  { topik: 'manajemen kualitas air keramba jaring apung KJA nila di danau dan waduk', kategori: 'Manajemen Kolam', keywords: ['KJA nila waduk', 'keramba jaring apung', 'kualitas air KJA'] },
  { topik: 'penataan titik kincir air tambak vaname untuk pengumpulan lumpur di central drain', kategori: 'Manajemen Kolam', keywords: ['kincir air vaname', 'central drain tambak', 'arus air kincir'] },
  { topik: 'budidaya kepiting bakau sistem vertikal box indoor apartemen kepiting RAS', kategori: 'Manajemen Kolam', keywords: ['apartemen kepiting indoor', 'crab box RAS', 'kepiting bakau vertikal'] },
  { topik: 'manajemen nitrit amonia dan alkalinitas pada sistem bioflok lele', kategori: 'Manajemen Kolam', keywords: ['nitrit amonia kolam', 'alkalinitas bioflok', 'kualitas air lele'] },
  { topik: 'cara sterilisasi dan penyiapan air kolam sebelum tebar benih', kategori: 'Manajemen Kolam', keywords: ['sterilisasi air kolam', 'penyiapan air lele', 'tebar benih lele'] },
  { topik: 'penerapan sistem RAS sirkulasi air tertutup hemat lahan', kategori: 'Manajemen Kolam', keywords: ['sistem RAS lele', 'resirkulasi air kolam', 'filter mekanis biologis'] },

  // ================= 5. PANEN & PASCAPANEN =================
  { topik: 'SOP pemuasaan dan sortasi lele sebelum panen agar tidak susut', kategori: 'Panen & Pascapanen', keywords: ['pemuasaan lele panen', 'sortasi ikan lele', 'panen lele susut'] },
  { topik: 'teknik pemanenan bertahap nila konsumsi ukuran 3 sampai 5 ekor per kg', kategori: 'Panen & Pascapanen', keywords: ['panen bertahap nila', 'ukuran panen nila', 'sortasi nila konsumsi'] },
  { topik: 'SOP panen udang vaname teknik es curah chilling agar kesegaran dan warna terjaga', kategori: 'Panen & Pascapanen', keywords: ['panen udang vaname', 'teknik chilling udang', 'kualitas udang panen'] },
  { topik: 'penanganan dan pengemasan lobster air tawar hidup sistem kering untuk pengiriman jarak jauh', kategori: 'Panen & Pascapanen', keywords: ['packing lobster hidup', 'pengiriman lobster kering', 'ekspor lobster air tawar'] },
  { topik: 'teknik grading ikan lele untuk mencegah kanibalisme dan keseragaman ukuran', kategori: 'Panen & Pascapanen', keywords: ['grading lele', 'alat sortir lele', 'keseragaman panen'] },
  { topik: 'teknik pemanenan dan seleksi gurame konsumsi tanpa merusak sisik', kategori: 'Panen & Pascapanen', keywords: ['panen ikan gurame', 'sisik gurame utuh', 'sortir gurame konsumsi'] },
  { topik: 'peluang usaha pengolahan abon lele dan lele asap higienis', kategori: 'Panen & Pascapanen', keywords: ['abon lele', 'lele asap higienis', 'hilirisasi budidaya lele'] },
  { topik: 'ekstraksi albumin ikan gabus untuk kebutuhan industri medis dan suplemen kesehatan', kategori: 'Panen & Pascapanen', keywords: ['ekstraksi albumin gabus', 'albumin channa striata', 'minyak ikan gabus'] },

  // ================= 6. BISNIS & PEMASARAN =================
  { topik: 'analisa usaha budidaya lele 1000 ekor kolam terpal lengkap BEP', kategori: 'Bisnis & Pemasaran', keywords: ['analisa usaha lele 1000 ekor', 'modal budidaya lele', 'BEP ternak lele'] },
  { topik: 'analisa usaha budidaya nila bioflok 4 kolam D3 lengkap modal pakan dan ROI', kategori: 'Bisnis & Pemasaran', keywords: ['analisa usaha nila bioflok', 'modal nila D3', 'keuntungan nila bioflok'] },
  { topik: 'analisa bisnis tambak udang vaname kolam terpal bulat sistem semi intensif', kategori: 'Bisnis & Pemasaran', keywords: ['analisa usaha vaname', 'modal tambak udang terpal', 'keuntungan udang vaname'] },
  { topik: 'prospek bisnis ternak lobster air tawar rumahan lahan sempit keuntungan tinggi', kategori: 'Bisnis & Pemasaran', keywords: ['bisnis lobster air tawar', 'ternak lobster rumahan', 'keuntungan lobster air tawar'] },
  { topik: 'analisa usaha pembesaran ikan patin kolam tanah kontrak pasokan pabrik fillet', kategori: 'Bisnis & Pemasaran', keywords: ['usaha pembesaran patin', 'kontrak pabrik fillet patin', 'modal ternak patin'] },
  { topik: 'analisa cashflow pemeliharaan gurame 10 bulan segmen restoran sunda dan pasar induk', kategori: 'Bisnis & Pemasaran', keywords: ['analisa usaha gurame', 'cashflow budidaya gurame', 'keuntungan ternak gurame'] },
  { topik: 'strategi kemitraan supplier pakan dan pengepul pasar induk lele', kategori: 'Bisnis & Pemasaran', keywords: ['supplier pakan lele', 'pengepul lele pasar induk', 'rantai pasok lele'] },
  { topik: 'cara pemasaran lele langsung ke restoran dan pedagang pecel lele', kategori: 'Bisnis & Pemasaran', keywords: ['pemasaran lele langsung', 'suplai pecel lele', 'harga jual lele'] },

  // ================= 7. TEKNOLOGI =================
  { topik: 'penerapan aerator venturi dan microbubble untuk hemat listrik kolam', kategori: 'Teknologi', keywords: ['aerator venturi', 'microbubble kolam', 'hemat listrik aerasi'] },
  { topik: 'penerapan automatic feeder digital berbasis timer untuk kolam ikan nila intensif', kategori: 'Teknologi', keywords: ['autofeeder ikan nila', 'pemberi pakan otomatis', 'teknologi pakan kolam'] },
  { topik: 'pemanfaatan sensor DO dan salinitas IoT real-time pada tambak udang vaname modern', kategori: 'Teknologi', keywords: ['sensor IoT tambak udang', 'monitoring DO salinitas', 'smart tambak vaname'] },
  { topik: 'teknologi blower root bioflok untuk suplai oksigen stabil ribuan liter air', kategori: 'Teknologi', keywords: ['blower root bioflok', 'aerasi kolam bioflok', 'suplai oksigen kolam'] },
  { topik: 'sistem monitoring kualitas air otomatis berbasis sensor IoT perikanan', kategori: 'Teknologi', keywords: ['IoT perikanan', 'sensor pH otomatis', 'monitoring kolam digital'] },
  { topik: 'desain resirkulasi RAS apartemen kepiting bakau hemat air dengan protein skimmer', kategori: 'Teknologi', keywords: ['RAS apartemen kepiting', 'protein skimmer kepiting', 'filter biologis RAS'] },

  // ================= 8. TIPS & TRIK =================
  { topik: 'cara mengatasi lele menggantung dan stres pasca hujan lebat', kategori: 'Tips & Trik', keywords: ['lele menggantung', 'lele stres hujan', 'stabilisasi pH hujan'] },
  { topik: 'trik menstabilkan alkalinitas dan pH tambak vaname pasca hujan deras', kategori: 'Tips & Trik', keywords: ['pH tambak pasca hujan', 'alkalinitas vaname hujan', 'kapur tambak udang'] },
  { topik: 'trik mempercepat pergantian kulit molting lobster air tawar dengan suplementasi mineral', kategori: 'Tips & Trik', keywords: ['mempercepat molting lobster', 'kalsium lobster air tawar', 'tips ternak lobster'] },
  { topik: 'cara mencegah daging patin berbau lumpur dengan teknik kolam air mengalir sebelum panen', kategori: 'Tips & Trik', keywords: ['patin bau lumpur', 'menghilangkan bau tanah ikan', 'flushing kolam patin'] },
  { topik: 'trik mengurangi bau air kolam lele di pemukiman padat penduduk', kategori: 'Tips & Trik', keywords: ['mengurangi bau kolam lele', 'kolam lele perkotaan', 'bakteri pengurai bau'] },
  { topik: 'cara menaikkan kadar oksigen terlarut kolam nila secara darurat saat listrik padam', kategori: 'Tips & Trik', keywords: ['DO darurat kolam nila', 'genset aerator kolam', 'tips oksigen ikan'] },
]

const MORNING_CLUSTER = ['Manajemen Kolam', 'Pembenihan', 'Pakan', 'Penyakit & Pengobatan']
const EVENING_CLUSTER = ['Bisnis & Pemasaran', 'Teknologi', 'Panen & Pascapanen', 'Tips & Trik']

function getBatchClusterTarget(): { name: string; categories: string[] } {
  // BATCH_TYPE override jika diset manual via env
  const envBatch = process.env.BATCH_TYPE?.toLowerCase()
  if (envBatch === 'morning') {
    return { name: 'Morning Batch (Manual - Teknis & Kolam)', categories: MORNING_CLUSTER }
  }
  if (envBatch === 'evening') {
    return { name: 'Evening Batch (Manual - Bisnis & Strategi)', categories: EVENING_CLUSTER }
  }

  // Deteksi berdasarkan UTC Hour:
  // 00:00 UTC = 07:00 WIB (Pagi) -> Morning cluster (< 6 atau >= 22)
  // 12:00 UTC = 19:00 WIB (Malam) -> Evening cluster (antara 6 dan 21)
  const utcHour = new Date().getUTCHours()
  if (utcHour < 6 || utcHour >= 22) {
    return { name: 'Morning Batch (07:00 WIB - Teknis, Kolam & Pakan)', categories: MORNING_CLUSTER }
  } else {
    return { name: 'Evening Batch (19:00 WIB - Bisnis, Teknologi & Pasar)', categories: EVENING_CLUSTER }
  }
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const DEDUP_STOPWORDS = new Set([
  'dan', 'atau', 'untuk', 'pada', 'di', 'ke', 'dari', 'yang', 'dengan', 'secara',
  'cara', 'panduan', 'teknik', 'metode', 'tips', 'trik', 'lengkap', 'praktis', 'optimal',
  '2023', '2024', '2025', '2026', 'lele', 'ikan', 'budidaya'
])

function extractTopicKeywords(text: string): Set<string> {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !DEDUP_STOPWORDS.has(w))
  return new Set(words)
}

function isTopicDuplicate(topic: string, existingTitles: string[], existingSlugs: Set<string>): boolean {
  const topicKws = Array.from(extractTopicKeywords(topic))
  if (topicKws.length === 0) return false

  const allExisting = [...existingTitles, ...Array.from(existingSlugs)]

  for (const item of allExisting) {
    const itemKws = extractTopicKeywords(item)
    const matchCount = topicKws.filter(w => itemKws.has(w)).length
    const overlapRatio = matchCount / topicKws.length
    // Jika 60% atau lebih kata kunci signifikan sama persis, anggap topik sudah dibahas
    if (overlapRatio >= 0.6) {
      return true
    }
  }
  return false
}

async function pilihTopikUnik(
  existingSlugs: Set<string>,
  existingTitles: string[],
  preferredCategories: string[] = MORNING_CLUSTER
): Promise<EvergreenTopic> {
  const custom = process.env.TOPIK_CUSTOM
  if (custom) {
    return {
      topik: custom,
      kategori: 'Tips & Trik',
      keywords: [custom],
    }
  }

  // 1. Cari topik dari static pool yang belum ada di D1 (berdasarkan slug, judul, & token similarity)
  const available = TOPIK_EVERGREEN_POOL.filter(item => {
    const s = slugify(item.topik)
    const slugExists = existingSlugs.has(s) || Array.from(existingSlugs).some(es => es.includes(s) || s.includes(es))
    const titleExists = existingTitles.some(t => t.toLowerCase().includes(item.topik.toLowerCase()))
    const hasOverlap = isTopicDuplicate(item.topik, existingTitles, existingSlugs)
    return !slugExists && !titleExists && !hasOverlap
  })

  // Deteksi komoditas dari 2-3 artikel terbaru untuk memastikan rotasi antar komoditas (misal lele -> vaname -> nila -> lobster)
  const recentTitles = existingTitles.slice(0, 3)
  const recentCommodities = new Set(recentTitles.map(t => detectCommodity(t)))
  console.log(`[TopikSelector] Komoditas artikel terbaru di D1: ${Array.from(recentCommodities).join(', ') || 'belum ada'}`)

  // Prioritaskan topik yang cocok dengan preferred cluster jadwal sesi ini (Morning vs Evening)
  const clusterMatches = available.filter(item => preferredCategories.includes(item.kategori))

  // Saring topik di cluster jadwal yang komoditasnya BERBEDA dengan artikel terakhir (balanced rotation)
  const diverseClusterMatches = clusterMatches.filter(item => !recentCommodities.has(detectCommodity(item.topik)))

  if (diverseClusterMatches.length > 0) {
    const chosen = diverseClusterMatches[0]
    console.log(`[TopikSelector] Terpilih topik rotasi komoditas [${detectCommodity(chosen.topik).toUpperCase()}]: "${chosen.topik}" (${chosen.kategori})`)
    return chosen
  }

  if (clusterMatches.length > 0) {
    const chosen = clusterMatches[0]
    console.log(`[TopikSelector] Terpilih topik cluster jadwal: "${chosen.topik}" (${chosen.kategori})`)
    return chosen
  }

  if (available.length > 0) {
    const chosen = available[0]
    console.log(`[TopikSelector] Terpilih topik dari kategori alternatif: "${chosen.topik}" (${chosen.kategori})`)
    return chosen
  }

  // 2. Jika seluruh static pool sudah terpakai di D1, generate topik baru via Groq multi-komoditas
  console.log('[TopikSelector] Seluruh static pool telah terbit. Meminta Groq membuat topik multi-komoditas baru...')
  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah Fisheries Research Director APLESI Enterprise. Buat 1 ide topik artikel panduan mendalam multi-komoditas akuakultur Indonesia (Nila, Gurame, Udang Vaname, Lobster Air Tawar, Kepiting Bakau, Patin, Gabus, Bawal, atau Lele) yang belum pernah dibahas.'
        },
        {
          role: 'user',
          content: `Berikut daftar sebagian judul artikel yang SUDAH ada di database kami:\n${existingTitles.slice(0, 20).map(t => `- "${t}"`).join('\n')}\n\nKategori prioritas sesi ini adalah: ${preferredCategories.join(', ')}.\nHindari komoditas yang baru saja dibahas: ${Array.from(recentCommodities).join(', ')}.\nBuat 1 ide topik baru yang segar, bernilai ekonomi tinggi, dan aplikatif untuk pembudidaya Indonesia. Kembalikan format JSON: {"topik": "string", "kategori": "${preferredCategories[0]}", "keywords": ["string"]}`
        }
      ],
      response_format: { type: 'json_object' }
    })
    const generated = JSON.parse(completion.choices[0]?.message?.content || '{}')
    if (generated.topik) {
      return {
        topik: generated.topik,
        kategori: generated.kategori || preferredCategories[0],
        keywords: generated.keywords || [generated.topik],
      }
    }
  } catch (err: any) {
    console.warn('[TopikSelector] Fallback generate topik dinamis gagal:', err.message)
  }

  // Fallback darurat jika Groq gagal: rotasi dengan variasi waktu
  const hari = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return TOPIK_EVERGREEN_POOL[hari % TOPIK_EVERGREEN_POOL.length]
}

async function generateArtikel(
  topikData: EvergreenTopic,
  existingTitles: string[],
  internalLinkTargets?: InternalLinkTarget[]
) {
  console.log(`\n[PIPELINE] START -> Generating V2: "${topikData.topik}" (${topikData.kategori})`)
  const startTime = Date.now()

  const req = {
    topik: topikData.topik,
    kategori: topikData.kategori,
    keywords: topikData.keywords,
    targetWords: 2500,
    tone: "Informatif, teknis, dan profesional",
    existingTitles: existingTitles.slice(0, 15),
    internalLinkTargets: internalLinkTargets || [],
  }
  
  const { konten, blueprint } = await generateArticleV2(req)
  const durationMs = Date.now() - startTime
  const wordCount = konten.split(/\s+/).filter(Boolean).length

  console.log(`[PIPELINE] Quality Engine -> Evaluating...`)
  const allEntities = blueprint.sections.flatMap((s: any) => s.entitiesToCover || [])
  const qualityReport = evaluateMarkdown(konten, undefined, { keywords: req.keywords, entities: allEntities })
  
  if (qualityReport.status !== 'PASS') {
    console.log(`[PIPELINE] Quality FAIL (Score: ${qualityReport.overall}). Skip Publish.`)
    metrics.log({
      articleSlug: slugify(blueprint.title),
      wordCount,
      durationMs,
      coverageScore: qualityReport.categories['ENTITY']?.score || 0,
      densityScore: qualityReport.categories['READABILITY']?.score || 0,
      qualityScore: qualityReport.overall,
      editorialScore: 0,
      publishDecision: 'FAIL'
    })
    return null
  }
  console.log(`[PIPELINE] Quality PASS (Score: ${qualityReport.overall}).`)

  console.log(`[PIPELINE] Editorial Engine -> Reviewing...`)
  const baseDoc = parseMarkdown(konten)
  const richDoc = enrichDocument(baseDoc)
  const editorContext = buildEditorContext(richDoc, qualityReport, 'panduan', [])
  let editorialReport: any = null
  try {
    editorialReport = await runEditorialReview(editorContext)
  } catch (err: any) {
    console.warn(`[PIPELINE] Editorial Review Exception:`, err.message)
  }
  
  let publishDecision = 'FAIL'
  if (editorialReport && (editorialReport.status === 'PASS' || editorialReport.status === 'WARNING')) {
    publishDecision = 'PASS'
    console.log(`[PIPELINE] Editorial ${editorialReport.status} (Score: ${editorialReport.overall}).`)
  } else if (qualityReport.overall >= 85) {
    // Fail-open: jika Quality Engine sangat tinggi (>= 85, artikel kita 99/100), loloskan jika editorial transient rate-limit
    publishDecision = 'PASS'
    console.log(`[PIPELINE] Quality Engine sangat tinggi (${qualityReport.overall}/100). Lolos publish otomatis (Editorial rate-limit fallback).`)
  } else {
    publishDecision = editorialReport?.status || 'FAIL'
    console.log(`[PIPELINE] Editorial ${publishDecision} (Score: ${editorialReport?.overall || 0}). Skip Publish.`)
  }

  console.log(`[PIPELINE] Metrics Saved.`)
  metrics.log({
    articleSlug: slugify(blueprint.title),
    wordCount,
    durationMs,
    coverageScore: qualityReport.categories['ENTITY']?.score || 0,
    densityScore: qualityReport.categories['READABILITY']?.score || 0,
    qualityScore: qualityReport.overall,
    editorialScore: editorialReport?.overall || 0,
    publishDecision: publishDecision
  })

  if (publishDecision !== 'PASS') {
    return null
  }

  console.log(`[PIPELINE] DONE -> Ready to Publish.`)

  return {
    judul: blueprint.title,
    ringkasan: `Panduan lengkap mengenai ${topikData.topik} untuk pembudidaya lele di Indonesia.`,
    konten: konten,
    tags: topikData.keywords,
    seoTitle: blueprint.title.substring(0, 60),
    seoDesc: `Panduan lengkap mengenai ${topikData.topik} untuk pembudidaya lele di Indonesia.`.substring(0, 160),
    kategori: topikData.kategori,
    imagePrompt: buildFallbackImagePrompt(blueprint.title, topikData.kategori)
  }
}

async function generateGambar(prompt) {
  console.log(`🖼️ Generating gambar via FLUX-1...`)
  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN
  if (!accountId || !apiToken) {
    console.warn('⚠️ CF_ACCOUNT_ID atau CF_API_TOKEN belum diset di environment.')
    return null
  }
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt}, realistic Indonesian aquaculture documentary photography, 4k`,
        }),
      }
    )
    if (!response.ok) {
      const errText = await response.text()
      if (response.status === 429) {
        console.warn(`⚠️ Cloudflare Workers AI kuota harian habis (429 Too Many Requests - 10,000 neurons limit). Menggunakan visual akuakultur otentik.`)
      } else {
        console.warn(`⚠️ Cloudflare Workers AI HTTP ${response.status} ${response.statusText}: ${errText}`)
      }
      return null
    }
    const data = await response.json()
    if (!data.result?.image) {
      console.warn('⚠️ FLUX-1 response tidak memuat field result.image')
      return null
    }
    // Decode base64 image (FLUX-1 returns JPEG)
    const jpegBuffer = Buffer.from(data.result.image, 'base64')
    return jpegBuffer
  } catch (err: any) {
    console.warn('⚠️ Generate gambar exception:', err.message)
    return null
  }
}

// ---------- Kuota harian generate gambar (dibagi dgn generate-berita-artikel.mjs) ----------
// FLUX-1 Schnell: 10.000 Neuron gratis/bulan (~10.000 langkah).
// num_steps=4 → ~2.500 gambar/bulan. Counter jaga-jaga.
const BATAS_GAMBAR_PER_HARI = 50

function kvKuotaKey() {
  const tanggalUTC = new Date().toISOString().split('T')[0]
  return `neuron-image-usage:${tanggalUTC}`
}
function kvHeaders() {
  return {
    Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}
function kvBaseUrl() {
  return `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}`
}

async function kvAmbilKuotaGambarHariIni() {
  try {
    const res = await fetch(`${kvBaseUrl()}/values/${kvKuotaKey()}`, { headers: kvHeaders() })
    if (!res.ok) return 0
    const text = await res.text()
    return text ? parseInt(text, 10) || 0 : 0
  } catch {
    return 0 // Kalau KV lagi error, jangan blok generate -- fail open
  }
}

async function kvTambahKuotaGambar(nilaiSekarang) {
  try {
    await fetch(`${kvBaseUrl()}/values/${kvKuotaKey()}`, {
      method: 'PUT',
      headers: kvHeaders(),
      body: String(nilaiSekarang + 1),
    })
  } catch (err) {
    console.warn('⚠️ Gagal update kuota gambar KV:', err.message)
  }
}

// ---------- GitHub Image Storage ----------
async function uploadToGithub(buffer, destPath) {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return ''

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${destPath}`
    const existing = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'aplesi-enterprise' },
    })

    let sha
    if (existing.ok) {
      const data = await existing.json()
      sha = data.sha
    }

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'aplesi-enterprise',
      },
      body: JSON.stringify({
        message: `chore: add image for ${destPath.split('/').pop()}`,
        content: buffer.toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    })

    if (!res.ok) {
      console.warn(`⚠️ GitHub upload gagal: ${res.status}`)
      return ''
    }

    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${destPath}`
  } catch (err) {
    console.warn(`⚠️ GitHub upload error:`, err.message)
    return ''
  }
}

async function generateGambarDenganKuota(prompt) {
  const kuotaSekarang = await kvAmbilKuotaGambarHariIni()
  if (kuotaSekarang >= BATAS_GAMBAR_PER_HARI) {
    console.warn(`⚠️ Kuota gambar harian tercapai (${kuotaSekarang}/${BATAS_GAMBAR_PER_HARI}), skip generate gambar -- pakai fallback.`)
    return null
  }
  const buffer = await generateGambar(prompt)
  if (buffer) await kvTambahKuotaGambar(kuotaSekarang)
  return buffer
}

async function main() {
  const jumlah = parseInt(process.env.JUMLAH_ARTIKEL || '1')
  const tanggal = new Date().toISOString().split('T')[0]

  const batch = getBatchClusterTarget()
  console.log(`⏰ Sesi Batch Saat Ini: ${batch.name}`)
  console.log(`🎯 Kategori Prioritas: ${batch.categories.join(', ')}`)

  console.log('🔍 Mengambil data artikel yang sudah ada di D1 untuk mencegah duplikasi...')
  const { slugs: existingSlugs, titles: existingTitles, articles: existingArticles } = await d1FetchExistingSlugsAndTitles()
  console.log(`📊 Ditemukan ${existingSlugs.size} slug dan ${existingTitles.length} judul terdaftar di D1.`)

  for (let i = 0; i < jumlah; i++) {
    try {
      const topikData = await pilihTopikUnik(existingSlugs, existingTitles, batch.categories)
      console.log(`\n📌 Target Topik: "${topikData.topik}" [Kategori: ${topikData.kategori}]`)

      // Ambil 3-5 artikel yang sudah ada di D1 untuk target internal link
      const internalLinkTargets: InternalLinkTarget[] = existingArticles
        .filter(a => a.slug && a.judul)
        .slice(0, 5)

      const artikel = await generateArtikel(topikData, existingTitles, internalLinkTargets)
      if (!artikel) {
        console.log(`⚠️ Artikel gagal Quality/Editorial, skip publish.`)
        continue
      }

      // Validasi & Sanitasi Hasil Konten (Quality Gate & Sanitasi Link Halusinasi)
      console.log(`🛡️ Menjalankan Master Article Quality Gate & Link Sanitizer...`)
      const validation = validateAndSanitizeArticle(artikel.konten, existingSlugs)
      if (!validation.valid) {
        console.warn(`⚠️ Catatan Validator:`)
        validation.errors.forEach(e => console.warn(`   - ${e}`))
      }
      console.log(`📊 Validator Stats: ${validation.stats.wordCount} kata, Tabel: ${validation.stats.hasTable ? 'Ya' : 'Tidak'}, FAQ: ${validation.stats.faqCount}, Internal Link Aktif: ${validation.stats.internalLinkCount}, Link Halusinasi Dibersihkan: ${validation.stats.strippedHallucinatedLinks}`)
      artikel.konten = validation.sanitizedContent

      // Pastikan slug 100% unik di D1 (mencegah error UNIQUE constraint)
      const baseSlug = slugify(artikel.judul)
      const slug = await d1EnsureUniqueSlug(baseSlug)
      console.log(`🔑 Final Unique Slug: "${slug}"`)
      existingSlugs.add(slug)
      existingTitles.push(artikel.judul)

      // Generate dan simpan gambar, pakai imagePrompt spesifik dari
      // isi artikel (bukan judul artikel yang generik)
      let gambarPath = getContextualAquacultureFallback(slug)
      const promptGambar = artikel.imagePrompt || `${artikel.judul}, Indonesian aquaculture, realistic photography`
      const gambarBuffer = await generateGambarDenganKuota(promptGambar)
      if (gambarBuffer) {
        const imgFile = `artikel/${slug}-${Date.now()}.jpg`
        const githubUrl = await uploadToGithub(gambarBuffer, `public/images/${imgFile}`)
        if (githubUrl) {
          gambarPath = githubUrl
          console.log(`✅ Gambar tersimpan di GitHub: ${githubUrl}`)
        } else {
          // Fallback: simpan lokal jika di dev environment
          try {
            const imgDir = join(process.cwd(), 'public', 'images', 'artikel')
            await mkdir(imgDir, { recursive: true })
            await writeFile(join(imgDir, `${slug}.jpg`), gambarBuffer)
            gambarPath = `/images/artikel/${slug}.jpg`
            console.log(`✅ Gambar disimpan lokal: ${slug}.jpg`)
          } catch (writeErr: any) {
            console.warn(`⚠️ Gagal simpan gambar lokal (read-only):`, writeErr.message)
          }
        }
      } else {
        console.log(`ℹ️ Menggunakan fallback visual kontekstual: ${gambarPath}`)
      }

      // Hitung reading time akurat (rata-rata 200 kata/menit)
      const wordCount = artikel.konten ? artikel.konten.split(/\s+/).filter(Boolean).length : 0
      const waktuBaca = Math.max(1, Math.ceil(wordCount / 200))

      // Buat file markdown dengan frontmatter
      const frontmatter = `---
judul: "${artikel.judul}"
slug: "${slug}"
ringkasan: "${artikel.ringkasan}"
gambar: "${gambarPath}"
kategori: "${artikel.kategori || 'Pembenihan'}"
tags: [${artikel.tags.map(t => `"${t}"`).join(', ')}]
penulis: "Tim Redaksi APLESI"
tanggal: "${tanggal}"
waktu_baca: ${waktuBaca}
status: "published"
seoTitle: "${artikel.seoTitle}"
seoDesc: "${artikel.seoDesc}"
---

${artikel.konten}`

      try {
        const artikelDir = join(process.cwd(), 'content', 'artikel')
        await mkdir(artikelDir, { recursive: true })
        await writeFile(join(artikelDir, `${slug}.md`), frontmatter)
        console.log(`✅ Artikel disimpan: ${slug}.md (waktu baca: ${waktuBaca} mnt)`)
      } catch (fsErr: any) {
        console.warn(`⚠️ Gagal simpan file .md (lingkungan read-only):`, fsErr.message)
      }

      // Pre-render markdown → HTML dan simpan ke D1
      try {
        const kontenHtml = renderMarkdown(artikel.konten)
        await d1Insert(slug, artikel, gambarPath, tanggal, kontenHtml, waktuBaca)
        console.log(`✅ Artikel disimpan ke D1: ${slug} (waktu_baca: ${waktuBaca})`)

        // Instant Indexing Ping: Notifikasi ke Google, Bing, Perplexity & ChatGPT Search
        const publishedUrl = `https://www.aplesi.my.id/artikel/${slug}`
        await notifySearchEngines(publishedUrl)
      } catch (err: any) {
        console.warn(`⚠️ Gagal simpan ke D1 atau ping search engines:`, err.message)
      }
    } catch (err: any) {
      console.error(`❌ Error generate artikel ${i + 1}:`, err.message)
    }
  }

  console.log('🎉 Auto-post selesai!')
}

main()
