import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      'avis-ontology': path.resolve(__dirname, '../avis-ontology/src/index.ts')
    }
  },
});
