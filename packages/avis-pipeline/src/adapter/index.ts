import { Scene } from 'avis-scene-builder';
import { PromptRenderer } from '../renderer';
import { PipelineError } from '../errors';

export class PromptAdapter {
  constructor(private renderer: PromptRenderer = new PromptRenderer()) {}

  /**
   * Adapts a complete Scene object into a final string prompt.
   */
  public generatePrompt(scene: Scene): string {
    if (!scene) {
      throw new PipelineError('Scene object is missing or invalid.');
    }
    
    // The adapter delegates formatting to the renderer to keep concerns separated.
    // If we had multiple target AI models (e.g. Midjourney vs DALL-E), 
    // the Adapter would pick the right Renderer here.
    return this.renderer.render(scene);
  }
}
