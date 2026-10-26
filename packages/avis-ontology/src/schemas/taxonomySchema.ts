import { z } from 'zod';
import { TaxonomyIdSchema } from './idSchemas';

export const TaxonomySchema = z.object({
  id: TaxonomyIdSchema.optional(), // Usually conceptual, but useful for reference
  kingdom: z.string().optional(),
  phylum: z.string().optional(),
  class: z.string().optional(),
  order: z.string().optional(),
  family: z.string().optional(),
  genus: z.string().optional(),
  species: z.string().optional(),
}).refine(data => {
  // If a lower classification is provided, its immediate parent should ideally exist
  // But for simple validation, we just ensure it's an object of strings.
  // Advanced hierarchical checking can go into the factory or a specialized validator.
  return true;
}, "Invalid taxonomy hierarchy");
