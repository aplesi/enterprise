import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { optimizeImageForWeb } from '../../lib/image/compressor'

describe('Image Compressor Module (WebP 16:9 Optimization)', () => {
  it('harus mengompresi buffer JPEG menjadi WebP dengan rasio dan kualitas optimal', async () => {
    // Buat dummy JPEG 1280x720 (16:9) dengan noise/pola warna
    const rawJpg = await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 3,
        background: { r: 40, g: 120, b: 180 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer()

    const result = await optimizeImageForWeb(rawJpg, {
      maxWidth: 1200,
      maxHeight: 675,
      quality: 80,
    })

    expect(result.optimized).toBe(true)
    expect(result.ext).toBe('webp')
    expect(result.mimeType).toBe('image/webp')
    expect(result.sizeAfter).toBeLessThan(result.sizeBefore)
    expect(result.savingsPercent).toBeGreaterThan(0)
    expect(result.width).toBeLessThanOrEqual(1200)
    expect(result.height).toBeLessThanOrEqual(675)

    // Verifikasi bahwa buffer yang dihasilkan adalah WebP valid (magic bytes: RIFF....WEBP)
    const header = result.buffer.subarray(0, 12).toString('ascii')
    expect(header.startsWith('RIFF')).toBe(true)
    expect(header.endsWith('WEBP')).toBe(true)
  })

  it('harus menghormati withoutEnlargement agar gambar kecil tidak dipaksa membesar', async () => {
    const smallJpg = await sharp({
      create: {
        width: 400,
        height: 225,
        channels: 3,
        background: { r: 10, g: 80, b: 50 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer()

    const result = await optimizeImageForWeb(smallJpg, {
      maxWidth: 1200,
      maxHeight: 675,
      withoutEnlargement: true,
    })

    expect(result.optimized).toBe(true)
    expect(result.width).toBe(400)
    expect(result.height).toBe(225)
  })

  it('harus melakukan graceful fallback saat buffer gambar korup / tidak valid tanpa crash', async () => {
    const corruptedBuffer = Buffer.from('BUKAN_DATA_GAMBAR_YANG_VALID_1234567890')

    const result = await optimizeImageForWeb(corruptedBuffer)

    expect(result.optimized).toBe(false)
    expect(result.sizeAfter).toBe(corruptedBuffer.length)
    expect(result.savingsPercent).toBe(0)
    expect(result.buffer).toEqual(corruptedBuffer)
  })

  it('harus throw error jika buffer input kosong (0 bytes)', async () => {
    const emptyBuffer = Buffer.alloc(0)
    await expect(optimizeImageForWeb(emptyBuffer)).rejects.toThrow('Buffer gambar kosong (0 bytes)')
  })
})
