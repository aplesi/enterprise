import { z } from 'zod';
import { TaxonomySchema } from './taxonomySchema';
import { TraitSchema } from './traitsSchema';
import { RenderingPropertySchema } from './renderingSchema';
import { RelationshipSchema } from './relationshipSchema';
import { EntityIdSchema } from './idSchemas';

export const EntityTypeSchema = z.enum([
  'SPECIES',
  'EQUIPMENT',
  'ENVIRONMENT',
  'ACTIVITY',
  'DISEASE'
]);

export const EntityMetadataSchema = z.object({
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const EntitySchema = z.object({
  schemaVersion: z.literal("1.0.0").default("1.0.0"),
  id: EntityIdSchema,
  type: EntityTypeSchema,
  name: z.string().min(1, "Entity name cannot be empty"),
  description: z.string().default(""),
  metadata: EntityMetadataSchema.optional(),
  taxonomy: TaxonomySchema.optional(),
  traits: z.array(TraitSchema).default([]),
  renderingProperties: z.array(RenderingPropertySchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
}).refine(data => {
  // Enforce taxonomy presence for SPECIES
  if (data.type === 'SPECIES' && !data.taxonomy) {
    return false;
  }
  return true;
}, {
  message: "Taxonomy is required for entities of type SPECIES",
  path: ["taxonomy"]
});
