import { NextRequest, NextResponse } from 'next/server'
import { query, queryFirst } from '@/lib/db/d1'

// Kolom ringan (tanpa konten berat)
const LISTING_COLUMNS = `slug, judul, ringkasan, gambar, kategori, tags, penulis, tanggal, waktu_baca, status`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const kategori = searchParams.get('kategori') || ''
    const search = searchParams.get('search') || ''

    const params: (string | number)[] = []
    const conditions: string[] = []

    // Untuk admin, tampilkan semua status (published + draft)
    if (kategori) {
      conditions.push('kategori = ?')
      params.push(kategori)
    }

    if (search) {
      conditions.push('judul LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count total
    const countRow = await queryFirst<{ total: number }>(
      `SELECT COUNT(*) as total FROM artikel ${whereClause}`,
      [...params]
    )
    const total = countRow?.total || 0

    // Fetch data
    params.push(limit, offset)
    const { results } = await query(
      `SELECT ${LISTING_COLUMNS} FROM artikel ${whereClause} ORDER BY tanggal DESC LIMIT ? OFFSET ?`,
      params
    )

    const data = results.map((row: Record<string, unknown>) => ({
      slug: row.slug,
      judul: row.judul,
      ringkasan: row.ringkasan || '',
      gambar: row.gambar || '/images/og-default.png',
      kategori: row.kategori || 'Budidaya',
      penulis: row.penulis || 'Tim Redaksi APLESI',
      tanggal: row.tanggal || '',
      status: row.status || 'draft',
      waktuBaca: row.waktu_baca || 1,
    }))

    return NextResponse.json({ success: true, data, total })
  } catch (error: unknown) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal memuat artikel' },
      { status: 500 }
    )
  }
}
