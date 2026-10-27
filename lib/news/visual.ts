// lib/news/visual.ts
// Helper visual fallback untuk kategori/topik berita perikanan

export interface FallbackVisual {
  bg: string
  badge: string
  icon: string
}

export function getFallbackVisual(judul: string): FallbackVisual {
  const j = (judul || '').toLowerCase()
  if (j.includes('udang') || j.includes('shrimp') || j.includes('tambak')) {
    return {
      bg: 'from-blue-700 via-teal-800 to-slate-900',
      badge: 'Tambak & Udang',
      icon: '🦐',
    }
  }
  if (j.includes('ekspor') || j.includes('pasar') || j.includes('harga') || j.includes('miliar')) {
    return {
      bg: 'from-amber-800 via-orange-900 to-slate-950',
      badge: 'Ekonomi & Pasar',
      icon: '📈',
    }
  }
  if (j.includes('kkp') || j.includes('kementerian') || j.includes('kebijakan') || j.includes('regulasi') || j.includes('barantin')) {
    return {
      bg: 'from-indigo-800 via-blue-950 to-slate-950',
      badge: 'Kebijakan & Regulasi',
      icon: '🏛️',
    }
  }
  if (j.includes('pakan') || j.includes('feed') || j.includes('nutrisi')) {
    return {
      bg: 'from-emerald-800 via-teal-950 to-midnight',
      badge: 'Pakan & Nutrisi',
      icon: '🌾',
    }
  }
  if (j.includes('rumput laut') || j.includes('seaweed')) {
    return {
      bg: 'from-teal-800 via-cyan-950 to-slate-900',
      badge: 'Rumput Laut',
      icon: '🌿',
    }
  }
  if (j.includes('lele') || j.includes('nila') || j.includes('bioflok') || j.includes('kolam') || j.includes('ras') || j.includes('patin')) {
    return {
      bg: 'from-cyan-900 via-blue-950 to-slate-950',
      badge: 'Budidaya Kolam',
      icon: '🐟',
    }
  }
  return {
    bg: 'from-midnight via-slate-900 to-azure/60',
    badge: 'Kabar Perikanan',
    icon: '🌊',
  }
}
