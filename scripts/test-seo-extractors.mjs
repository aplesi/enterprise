import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Helper untuk mengimpor file TS di dalam script Node.js MJS
// tanpa memerlukan ts-node atau dependency eksternal tambahan.
function requireTs(relativePath) {
  const filePath = path.resolve(__dirname, relativePath)
  const code = fs.readFileSync(filePath, 'utf8')
  
  const result = ts.transpileModule(code, {
    compilerOptions: { 
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  })
  
  const exports = {}
  const module = { exports }
  // Evaluasi kode yang sudah dikompilasi ke JS
  eval(result.outputText)
  return module.exports
}

const { extractFaq } = requireTs('../lib/seo/faq.ts')
const { extractHowToSteps } = requireTs('../lib/seo/howto.ts')

const sampleKonten = `
Ringkasan singkat artikel.

## FAQ

### Apa itu Sistem Bioflok?
Sistem bioflok adalah teknik akuakultur.

### Bagaimana cara memulai?
Caranya sangat mudah, ikuti panduan berikut.

## Langkah-Langkah

### 1. Persiapan Kolam
Siapkan terpal dan bersihkan dari kotoran.

### 2. Penebaran Benih
Tebar benih saat suhu air stabil.
`

console.log("Menjalankan test SEO Extractors...")

const faqResult = extractFaq(sampleKonten)
const howtoResult = extractHowToSteps(sampleKonten)

let pass = true

// Verifikasi FAQ
if (faqResult.length !== 2) {
  console.error("❌ Gagal: extractFaq seharusnya menemukan 2 FAQ, tapi menemukan", faqResult.length)
  pass = false
} else if (faqResult[0].pertanyaan !== "Apa itu Sistem Bioflok?") {
  console.error("❌ Gagal: Pertanyaan FAQ pertama tidak sesuai:", faqResult[0].pertanyaan)
  pass = false
} else {
  console.log("✅ extractFaq berhasil membaca section ## FAQ saja.")
}

// Verifikasi HowTo
if (howtoResult.length !== 2) {
  console.error("❌ Gagal: extractHowToSteps seharusnya menemukan 2 langkah, tapi menemukan", howtoResult.length)
  pass = false
} else if (howtoResult[0].nama !== "Persiapan Kolam") {
  console.error("❌ Gagal: Langkah pertama tidak sesuai:", howtoResult[0].nama)
  pass = false
} else {
  console.log("✅ extractHowToSteps berhasil membaca section ## Langkah-Langkah saja.")
}

if (pass) {
  console.log("🎉 Semua test berhasil! Extractor sudah scoped-based dan tidak bertabrakan.")
} else {
  process.exit(1)
}
