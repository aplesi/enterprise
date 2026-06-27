// lib/db/artikel.ts
// Baca artikel dari file .md di folder content/artikel/

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Artikel } from '@/types'

const ARTIKEL_DIR = path.join(process.cwd(), 'content', 'artikel')

function pastikanDirAda() {
  if (!fs.existsSync(ARTIKEL_DIR)) {
    fs.mkdirSync(ARTIKEL_DIR, { recursive: true })
  }
}

export function getAllArtikel(): Artikel[] {
  pastikanDirAda()
  const files = fs.readdirSync(ARTIKEL_DIR).filter((f) => f.endsWith('.md'))

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(ARTIKEL_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug: data.slug || file.replace('.md', ''),
        judul: data.judul || '',
        ringkasan: data.ringkasan || '',
        konten: content,
        gambar: data.gambar || '',
        kategori: data.kategori || 'Umum',
        tags: data.tags || [],
        penulis: data.penulis || 'Aplesi',
        tanggal: data.tanggal || new Date().toISOString().split('T')[0],
        diperbarui: data.diperbarui,
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        status: data.status || 'published',
        jadwalPublish: data.jadwalPublish,
      } as Artikel
    })
    .filter((a) => a.status === 'published')
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
}

export function getArtikelTerbaru(n = 6): Artikel[] {
  return getAllArtikel().slice(0, n)
}

export function getArtikelBySlug(slug: string): Artikel | undefined {
  pastikanDirAda()
  const filePath = path.join(ARTIKEL_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return undefined

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    judul: data.judul || '',
    ringkasan: data.ringkasan || '',
    konten: content,
    gambar: data.gambar || '',
    kategori: data.kategori || 'Umum',
    tags: data.tags || [],
    penulis: data.penulis || 'Aplesi',
    tanggal: data.tanggal || '',
    diperbarui: data.diperbarui,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
    status: data.status || 'published',
  } as Artikel
}

export function getArtikelByKategori(kategori: string): Artikel[] {
  return getAllArtikel().filter(
    (a) => a.kategori.toLowerCase() === kategori.toLowerCase()
  )
}

export function getAllSlugs(): string[] {
  pastikanDirAda()
  return fs
    .readdirSync(ARTIKEL_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace('.md', ''))
}

export function simpanArtikelLokal(slug: string, konten: string): void {
  pastikanDirAda()
  fs.writeFileSync(path.join(ARTIKEL_DIR, `${slug}.md`), konten, 'utf-8')
}
