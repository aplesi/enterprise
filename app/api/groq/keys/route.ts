// app/api/groq/keys/route.ts
// API endpoint untuk manage Groq API keys secara dynamic
// GET  = list semua key yang tersimpan di KV
// POST = tambah key baru
// DELETE = hapus key berdasarkan label

import { NextRequest, NextResponse } from 'next/server'
import { kvGet, kvSet, kvDelete, kvList } from '@/lib/cloudflare/kv'
import { clearPoolCache } from '@/lib/ai/groq-pool'

const GROQ_KEY_PREFIX = 'settings:GROQ_API_KEY'
const MAX_KEYS = 10

interface GroqKeyEntry {
  label: string      // e.g. "GROQ_API_KEY", "GROQ_API_KEY_2"
  keySuffix: string  // 4 karakter terakhir
  isSet: boolean
}

/**
 * Cari slot kosong berikutnya untuk Groq key.
 * Slot: GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, ...
 */
async function findNextSlot(): Promise<string | null> {
  // Cek slot utama dulu
  const mainKey = await kvGet(`${GROQ_KEY_PREFIX}`)
  if (!mainKey) return 'GROQ_API_KEY'

  // Cek slot 2-10
  for (let i = 2; i <= MAX_KEYS; i++) {
    const existing = await kvGet(`${GROQ_KEY_PREFIX}_${i}`)
    if (!existing) return `GROQ_API_KEY_${i}`
  }

  return null // semua slot penuh
}

export async function GET() {
  try {
    const keys: GroqKeyEntry[] = []

    // Cek slot utama
    const mainVal = await kvGet(`${GROQ_KEY_PREFIX}`)
    if (mainVal && mainVal.length > 10) {
      keys.push({
        label: 'GROQ_API_KEY',
        keySuffix: mainVal.slice(-4),
        isSet: true,
      })
    }

    // Cek slot 2-10
    for (let i = 2; i <= MAX_KEYS; i++) {
      const val = await kvGet(`${GROQ_KEY_PREFIX}_${i}`)
      if (val && val.length > 10) {
        keys.push({
          label: `GROQ_API_KEY_${i}`,
          keySuffix: val.slice(-4),
          isSet: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        keys,
        totalKeys: keys.length,
        maxKeys: MAX_KEYS,
        canAdd: keys.length < MAX_KEYS,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Gagal membaca Groq API keys' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { apiKey?: string }
    const apiKey = body.apiKey?.trim()

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { success: false, error: 'API key tidak valid (minimal 10 karakter)' },
        { status: 400 }
      )
    }

    // Cek duplikat — bandingkan dengan semua key yang ada
    const existingKeys = await kvList(GROQ_KEY_PREFIX)
    for (const kvKey of existingKeys) {
      const val = await kvGet(kvKey)
      if (val === apiKey) {
        return NextResponse.json(
          { success: false, error: 'API key ini sudah terdaftar' },
          { status: 409 }
        )
      }
    }

    // Cari slot kosong
    const slot = await findNextSlot()
    if (!slot) {
      return NextResponse.json(
        { success: false, error: `Maksimal ${MAX_KEYS} API key sudah tercapai. Hapus key lama dulu.` },
        { status: 409 }
      )
    }

    // Simpan ke KV
    const saved = await kvSet(`settings:${slot}`, apiKey)
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan ke Cloudflare KV' },
        { status: 500 }
      )
    }

    // Clear pool cache supaya key baru langsung terdeteksi
    clearPoolCache()

    return NextResponse.json({
      success: true,
      message: `API key berhasil ditambahkan sebagai ${slot}`,
      data: { label: slot, keySuffix: apiKey.slice(-4) },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { label?: string }
    const label = body.label?.trim()

    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label key harus diisi' },
        { status: 400 }
      )
    }

    // Validasi label — hanya boleh GROQ_API_KEY atau GROQ_API_KEY_2..10
    if (!/^GROQ_API_KEY(_[2-9]|_10)?$/.test(label)) {
      return NextResponse.json(
        { success: false, error: 'Label key tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah key ada
    const existing = await kvGet(`settings:${label}`)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Key ${label} tidak ditemukan` },
        { status: 404 }
      )
    }

    // Hapus dari KV
    const deleted = await kvDelete(`settings:${label}`)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus dari Cloudflare KV' },
        { status: 500 }
      )
    }

    // Clear pool cache
    clearPoolCache()

    return NextResponse.json({
      success: true,
      message: `${label} berhasil dihapus`,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus API key' },
      { status: 500 }
    )
  }
}
