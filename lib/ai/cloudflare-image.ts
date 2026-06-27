// lib/ai/cloudflare-image.ts
// Generate gambar menggunakan Cloudflare Workers AI (gratis)

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN

// Model tersedia di Cloudflare AI
const IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0'

export async function generateGambar(prompt: string): Promise<Buffer> {
  const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, budidaya lele Indonesia, fish farming`

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${IMAGE_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        num_steps: 20,
        width: 1200,
        height: 630, // ukuran ideal OG image
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Cloudflare AI error: ${err}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generateGambarDanSimpan(
  prompt: string,
  slug: string
): Promise<string> {
  const buffer = await generateGambar(prompt)

  // Simpan ke Cloudflare Images atau public folder
  // Untuk development: simpan ke public/images/artikel/
  const { writeFile } = await import('fs/promises')
  const { join } = await import('path')

  const fileName = `${slug}-${Date.now()}.png`
  const filePath = join(process.cwd(), 'public', 'images', 'artikel', fileName)

  await writeFile(filePath, buffer)

  return `/images/artikel/${fileName}`
}

// Upload ke Cloudflare Images (production)
export async function uploadKeCloudflareImages(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const formData = new FormData()
  const blob = new Blob([buffer], { type: 'image/png' })
  formData.append('file', blob, fileName)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: formData,
    }
  )

  const data = await response.json() as { result: { variants: string[] } }
  return data.result.variants[0]
}
