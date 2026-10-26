import { Entity } from 'avis-ontology';
import { GraphTraversal } from 'avis-graph-loader';
import { DecisionObject, RuleContext } from './types';
import { RuleRegistry } from './registry';
import { RuleEvaluator } from './evaluator';
import { ConflictResolver, PriorityEvaluator } from './resolver';

export class RuleEngine {
  constructor(
    private registry: RuleRegistry,
    private evaluator: RuleEvaluator = new RuleEvaluator(),
    private resolver: ConflictResolver = new ConflictResolver(),
    private priorityEvaluator: PriorityEvaluator = new PriorityEvaluator()
  ) {}

  /**
   * Evaluates all registered rules against the provided entity and graph traversal context.
   * Resolves conflicts deterministically and returns a final DecisionObject.
   */
  public evaluate(entity: Entity, traversal: GraphTraversal): DecisionObject {
    const context: RuleContext = { entity, traversal };
    
    const allRules = this.registry.getAllRules();
    const matchedRules = this.evaluator.evaluateRules(allRules, context);
    
    const { resolutions, conflictsDetected } = this.resolver.resolve(matchedRules, context);
    
    // Calculate final score using only the rules that contributed to the final resolution
    const appliedRuleIds = new Set(resolutions.map(r => r.ruleId));
    const appliedRules = matchedRules.filter(r => appliedRuleIds.has(r.id));
    
    const finalPriorityScore = this.priorityEvaluator.calculateFinalScore(appliedRules);

    return {
      entityId: entity.id as string,
      matchedRules: matchedRules.map(r => r.id),
      appliedResolutions: resolutions,
      conflictsDetected,
      finalPriorityScore
    };
  }
}
