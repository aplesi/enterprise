import { Entity, EntityId, RelationshipType, Relationship } from 'avis-ontology';
import { IKnowledgeGraphRepository } from '../repository';
import { TraversalError } from '../errors';

export class GraphTraversal {
  constructor(private repository: IKnowledgeGraphRepository) {}

  public getRelationships(entityId: EntityId | string): Relationship[] {
    const entity = this.repository.getEntityById(entityId);
    if (!entity) throw new TraversalError(`Entity not found: ${entityId}`);

    const id = entityId as string;
    const outgoing = this.repository.getOutgoingRelationships(id);
    const incoming = this.repository.getIncomingRelationships(id);

    return [...outgoing, ...incoming];
  }

  public getRelatedEntities(entityId: EntityId | string, relType?: RelationshipType): Entity[] {
    const relationships = this.getRelationships(entityId);
    
    let filtered = relationships;
    if (relType) filtered = relationships.filter(r => r.type === relType);

    const relatedIds = new Set<string>();
    for (const rel of filtered) {
      if (rel.sourceId !== entityId) relatedIds.add(rel.sourceId as string);
      if (rel.targetId !== entityId) relatedIds.add(rel.targetId as string);
    }

    const relatedEntities: Entity[] = [];
    for (const id of relatedIds) {
      const related = this.repository.getEntityById(id);
      if (related) relatedEntities.push(related);
    }

    return relatedEntities;
  }

  public findByTaxonomy(rank: keyof NonNullable<Entity['taxonomy']>, value: string): Entity[] {
    return this.repository.getEntitiesByTaxonomy(rank, value);
  }
}
