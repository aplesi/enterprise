import { readFile } from 'fs/promises';
import { marked } from 'marked';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
  console.error('❌ Env vars wajib: CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN');
  process.exit(1);
}

const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;

async function d1Query(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D1 error (${res.status}): ${err}`);
  }
  return res.json();
}

function renderMarkdown(markdown) {
  const tokens = marked.lexer(markdown);
  const groupedTokens = [];
  let currentGroup = [];

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      if (currentGroup.length > 0) groupedTokens.push(currentGroup);
      currentGroup = [token];
    } else {
      currentGroup.push(token);
    }
  }
  if (currentGroup.length > 0) groupedTokens.push(currentGroup);

  let finalHtml = '';
  for (const group of groupedTokens) {
    const firstToken = group[0];
    group.links = tokens.links;
    const groupHtml = marked.parser(group);

    if (firstToken && firstToken.type === 'heading' && firstToken.depth === 2) {
      const id = firstToken.text.toLowerCase().replace(/[^\w]+/g, '-');
      finalHtml += `<section id="${id}">\n${groupHtml}</section>\n`;
    } else {
      finalHtml += groupHtml;
    }
  }
  return finalHtml;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv && !line.startsWith('  ')) {
      currentKey = kv[1];
      let val = kv[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      meta[currentKey] = val;
    } else if (line.match(/^\s+-\s+(.+)$/)) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      let val = line.match(/^\s+-\s+(.+)$/)[1].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      meta[currentKey].push(val);
    }
  }

  return { meta, body: match[2].trim() };
}

async function main() {
  const filePath = 'content/artikel/sistem-bioflok-budidaya-lele-intensif.md';
  console.log(`Membaca ${filePath}...`);
  const raw = await readFile(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const waktuBaca = Math.max(1, Math.ceil(wordCount / 200));
  const kontenHtml = renderMarkdown(body);

  console.log(`Slug: ${meta.slug}`);
  console.log(`Judul: ${meta.judul}`);
  console.log(`Word Count: ${wordCount} kata (~${waktuBaca} menit baca)`);

  const sql = `
    UPDATE artikel SET
      judul = ?,
      ringkasan = ?,
      konten = ?,
      konten_html = ?,
      gambar = ?,
      kategori = ?,
      tags = ?,
      penulis = ?,
      tanggal = ?,
      diperbarui = ?,
      seo_title = ?,
      seo_desc = ?,
      status = ?,
      waktu_baca = ?
    WHERE slug = ?
  `;

  const params = [
    meta.judul,
    meta.ringkasan || '',
    body,
    kontenHtml,
    meta.gambar || '/images/artikel/sistem-bioflok-budidaya-lele-intensif.jpg',
    meta.kategori || 'Budidaya Lele',
    JSON.stringify(meta.tags || ['sistem bioflok', 'budidaya lele']),
    meta.penulis || 'Tim Redaksi APLESI',
    meta.tanggal || '2026-07-28',
    new Date().toISOString().split('T')[0],
    meta.seoTitle || meta.judul,
    meta.seoDesc || meta.ringkasan,
    meta.status || 'published',
    waktuBaca,
    meta.slug,
  ];

  console.log('Mengupdate D1 database...');
  const res = await d1Query(sql, params);
  console.log('✅ Berhasil update D1:', JSON.stringify(res));
}

main().catch(err => {
  console.error('❌ Gagal:', err);
});
