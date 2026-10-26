import { createEntity, Entity } from 'avis-ontology';
import { IKnowledgeGraphRepository } from '../repository';
import { GraphLoadError } from '../errors';
import { GraphValidator } from '../validation';

export interface GraphSeed {
  entities: unknown[];
}

export class JsonSeedLoader {
  private validator: GraphValidator;

  constructor(private repository: IKnowledgeGraphRepository) {
    this.validator = new GraphValidator();
  }

  /**
   * Loads a JSON seed object, validates all entities, checks referential integrity,
   * and loads them into the repository.
   * 
   * @param data The JSON object containing the graph seed
   */
  public load(data: unknown): void {
    if (!data || typeof data !== 'object' || !('entities' in data)) {
      throw new GraphLoadError("Invalid seed format: 'entities' array is required.");
    }

    const seed = data as GraphSeed;
    if (!Array.isArray(seed.entities)) {
      throw new GraphLoadError("Invalid seed format: 'entities' must be an array.");
    }

    const parsedEntities: Entity[] = [];
    
    // 1. Structural Validation (Ontology Delegation)
    for (const raw of seed.entities) {
      try {
        const entity = createEntity(raw);
        parsedEntities.push(entity);
      } catch (error) {
        throw new GraphLoadError(`Validation failed for entity: ${JSON.stringify(raw)}`, error);
      }
    }

    // 2. Semantic Validation (Duplicate IDs, Referential Integrity)
    this.validator.validate(parsedEntities);

    // 3. Load into Repository
    this.repository.addEntities(parsedEntities);
  }
}
