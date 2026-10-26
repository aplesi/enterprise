import { describe, it, expect, beforeEach } from 'vitest';
import { SceneBuilder, SceneFactory, SceneValidator, SceneBuilderError, SceneMetadata, SceneObject } from '../src';
import { createEntity } from 'avis-ontology';
import { InMemoryGraphRepository, GraphTraversal } from 'avis-graph-loader';
import { DecisionObject } from 'avis-rule-engine';

describe('Scene Builder', () => {
  it('should build an immutable partial scene using Builder Pattern', () => {
    const builder = new SceneBuilder();
    
    const meta: SceneMetadata = { version: '1.0', sourceEntityId: 'e1', timestamp: '2026' };
    const b1 = builder.setMetadata(meta);
    
    const subject: SceneObject = { entityId: 'e1', role: 'SUBJECT', visualAttributes: {} };
    const b2 = b1.setSubject(subject);

    expect(builder.getPartial().metadata).toBeUndefined();
    expect(b1.getPartial().metadata).toBeDefined();
    expect(b1.getPartial().subject).toBeUndefined();
    expect(b2.getPartial().subject).toBeDefined();
  });

  it('should validate complete scenes and throw on incomplete ones', () => {
    const builder = new SceneBuilder();
    expect(() => SceneValidator.validate(builder.getPartial())).toThrow(SceneBuilderError);
    
    const complete = builder
      .setMetadata({ version: '1.0', sourceEntityId: 'e1', timestamp: '2026' })
      .setSubject({ entityId: 'e1', role: 'SUBJECT', visualAttributes: {} })
      .setEnvironment({ locationType: 'studio', timeOfDay: 'day', weather: 'clear' })
      .setCamera({ lens: 'macro', aperture: 'f/1.8', motion: 'static' })
      .setComposition({ framing: 'close_up', perspective: 'eye_level', focus: 'subject' })
      .setLighting({ type: 'studio', direction: 'top', intensity: 'bright' })
      .setRenderingHints({ style: 'photorealistic', quality: 'high' });

    const scene = complete.getPartial();
    expect(() => SceneValidator.validate(scene)).not.toThrow();
    
    // Arrays should be initialized if not explicitly set
    expect(scene.colorPalette).toBeDefined();
    expect(scene.relationships).toBeDefined();
  });
});

describe('Scene Factory', () => {
  let repository: InMemoryGraphRepository;
  let traversal: GraphTraversal;
  let factory: SceneFactory;

  beforeEach(() => {
    repository = new InMemoryGraphRepository();
    traversal = new GraphTraversal(repository);
    factory = new SceneFactory(repository, traversal);
  });

  it('should generate a scene from an empty decision object', () => {
    const entity = createEntity({ id: 'fish-1', type: 'SPECIES', name: 'Lele' });
    repository.addEntity(entity);

    const decision: DecisionObject = {
      entityId: 'fish-1',
      matchedRules: [],
      appliedResolutions: [],
      conflictsDetected: false,
      finalPriorityScore: 0
    };

    const scene = factory.buildScene(decision);
    expect(scene.subject.entityId).toBe('fish-1');
    expect(scene.environment.locationType).toBe('studio_backdrop'); // fallback default
  });

  it('should map decision visual attributes into scene building', () => {
    const entity = createEntity({ id: 'fish-1', type: 'SPECIES', name: 'Lele' });
    repository.addEntity(entity);

    const decision: DecisionObject = {
      entityId: 'fish-1',
      matchedRules: ['r1'],
      appliedResolutions: [
        {
          ruleId: 'r1',
          messages: [],
          modifications: [
            { traitId: 'locationType', value: 'underwater_river' },
            { traitId: 'cameraLens', value: 'wide_angle' }
          ]
        }
      ],
      conflictsDetected: false,
      finalPriorityScore: 10
    };

    const scene = factory.buildScene(decision);
    expect(scene.environment.locationType).toBe('underwater_river');
    expect(scene.camera.lens).toBe('wide_angle');
  });

  it('should fetch multiple entities as supporting objects via relationships', () => {
    const main = createEntity({ id: 'fish-1', type: 'SPECIES', name: 'Lele', relationships: [{ id: 'rel1', sourceId: 'fish-1', targetId: 'eq-1', type: 'HAS_TRAIT' }] });
    const equipment = createEntity({ id: 'eq-1', type: 'EQUIPMENT', name: 'Aerator' });
    repository.addEntities([main, equipment]);

    const decision: DecisionObject = {
      entityId: 'fish-1',
      matchedRules: [],
      appliedResolutions: [],
      conflictsDetected: false,
      finalPriorityScore: 0
    };

    const scene = factory.buildScene(decision);
    expect(scene.supportingObjects?.length).toBe(1);
    expect(scene.supportingObjects![0].entityId).toBe('eq-1');
    
    expect(scene.relationships?.length).toBe(1);
    expect(scene.relationships![0].targetId).toBe('eq-1');
  });

  it('should throw if main entity does not exist', () => {
    const decision: DecisionObject = {
      entityId: 'missing-entity',
      matchedRules: [],
      appliedResolutions: [],
      conflictsDetected: false,
      finalPriorityScore: 0
    };

    expect(() => factory.buildScene(decision)).toThrow(SceneBuilderError);
  });
});
