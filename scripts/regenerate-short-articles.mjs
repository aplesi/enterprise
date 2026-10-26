import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Groq from 'groq-sdk';
import { AI_STRUCTURE_PROMPT } from '../prompts/index.mjs';

// Untuk pilot run: isi slug artikel yang ingin diproses (tanpa .md).
// Kosongkan array ini untuk kembali ke mode "semua artikel" (mode lama).
const TARGET_SLUGS = [
  'sistem-bioflok-budidaya-lele-intensif'
];

// Atau limit jumlah dari hasil auto-detect (dipakai kalau TARGET_SLUGS kosong)
const LIMIT = 5;

// Kumpulkan semua API key dari environment
const apiKeys = Object.keys(process.env)
  .filter(key => key.startsWith('GROQ_API_KEY'))
  .map(key => process.env[key])
  .filter(Boolean);

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: apiKeys[currentKeyIndex] });

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`🔄 Mengganti API Key ke index ${currentKeyIndex + 1}/${apiKeys.length}`);
  groq = new Groq({ apiKey: apiKeys[currentKeyIndex] });
}

const systemPrompt = `Kamu adalah penulis konten profesional untuk website budidaya ikan "Aplesi" (aplesi.my.id), menulis atas nama Tim Redaksi APLESI berdasarkan praktik budidaya nyata.
Selalu tulis dalam Bahasa Indonesia yang baik dan benar.
Fokus pada konten praktis dan berguna untuk peternak ikan di Indonesia.
Gunakan heading H2 dan H3 yang relevan.
Sertakan tips praktis dan pengalaman lapangan secara realistis. ⚠️ JANGAN berhalusinasi atau mengarang angka spesifik seperti harga pasti, luas kolam, persentase keberhasilan yang fiktif, atau mengarang tahun/lokasi spesifik (misalnya menyebut "Jawa Barat di tahun 2020"). Gunakan estimasi rentang wajar jika perlu, dan hindari klaim faktual palsu.

⚠️ ATURAN PANJANG ARTIKEL — KRITIS, JANGAN DILANGGAR:
- Target panjang konten: 2000-3000 kata.
- Hitung kata Anda secara mental saat menulis. Artikel yang terlalu pendek akan DITOLAK.
- Untuk target 2000-3000 kata: kamu WAJIB menulis MINIMAL 10 section (H2/H3), masing-masing 150-250 kata.
- Jangan pernah menulis section kurang dari 100 kata — itu terlalu dangkal dan tidak bernilai.
- Setiap section HARUS berisi paragraf penjelasan mendalam, BUKAN hanya daftar bullet point singkat.

${AI_STRUCTURE_PROMPT}

Format respons HARUS dalam JSON valid seperti ini:
{
  "judul": "Judul Artikel (Clickable & SEO Friendly)",
  "ringkasan": "ringkasan 1-2 kalimat untuk meta description (max 160 karakter)",
  "konten": "konten artikel lengkap dalam format Markdown",
  "seoTitle": "judul SEO (max 60 karakter)",
  "seoDesc": "deskripsi SEO (max 160 karakter)"
}

Pastikan respons hanya JSON, tanpa teks tambahan apapun.`;

async function main() {
  console.log('🔍 Memulai pemindaian artikel (Standalone Mode)...');
  const dir = path.join(process.cwd(), 'content', 'artikel');
  const files = await fs.readdir(dir);

  let countShort = 0;
  let countSuccess = 0;
  
  // Array untuk menyimpan file yang akan diproses agar lebih rapi
  const filesToProcess = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(dir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(fileContent);

    // Hitung kata
    const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;
    
    // Deteksi apakah sudah memenuhi format AI-First (memiliki ## Ringkasan Singkat)
    const hasRingkasanSingkat = /^##\s+ringkasan singkat/im.test(parsed.content);
    
    if (wordCount < 400 || !hasRingkasanSingkat) {
      filesToProcess.push({ file, filePath, parsed, wordCount, hasRingkasanSingkat });
    }
  }

  console.log(`Menemukan ${filesToProcess.length} artikel yang perlu di-regenerate (pendek atau belum standar AI-First).`);

  let filesToRun = filesToProcess;
  if (TARGET_SLUGS && TARGET_SLUGS.length > 0) {
    filesToRun = filesToProcess.filter(item => TARGET_SLUGS.includes(item.file.replace('.md', '')));
  } else {
    filesToRun.sort((a, b) => a.wordCount - b.wordCount);
    filesToRun = filesToRun.slice(0, LIMIT);
  }

  for (const item of filesToRun) {
    const { file, filePath, parsed, wordCount, hasRingkasanSingkat } = item;
    countShort++;
    
    const reason = wordCount < 400 ? `Pendek: ${wordCount} kata` : `Format lama (tanpa Ringkasan Singkat)`;
    console.log(`\n[${countShort}/${filesToRun.length}] ⏳ Meng-generate ulang: ${file} (${reason})`);
    
    const { judul, kategori, tags } = parsed.data;

    const userPrompt = `Tulis artikel tentang: "${judul}"

Kategori: ${kategori || 'Budidaya'}
Keywords yang harus ada: ${(tags || []).join(', ')}
Panjang: 2000-3000 kata — INI WAJIB DIPENUHI, jangan kurang dari 2000 kata.
Gaya penulisan: informatif dan edukatif, gaya bahasa formal tapi mudah dipahami

Buatkan juga bagian FAQ dengan format H3 di bagian bawah artikel.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
      });

      const raw = completion.choices[0].message.content;
      const newArtikel = JSON.parse(raw);
      
      // Pertahankan frontmatter lama (termasuk gambar, tanggal, penulis, slug), tapi update konten dan SEO
      const newFrontmatter = {
        ...parsed.data,
        ringkasan: newArtikel.ringkasan,
        seoTitle: newArtikel.seoTitle,
        seoDesc: newArtikel.seoDesc,
      };

      const newFileContent = matter.stringify(newArtikel.konten, newFrontmatter);
      await fs.writeFile(filePath, newFileContent);
      
      const newWordCount = newArtikel.konten.split(/\s+/).filter(Boolean).length;
      console.log(`✅ Berhasil: ${file} (Baru: ${newWordCount} kata)`);
      countSuccess++;

      // Jeda 30 detik antar request untuk menghindari rate-limit Groq LLaMA 3.3 70B
      console.log('Jeda 30 detik sebelum artikel berikutnya...');
      await new Promise(r => setTimeout(r, 30000));

    } catch (err) {
      console.error(`❌ Error sistem pada ${file}:`, err.message);
      if (err.message.includes('rate_limit') || err.message.includes('429')) {
        console.log('⏳ Rate limit tercapai! Rotasi kunci API...');
        rotateKey();
        // Coba masukkan kembali file ini ke antrian filesToRun agar dieksekusi ulang
        filesToRun.push(item);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  console.log(`\n🎉 Selesai! Berhasil meng-generate ulang ${countSuccess} dari ${filesToProcess.length} artikel pendek.`);
  console.log(`Silakan cek hasilnya lalu jalankan git commit & git push.`);
}

main().catch(console.error);
