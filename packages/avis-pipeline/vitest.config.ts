import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      'avis-ontology': path.resolve(__dirname, '../avis-ontology/src/index.ts'),
      'avis-graph-loader': path.resolve(__dirname, '../avis-graph-loader/src/index.ts'),
      'avis-rule-engine': path.resolve(__dirname, '../avis-rule-engine/src/index.ts'),
      'avis-scene-builder': path.resolve(__dirname, '../avis-scene-builder/src/index.ts')
    }
  },
});
