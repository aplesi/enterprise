import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryGraphRepository, GraphTraversal, TraversalError } from '../src';
import { createEntity } from 'avis-ontology';

describe('GraphTraversal', () => {
  let repository: InMemoryGraphRepository;
  let traversal: GraphTraversal;

  beforeEach(() => {
    repository = new InMemoryGraphRepository();
    traversal = new GraphTraversal(repository);

    repository.addEntities([
      createEntity({
        id: "env-1",
        type: "ENVIRONMENT",
        name: "Pond",
        relationships: [
          {
            id: "rel-1",
            sourceId: "env-1",
            targetId: "eq-1",
            type: "REQUIRES_EQUIPMENT"
          }
        ]
      }),
      createEntity({
        id: "eq-1",
        type: "EQUIPMENT",
        name: "Aerator"
      }),
      createEntity({
        id: "fish-1",
        type: "SPECIES",
        name: "Catfish",
        taxonomy: { family: "Clariidae" },
        relationships: [
          {
            id: "rel-2",
            sourceId: "fish-1",
            targetId: "env-1",
            type: "PREFERS_ENVIRONMENT"
          }
        ]
      })
    ]);
  });

  it('should find outgoing and incoming relationships', () => {
    // env-1 has 1 outgoing (to eq-1) and 1 incoming (from fish-1)
    const rels = traversal.getRelationships("env-1");
    expect(rels.length).toBe(2);
    expect(rels.some(r => r.sourceId === "env-1" && r.targetId === "eq-1")).toBe(true);
    expect(rels.some(r => r.sourceId === "fish-1" && r.targetId === "env-1")).toBe(true);
  });

  it('should throw on non-existent entity', () => {
    expect(() => traversal.getRelationships("missing")).toThrow(TraversalError);
  });

  it('should find related entities (target or source)', () => {
    const related = traversal.getRelatedEntities("env-1");
    expect(related.length).toBe(2);
    expect(related.some(e => e.id === "eq-1")).toBe(true);
    expect(related.some(e => e.id === "fish-1")).toBe(true);
  });

  it('should filter related entities by relationship type', () => {
    const related = traversal.getRelatedEntities("env-1", "PREFERS_ENVIRONMENT");
    expect(related.length).toBe(1);
    expect(related[0].id).toBe("fish-1"); // incoming
  });

  it('should find entities by taxonomy lookup', () => {
    const catfishFamily = traversal.findByTaxonomy("family", "Clariidae");
    expect(catfishFamily.length).toBe(1);
    expect(catfishFamily[0].id).toBe("fish-1");

    const noFamily = traversal.findByTaxonomy("family", "Unknown");
    expect(noFamily.length).toBe(0);
  });
});
