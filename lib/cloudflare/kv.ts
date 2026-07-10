// lib/cloudflare/kv.ts
// Cloudflare KV — simpan settings dari admin panel

// In-memory fallback untuk local development tanpa koneksi CF KV
const localStore = new Map<string, string>()

function hasConfig() {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_API_TOKEN = process.env.CF_API_TOKEN
  const KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID
  return !!(CF_ACCOUNT_ID && CF_API_TOKEN && KV_NAMESPACE_ID)
}

function getBaseUrl() {
  return `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}`
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export async function kvGet(key: string): Promise<string | null> {
  if (!hasConfig()) {
    return localStore.get(key) || null
  }
  
  try {
    const res = await fetch(`${getBaseUrl()}/values/${key}`, { headers: getHeaders() })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function kvSet(key: string, value: string): Promise<boolean> {
  if (!hasConfig()) {
    localStore.set(key, value)
    return true
  }
  
  try {
    const res = await fetch(`${getBaseUrl()}/values/${key}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: value,
    })
    return res.ok
  } catch {
    return false
  }
}

export async function kvDelete(key: string): Promise<boolean> {
  if (!hasConfig()) {
    localStore.delete(key)
    return true
  }
  
  try {
    const res = await fetch(`${getBaseUrl()}/values/${key}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function kvList(prefix?: string): Promise<string[]> {
  if (!hasConfig()) {
    const keys = Array.from(localStore.keys())
    if (prefix) return keys.filter(k => k.startsWith(prefix))
    return keys
  }
  
  try {
    const url = prefix
      ? `${getBaseUrl()}/keys?prefix=${encodeURIComponent(prefix)}`
      : `${getBaseUrl()}/keys`
    const res = await fetch(url, { headers: getHeaders() })
    if (!res.ok) return []
    const data = await res.json() as { result: { name: string }[] }
    return data.result.map((k) => k.name)
  } catch {
    return []
  }
}

// Hitung jumlah key dengan prefix tertentu, ikuti cursor pagination penuh
// (API list Cloudflare KV maks 1000 key per halaman -- tanpa loop cursor ini,
// hitungan akan berhenti/salah begitu klik sebuah link melewati 1000).
// Dipakai untuk hitung totalKlik afiliasi dari log klik (lihat app/go/[slug]/route.ts).
export async function kvCountByPrefix(prefix: string): Promise<number> {
  if (!hasConfig()) {
    return Array.from(localStore.keys()).filter((k) => k.startsWith(prefix)).length
  }

  try {
    let jumlah = 0
    let cursor: string | undefined

    do {
      const url = new URL(`${getBaseUrl()}/keys`)
      url.searchParams.set('prefix', prefix)
      if (cursor) url.searchParams.set('cursor', cursor)

      const res = await fetch(url.toString(), { headers: getHeaders() })
      if (!res.ok) break

      const data = (await res.json()) as {
        result: { name: string }[]
        result_info?: { cursor?: string }
      }
      jumlah += data.result?.length || 0
      cursor = data.result_info?.cursor || undefined
    } while (cursor)

    return jumlah
  } catch {
    return 0
  }
}
