import { z } from 'zod';
import { EntityIdSchema, RelationshipIdSchema } from './idSchemas';

export const RelationshipTypeSchema = z.enum([
  'HAS_TRAIT',
  'REQUIRES_EQUIPMENT',
  'PREFERS_ENVIRONMENT',
  'INCOMPATIBLE_WITH',
  'HAS_SYMPTOM'
]);

export const RelationshipSchema = z.object({
  id: RelationshipIdSchema.optional(), // Added id for consistency if needed, optional for backward compatibility
  sourceId: EntityIdSchema,
  targetId: EntityIdSchema,
  type: RelationshipTypeSchema,
  weight: z.number().min(0).max(1).default(1.0),
});
