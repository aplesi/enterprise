# AVIS Rule Engine (`avis-rule-engine`)

Rule Engine adalah jantung deterministik dari AVIS (Aquaculture Visual Intelligence System). Engine ini tidak menggunakan LLM dan tidak mengandalkan model probabilistik (AI). Semua aturan yang dijalankan adalah kode pasti (deterministik) berbentuk fungsi *Pure* yang merespons berdasarkan hasil *traversal* graf ontologi statis.

## Arsitektur

Modul ini mematuhi prinsip SOLID, *Clean Architecture*, *Dependency Injection*, dan mengimplementasikan variasi *Strategy Pattern* (untuk Resolusi Konflik dan Evaluasi Prioritas). 

- **Rule**: Objek murni tanpa *Side Effect*, memuat definisi `priority`, metode `evaluate(context)` dan `resolve(context)`.
- **RuleRegistry**: Fasilitas penyimpanan sementara bagi semua aturan yang terdaftar di dalam sistem.
- **RuleEvaluator**: Mesin pemicu (trigger) yang memeriksa kondisi kecocokan (*evaluate*) pada setiap aturan secara sekuensial dan terisolasi.
- **ConflictResolver**: Saat dua atau lebih aturan mencoba memodifikasi properti (TraitId) yang identik dengan nilai yang saling eksklusif (berbeda), modul ini menjamin bahwa resolusi dengan skor *priority* tertinggi yang akan menang, dan menekan nilai konflik ke bawah.
- **PriorityEvaluator**: Strategi deterministik untuk merangkum dan mengakumulasi skor prioritas akhir.
- **DecisionObject**: Hasil akhir absolut dari eksekusi rule, dipasok kembali sebagai *state* statis bebas bentrokan ke komponen rendering visual di masa mendatang.

## Kontrak Public API
Ekspor utama untuk paket di atasnya (Resolver/Scene Builder):
- **`RuleEngine`** (Facade utama yang merajut keseluruhan komponen)
- **`RuleContext`, `Rule`, `RuleResolution`, `DecisionObject`**
- **`RuleRegistry`**
- **`RuleEngineError`**

## Contoh Penggunaan (Dependency Injection)

```typescript
import { createEntity } from 'avis-ontology';
import { InMemoryGraphRepository, GraphTraversal } from 'avis-graph-loader';
import { RuleEngine, RuleRegistry, Rule, RuleContext } from 'avis-rule-engine';

// 1. Inisialisasi Graph
const repo = new InMemoryGraphRepository();
const traversal = new GraphTraversal(repo);
const ikan = createEntity({ id: "fish-1", type: "SPECIES", name: "Lele" });

// 2. Persiapan Rule
const warnaAirRule: Rule = {
  id: 'air-kotor-rule',
  name: 'Deteksi Air Kotor',
  description: 'Ubah warna air jika mendeteksi kondisi kotor',
  priority: 100, // Prioritas tinggi
  evaluate: (context: RuleContext) => {
    // Mengecek dari graph loader apakah lele ini berkaitan dengan lingkungan kotor (deterministik)
    return true; 
  },
  resolve: (context: RuleContext) => ({
    ruleId: 'air-kotor-rule',
    modifications: [{ traitId: 'water-color', value: '#8B4513' }],
    messages: ['Kondisi lingkungan diatur ke keruh']
  })
};

// 3. Register & Setup Engine (menggunakan Default Evaluator & Resolver Strategies)
const registry = new RuleRegistry();
registry.register(warnaAirRule);

const engine = new RuleEngine(registry);

// 4. Hitung Keputusan Deterministik
const decision = engine.evaluate(ikan, traversal);

// Output
console.log(decision.conflictsDetected); // false
console.log(decision.finalPriorityScore); // 100
console.log(decision.appliedResolutions[0].modifications[0].value); // #8B4513
```
