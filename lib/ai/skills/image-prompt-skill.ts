// lib/ai/skills/image-prompt-skill.ts
// Image Prompt Master Skill ("Anti-AI Raw Realism")
// Standar fotografi dokumenter jurnalistik perikanan & krustasea Indonesia autentik (National Geographic / Reuters / raw 35mm style)
// Menolak visual CGI plastik, render 3D artstation, dan distorsi anatomi spesies akuakultur.

export interface ImagePromptContext {
  judul?: string
  kategori?: string
}

export interface SpeciesPhotoFeature {
  commodity: string
  scientificName: string
  visualDescription: string
  keywords: string[]
}

/**
 * Metadata kamera realistis & ketidaksempurnaan alami (Anti-AI Raw Realism)
 */
export const CAMERA_SPECS =
  'Shot on 35mm lens at f/8, deep depth of field, natural eye-level candid documentary angle, slightly off-center handheld framing'
export const HUMAN_REALISTIC_TEXTURES =
  'authentic skin texture with visible pores, weathered sun-tanned hands, casual faded cotton work shirt'
export const ENVIRONMENT_REALISTIC_TEXTURES =
  'natural murky pond water with subtle surface ripples and aeration foam, weathered PVC pipes, damp concrete or tarpaulin embankment edges'
export const SPATIAL_REALISM =
  'farmer standing safely on dry ground outside the pond wall beside the outer embankment, working full-body from the dry exterior perimeter'
export const NATURAL_LIGHTING =
  'diffused morning tropical overcast daylight, natural ambient shadows, slight highlight reflection on water surface, flat ungraded color profile'
export const CORE_RAW_STYLE =
  'authentic Indonesian aquaculture setting, 35mm documentary photojournalism, Reuters and National Geographic field reportage style, subtle film grain ISO 400, unedited raw documentary photograph'

// Pertahankan alias REALISTIC_TEXTURES untuk backward-compatibility jika di-import file lain:
export const REALISTIC_TEXTURES = `${HUMAN_REALISTIC_TEXTURES}, ${ENVIRONMENT_REALISTIC_TEXTURES}`

/**
 * Basis data visual morfologi spesies akuakultur Indonesia yang akurat
 */
export const COMMODITY_SPECIES_VISUALS: Record<string, SpeciesPhotoFeature> = {
  udang_galah: {
    commodity: 'udang_galah',
    scientificName: 'Macrobrachium rosenbergii',
    visualDescription: 'Giant freshwater prawn (Macrobrachium rosenbergii), long blue claw appendages, translucent greenish body',
    keywords: ['udang galah', 'macrobrachium', 'freshwater prawn'],
  },
  lobster: {
    commodity: 'lobster',
    scientificName: 'Cherax quadricarinatus',
    visualDescription: 'Freshwater redclaw crayfish (Cherax quadricarinatus), mottled blue-green carapace with bright red patch on male claws',
    keywords: ['lobster', 'crayfish', 'cherax', 'red claw', 'redclaw', 'lobster air tawar'],
  },
  kepiting: {
    commodity: 'kepiting',
    scientificName: 'Scylla serrata',
    visualDescription: 'Mud crab (Scylla serrata), heavy dark olive-green carapace with robust crushing claws',
    keywords: ['kepiting', 'mud crab', 'scylla', 'crab box', 'apartemen kepiting', 'soka'],
  },
  vaname: {
    commodity: 'vaname',
    scientificName: 'Litopenaeus vannamei',
    visualDescription:
      'Whiteleg shrimp (Litopenaeus vannamei), translucent greyish-white body with pinkish hue and long antennae',
    keywords: ['vaname', 'vannamei', 'udang putih', 'shrimp', 'tambak udang', 'anco'],
  },
  lele: {
    commodity: 'lele',
    scientificName: 'Clarias gariepinus',
    visualDescription: 'African catfish (Clarias gariepinus), smooth dark black skin, distinct barbels/whiskers, scaleless elongated body',
    keywords: ['lele', 'clarias', 'catfish', 'dumbo', 'sangkuriang', 'mutiara'],
  },
  nila: {
    commodity: 'nila',
    scientificName: 'Oreochromis niloticus',
    visualDescription: 'Nile tilapia (Oreochromis niloticus), olive-grey body with distinct vertical dark stripes',
    keywords: ['nila', 'tilapia', 'oreochromis', 'gesit', 'sultana', 'nirwana'],
  },
  gurame: {
    commodity: 'gurame',
    scientificName: 'Osphronemus goramy',
    visualDescription: 'Giant gourami (Osphronemus goramy), deep oval laterally compressed body, elongated pelvic fin threads',
    keywords: ['gurame', 'gurami', 'gourami', 'osphronemus', 'soang', 'bastar'],
  },
  patin: {
    commodity: 'patin',
    scientificName: 'Pangasianodon hypophthalmus',
    visualDescription: 'Pangasius catfish (Pangasianodon hypophthalmus), iridescent silver-grey body, white belly, sleek scaleless skin',
    keywords: ['patin', 'pangasius', 'pangasianodon', 'jambal'],
  },
  gabus: {
    commodity: 'gabus',
    scientificName: 'Channa striata',
    visualDescription: 'Striped snakehead (Channa striata), cylindrical elongated body with dark mottled snake-like scale patterns',
    keywords: ['gabus', 'channa', 'snakehead', 'haruan', 'kutu'],
  },
  bawal: {
    commodity: 'bawal',
    scientificName: 'Colossoma macropomum',
    visualDescription: 'Freshwater pomfret (Colossoma macropomum), deep round laterally compressed silver body with reddish throat and belly',
    keywords: ['bawal', 'colossoma', 'piaractus', 'pomfret'],
  },
  bandeng: {
    commodity: 'bandeng',
    scientificName: 'Chanos chanos',
    visualDescription: 'Milkfish (Chanos chanos), streamlined silvery torpedo-shaped body with deeply forked tail',
    keywords: ['bandeng', 'milkfish', 'chanos'],
  },
  kakap: {
    commodity: 'kakap',
    scientificName: 'Lates calcarifer',
    visualDescription: 'Barramundi (Lates calcarifer), iridescent silver body, concave head profile with large dorsal spines',
    keywords: ['kakap', 'barramundi', 'lates', 'siakap'],
  },
}

/**
 * Daftar pola AI buzzwords & trigger visual render sintetis yang harus dieliminasi.
 * Menggunakan negative lookbehind agar TIDAK menghapus klausa penolakan negatif (e.g. "no CGI", "without 3D render", "no plastic skin").
 */
const AI_BUZZWORD_PATTERNS: RegExp[] = [
  /\bphotorealistic\b/gi,
  /\bhyper[-_\s]*realistic\b/gi,
  /\bultra[-_\s]*realistic\b/gi,
  /\b(?:2k|4k|8k|16k)(?:\s+resolution)?\b/gi,
  /\b(?:ultra\s+hd|uhd|full\s+hd)\b/gi,
  /\bunreal\s+engine(?:\s*\d+(?:\.\d+)?)?\b/gi,
  /\boctane[-_\s]*render(?:ing|ed)?\b/gi,
  /\btrending\s+on\s+artstation\b/gi,
  /\bartstation\b/gi,
  /\bblender\s+render(?:ing)?\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)\s+)\bcinematic(?:\s+(?:lighting|shot))?\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)\s+)(?:\bsmooth\s+)?plastic\s+skin\b/gi,
  /\bairbrushed?\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)\s+)\b3d\s+(?:render(?:ing)?|model|graphics|animation)\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)\s+)\b(?:cgi(?:\s+render)?|vfx)\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)\s+)\bdigital\s+(?:illustration|painting|render|art)\b/gi,
  /\bconcept\s+art\b/gi,
  /\bv[-_\s]*ray\b/gi,
  /\bray[-_\s]*tracing\b/gi,
  /\bmasterpiece\b/gi,
  /\bhd\s+wallpaper\b/gi,
  /\b(?:studio|perfect)\s+lighting\b/gi,
  /(?<!\b(?:no|without|avoid|not|never)(?:\s+artificial)?\s+)\bstudio\s+glow\b/gi,
  /\bglamour\s+shot\b/gi,
  /\boversaturated\b/gi,
  /\b(?:hyper|ultra|highly|insanely)[-_\s]*detailed\b/gi,
  /\bintricate\s+details\b/gi,
  /\b(?:doll[-_\s]*like|wax\s+figure)\b/gi,
]

/**
 * Membersihkan buzzword AI sintetis dari prompt
 */
export function cleanAiBuzzwords(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return ''

  // Hapus tanda kutip atau backtick di sekeliling prompt
  let cleaned = prompt.replace(/^[`"'\s]+|[`"'\s]+$/g, '')

  for (const pattern of AI_BUZZWORD_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Bersihkan kata negasi menggantung yang tersisa setelah buzzword dihapus (e.g. "no,", "without,")
  cleaned = cleaned.replace(/\b(?:no|without|avoid|not|never)\s*([,;.]|$)/gi, '$1')

  // Bersihkan tanda kurung kosong atau berisi koma saja
  cleaned = cleaned.replace(/\(\s*[,;\s]*\)/g, ' ')

  // Bersihkan sisa koma/titik-koma beruntun
  cleaned = cleaned.replace(/[,;](\s*[,;])+/g, ',')

  // Normalisasi spasi di sekitar koma
  cleaned = cleaned.replace(/\s*,\s*/g, ', ')

  // Hapus koma/titik-koma/spasi/kutip di awal dan akhir string
  cleaned = cleaned.replace(/^[`"'\s,;.]+|[`"'\s,;.]+$/g, '')

  // Rapikan spasi berlebih
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  return cleaned.trim()
}

/**
 * Mendeteksi komoditas akuakultur dari teks prompt atau judul konteks.
 * Prioritas krustasea spesifik (udang galah, lobster, kepiting) dievaluasi sebelum udang vaname umum.
 */
export function detectAquacultureCommodity(text: string): string | null {
  const lower = text.toLowerCase()

  // 1. Krustasea spesifik
  if (lower.includes('udang galah') || lower.includes('macrobrachium') || lower.includes('freshwater prawn')) {
    return 'udang_galah'
  }
  if (lower.includes('lobster') || lower.includes('crayfish') || lower.includes('cherax') || lower.includes('red claw') || lower.includes('redclaw') || lower.includes('lobster air tawar')) {
    return 'lobster'
  }
  if (lower.includes('kepiting') || lower.includes('mud crab') || lower.includes('scylla') || lower.includes('crab box') || lower.includes('apartemen kepiting') || lower.includes('soka')) {
    return 'kepiting'
  }
  if (
    lower.includes('vaname') ||
    lower.includes('vannamei') ||
    lower.includes('udang putih') ||
    lower.includes('tambak udang') ||
    lower.includes('anco') ||
    /\b(?:udang|shrimp)\b/.test(lower)
  ) {
    return 'vaname'
  }

  // 2. Ikan air tawar/payau
  if (lower.includes('lele') || lower.includes('clarias') || lower.includes('catfish') || lower.includes('dumbo') || lower.includes('sangkuriang') || lower.includes('mutiara')) {
    return 'lele'
  }
  if (lower.includes('nila') || lower.includes('tilapia') || lower.includes('oreochromis') || lower.includes('gesit') || lower.includes('sultana') || lower.includes('nirwana')) {
    return 'nila'
  }
  if (lower.includes('gurame') || lower.includes('gurami') || lower.includes('gourami') || lower.includes('osphronemus') || lower.includes('soang') || lower.includes('bastar')) {
    return 'gurame'
  }
  if (lower.includes('patin') || lower.includes('pangasius') || lower.includes('pangasianodon') || lower.includes('jambal')) {
    return 'patin'
  }
  if (/\b(ikan\s+kutu|haruan|channa|snakehead|gabus)\b/.test(lower)) {
    return 'gabus'
  }
  if (lower.includes('bawal') || lower.includes('colossoma') || lower.includes('piaractus') || lower.includes('pomfret')) {
    return 'bawal'
  }
  if (lower.includes('bandeng') || lower.includes('milkfish') || lower.includes('chanos')) {
    return 'bandeng'
  }
  if (lower.includes('kakap') || lower.includes('barramundi') || lower.includes('lates') || lower.includes('siakap')) {
    return 'kakap'
  }

  return null
}

/**
 * Deteksi apakah adegan membutuhkan aturan posisi fisik darat (pembudidaya di LUAR kolam,
 * bukan berdiri nyebur di dalam air kolam pakan/terpal/bioflok/beton).
 */
export function shouldEnforceDryLandPosture(text: string): boolean {
  const lower = text.toLowerCase()
  const mentionsActor = /\b(farmer|farmers|technician|worker|workers|specialist|pembudidaya|peternak|petani|person|man|woman)\b/.test(lower)
  const mentionsPondContext = /\b(pond|ponds|kolam|tank|tanks|biofloc|bioflok|tarpaulin|terpal|hdpe|concrete|feeding|feed|pellets?|pelet|aeration)\b/.test(lower)
  const isWadingHarvest = /\b(seine\s+net|cast\s+net|wading|jaring\s+panen|menjaring|serok\s+panen\s+kolam\s+tanah)\b/.test(lower)
  return mentionsActor && mentionsPondContext && !isWadingHarvest
}

/**
 * Memperkaya prompt gambar agar menghasilkan foto dokumenter akuakultur Indonesia mentah (Raw Realism),
 * bebas dari estetika plastik AI dan distorsi anatomi ikan.
 */
export function enhanceImagePromptToRealPhoto(
  prompt: string,
  context?: ImagePromptContext
): string {
  const cleaned = cleanAiBuzzwords(prompt)
  const fullTextToAnalyze = `${cleaned} ${context?.judul || ''} ${context?.kategori || ''}`.trim()
  const detectedKey = detectAquacultureCommodity(fullTextToAnalyze)

  // 1. Tentukan subjek dasar (base scene)
  let baseSubject = cleaned
  if (!baseSubject) {
    if (context?.judul) {
      const cleanTitle = context.judul.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim()
      baseSubject = `Indonesian aquaculture documentary scene about ${cleanTitle}`
    } else {
      baseSubject = 'Authentic Indonesian aquaculture facility, commercial ponds under natural daylight'
    }
  }

  const components: string[] = [baseSubject]

  // 2. Injeksi morfologi spesies akurat jika terdeteksi dan belum ada dalam prompt
  if (detectedKey && COMMODITY_SPECIES_VISUALS[detectedKey]) {
    const feature = COMMODITY_SPECIES_VISUALS[detectedKey]
    const baseLower = baseSubject.toLowerCase()
    const sciLower = feature.scientificName.toLowerCase()

    if (!baseLower.includes(sciLower) && !baseLower.includes(feature.visualDescription.toLowerCase().slice(0, 30))) {
      components.push(feature.visualDescription)
    }
  }

  // 2b. Pastikan pembudidaya berdiri di luar kolam (tanah kering/pematang), tidak nyebur di kolam pakan/terpal
  const preCheck = components.join(' ').toLowerCase()
  if (
    shouldEnforceDryLandPosture(baseSubject) &&
    !preCheck.includes('outside the pond wall') &&
    !preCheck.includes('standing safely on dry ground')
  ) {
    components.push(SPATIAL_REALISM)
  }

  // 3. Injeksi spesifikasi kamera & sudut candid (f/8, deep depth of field)
  const lowerComponents = components.join(' ').toLowerCase()
  if (!lowerComponents.includes('35mm lens') && !lowerComponents.includes('35mm f/2.8')) {
    components.push(CAMERA_SPECS)
  }

  // 4. Injeksi tekstur realistis: pisahkan tekstur manusia vs lingkungan
  const hasHumanActor = /\b(farmer|farmers|technician|worker|workers|specialist|pembudidaya|peternak|petani|person|man|woman)\b/i.test(baseSubject)

  if (hasHumanActor && !lowerComponents.includes('authentic skin texture') && !lowerComponents.includes('weathered')) {
    components.push(HUMAN_REALISTIC_TEXTURES)
  }

  if (!lowerComponents.includes('natural murky pond water') && !lowerComponents.includes('aeration foam')) {
    components.push(ENVIRONMENT_REALISTIC_TEXTURES)
  }

  // 5. Injeksi pencahayaan alami (diffused morning tropical daylight)
  if (!lowerComponents.includes('diffused morning tropical') && !lowerComponents.includes('natural ambient shadows')) {
    components.push(NATURAL_LIGHTING)
  }

  // 6. Injeksi gaya dokumenter mentah & penolak CGI/render (Core Style)
  if (!lowerComponents.includes('subtle film grain') && !lowerComponents.includes('unedited raw documentary photograph')) {
    components.push(CORE_RAW_STYLE)
  }

  // Gabungkan dan rapikan (Mode Naratif untuk ag/gemini-3.1-flash-image-16x9)
  let finalPrompt = components
    .map((part) => part.trim().replace(/^[,.]+|[,.]+$/g, ''))
    .filter(Boolean)
    .join('. ')

  if (!finalPrompt.toLowerCase().includes('without any text overlays')) {
    finalPrompt +=
      '. Clean documentary frame without any text overlays, watermarks, typography, or graphic banners.'
  }

  let final = finalPrompt.replace(/\.\s*\./g, '.').replace(/\s{2,}/g, ' ').trim()
  if (!final.endsWith('.')) {
    final += '.'
  }

  return final
}
