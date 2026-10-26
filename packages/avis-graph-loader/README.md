# AVIS Graph Loader (`avis-graph-loader`)

Modul ini berfungsi sebagai pintu masuk (Loader) dan penyimpan in-memory (Repository) dari graf pengetahuan AVIS (Knowledge Graph). Modul ini membaca graf dari JSON seed, memvalidasinya melawan skema ontologi, dan memberikan akses baca (Lookup & Traversal) bagi komponen eksekutor.

## Dependency terhadap AVIS-FND-01
Modul ini sepenuhnya bergantung pada `avis-ontology` (AVIS-FND-01) untuk urusan Type-Safety dan Validation. Modul ini tidak pernah mendefinisikan ulang bentuk data, melainkan murni memanggil `createEntity` dan struktur Zod (seperti `EntityId`, `Relationship`) dari paket `avis-ontology`. Semua entitas yang diproses akan mematuhi status `DeepReadonly` demi menjamin *Immutability* data graf.

## Kontrak Public API
Ekspor utama yang diizinkan untuk digunakan oleh paket hilir:
- **`InMemoryGraphRepository`**: Kelas *singleton* untuk menyimpan graf.
- **`JsonSeedLoader`**: Menangani injeksi awal JSON statis ke dalam repositori.
- **`GraphTraversal`**: *Engine* murni (*Pure API*) untuk menavigasi, mengekstrak relasi, dan mem-filter taksonomi tanpa perlu mengiterasi `getAllEntities` secara manual.
- **`GraphLoadError`, `TraversalError`**: Custom Error khusus manajemen kesalahan graf.

## Cara Penggunaan
Contoh siklus muat statis saat peluncuran mesin (Bootstrap):

```typescript
import { 
  InMemoryGraphRepository, 
  JsonSeedLoader, 
  GraphTraversal 
} from 'avis-graph-loader';

// 1. Inisialisasi
const repository = new InMemoryGraphRepository();
const loader = new JsonSeedLoader(repository);
const traversal = new GraphTraversal(repository);

// 2. Load dari seed.json (Biasanya melalui baca fs.readFileSync di server)
const rawSeedData = {
  entities: [
    {
      id: "clarias-gariepinus",
      type: "SPECIES",
      name: "Lele Dumbo",
      taxonomy: { family: "Clariidae" }
    },
    // ...
  ]
};

// 3. Validasi & Injeksi (Akan melempar GraphLoadError jika rusak)
loader.load(rawSeedData);

// 4. Penggunaan Rutin (Lookup & Traversal)
const lele = repository.getEntityById("clarias-gariepinus");
const leleFamily = traversal.findByTaxonomy("family", "Clariidae");
const allEq = repository.getEntitiesByType("EQUIPMENT");

// Traversal relasi
const relatedToLele = traversal.getRelatedEntities("clarias-gariepinus", "PREFERS_ENVIRONMENT");
```
