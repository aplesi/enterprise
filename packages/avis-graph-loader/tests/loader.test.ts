import { describe, it, expect, beforeEach } from 'vitest';
import { JsonSeedLoader, InMemoryGraphRepository, GraphLoadError } from '../src';

describe('JsonSeedLoader', () => {
  let repository: InMemoryGraphRepository;
  let loader: JsonSeedLoader;

  beforeEach(() => {
    repository = new InMemoryGraphRepository();
    loader = new JsonSeedLoader(repository);
  });

  it('should successfully load a valid graph seed', () => {
    const validSeed = {
      entities: [
        {
          id: "fish-1",
          type: "SPECIES",
          name: "Catfish",
          taxonomy: { family: "Clariidae" }
        },
        {
          id: "eq-1",
          type: "EQUIPMENT",
          name: "Aerator",
          relationships: [
            {
              id: "rel-1",
              sourceId: "eq-1",
              targetId: "fish-1",
              type: "HAS_TRAIT", // arbitrary valid enum
              weight: 1.0
            }
          ]
        }
      ]
    };

    expect(() => loader.load(validSeed)).not.toThrow();
    expect(repository.getAllEntities().length).toBe(2);
  });

  it('should reject non-object or missing entities array', () => {
    expect(() => loader.load(null)).toThrow(GraphLoadError);
    expect(() => loader.load({ data: [] })).toThrow(GraphLoadError);
    expect(() => loader.load({ entities: "not-an-array" })).toThrow(GraphLoadError);
  });

  it('should reject seed with invalid entity structure', () => {
    const invalidSeed = {
      entities: [
        {
          id: "fish-1",
          type: "INVALID_TYPE",
          name: "Catfish"
        }
      ]
    };

    expect(() => loader.load(invalidSeed)).toThrow(GraphLoadError);
  });

  it('should reject duplicate entity IDs', () => {
    const duplicateSeed = {
      entities: [
        {
          id: "fish-1",
          type: "SPECIES",
          name: "Catfish"
        },
        {
          id: "fish-1",
          type: "SPECIES",
          name: "Duplicate Catfish"
        }
      ]
    };

    expect(() => loader.load(duplicateSeed)).toThrowError(/Duplicate entity ID detected/);
  });

  it('should catch referential integrity errors', () => {
    const orphanedSeed = {
      entities: [
        {
          id: "eq-1",
          type: "EQUIPMENT",
          name: "Aerator",
          relationships: [
            {
              id: "rel-1",
              sourceId: "eq-1",
              targetId: "missing-target",
              type: "REQUIRES_EQUIPMENT",
              weight: 1.0
            }
          ]
        }
      ]
    };

    // "missing-target" does not exist in the entities array
    expect(() => loader.load(orphanedSeed)).toThrow(GraphLoadError);
    expect(() => loader.load(orphanedSeed)).toThrowError(/Referential integrity error/);
  });
});
