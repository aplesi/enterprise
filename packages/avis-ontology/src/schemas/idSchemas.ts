import { z } from 'zod';

export const EntityIdSchema = z.string().min(1, "Entity ID cannot be empty").brand<'EntityId'>();
export const TraitIdSchema = z.string().min(1, "Trait ID cannot be empty").brand<'TraitId'>();
export const RelationshipIdSchema = z.string().min(1, "Relationship ID cannot be empty").brand<'RelationshipId'>();
export const TaxonomyIdSchema = z.string().min(1).brand<'TaxonomyId'>();
