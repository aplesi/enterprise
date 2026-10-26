# AVIS Core Ontology (`avis-ontology`)

Modul ini adalah pondasi struktural untuk Aquaculture Visual Intelligence System (AVIS). Menyediakan Type-Safety, Runtime Validation (Zod), dan Factory functions (Immutable) untuk membangun node graf.

## Instalasi
```bash
cd packages/avis-ontology
npm install
```

## Penggunaan

```typescript
import { createEntity, Entity } from 'avis-ontology';

const myEntity: Entity = createEntity({
  id: "eq-1",
  type: "EQUIPMENT",
  name: "Aerator",
  traits: [
    {
      id: "t1",
      type: "MORPHOLOGICAL",
      name: "Shape",
      value: "Wheel",
      isRequired: true
    }
  ]
});
```

## Public API
- `createEntity(raw)`: Factory fungsi pembangun entity read-only yang tervalidasi.
- `validateEntity(raw)`: Fungsi validasi tanpa *throw error* (Safe Parse).
- `EntitySchema`, `TaxonomySchema`, `TraitSchema`, `RelationshipSchema`: Zod schema langsung jika diperlukan.
- `Entity`, `Taxonomy`, dll: Tipe TypeScript murni hasil inferensi.

## Testing
Gunakan vitest:
```bash
npm run test
```
