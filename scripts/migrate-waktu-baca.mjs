// scripts/migrate-waktu-baca.mjs
import { execSync } from 'child_process'

async function query(sql) {
  try {
    const output = execSync(`npx wrangler d1 execute aplesi-db --remote --json --command="${sql}"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    return data[0]?.results || [];
  } catch (error) {
    console.error(`Error executing query: ${sql}`, error.message);
    return [];
  }
}

function hitungWaktuBaca(konten) {
  return Math.ceil((konten || '').split(/\s+/).length / 200)
}

async function main() {
  // Since we can't easily pass parameterized queries through the CLI,
  // we'll format the string and use single quotes.
  // Note: content might have single quotes, so we need to be careful with updates.
  const artikels = await query("SELECT slug, konten FROM artikel WHERE status = 'published'")
  console.log(`Found ${artikels.length} articles to update`)
  
  for (const art of artikels) {
    const wb = hitungWaktuBaca(art.konten)
    await query(`UPDATE artikel SET waktu_baca = ${wb} WHERE slug = '${art.slug}'`)
    console.log(`  ${art.slug} → ${wb} menit`)
  }
  console.log('Done!')
}

main().catch(console.error)
