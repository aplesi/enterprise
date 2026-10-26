// @ts-nocheck
// Script pengujian utama untuk End-to-End Pipeline V1
import { generateArtikel } from './lib/ai/generator'
import { evaluateMarkdown } from './lib/quality/engine/core'
import { buildEditorContext } from './lib/ai/editor/context'
import { runEditorialReview } from './lib/ai/editor/engine'
import fs from 'fs'

import { parseMarkdown } from './lib/markdown/parse'
import { enrichDocument } from './lib/quality/enrichment/enricher'

async function runGoldenTest() {
  console.log("1. Generating Article...")
  const req = {
    topik: "Sistem Bioflok Budidaya Lele Intensif",
    kategori: "Teknologi",
    keywords: ["bioflok", "lele intensif", "budidaya lele", "probiotik", "flok"],
    panjang: "panjang" as any,
    tone: "tutorial" as any
  }
  
  let article = await generateArtikel(req)
  console.log(`Generated ${article.konten.split(' ').length} words.`)

  console.log("2. Running Quality Engine...")
  let qualityReport = evaluateMarkdown(article.konten)
  console.log(`Quality Score: ${qualityReport.overall}`)

  const baseDoc = parseMarkdown(article.konten)
  const richDoc = enrichDocument(baseDoc)

  console.log("3. Running Editorial Review Engine...")
  let editorContext = buildEditorContext(
    richDoc,
    qualityReport,
    'panduan',
    []
  )
  let editorialReport = await runEditorialReview(editorContext)
  console.log(`Editorial Score: ${editorialReport.overall} | Status: ${editorialReport.status}`)

  let iteration = 1
  const history = []

  // Feedback loop if needed (if either fails)
  if (qualityReport.overall < 80 || editorialReport.status !== 'PASS') {
    console.log("4. Regeneration needed based on feedback...")
    history.push({
      iteration,
      score: editorialReport.overall,
      actionList: editorialReport.actionList || []
    })

    const feedbackPrompt = `
      Artikel sebelumnya gagal melewati standar Editorial Review.
      Status Editor: ${editorialReport.status}
      Catatan Editor: ${editorialReport.editorNotes?.join(' ')}
      Tindakan yang diminta:
      ${editorialReport.actionList?.map(a => `- [${a.targetSection}] ${a.type}: ${a.instruction}`).join('\n')}
      
      Tolong perbaiki artikel tersebut dengan mengikuti instruksi di atas secara ketat tanpa mengurangi total kata (harus lebih dari 2000 kata).
    `
    // We simulate regeneration by calling groq directly with feedback
    const { groqChatWithRotation } = await import('./lib/ai/groq')
    const regeneratedRaw = await groqChatWithRotation({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Kamu adalah penulis ulang konten berdasarkan instruksi Editor.' },
        { role: 'user', content: `Konten asli:\n${article.konten}\n\nInstruksi Perbaikan:\n${feedbackPrompt}\n\nBerikan balasan JSON dengan format { "konten": "..." }` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    let stripped = regeneratedRaw.trim()
    const match = stripped.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/)
    if (match) stripped = match[1].trim()
    
    const parsed = JSON.parse(stripped)
    article.konten = String(parsed.konten || parsed.konten_baru || "")
    
    console.log(`Regenerated ${article.konten.split(' ').length} words.`)
    
    console.log("5. Running Second Quality Engine...")
    qualityReport = evaluateMarkdown(article.konten)
    
    const secondBaseDoc = parseMarkdown(article.konten)
    const secondRichDoc = enrichDocument(secondBaseDoc)
    
    console.log("6. Running Second Editorial Review Engine...")
    editorContext = buildEditorContext(
      secondRichDoc,
      qualityReport,
      'panduan',
      history
    )
    editorialReport = await runEditorialReview(editorContext)
    console.log(`Second Editorial Score: ${editorialReport.overall} | Status: ${editorialReport.status}`)
  }

  const result = {
    article,
    qualityReport,
    editorialReport,
    history
  }

  fs.writeFileSync('./golden-result.json', JSON.stringify(result, null, 2))
  fs.writeFileSync('./golden-article.md', article.konten)
  console.log("Done. Saved to golden-result.json and golden-article.md")
}

runGoldenTest().catch(console.error)
