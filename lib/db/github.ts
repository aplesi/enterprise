// lib/db/github.ts
// Simpan artikel ke GitHub repo sebagai file .md

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'aplesi-enterprise',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function getRepoUrl(path: string) {
  return `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`
}

export async function simpanArtikelKeGitHub(
  slug: string,
  konten: string,
  pesan = 'feat: tambah artikel baru via AI'
): Promise<string> {
  const path = `content/artikel/${slug}.md`
  
  // Edge-compatible Base64 encoding (support UTF-8)
  const bytes = new TextEncoder().encode(konten)
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
  const encoded = btoa(binString)

  // Cek apakah file sudah ada (untuk update)
  let sha: string | undefined
  try {
    const existing = await fetch(getRepoUrl(path), { headers: getHeaders() })
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

  const response = await fetch(getRepoUrl(path), {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub API error: ${err}`)
  }

  const data = await response.json() as { content: { html_url: string } }
  return data.content.html_url
}

export async function hapusArtikelDariGitHub(slug: string): Promise<void> {
  const path = `content/artikel/${slug}.md`

  const existing = await fetch(getRepoUrl(path), { headers: getHeaders() })

  if (!existing.ok) return

  const data = await existing.json() as { sha: string }

  await fetch(getRepoUrl(path), {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({
      message: `chore: hapus artikel ${slug}`,
      sha: data.sha,
      branch: 'main',
    }),
  })
}
