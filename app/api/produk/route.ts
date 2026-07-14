// app/api/produk/route.ts
// CRUD produk via API — dipakai oleh admin panel

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllProdukAdmin,
  insertProduk,
  updateProduk,
  deleteProduk,
} from '@/lib/db/produk'
import type { ApiResponse } from '@/types'


export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const produk = await getAllProdukAdmin()
    return NextResponse.json({ success: true, data: produk })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengambil data produk'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    const { nama, deskripsi, harga, hargaAsli, gambar, kategori, platform, urlAfiliasi, rating, terjual } = body

    if (!nama || !urlAfiliasi) {
      return NextResponse.json(
        { success: false, error: 'Nama produk dan URL afiliasi wajib diisi' },
        { status: 400 }
      )
    }

    const id = await insertProduk({
      nama,
      deskripsi: deskripsi || '',
      harga: Number(harga) || 0,
      hargaAsli: hargaAsli ? Number(hargaAsli) : undefined,
      gambar: gambar || [],
      kategori: kategori || 'Lainnya',
      platform: platform || 'Shopee',
      urlAfiliasi,
      rating: rating ? Number(rating) : undefined,
      terjual: terjual ? Number(terjual) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: { id },
      message: `Produk "${nama}" berhasil ditambahkan`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menambah produk'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID produk wajib diisi' },
        { status: 400 }
      )
    }

    await updateProduk(Number(id), data)
    return NextResponse.json({ success: true, message: 'Produk berhasil diperbarui' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal update produk'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID produk wajib diisi' },
        { status: 400 }
      )
    }

    await deleteProduk(Number(id))
    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal hapus produk'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
