# AVIS Scene Builder (`avis-scene-builder`)

Modul ini bertanggung jawab untuk menerjemahkan hasil pengambilan keputusan logis (*Decision Object*) dari `avis-rule-engine` beserta graf ontologi (melalui `avis-graph-loader`) menjadi struktur **Scene Object** yang netral, kaya konteks, dan sangat representatif.

Scene Builder **bukan** sebuah *Prompt Generator* apalagi modul AI. Ia bertindak secara murni deterministik. Output-nya dirancang murni berbasis properti statis (*Composition, Camera, Lighting, Entities*), yang di masa mendatang akan ditangkap dan dipoles oleh modul ujung: *Prompt Adapter* (AVIS-ADAPTER).

## Tujuan Scene Builder
1. Memusatkan translasi instruksi logis ("keruh", "dekat aerator") menjadi representasi properti visual diskrit ("water-color: brown", "relationships: [near, eq-1]").
2. Memblokade agar model generatif di ujung *Pipeline* hanya perlu fokus pada representasi bahasa natural/seni (*Prompting*) tanpa harus memikirkan relasi, dependensi, dan ontologi lele.
3. Menjamin *immutability* rancang bangun adegan sebelum digambar.

## Dependency
Modul ini bertopang sepenuhnya pada:
- **AVIS-FND-01 (`avis-ontology`)**: Fondasi tipe data, struktur *Entity*.
- **AVIS-FND-02 (`avis-graph-loader`)**: Pengambil data sekeliling objek utama via lintasan *GraphTraversal*.
- **AVIS-COR-01 (`avis-rule-engine`)**: Pemasok parameter hasil eksekusi *Rules* (`DecisionObject`).

## Struktur `Scene` Object
Scene Object ini akan menjadi *blueprint* baku (*Single Source of Truth*) adegan visual:

```typescript
export interface Scene {
  metadata: SceneMetadata;
  subject: SceneObject;
  supportingObjects: SceneObject[];
  environment: Environment;
  camera: Camera;
  composition: Composition;
  lighting: Lighting;
  colorPalette: string[];
  visualConstraints: string[];
  negativeConstraints: string[];
  relationships: SceneRelationship[];
  renderingHints: RenderingHints;
}
```

## Contoh Penggunaan (Public API)

```typescript
import { SceneFactory, SceneValidator } from 'avis-scene-builder';
import { InMemoryGraphRepository, GraphTraversal } from 'avis-graph-loader';
import { DecisionObject } from 'avis-rule-engine';

// 1. Disediakan oleh modul hilir (Dependency Injection)
const repo = new InMemoryGraphRepository();
const traversal = new GraphTraversal(repo);

// (Pura-pura terdapat ikan lele di repo dan kita sudah punya decision dari Rule Engine)
const myDecision: DecisionObject = {
  entityId: "fish-dumbo",
  matchedRules: ["rule-water-quality"],
  appliedResolutions: [ /* Resolusi merubah lighting/warna air */ ],
  conflictsDetected: false,
  finalPriorityScore: 90
};

// 2. Bangun Scene menggunakan Factory
const factory = new SceneFactory(repo, traversal);
const finalScene = factory.buildScene(myDecision);

// 3. Scene siap dipasok ke Prompt Adapter!
console.log(finalScene.environment.locationType); 
console.log(finalScene.camera.lens);
```

## Extension Points untuk Prompt Adapter
Nantinya, modul `avis-prompt-adapter` akan mengonsumsi tipe `Scene` ini secara mentah. Konsep `renderingHints` (kualitas, gaya gambar) dan `negativeConstraints` (misal: "no extra fins", "no blurry background") dipersiapkan agar dapat dipetakan langsung ke format model-spesifik seperti *Stable Diffusion XL* atau *Midjourney*.
