// app/api/settings/test-image/route.ts
// Endpoint untuk menguji konektivitas AI Image Router & generate gambar sampel

import { NextRequest, NextResponse } from 'next/server'
import {
  generateViaRouter,
  generateViaCloudflare,
  getImageRouterConfig,
  detectImageMimeType,
} from '@/lib/ai/cloudflare-image'
import type { AiImageTestResult } from '@/types'

const TEST_PROMPT = 'Indonesian aquaculture catfish fish pond, realistic photography'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    let body: {
      baseUrl?: string
      apiKey?: string
      model?: string
      enabled?: boolean
    } = {}

    try {
      body = await req.json()
    } catch {
      // Body kosong diperbolehkan (akan memakai config dari KV/env)
    }

    const savedConfig = await getImageRouterConfig()

    const isEnabled = body.enabled !== undefined ? body.enabled : savedConfig.enabled
    const baseUrl = (body.baseUrl !== undefined ? body.baseUrl : savedConfig.url).trim()
    const apiKey = (body.apiKey !== undefined ? body.apiKey : savedConfig.key).trim()
    const model = (body.model !== undefined && body.model.trim() ? body.model : savedConfig.model).trim()

    let arrayBuffer: ArrayBuffer
    let targetDesc: string

    // Prioritaskan pengujian router jika baseUrl diisi, atau jika router aktif dengan URL tersimpan
    const shouldTestRouter = Boolean(baseUrl || (isEnabled && savedConfig.url))
    const targetUrl = baseUrl || savedConfig.url

    if (shouldTestRouter && targetUrl) {
      targetDesc = `Image Router (${targetUrl}, model: ${model})`
      arrayBuffer = await generateViaRouter(TEST_PROMPT, targetUrl, apiKey, model)
    } else {
      const cfModel = (model.startsWith('@cf/') || model.startsWith('@hf/')) ? model : '@cf/black-forest-labs/flux-1-schnell'
      targetDesc = `Direct Cloudflare Workers AI (model: ${cfModel})`
      arrayBuffer = await generateViaCloudflare(TEST_PROMPT, cfModel)
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Hasil generate gambar kosong atau tidak valid')
    }

    const latencyMs = Date.now() - startTime

    // Encode arrayBuffer menjadi base64 data URL untuk preview dengan MIME type yang akurat
    const bytes = new Uint8Array(arrayBuffer)
    const CHUNK_SIZE = 8192
    let binaryString = ''
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length))
      binaryString += String.fromCharCode(...chunk)
    }
    const mimeType = detectImageMimeType(arrayBuffer)
    const previewUrl = `data:${mimeType};base64,${btoa(binaryString)}`

    const responseData: AiImageTestResult = {
      success: true,
      latencyMs,
      previewUrl,
      message: `Koneksi dan generate gambar sampel berhasil via ${targetDesc}`,
    }

    return NextResponse.json(responseData)
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menguji generate gambar'

    const errorData: AiImageTestResult = {
      success: false,
      latencyMs,
      message: errorMessage,
    }

    return NextResponse.json(errorData, { status: 400 })
  }
}
