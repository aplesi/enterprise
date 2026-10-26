# AVIS Core Ontology Architecture

## Package Overview
Paket `avis-ontology` adalah *Single Source of Truth* untuk bentuk data (skema) graf di Aquaculture Visual Intelligence System (AVIS). Paket ini berfokus semata-mata pada bentuk (Zod) dan tipe (TypeScript) tanpa memuat logika bisnis penyelesaian graf (*Resolver*) atau aturan (*Rule Engine*).

## Folder Structure
```
packages/avis-ontology/
├── src/
│   ├── errors/       # Kelas error kustom (OntologyError, ValidationError)
│   ├── factory/      # Fungsi pembangun instansi Entity yang aman
│   ├── schemas/      # Zod schemas (Entity, Taxonomy, Traits, dll)
│   ├── types/        # Tipe TypeScript statis hasil inferensi Zod
│   ├── validation/   # Utilitas validasi safeParse
│   └── index.ts      # Public API Barrel
└── tests/            # Unit tests komprehensif
```

## Dependency Rules
Aliran dependensi internal bersifat **Unidirectional**:
`types` $\leftarrow$ `schemas` $\leftarrow$ `validation` $\leftarrow$ `factory` $\leftarrow$ `index.ts`
Dilarang keras membuat referensi memutar (*circular dependency*).

## Public API
Seluruh konsumsi dari paket luar (misal `avis-rule-engine`) wajib mengimpor melalui *root* paket.
**BENAR**: `import { EntitySchema, createEntity } from 'avis-ontology';`
**SALAH**: `import { EntitySchema } from 'avis-ontology/src/schemas/entitySchema';`

## Design Principles
1. **Immutability by TS**: Segala objek yang mengalir keluar dari factory dijamin keamanannya oleh tipe `DeepReadonly<T>` TypeScript.
2. **Brand Types**: Segala properti ID (`EntityId`, `TraitId`, `TaxonomyId`, `RelationshipId`) menggunakan tipe buram (*Opaque/Brand types*) agar ID tidak tertukar secara logika di luar sistem.

## Extension Points
Skema dirancang agar toleran terhadap penambahan (selama *backward-compatible*).
- **Metadata**: Menyediakan informasi sekunder (`source`, `confidence`, `tags`, `createdAt`) tanpa merusak relasi struktural utama graf. Bersifat opsional.

## Forbidden Imports
Paket ini **dilarang keras** mengimpor pustaka standar Node.js (mis. `fs`, `path`, `crypto`) karena ontologi harus dapat dijalankan secara universal di segala *runtime* (*Browser*, *Cloudflare Workers*, *Deno*, *Bun*).

## Future Compatibility
Ontologi dilengkapi dengan `schemaVersion` (saat ini `"1.0.0"`) di dalam inti `EntitySchema`. Modul lain kelak akan memvalidasi *version* ini guna merancang jalur *backward-compatibility* saat perpindahan versi arsitektur terjadi.
