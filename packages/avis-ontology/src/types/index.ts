import { z } from 'zod';
import {
  EntitySchema,
  EntityTypeSchema,
  EntityMetadataSchema,
  TaxonomySchema,
  TraitSchema,
  TraitTypeSchema,
  RenderingPropertySchema,
  RenderingTargetSchema,
  RelationshipSchema,
  RelationshipTypeSchema,
  EntityIdSchema,
  TraitIdSchema,
  TaxonomyIdSchema,
  RelationshipIdSchema
} from '../schemas';

// DeepReadonly to enforce deep immutability at compile time.
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export type EntityId = z.infer<typeof EntityIdSchema>;
export type TraitId = z.infer<typeof TraitIdSchema>;
export type TaxonomyId = z.infer<typeof TaxonomyIdSchema>;
export type RelationshipId = z.infer<typeof RelationshipIdSchema>;

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type EntityMetadata = DeepReadonly<z.infer<typeof EntityMetadataSchema>>;
export type Entity = DeepReadonly<z.infer<typeof EntitySchema>>;

export type Taxonomy = DeepReadonly<z.infer<typeof TaxonomySchema>>;

export type TraitType = z.infer<typeof TraitTypeSchema>;
export type Trait = DeepReadonly<z.infer<typeof TraitSchema>>;

export type RenderingTarget = z.infer<typeof RenderingTargetSchema>;
export type RenderingProperty = DeepReadonly<z.infer<typeof RenderingPropertySchema>>;

export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type Relationship = DeepReadonly<z.infer<typeof RelationshipSchema>>;
