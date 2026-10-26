import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryGraphRepository } from '../src';
import { createEntity } from 'avis-ontology';

describe('InMemoryGraphRepository', () => {
  let repository: InMemoryGraphRepository;

  beforeEach(() => {
    repository = new InMemoryGraphRepository();
  });

  it('should add and retrieve entities', () => {
    const entity = createEntity({
      id: "fish-1",
      type: "SPECIES",
      name: "Catfish",
      taxonomy: { kingdom: "Animalia" }
    });

    repository.addEntity(entity);
    
    const found = repository.getEntityById("fish-1");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Catfish");
  });

  it('should clear all entities', () => {
    const entity = createEntity({
      id: "fish-1",
      type: "SPECIES",
      name: "Catfish",
      taxonomy: { kingdom: "Animalia" }
    });

    repository.addEntity(entity);
    expect(repository.getAllEntities().length).toBe(1);

    repository.clear();
    expect(repository.getAllEntities().length).toBe(0);
  });

  it('should find entities by type', () => {
    repository.addEntities([
      createEntity({ id: "fish-1", type: "SPECIES", name: "Catfish", taxonomy: {} }),
      createEntity({ id: "eq-1", type: "EQUIPMENT", name: "Aerator" })
    ]);

    const equipment = repository.getEntitiesByType("EQUIPMENT");
    expect(equipment.length).toBe(1);
    expect(equipment[0].id).toBe("eq-1");
  });
});
