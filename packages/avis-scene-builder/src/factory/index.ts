import { DecisionObject } from 'avis-rule-engine';
import { GraphTraversal, IKnowledgeGraphRepository } from 'avis-graph-loader';
import { SceneBuilder } from '../builders';
import { SceneValidator } from '../validation';
import { Scene, SceneObject, SceneMetadata } from '../types';
import { SceneBuilderError } from '../errors';

export class SceneFactory {
  constructor(
    private repository: IKnowledgeGraphRepository,
    private traversal: GraphTraversal
  ) {}

  /**
   * Constructs a complete Scene object based on the DecisionObject and Graph context.
   */
  public buildScene(decision: DecisionObject): Scene {
    const mainEntity = this.repository.getEntityById(decision.entityId);
    if (!mainEntity) {
      throw new SceneBuilderError(`Entity not found in repository: ${decision.entityId}`);
    }

    const metadata: SceneMetadata = {
      version: '1.0.0',
      sourceEntityId: mainEntity.id as string,
      timestamp: new Date().toISOString()
    };

    // We can extract visual attributes from applied resolutions
    const visualAttributes: Record<string, unknown> = {};
    for (const resolution of decision.appliedResolutions) {
      for (const mod of resolution.modifications) {
        visualAttributes[mod.traitId as string] = mod.value;
      }
    }

    const subject: SceneObject = {
      entityId: mainEntity.id as string,
      role: 'SUBJECT',
      visualAttributes
    };

    let builder = new SceneBuilder()
      .setMetadata(metadata)
      .setSubject(subject);

    // Provide some default environments/cameras if resolutions didn't provide full details.
    // In a real system, the resolutions or entity traits would populate these fully.
    
    // Default Environment mapping
    builder = builder.setEnvironment({
      locationType: String(visualAttributes['locationType'] || 'studio_backdrop'),
      timeOfDay: String(visualAttributes['timeOfDay'] || 'day'),
      weather: String(visualAttributes['weather'] || 'clear')
    });

    // Default Camera
    builder = builder.setCamera({
      lens: String(visualAttributes['cameraLens'] || 'standard_50mm'),
      aperture: String(visualAttributes['cameraAperture'] || 'f/5.6'),
      motion: 'static'
    });

    // Default Composition
    builder = builder.setComposition({
      framing: String(visualAttributes['framing'] || 'medium_shot'),
      perspective: String(visualAttributes['perspective'] || 'eye_level'),
      focus: 'subject'
    });

    // Default Lighting
    builder = builder.setLighting({
      type: String(visualAttributes['lightingType'] || 'soft_studio_lighting'),
      direction: String(visualAttributes['lightingDirection'] || 'front_left'),
      intensity: 'balanced'
    });

    // Rendering Hints
    builder = builder.setRenderingHints({
      style: String(visualAttributes['renderStyle'] || 'photorealistic'),
      quality: 'masterpiece, highly detailed, 8k resolution'
    });

    // We also can fetch related entities from the graph and add them as supporting objects.
    // For example, if there's a REQUIRES_EQUIPMENT relationship, we might add it to the scene.
    const relatedEntities = this.traversal.getRelatedEntities(mainEntity.id);
    for (const related of relatedEntities) {
      builder = builder.addSupportingObject({
        entityId: related.id as string,
        role: related.type === 'ENVIRONMENT' ? 'ENVIRONMENT_PROP' : 'SUPPORTING',
        visualAttributes: { type: related.type, name: related.name }
      });

      // Add spatial relationship
      builder = builder.addRelationship({
        sourceId: mainEntity.id as string,
        targetId: related.id as string,
        spatialRelation: 'near'
      });
    }

    const partial = builder.getPartial();
    SceneValidator.validate(partial);
    
    return partial; // Now type-safe as full Scene
  }
}
