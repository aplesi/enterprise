// lib/db/github.ts
// Simpan artikel ke GitHub repo sebagai file .md

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const BASE_URL = 'https://api.github.com'

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
}

export async function simpanArtikelKeGitHub(
  slug: string,
  konten: string,
  pesan = 'feat: tambah artikel baru via AI'
): Promise<string> {
  const path = `content/artikel/${slug}.md`
  const encoded = Buffer.from(konten).toString('base64')

  // Cek apakah file sudah ada (untuk update)
  let sha: string | undefined
  try {
    const existing = await fetch(
      `${BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      { headers }
    )
    if (existing.ok) {
      const data = await existing.json() as { sha: string }
      sha = data.sha
    }
  } catch {
    // File belum ada, akan dibuat baru
  }

  const body: Record<string, unknown> = {
    message: pesan,
    content: encoded,
    branch: 'main',
  }
  if (sha) body.sha = sha

  const response = await fetch(
    `${BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub API error: ${err}`)
  }

  const data = await response.json() as { content: { html_url: string } }
  return data.content.html_url
}

export async function hapusArtikelDariGitHub(slug: string): Promise<void> {
  const path = `content/artikel/${slug}.md`

  const existing = await fetch(
    `${BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers }
  )

  if (!existing.ok) return

  const data = await existing.json() as { sha: string }

  await fetch(
    `${BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        message: `chore: hapus artikel ${slug}`,
        sha: data.sha,
        branch: 'main',
      }),
    }
  )
}
