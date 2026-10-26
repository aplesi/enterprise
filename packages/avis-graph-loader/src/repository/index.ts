import { Entity, EntityId, EntityType, Relationship } from 'avis-ontology';

export interface IKnowledgeGraphRepository {
  addEntity(entity: Entity): void;
  addEntities(entities: Entity[]): void;
  clear(): void;
  getEntityById(id: EntityId | string): Entity | undefined;
  getAllEntities(): Entity[];
  getEntitiesByType(type: EntityType): Entity[];
  
  // Index Access Methods
  getOutgoingRelationships(entityId: string): Relationship[];
  getIncomingRelationships(entityId: string): Relationship[];
  getEntitiesByTaxonomy(rank: keyof NonNullable<Entity['taxonomy']>, value: string): Entity[];
}

export class InMemoryGraphRepository implements IKnowledgeGraphRepository {
  private entities: Map<string, Entity> = new Map();
  
  // Indexes
  private outgoingRelations: Map<string, Relationship[]> = new Map();
  private incomingRelations: Map<string, Relationship[]> = new Map();
  // taxonomyIndex: Map<Rank, Map<Value, Set<EntityId>>>
  private taxonomyIndex: Map<string, Map<string, Set<string>>> = new Map();

  public addEntity(entity: Entity): void {
    const id = entity.id as string;
    this.entities.set(id, entity);

    // Build outgoing relations index
    if (entity.relationships) {
      this.outgoingRelations.set(id, [...entity.relationships]);
      
      // Build incoming relations index
      for (const rel of entity.relationships) {
        const targetId = rel.targetId as string;
        if (!this.incomingRelations.has(targetId)) {
          this.incomingRelations.set(targetId, []);
        }
        this.incomingRelations.get(targetId)!.push(rel);
      }
    }

    // Build taxonomy index
    if (entity.taxonomy) {
      for (const [rank, val] of Object.entries(entity.taxonomy)) {
        if (!val) continue;
        const value = val as string;
        
        if (!this.taxonomyIndex.has(rank)) {
          this.taxonomyIndex.set(rank, new Map());
        }
        const rankMap = this.taxonomyIndex.get(rank)!;
        
        if (!rankMap.has(value)) {
          rankMap.set(value, new Set());
        }
        rankMap.get(value)!.add(id);
      }
    }
  }

  public addEntities(entities: Entity[]): void {
    for (const entity of entities) {
      this.addEntity(entity);
    }
  }

  public clear(): void {
    this.entities.clear();
    this.outgoingRelations.clear();
    this.incomingRelations.clear();
    this.taxonomyIndex.clear();
  }

  public getEntityById(id: EntityId | string): Entity | undefined {
    return this.entities.get(id as string);
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getEntitiesByType(type: EntityType): Entity[] {
    return this.getAllEntities().filter(e => e.type === type);
  }

  public getOutgoingRelationships(entityId: string): Relationship[] {
    return this.outgoingRelations.get(entityId) || [];
  }

  public getIncomingRelationships(entityId: string): Relationship[] {
    return this.incomingRelations.get(entityId) || [];
  }

  public getEntitiesByTaxonomy(rank: keyof NonNullable<Entity['taxonomy']>, value: string): Entity[] {
    const rankMap = this.taxonomyIndex.get(rank);
    if (!rankMap) return [];
    
    const idSet = rankMap.get(value);
    if (!idSet) return [];
    
    const result: Entity[] = [];
    for (const id of idSet) {
      const e = this.getEntityById(id);
      if (e) result.push(e);
    }
    return result;
  }
}
