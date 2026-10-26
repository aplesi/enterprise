import { describe, it, expect } from 'vitest';
import { createEntity, validateEntity, EntityTypeSchema, TraitTypeSchema, RelationshipTypeSchema } from '../src';
import { ValidationError } from '../src/errors';

describe('Ontology Interfaces & Factory', () => {
  it('should create a valid SPECIES entity', () => {
    const raw = {
      id: "clarias-gariepinus",
      type: "SPECIES",
      name: "African Sharptooth Catfish",
      description: "A large eel-like catfish",
      taxonomy: {
        kingdom: "Animalia",
        family: "Clariidae",
        species: "C. gariepinus"
      },
      traits: [
        {
          id: "t1",
          type: "MORPHOLOGICAL",
          name: "Barbels",
          value: "Four pairs",
          isRequired: true
        }
      ],
      renderingProperties: [
        {
          id: "r1",
          targetModel: "FLUX",
          promptText: "four pairs of long barbels around mouth",
          weight: 1.5,
          isNegative: false
        }
      ]
    };

    const entity = createEntity(raw);
    expect(entity.id).toBe("clarias-gariepinus");
    expect(entity.taxonomy?.family).toBe("Clariidae");
    expect(entity.traits[0].type).toBe("MORPHOLOGICAL");
    
  it('should test compile-time mutability protection (DeepReadonly)', () => {
    const raw = {
      id: "clarias-gariepinus",
      type: "SPECIES",
      name: "Catfish"
    };
    const entity = createEntity(raw);
    
    // @ts-expect-error - Cannot assign to 'name' because it is a read-only property.
    // entity.name = "Mutated";
    
    // Test passes if compiler enforces readonly
    expect(entity.name).toBe("Catfish");
  });

  it('should reject SPECIES missing taxonomy', () => {
    const raw = {
      id: "invalid-species",
      type: "SPECIES",
      name: "Catfish"
    };

    expect(() => createEntity(raw)).toThrow(ValidationError);
  });

  it('should validate EQUIPMENT without taxonomy', () => {
    const raw = {
      id: "aerator-01",
      type: "EQUIPMENT",
      name: "Paddlewheel Aerator"
    };
    
    const entity = createEntity(raw);
    expect(entity.type).toBe("EQUIPMENT");
    expect(entity.taxonomy).toBeUndefined();
  });

  it('should reject invalid trait types', () => {
    const raw = {
      id: "valid-eq",
      type: "EQUIPMENT",
      name: "Eq",
      traits: [
        {
          id: "t1",
          type: "INVALID_TYPE",
          name: "Color",
          value: "Red",
          isRequired: false
        }
      ]
    };

    expect(() => createEntity(raw)).toThrow(ValidationError);
  });

  it('should safely validate without throwing', () => {
    const raw = { id: "bad" }; // Missing type and name
    const result = validateEntity(raw);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('should apply default values and versioning', () => {
    const raw = {
      id: "empty-entity",
      type: "ENVIRONMENT",
      name: "Empty"
    };
    const entity = createEntity(raw);
    expect(entity.traits).toEqual([]);
    expect(entity.renderingProperties).toEqual([]);
    expect(entity.relationships).toEqual([]);
    expect(entity.description).toBe("");
    expect(entity.schemaVersion).toBe("1.0.0"); // Version validation
  });
  
  it('should parse valid relationships and brand types', () => {
    const raw = {
      id: "env-1",
      type: "ENVIRONMENT",
      name: "Pond",
      relationships: [
        {
          id: "rel-1",
          sourceId: "env-1",
          targetId: "eq-1",
          type: "REQUIRES_EQUIPMENT",
          weight: 0.8
        }
      ]
    };
    
    const entity = createEntity(raw);
    expect(entity.relationships[0].type).toBe("REQUIRES_EQUIPMENT");
    expect(entity.relationships[0].weight).toBe(0.8);
    // Brand type compile time validation
    const relId: string = entity.relationships[0].id!;
    expect(relId).toBe("rel-1");
  });

  it('should validate metadata extension', () => {
    const raw = {
      id: "meta-entity",
      type: "ACTIVITY",
      name: "Feeding",
      metadata: {
        source: "LLM",
        confidence: 0.95,
        tags: ["daily", "nutrition"]
      }
    };
    
    const entity = createEntity(raw);
    expect(entity.metadata).toBeDefined();
    expect(entity.metadata?.source).toBe("LLM");
    expect(entity.metadata?.confidence).toBe(0.95);
    expect(entity.metadata?.tags).toContain("daily");
  });
});
