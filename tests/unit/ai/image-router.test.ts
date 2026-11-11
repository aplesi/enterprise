import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getImageRouterConfig,
  generateViaRouter,
  generateViaCloudflare,
  generateGambar,
} from '@/lib/ai/cloudflare-image'
import * as kvModule from '@/lib/cloudflare/kv'
import { POST as testImageHandler } from '@/app/api/settings/test-image/route'
import { GET as getSettingsHandler, POST as postSettingsHandler } from '@/app/api/settings/route'
import { NextRequest } from 'next/server'

describe('AI Image Router Unit Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getImageRouterConfig', () => {
    it('returns default values when KV and env are empty', async () => {
      vi.spyOn(kvModule, 'kvGet').mockResolvedValue(null)
      delete process.env.IMAGE_ROUTER_ENABLED
      delete process.env.IMAGE_ROUTER_URL
      delete process.env.IMAGE_ROUTER_KEY
      delete process.env.IMAGE_ROUTER_MODEL

      const config = await getImageRouterConfig()
      expect(config.enabled).toBe(false)
      expect(config.url).toBe('')
      expect(config.key).toBe('')
      expect(config.model).toBe('@cf/black-forest-labs/flux-1-schnell')
    })

    it('reads configuration from Cloudflare KV when available', async () => {
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (key: string) => {
        if (key === 'settings:IMAGE_ROUTER_ENABLED') return 'true'
        if (key === 'settings:IMAGE_ROUTER_URL') return 'https://ai.aplesi.my.id/v1'
        if (key === 'settings:IMAGE_ROUTER_KEY') return 'test-key-123'
        if (key === 'settings:IMAGE_ROUTER_MODEL') return '@cf/leonardoai/phoenix-1.0'
        return null
      })

      const config = await getImageRouterConfig()
      expect(config.enabled).toBe(true)
      expect(config.url).toBe('https://ai.aplesi.my.id/v1')
      expect(config.key).toBe('test-key-123')
      expect(config.model).toBe('@cf/leonardoai/phoenix-1.0')
    })

    it('falls back to process.env if KV has no value', async () => {
      vi.spyOn(kvModule, 'kvGet').mockResolvedValue(null)
      process.env.IMAGE_ROUTER_ENABLED = 'true'
      process.env.IMAGE_ROUTER_URL = 'https://gateway.example.com/v1'
      process.env.IMAGE_ROUTER_KEY = 'env-key-456'
      process.env.IMAGE_ROUTER_MODEL = 'custom-model'

      const config = await getImageRouterConfig()
      expect(config.enabled).toBe(true)
      expect(config.url).toBe('https://gateway.example.com/v1')
      expect(config.key).toBe('env-key-456')
      expect(config.model).toBe('custom-model')
    })

    it('overrides KV URL with LOCAL_IMAGE_ROUTER_URL only in development mode', async () => {
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (key: string) => {
        if (key === 'settings:IMAGE_ROUTER_ENABLED') return 'true'
        if (key === 'settings:IMAGE_ROUTER_URL') return 'https://ai.aplesi.my.id/v1'
        return null
      })

      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('LOCAL_IMAGE_ROUTER_URL', 'http://localhost:20128/v1')

      const devConfig = await getImageRouterConfig()
      expect(devConfig.url).toBe('http://localhost:20128/v1')

      vi.stubEnv('NODE_ENV', 'production')
      const prodConfig = await getImageRouterConfig()
      expect(prodConfig.url).toBe('https://ai.aplesi.my.id/v1')

      vi.unstubAllEnvs()
    })
  })

  describe('generateViaRouter', () => {
    it('handles OpenAI-compatible format with b64_json', async () => {
      const sampleBase64 = btoa('test-image-data-openai')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: sampleBase64 }],
        }),
      } as unknown as Response)

      const result = await generateViaRouter(
        'catfish pond',
        'https://ai.aplesi.my.id/v1',
        'key-abc',
        '@cf/black-forest-labs/flux-1-schnell'
      )

      expect(result).toBeInstanceOf(ArrayBuffer)
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('test-image-data-openai')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://ai.aplesi.my.id/v1/images/generations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer key-abc',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('handles Cloudflare format with result.image', async () => {
      const sampleBase64 = btoa('test-image-data-cf')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          result: { image: sampleBase64 },
        }),
      } as unknown as Response)

      const result = await generateViaRouter(
        'catfish pond',
        'https://gateway.ai.cloudflare.com/v1/acc/gateway/workers-ai',
        'key-cf',
        '@cf/leonardoai/phoenix-1.0'
      )

      expect(result).toBeInstanceOf(ArrayBuffer)
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('test-image-data-cf')
    })

    it('handles direct binary image response', async () => {
      const sampleBytes = new TextEncoder().encode('binary-image-stream')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => sampleBytes.buffer,
      } as unknown as Response)

      const result = await generateViaRouter(
        'catfish pond',
        'https://ai.aplesi.my.id/v1/images/generations',
        'key-abc'
      )

      expect(result).toBeInstanceOf(ArrayBuffer)
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('binary-image-stream')
    })

    it('throws descriptive error on HTTP failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid Bearer token',
      } as unknown as Response)

      await expect(
        generateViaRouter('catfish pond', 'https://ai.aplesi.my.id/v1', 'bad-key')
      ).rejects.toThrow('Image Router error (401 Unauthorized): Invalid Bearer token')
    })
  })

  describe('generateViaCloudflare', () => {
    it('throws error if credentials are missing', async () => {
      vi.spyOn(kvModule, 'kvGet').mockResolvedValue(null)
      delete process.env.CF_ACCOUNT_ID
      delete process.env.CF_API_TOKEN

      await expect(generateViaCloudflare('catfish pond')).rejects.toThrow(
        'CF_ACCOUNT_ID atau CF_API_TOKEN belum diset di environment / settings KV'
      )
    })

    it('successfully calls Cloudflare AI and returns ArrayBuffer', async () => {
      process.env.CF_ACCOUNT_ID = 'cf-acc-123'
      process.env.CF_API_TOKEN = 'cf-tok-123'
      const sampleBase64 = btoa('cf-direct-image-data')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          result: { image: sampleBase64 },
        }),
      } as unknown as Response)

      const result = await generateViaCloudflare('catfish pond')
      expect(result).toBeInstanceOf(ArrayBuffer)
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('cf-direct-image-data')
    })
  })

  describe('generateGambar (fallback orchestration)', () => {
    it('uses router when enabled and succeeds', async () => {
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (key: string) => {
        if (key === 'settings:IMAGE_ROUTER_ENABLED') return 'true'
        if (key === 'settings:IMAGE_ROUTER_URL') return 'https://ai.aplesi.my.id/v1'
        return null
      })

      const sampleBase64 = btoa('router-image-data')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: sampleBase64 }],
        }),
      } as unknown as Response)

      const result = await generateGambar('catfish')
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('router-image-data')
    })

    it('falls back to direct Cloudflare if router fails', async () => {
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (key: string) => {
        if (key === 'settings:IMAGE_ROUTER_ENABLED') return 'true'
        if (key === 'settings:IMAGE_ROUTER_URL') return 'https://ai.aplesi.my.id/v1'
        if (key === 'settings:CF_ACCOUNT_ID') return 'acc-cf'
        if (key === 'settings:CF_API_TOKEN') return 'tok-cf'
        return null
      })

      const cfSampleBase64 = btoa('fallback-cf-data')
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          // Router failure
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Error',
            text: async () => 'Router offline',
          } as unknown as Response
        }
        // Cloudflare fallback success
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            result: { image: cfSampleBase64 },
          }),
        } as unknown as Response
      })

      const result = await generateGambar('catfish pond')
      const decodedStr = new TextDecoder().decode(new Uint8Array(result))
      expect(decodedStr).toBe('fallback-cf-data')
      expect(callCount).toBe(2)
    })
  })

  describe('app/api/settings and test-image endpoint', () => {
    it('settings API saves and reads IMAGE_ROUTER keys correctly', async () => {
      const store = new Map<string, string>()
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (k: string) => store.get(k) || null)
      vi.spyOn(kvModule, 'kvSet').mockImplementation(async (k: string, v: string) => {
        store.set(k, v)
        return true
      })

      const reqPost = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IMAGE_ROUTER_ENABLED: 'true',
          IMAGE_ROUTER_URL: 'https://ai.aplesi.my.id/v1',
          IMAGE_ROUTER_KEY: 'secret-key-xyz',
          IMAGE_ROUTER_MODEL: '@cf/leonardoai/phoenix-1.0',
        }),
      })

      const postRes = await postSettingsHandler(reqPost)
      const postData = await postRes.json()
      expect(postData.success).toBe(true)

      const getRes = await getSettingsHandler()
      const getData = await getRes.json()
      expect(getData.success).toBe(true)
      expect(getData.data.IMAGE_ROUTER_ENABLED).toBe('true')
      expect(getData.data.IMAGE_ROUTER_URL).toBe('https://ai.aplesi.my.id/v1')
      expect(getData.data.IMAGE_ROUTER_KEY).toBe('secret-key-xyz')
      expect(getData.data.IMAGE_ROUTER_MODEL).toBe('@cf/leonardoai/phoenix-1.0')
    })

    it('prevents localhost IMAGE_ROUTER_URL from overwriting KV in development and uses LOCAL_IMAGE_ROUTER_URL on GET', async () => {
      const store = new Map<string, string>([
        ['settings:IMAGE_ROUTER_URL', 'https://ai.aplesi.my.id/v1'],
      ])
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (k: string) => store.get(k) || null)
      const kvSetSpy = vi.spyOn(kvModule, 'kvSet').mockImplementation(async (k: string, v: string) => {
        store.set(k, v)
        return true
      })

      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('LOCAL_IMAGE_ROUTER_URL', 'http://localhost:20128/v1')

      const reqPost = new NextRequest('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IMAGE_ROUTER_URL: 'http://localhost:20128/v1',
          IMAGE_ROUTER_MODEL: 'ag/gemini-3.1-flash-image',
        }),
      })

      const postRes = await postSettingsHandler(reqPost)
      const postData = await postRes.json()
      expect(postData.success).toBe(true)
      // KV production URL tetap aman dan tidak tertimpa localhost
      expect(store.get('settings:IMAGE_ROUTER_URL')).toBe('https://ai.aplesi.my.id/v1')
      expect(kvSetSpy).not.toHaveBeenCalledWith('settings:IMAGE_ROUTER_URL', expect.anything())
      expect(store.get('settings:IMAGE_ROUTER_MODEL')).toBe('ag/gemini-3.1-flash-image')

      const getRes = await getSettingsHandler()
      const getData = await getRes.json()
      expect(getData.data.IMAGE_ROUTER_URL).toBe('http://localhost:20128/v1')

      vi.unstubAllEnvs()
    })

    it('test-image endpoint returns success, latency, and previewUrl on valid image response', async () => {
      const sampleBase64 = btoa('test-preview-image')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: sampleBase64 }],
        }),
      } as unknown as Response)

      const req = new NextRequest('http://localhost:3000/api/settings/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: 'https://ai.aplesi.my.id/v1',
          apiKey: 'test-key',
          model: '@cf/black-forest-labs/flux-1-schnell',
          enabled: true,
        }),
      })

      const res = await testImageHandler(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.latencyMs).toBeGreaterThanOrEqual(0)
      expect(data.previewUrl).toContain('data:image/jpeg;base64,')
      expect(data.message).toContain('Koneksi dan generate gambar sampel berhasil')
    })

    it('test-image endpoint tests router when baseUrl is passed even if enabled is false', async () => {
      const sampleBase64 = btoa('test-preview-disabled-toggle')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: sampleBase64 }],
        }),
      } as unknown as Response)

      const req = new NextRequest('http://localhost:3000/api/settings/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: 'https://ai.aplesi.my.id/v1',
          apiKey: 'test-key-toggle-off',
          model: '@cf/black-forest-labs/flux-1-schnell',
          enabled: false, // User enters baseUrl but hasn't switched toggle on yet
        }),
      })

      const res = await testImageHandler(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Image Router (https://ai.aplesi.my.id/v1')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://ai.aplesi.my.id/v1/images/generations',
        expect.anything()
      )
    })

    it('test-image endpoint returns correct PNG mimeType for PNG image buffers', async () => {
      // PNG magic bytes: \x89PNG\r\n\x1a\n
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      let binaryStr = ''
      for (let i = 0; i < pngHeader.length; i++) binaryStr += String.fromCharCode(pngHeader[i])
      const pngBase64 = btoa(binaryStr)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ b64_json: pngBase64 }],
        }),
      } as unknown as Response)

      const req = new NextRequest('http://localhost:3000/api/settings/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: 'https://ai.aplesi.my.id/v1',
          apiKey: 'key',
        }),
      })

      const res = await testImageHandler(req)
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.previewUrl).toContain('data:image/png;base64,')
    })

    it('test-image endpoint returns 400 and failure message when router fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Invalid authentication',
      } as unknown as Response)

      const req = new NextRequest('http://localhost:3000/api/settings/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: 'https://ai.aplesi.my.id/v1',
          apiKey: 'wrong-key',
          model: '@cf/black-forest-labs/flux-1-schnell',
          enabled: true,
        }),
      })

      const res = await testImageHandler(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('403 Forbidden')
    })
  })

  describe('detectImageExtension and detectImageMimeType', () => {
    it('accurately identifies PNG, JPEG, WebP, and GIF magic bytes', async () => {
      const { detectImageExtension, detectImageMimeType } = await import('@/lib/ai/cloudflare-image')

      const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]).buffer
      expect(detectImageExtension(png)).toBe('png')
      expect(detectImageMimeType(png)).toBe('image/png')

      const jpg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer
      expect(detectImageExtension(jpg)).toBe('jpg')
      expect(detectImageMimeType(jpg)).toBe('image/jpeg')

      const webp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
      ]).buffer
      expect(detectImageExtension(webp)).toBe('webp')
      expect(detectImageMimeType(webp)).toBe('image/webp')

      const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).buffer
      expect(detectImageExtension(gif)).toBe('gif')
      expect(detectImageMimeType(gif)).toBe('image/gif')
    })
  })

  describe('Additional Router Formats and Model Fallback', () => {
    it('handles images array format and output array format', async () => {
      const sampleBase64 = btoa('sample-image')

      // images: [string]
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ images: [sampleBase64] }),
      } as unknown as Response)

      const resImages = await generateViaRouter('prompt', 'https://router.local', 'key')
      expect(new TextDecoder().decode(new Uint8Array(resImages))).toBe('sample-image')

      // output: [string]
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ output: [sampleBase64] }),
      } as unknown as Response)

      const resOutput = await generateViaRouter('prompt', 'https://router.local', 'key')
      expect(new TextDecoder().decode(new Uint8Array(resOutput))).toBe('sample-image')
    })

    it('falls back to default Cloudflare model when router model is custom and router fails', async () => {
      vi.spyOn(kvModule, 'kvGet').mockImplementation(async (key: string) => {
        if (key === 'settings:IMAGE_ROUTER_ENABLED') return 'true'
        if (key === 'settings:IMAGE_ROUTER_URL') return 'https://ai.aplesi.my.id/v1'
        if (key === 'settings:IMAGE_ROUTER_MODEL') return 'dall-e-3' // Custom non-CF model
        if (key === 'settings:CF_ACCOUNT_ID') return 'cf-acc'
        if (key === 'settings:CF_API_TOKEN') return 'cf-tok'
        return null
      })

      const cfData = btoa('cf-success-data')
      let routerCalled = false
      let cfUrlCalled = ''

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (!routerCalled) {
          routerCalled = true
          return { ok: false, status: 500, statusText: 'Server Error', text: async () => 'err' } as unknown as Response
        }
        cfUrlCalled = url
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ result: { image: cfData } }),
        } as unknown as Response
      })

      const result = await generateGambar('catfish pond')
      expect(new TextDecoder().decode(new Uint8Array(result))).toBe('cf-success-data')
      // Must NOT call Cloudflare AI with dall-e-3, but with @cf/black-forest-labs/flux-1-schnell
      expect(cfUrlCalled).toContain('@cf/black-forest-labs/flux-1-schnell')
      expect(cfUrlCalled).not.toContain('dall-e-3')
    })
  })
})
