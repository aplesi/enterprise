// lib/image/compressor.ts
// Modul kompresi & optimasi gambar web modern (WebP 16:9) untuk APLESI Enterprise
// Memakai library `sharp` dengan fallback aman (graceful degradation) jika sharp gagal/tidak tersedia

import sharp from 'sharp'

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  effort?: number
  lossless?: boolean
  fit?: keyof sharp.FitEnum
  withoutEnlargement?: boolean
}

export interface OptimizedImageResult {
  buffer: Buffer
  ext: 'webp' | 'jpg' | 'png'
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png'
  width?: number
  height?: number
  sizeBefore: number
  sizeAfter: number
  savingsPercent: number
  optimized: boolean
}

/**
 * Mendeteksi ekstensi dasar gambar dari magic bytes buffer
 */
function detectFallbackFormat(buffer: Buffer): { ext: 'webp' | 'jpg' | 'png'; mime: 'image/webp' | 'image/jpeg' | 'image/png' } {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' }
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' }
  }
  return { ext: 'jpg', mime: 'image/jpeg' }
}

/**
 * Mengoptimalkan buffer gambar menjadi WebP dengan resolusi responsif (default 1200x675 max / 16:9)
 * Mengurangi ukuran gambar hingga 80-90% tanpa mengurangi ketajaman visual.
 *
 * @param input - ArrayBuffer, Buffer, atau Uint8Array mentah dari AI Router/scraper
 * @param options - Konfigurasi kompresi opsional
 * @returns OptimizedImageResult dengan buffer terkompresi dan statistik penghematan
 */
export async function optimizeImageForWeb(
  input: ArrayBuffer | Buffer | Uint8Array,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  const rawBuffer = Buffer.isBuffer(input)
    ? input
    : input instanceof ArrayBuffer
      ? Buffer.from(input)
      : Buffer.from(input.buffer, input.byteOffset, input.byteLength)

  const sizeBefore = rawBuffer.length

  if (sizeBefore === 0) {
    throw new Error('Buffer gambar kosong (0 bytes)')
  }

  const {
    maxWidth = 1200,
    maxHeight = 675,
    quality = 80,
    effort = 4,
    lossless = false,
    fit = 'inside',
    withoutEnlargement = true,
  } = options

  try {
    const pipeline = sharp(rawBuffer, { failOnError: false })
    const metadata = await pipeline.metadata()

    const resized = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit,
      withoutEnlargement,
    })

    const optimizedBuffer = await resized
      .webp({
        quality,
        effort,
        lossless,
        force: true,
      })
      .toBuffer()

    const sizeAfter = optimizedBuffer.length
    const savingsPercent = sizeBefore > 0
      ? Math.max(0, parseFloat((((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1)))
      : 0

    const finalMetadata = await sharp(optimizedBuffer).metadata().catch(() => null)

    return {
      buffer: optimizedBuffer,
      ext: 'webp',
      mimeType: 'image/webp',
      width: finalMetadata?.width || metadata.width,
      height: finalMetadata?.height || metadata.height,
      sizeBefore,
      sizeAfter,
      savingsPercent,
      optimized: true,
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.warn(`[ImageCompressor] Sharp compression gagal, memakai buffer asli: ${errMsg}`)

    const fallback = detectFallbackFormat(rawBuffer)
    return {
      buffer: rawBuffer,
      ext: fallback.ext,
      mimeType: fallback.mime,
      sizeBefore,
      sizeAfter: sizeBefore,
      savingsPercent: 0,
      optimized: false,
    }
  }
}
