import { Entity } from 'avis-ontology';
import { GraphLoadError } from '../errors';

export class GraphValidator {
  /**
   * Validates a batch of entities for duplicate IDs and referential integrity.
   * Throws GraphLoadError if any validation fails.
   */
  public validate(entities: Entity[]): void {
    const entityIds = new Set<string>();
    
    // Check for duplicate entity IDs
    for (const entity of entities) {
      if (entityIds.has(entity.id as string)) {
        throw new GraphLoadError(`Duplicate entity ID detected: ${entity.id}`);
      }
      entityIds.add(entity.id as string);
    }

    // Check for referential integrity
    for (const entity of entities) {
      if (entity.relationships) {
        for (const rel of entity.relationships) {
          if (!entityIds.has(rel.sourceId as string)) {
            throw new GraphLoadError(`Referential integrity error: sourceId '${rel.sourceId}' in relationship of entity '${entity.id}' does not exist.`);
          }
          if (!entityIds.has(rel.targetId as string)) {
            throw new GraphLoadError(`Referential integrity error: targetId '${rel.targetId}' in relationship of entity '${entity.id}' does not exist.`);
          }
        }
      }
    }
  }
}
