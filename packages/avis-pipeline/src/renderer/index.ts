import { Scene } from 'avis-scene-builder';

export class PromptRenderer {
  /**
   * Renders a final prompt string based on the Scene object and an ordered strategy.
   * Ensures deterministic output order.
   */
  public render(scene: Scene): string {
    const parts: string[] = [];

    // 1. Subject
    parts.push(this.renderSubject(scene));
    
    // 2. Environment
    parts.push(this.renderEnvironment(scene));

    // 3. Composition
    parts.push(this.renderComposition(scene));

    // 4. Camera
    parts.push(this.renderCamera(scene));

    // 5. Lighting
    parts.push(this.renderLighting(scene));

    // 6. Objects & Relationships
    parts.push(this.renderObjectsAndRelationships(scene));

    // 7. Rendering Hints
    parts.push(this.renderHints(scene));

    // 8. Negative Constraints
    if (scene.negativeConstraints && scene.negativeConstraints.length > 0) {
      parts.push(`--no ${scene.negativeConstraints.join(', ')}`);
    }

    return parts.filter(p => p.trim() !== '').join(', ').trim();
  }

  private renderSubject(scene: Scene): string {
    const subj = scene.subject;
    const visual = subj.visualAttributes;
    const name = visual['name'] || subj.entityId;
    return `Main subject: ${name}`;
  }

  private renderEnvironment(scene: Scene): string {
    const env = scene.environment;
    return `Environment: ${env.locationType} during ${env.timeOfDay} with ${env.weather} weather`;
  }

  private renderComposition(scene: Scene): string {
    const comp = scene.composition;
    return `${comp.framing}, ${comp.perspective} perspective, focus on ${comp.focus}`;
  }

  private renderCamera(scene: Scene): string {
    const cam = scene.camera;
    return `Shot on ${cam.lens} lens at ${cam.aperture}, ${cam.motion} motion`;
  }

  private renderLighting(scene: Scene): string {
    const light = scene.lighting;
    return `${light.intensity} ${light.type} lighting from ${light.direction}`;
  }

  private renderObjectsAndRelationships(scene: Scene): string {
    const parts: string[] = [];
    
    if (scene.supportingObjects && scene.supportingObjects.length > 0) {
      const objects = scene.supportingObjects.map(obj => obj.visualAttributes['name'] || obj.entityId);
      parts.push(`Supporting elements: ${objects.join(', ')}`);
    }

    if (scene.relationships && scene.relationships.length > 0) {
      const rels = scene.relationships.map(rel => `${rel.sourceId} is ${rel.spatialRelation} ${rel.targetId}`);
      parts.push(`Spatial relations: ${rels.join('; ')}`);
    }

    return parts.join(', ');
  }

  private renderHints(scene: Scene): string {
    const hints = scene.renderingHints;
    return `Style: ${hints.style}, Quality: ${hints.quality}`;
  }
}
