// lib/ai/cloudflare-image.ts
// Generate gambar menggunakan Cloudflare Workers AI (gratis)
// Edge-compatible: tidak menggunakan fs atau path

const IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0'

export async function generateGambar(prompt: string): Promise<ArrayBuffer> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, budidaya ikan Indonesia, fish farming`

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
        height: 630,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Cloudflare AI error: ${err}`)
  }

  return response.arrayBuffer()
}

export async function generateGambarDanSimpan(
  prompt: string,
  slug: string
): Promise<string> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  const arrayBuffer = await generateGambar(prompt)

  // Upload ke Cloudflare Images (production)
  const fileName = `${slug}-${Date.now()}.png`
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'image/png' })
  formData.append('file', blob, fileName)

  try {
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
        body: formData,
      }
    )

    if (uploadResponse.ok) {
      const data = await uploadResponse.json() as { result: { variants: string[] } }
      return data.result.variants[0]
    }
  } catch {
    // fallback jika upload gagal
  }

  // Fallback: kembalikan path placeholder
  return `/images/artikel/${fileName}`
}

// Upload ke Cloudflare Images (production)
export async function uploadKeCloudflareImages(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<string> {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN

  const formData = new FormData()
  const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'image/png' })
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
