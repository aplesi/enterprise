import { Scene } from '../types';
import { SceneBuilderError } from '../errors';

export class SceneValidator {
  /**
   * Validates if a partial scene has all required properties to be a complete Scene.
   * Throws SceneBuilderError if validation fails.
   */
  public static validate(partialScene: Partial<Scene>): asserts partialScene is Scene {
    const requiredFields: (keyof Scene)[] = [
      'metadata',
      'subject',
      'environment',
      'camera',
      'composition',
      'lighting',
      'renderingHints'
    ];

    for (const field of requiredFields) {
      if (!partialScene[field]) {
        throw new SceneBuilderError(`Missing required scene property: ${field}`);
      }
    }

    if (!partialScene.supportingObjects) partialScene.supportingObjects = [];
    if (!partialScene.colorPalette) partialScene.colorPalette = [];
    if (!partialScene.visualConstraints) partialScene.visualConstraints = [];
    if (!partialScene.negativeConstraints) partialScene.negativeConstraints = [];
    if (!partialScene.relationships) partialScene.relationships = [];
  }
}
