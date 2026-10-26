import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineOrchestrator, PromptAdapter, PromptRenderer, PipelineContext } from '../src';
import { RuleRegistry, Rule } from 'avis-rule-engine';
import { SceneBuilder } from 'avis-scene-builder';

// Mock Rule for Integration Test
class WaterQualityRule implements Rule {
  id = 'rule-water-quality';
  name = 'Water Quality Adjuster';
  description = 'Adjusts water environment based on fish species';
  priority = 50;

  evaluate(entity: any, traversal: any) {
    if (entity.type === 'SPECIES' && entity.name === 'Lele Dumbo') {
      return {
        isMatch: true,
        modifications: [
          { traitId: 'locationType', value: 'murky_pond' },
          { traitId: 'lightingType', value: 'dramatic_sunlight' }
        ],
        messages: ['Applied murky pond and dramatic sunlight for Lele Dumbo']
      };
    }
    return { isMatch: false, modifications: [], messages: [] };
  }
}

describe('Prompt Renderer', () => {
  it('should render a scene deterministically', () => {
    const builder = new SceneBuilder()
      .setSubject({ entityId: 'lele-1', role: 'SUBJECT', visualAttributes: { name: 'Lele Dumbo' } })
      .setEnvironment({ locationType: 'murky_pond', timeOfDay: 'morning', weather: 'clear' })
      .setComposition({ framing: 'close_up', perspective: 'eye_level', focus: 'subject' })
      .setCamera({ lens: 'macro', aperture: 'f/1.8', motion: 'static' })
      .setLighting({ type: 'dramatic', direction: 'top', intensity: 'high' })
      .setRenderingHints({ style: 'photorealistic', quality: '8k' })
      .addNegativeConstraint('blurry')
      .addNegativeConstraint('noise');

    const renderer = new PromptRenderer();
    const prompt = renderer.render(builder.getPartial() as any);

    expect(prompt).toContain('Main subject: Lele Dumbo');
    expect(prompt).toContain('Environment: murky_pond');
    expect(prompt).toContain('--no blurry, noise');
  });

  it('should handle empty supporting objects gracefully', () => {
    const builder = new SceneBuilder()
      .setSubject({ entityId: 'lele-1', role: 'SUBJECT', visualAttributes: { name: 'Lele Dumbo' } })
      .setEnvironment({ locationType: 'murky_pond', timeOfDay: 'morning', weather: 'clear' })
      .setComposition({ framing: 'close_up', perspective: 'eye_level', focus: 'subject' })
      .setCamera({ lens: 'macro', aperture: 'f/1.8', motion: 'static' })
      .setLighting({ type: 'dramatic', direction: 'top', intensity: 'high' })
      .setRenderingHints({ style: 'photorealistic', quality: '8k' });

    const renderer = new PromptRenderer();
    const prompt = renderer.render(builder.getPartial() as any);
    expect(prompt).not.toContain('Supporting elements');
  });
});

describe('End-to-End Pipeline Integration', () => {
  let registry: RuleRegistry;
  let orchestrator: PipelineOrchestrator;

  beforeEach(() => {
    registry = new RuleRegistry();
    registry.register(new WaterQualityRule());
    orchestrator = new PipelineOrchestrator(registry);
  });

  it('should process a valid entity from raw seed to final prompt', () => {
    const rawData = {
      entities: [
        { id: 'fish-1', type: 'SPECIES', name: 'Lele Dumbo', traits: {}, relationships: [] }
      ]
    };

    const context: PipelineContext = {
      articleId: 'art-123',
      rawSeedData: rawData,
      targetEntityId: 'fish-1'
    };

    const result = orchestrator.execute(context);

    expect(result.articleId).toBe('art-123');
    expect(result.entity.id).toBe('fish-1');
    expect(result.decision.matchedRules).toContain('rule-water-quality');
    expect(result.scene.environment.locationType).toBe('murky_pond'); // applied by rule
    expect(result.prompt).toContain('Main subject: Lele Dumbo');
    expect(result.prompt).toContain('murky_pond');
  });

  it('should throw PipelineError if target entity does not exist in graph', () => {
    const rawData = { entities: [] };
    const context: PipelineContext = {
      articleId: 'art-123',
      rawSeedData: rawData,
      targetEntityId: 'ghost-fish'
    };

    expect(() => orchestrator.execute(context)).toThrow('Target entity \'ghost-fish\' not found in graph seed.');
  });
});
