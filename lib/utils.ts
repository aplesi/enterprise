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
