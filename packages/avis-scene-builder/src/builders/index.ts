import { 
  Scene, SceneMetadata, SceneObject, SceneRelationship, 
  Composition, Camera, Lighting, Environment, RenderingHints 
} from '../types';

export class SceneBuilder {
  private scene: Partial<Scene>;

  constructor(initialScene?: Partial<Scene>) {
    this.scene = initialScene ? { ...initialScene } : {
      supportingObjects: [],
      colorPalette: [],
      visualConstraints: [],
      negativeConstraints: [],
      relationships: []
    };
  }

  public setMetadata(metadata: SceneMetadata): SceneBuilder {
    return new SceneBuilder({ ...this.scene, metadata });
  }

  public setSubject(subject: SceneObject): SceneBuilder {
    return new SceneBuilder({ ...this.scene, subject });
  }

  public addSupportingObject(object: SceneObject): SceneBuilder {
    const supportingObjects = [...(this.scene.supportingObjects || []), object];
    return new SceneBuilder({ ...this.scene, supportingObjects });
  }

  public setEnvironment(environment: Environment): SceneBuilder {
    return new SceneBuilder({ ...this.scene, environment });
  }

  public setCamera(camera: Camera): SceneBuilder {
    return new SceneBuilder({ ...this.scene, camera });
  }

  public setComposition(composition: Composition): SceneBuilder {
    return new SceneBuilder({ ...this.scene, composition });
  }

  public setLighting(lighting: Lighting): SceneBuilder {
    return new SceneBuilder({ ...this.scene, lighting });
  }

  public addColor(color: string): SceneBuilder {
    const colorPalette = [...(this.scene.colorPalette || []), color];
    return new SceneBuilder({ ...this.scene, colorPalette });
  }

  public addVisualConstraint(constraint: string): SceneBuilder {
    const visualConstraints = [...(this.scene.visualConstraints || []), constraint];
    return new SceneBuilder({ ...this.scene, visualConstraints });
  }

  public addNegativeConstraint(constraint: string): SceneBuilder {
    const negativeConstraints = [...(this.scene.negativeConstraints || []), constraint];
    return new SceneBuilder({ ...this.scene, negativeConstraints });
  }

  public addRelationship(relationship: SceneRelationship): SceneBuilder {
    const relationships = [...(this.scene.relationships || []), relationship];
    return new SceneBuilder({ ...this.scene, relationships });
  }

  public setRenderingHints(hints: RenderingHints): SceneBuilder {
    return new SceneBuilder({ ...this.scene, renderingHints: hints });
  }

  /**
   * Returns the partial scene for validation or further building.
   */
  public getPartial(): Partial<Scene> {
    return { ...this.scene };
  }
}
