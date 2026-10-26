import { InMemoryGraphRepository, JsonSeedLoader, GraphTraversal } from 'avis-graph-loader';
import { RuleEngine, RuleRegistry } from 'avis-rule-engine';
import { SceneFactory, Scene } from 'avis-scene-builder';
import { PromptAdapter } from '../adapter';
import { PipelineContext, PipelineResult } from '../types';
import { PipelineError } from '../errors';

export class PipelineOrchestrator {
  constructor(
    private registry: RuleRegistry,
    private adapter: PromptAdapter = new PromptAdapter()
  ) {}

  /**
   * Executes the full AVIS pipeline end-to-end.
   */
  public execute(context: PipelineContext): PipelineResult {
    try {
      // 1. Knowledge Graph Loader Phase
      const repository = new InMemoryGraphRepository();
      const loader = new JsonSeedLoader(repository);
      
      // Load raw seed data into the graph
      loader.load(context.rawSeedData);
      
      const traversal = new GraphTraversal(repository);
      
      // Find the target entity
      const entity = repository.getEntityById(context.targetEntityId);
      if (!entity) {
        throw new PipelineError(`Target entity '${context.targetEntityId}' not found in graph seed.`);
      }

      // 2. Rule Engine Phase
      const ruleEngine = new RuleEngine(this.registry);
      const decision = ruleEngine.evaluate(entity, traversal);

      // 3. Scene Builder Phase
      const sceneFactory = new SceneFactory(repository, traversal);
      const scene = sceneFactory.buildScene(decision);

      // 4. Prompt Adapter Phase
      const prompt = this.adapter.generatePrompt(scene);

      return {
        articleId: context.articleId,
        entity,
        decision,
        scene,
        prompt
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new PipelineError(`Pipeline execution failed: ${error.message}`, error);
      }
      throw new PipelineError('Pipeline execution failed due to an unknown error.', error);
    }
  }
}
