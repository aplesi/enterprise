import { z } from 'zod';
import { TraitIdSchema } from './idSchemas';

export const TraitTypeSchema = z.enum([
  'MORPHOLOGICAL',
  'BEHAVIORAL',
  'ENVIRONMENTAL',
  'NEGATIVE'
]);

export const TraitSchema = z.object({
  id: TraitIdSchema,
  type: TraitTypeSchema,
  name: z.string().min(1, "Trait name cannot be empty"),
  value: z.string(),
  isRequired: z.boolean().default(false),
});
