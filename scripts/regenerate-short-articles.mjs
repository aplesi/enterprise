import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Groq from 'groq-sdk';

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
Sertakan tips praktis dan pengalaman lapangan, data spesifik (angka, rentang biaya, durasi), bukan klaim generik.

⚠️ ATURAN PANJANG ARTIKEL — KRITIS, JANGAN DILANGGAR:
- Target panjang konten: 2000-2500 kata.
- Hitung kata Anda secara mental saat menulis. Artikel yang terlalu pendek akan DITOLAK.
- Untuk target 2000-2500 kata: kamu WAJIB menulis MINIMAL 10 section (H2/H3), masing-masing 150-250 kata.
- Jangan pernah menulis section kurang dari 100 kata — itu terlalu dangkal dan tidak bernilai.
- Setiap section HARUS berisi paragraf penjelasan mendalam, BUKAN hanya daftar bullet point singkat.

ATURAN FORMAT WAJIB (penting untuk SEO & agar dikutip AI/Google):
1. ANSWER-FIRST: di bawah SETIAP heading H2/H3, kalimat PERTAMA harus langsung menjawab inti topik heading tersebut -- bukan basa-basi pembuka. Kalimat 2-4 berisi detail pendukung (data/angka), lalu bullet points jika ada langkah/daftar.
2. PANJANG PER SECTION: setiap section di bawah satu H2/H3 sebaiknya 150-200 kata (minimum 100, maksimum 300). Jangan buat section super singkat (di bawah 50 kata) -- itu terlalu dangkal. Jangan juga lewat 300 kata untuk satu poin -- pecah jadi sub-heading baru kalau perlu.
3. PANJANG PARAGRAF: tiap paragraf sekitar 60-100 kata, satu ide utama per paragraf.
4. Jika artikel ini berupa panduan langkah-demi-langkah, gunakan heading H3 bernomor eksplisit ("### 1. Nama Langkah", "### 2. Nama Langkah", dst).
5. SERTAKAN DATA KONKRET: biaya dalam Rupiah (contoh: Rp 2.000.000-5.000.000), durasi (contoh: 3-4 bulan), ukuran (contoh: diameter 3 meter), dosis (contoh: 5 ml per 1000 liter). Jangan menulis "biaya murah" tanpa angka.
6. Untuk SEO lokal Indonesia: sebutkan nama daerah/kota penghasil ikan terbesar, nama merek pakan/probiotik populer di Indonesia, dan referensi ke standar KKP (Kementerian Kelautan dan Perikanan) jika relevan.

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
    
    if (wordCount < 400) {
      filesToProcess.push({ file, filePath, parsed, wordCount });
    }
  }

  console.log(`Menemukan ${filesToProcess.length} artikel pendek yang perlu di-regenerate.`);

  for (const item of filesToProcess) {
    const { file, filePath, parsed, wordCount } = item;
    countShort++;
    console.log(`\n[${countShort}/${filesToProcess.length}] ⏳ Meng-generate ulang: ${file} (Saat ini: ${wordCount} kata)`);
    
    const { judul, kategori, tags } = parsed.data;

    const userPrompt = `Tulis artikel tentang: "${judul}"

Kategori: ${kategori || 'Budidaya'}
Keywords yang harus ada: ${(tags || []).join(', ')}
Panjang: 2000-2500 kata — INI WAJIB DIPENUHI, jangan kurang dari 2000 kata.
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
        // Coba masukkan kembali file ini ke antrian agar tidak terlewat
        filesToProcess.push(item);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  console.log(`\n🎉 Selesai! Berhasil meng-generate ulang ${countSuccess} dari ${filesToProcess.length} artikel pendek.`);
  console.log(`Silakan cek hasilnya lalu jalankan git commit & git push.`);
}

main().catch(console.error);
