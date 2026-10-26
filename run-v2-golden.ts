import { generateArticleV2 } from './lib/ai/generator/orchestrator'
import { evaluateMarkdown } from './lib/quality/engine/core'
import { buildEditorContext } from './lib/ai/editor/context'
import { runEditorialReview } from './lib/ai/editor/engine'
import fs from 'fs'
import { parseMarkdown } from './lib/markdown/parse'
import { enrichDocument } from './lib/quality/enrichment/enricher'
import { generateFrontmatter } from './lib/utils'

async function runV2Test() {
  console.log("=== V2 HIERARCHICAL GENERATOR TEST ===")
  const req = {
    topik: "Sistem Bioflok Budidaya Lele Intensif",
    kategori: "Teknologi",
    keywords: ["bioflok", "lele intensif", "budidaya lele", "probiotik", "flok"],
    targetWords: 2000,
    tone: "tutorial"
  }
  
  const startTime = Date.now()
  const { konten, blueprint } = await generateArticleV2(req)
  const duration = (Date.now() - startTime) / 1000
  
  const wordCount = konten.split(/\s+/).filter(Boolean).length
  console.log(`\nGenerated ${wordCount} words in ${duration}s.`)

  console.log("\n2. Running Quality Engine...")
  
  const allEntities = blueprint.sections.flatMap(s => s.entitiesToCover)
  let qualityReport = evaluateMarkdown(konten, undefined, { keywords: req.keywords, entities: allEntities })
  
  console.log(`Quality Score: ${qualityReport.overall} | Status: ${qualityReport.status}`)

  const baseDoc = parseMarkdown(konten)
  const richDoc = enrichDocument(baseDoc)

  console.log("\n3. Running Editorial Review Engine...")
  let editorContext = buildEditorContext(
    richDoc,
    qualityReport,
    'panduan',
    []
  )
  
  let editorialReport = await runEditorialReview(editorContext)
  console.log(`Editorial Score: ${editorialReport.overall} | Status: ${editorialReport.status}`)
  
  // Log metrics non-blocking
  import('./lib/metrics/collector').then(({ metrics }) => {
    metrics.log({
      articleSlug: 'sistem-bioflok-v2',
      wordCount: wordCount,
      densityScore: qualityReport.categories['READABILITY']?.score || 0,
      coverageScore: qualityReport.categories['ENTITY']?.score || 0,
      qualityScore: qualityReport.overall,
      editorialScore: editorialReport.overall,
      durationMs: duration * 1000,
      timestamp: new Date().toISOString()
    })
  })
  
  // Construct final frontmatter & markdown
  const frontmatter = generateFrontmatter({
    judul: blueprint.title,
    slug: "sistem-bioflok-v2",
    kategori: req.kategori,
    tags: req.keywords,
    tanggal: new Date().toISOString().split('T')[0],
    status: "published",
    penulis: "Aplesi AI V2"
  })
  
  const finalMarkdown = `${frontmatter}\n${konten}`
  fs.writeFileSync('v2-golden-article.md', finalMarkdown)
  
  console.log('\nDone. Saved to v2-golden-article.md')
}

runV2Test().catch(console.error)
