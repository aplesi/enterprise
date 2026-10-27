// lib/utils.ts

import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatTanggal(date: string, locale = 'id-ID'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function waktuRelatif(date: string): string {
  const detik = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  const menit = Math.floor(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.floor(jam / 24)
  if (hari < 7) return `${hari} hari lalu`
  return formatTanggal(date)
}

export function formatHarga(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka)
}

export function estimasiWacaBaca(konten: string): number {
  const kataPerMenit = 200
  const jumlahKata = konten.split(/\s+/).length
  return Math.ceil(jumlahKata / kataPerMenit)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function bersihkanRingkasan(ringkasan: string, sumber?: string): string {
  if (!ringkasan) return ''
  let teks = ringkasan.trim()
  if (sumber) {
    const escaped = sumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    teks = teks.replace(new RegExp(`\\s*[-–—|•]?\\s*${escaped}\\s*(\\.*)?$`, 'i'), '')
  }
  teks = teks
    .replace(/\s*[-–—|•]?\s*[A-Za-z0-9-]+\.(com|co\.id|id|org|net|gov|go\.id|info|biz|tv|me|xyz)(\s*\.{1,3})?$/i, '')
    .replace(/\s*[-–—|•]\s*[^-–—|•]+(\.{1,3})?$/, '')
    .trim()
  return teks
}

export function generateFrontmatter(data: Record<string, unknown>): string {
  const lines = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      value.forEach((v) => lines.push(`  - ${v}`))
    } else if (value !== undefined && value !== null) {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}
