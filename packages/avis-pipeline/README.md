# AVIS End-to-End Pipeline (`avis-pipeline`)

Modul ini adalah *Pipeline Orchestrator* yang menjahit seluruh Foundation Layer dan Core Engine AVIS menjadi satu kesatuan aliran kerja yang koheren. Ini adalah perwujudan AVIS MVP-01 (*First Working System*).

## Tujuan Pipeline
Membuktikan bahwa konsep arsitektur AVIS (Ekstraksi Semantik $\rightarrow$ Knowledge Graph $\rightarrow$ Rule Engine $\rightarrow$ Scene Builder $\rightarrow$ Prompt Adapter) dapat berjalan deterministik secara *end-to-end* tanpa sirkulasi dependensi.

## Alur Data (Data Flow)
1. **Input**: `PipelineContext` (berisi data raw JSON *Knowledge Graph* dan ID target *Entity* hasil ekstraksi semantik artikel).
2. **Graph Loader Phase**: Memuat JSON mentah menggunakan `JsonSeedLoader` ke dalam `InMemoryGraphRepository`.
3. **Rule Engine Phase**: `RuleEngine` mengevaluasi graf dan entitas target untuk mengambil keputusan visual.
4. **Scene Builder Phase**: `SceneFactory` menerjemahkan keputusan menjadi properti adegan spasial/lingkungan yang independen (DTO *Scene*).
5. **Prompt Adapter Phase**: `PromptRenderer` menerjemahkan objek *Scene* ke dalam urutan kalimat spesifik (*Prompt* teks murni) dengan struktur urutan deterministik:
   *Subject* $\rightarrow$ *Environment* $\rightarrow$ *Composition* $\rightarrow$ *Camera* $\rightarrow$ *Lighting* $\rightarrow$ *Objects/Relationships* $\rightarrow$ *Rendering Hints* $\rightarrow$ *Negative Constraints*.

## Dependency Antar Modul
- Bergantung pada: `avis-ontology`, `avis-graph-loader`, `avis-rule-engine`, `avis-scene-builder`.
- Modul *Prompt Adapter* di dalam *pipeline* ini sama sekali **tidak mengetahui** keberadaan *Graph* atau *Rule Engine*. Ia murni hanya mengonsumsi objek `Scene`.

## Public API
```typescript
import { PipelineOrchestrator, PipelineContext, PipelineResult } from 'avis-pipeline';
import { RuleRegistry } from 'avis-rule-engine';

const registry = new RuleRegistry();
// registry.register(new CustomRule());

const orchestrator = new PipelineOrchestrator(registry);

const context: PipelineContext = {
  articleId: 'artikel-123',
  targetEntityId: 'lele-dumbo',
  rawSeedData: {
    entities: [
      { id: 'lele-dumbo', type: 'SPECIES', name: 'Lele Dumbo', traits: {}, relationships: [] }
    ]
  }
};

const result: PipelineResult = orchestrator.execute(context);
console.log(result.prompt); // Output Prompt siap dikirim ke Stable Diffusion XL!
```

## Contoh Input & Output
**Input**: Artikel menyebut "Lele Dumbo dipelihara di kolam terpal". Ekstraksi semantik mengirim Graph Seed dengan relasi "Lele Dumbo" $\rightarrow$ "Kolam Terpal".
**Output**: 
`Main subject: Lele Dumbo, Environment: murky_pond during day with clear weather, medium_shot, eye_level perspective, focus on subject, Shot on standard_50mm lens at f/5.6, static motion, balanced soft_studio_lighting lighting from front_left, Supporting elements: Kolam Terpal, Spatial relations: lele-dumbo is near kolam-terpal, Style: photorealistic, Quality: masterpiece, highly detailed, 8k resolution`
