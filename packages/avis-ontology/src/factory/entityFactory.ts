import { EntitySchema } from '../schemas';
import { Entity } from '../types';
import { EntityError, ValidationError } from '../errors';

/**
 * Creates a valid Entity based on the core ontology schema.
 * @param rawData The raw unvalidated entity object
 * @throws {ValidationError} if the data does not match the schema
 * @returns A DeepReadonly Entity object at compile-time
 */
export function createEntity(rawData: unknown): Entity {
  const result = EntitySchema.safeParse(rawData);
  if (!result.success) {
    throw new ValidationError("Failed to build Entity", result.error.format());
  }
  
  return result.data as unknown as Entity;
}
