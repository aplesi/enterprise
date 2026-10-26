import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine, RuleRegistry, Rule, RuleContext, RuleResolution, RuleEngineError } from '../src';
import { createEntity } from 'avis-ontology';
import { InMemoryGraphRepository, GraphTraversal } from 'avis-graph-loader';

describe('Rule Engine', () => {
  let registry: RuleRegistry;
  let engine: RuleEngine;
  let traversal: GraphTraversal;

  beforeEach(() => {
    registry = new RuleRegistry();
    engine = new RuleEngine(registry);
    const repo = new InMemoryGraphRepository();
    traversal = new GraphTraversal(repo);
  });

  const createDummyRule = (id: string, priority: number, evaluatesTo: boolean, modTrait?: string, modValue?: unknown): Rule => ({
    id,
    name: `Rule ${id}`,
    description: 'Dummy rule for testing',
    priority,
    evaluate: (context: RuleContext) => evaluatesTo,
    resolve: (context: RuleContext): RuleResolution => ({
      ruleId: id,
      modifications: modTrait ? [{ traitId: modTrait, value: modValue }] : [],
      messages: [`Executed ${id}`]
    })
  });

  it('should successfully register rules', () => {
    const rule1 = createDummyRule('r1', 10, true);
    registry.register(rule1);
    expect(registry.getRule('r1')).toBeDefined();
    
    // Registering duplicate should fail
    expect(() => registry.register(rule1)).toThrow(RuleEngineError);
  });

  it('should evaluate a single rule correctly', () => {
    registry.register(createDummyRule('r1', 10, true, 'trait-color', 'red'));
    const entity = createEntity({ id: 'e1', type: 'SPECIES', name: 'Fish' });
    
    const decision = engine.evaluate(entity, traversal);
    expect(decision.entityId).toBe('e1');
    expect(decision.matchedRules).toContain('r1');
    expect(decision.appliedResolutions.length).toBe(1);
    expect(decision.finalPriorityScore).toBe(10);
    expect(decision.conflictsDetected).toBe(false);
  });

  it('should handle empty rule set gracefully', () => {
    const entity = createEntity({ id: 'e1', type: 'SPECIES', name: 'Fish' });
    const decision = engine.evaluate(entity, traversal);
    
    expect(decision.matchedRules.length).toBe(0);
    expect(decision.appliedResolutions.length).toBe(0);
    expect(decision.finalPriorityScore).toBe(0);
  });

  it('should filter out rules that do not evaluate to true', () => {
    registry.register(createDummyRule('r1', 10, false));
    registry.register(createDummyRule('r2', 20, true, 'trait-1', 'val'));

    const entity = createEntity({ id: 'e1', type: 'SPECIES', name: 'Fish' });
    const decision = engine.evaluate(entity, traversal);

    expect(decision.matchedRules).toContain('r2');
    expect(decision.matchedRules).not.toContain('r1');
    expect(decision.finalPriorityScore).toBe(20);
  });

  it('should detect conflicts and prioritize correctly', () => {
    // Both try to modify 'trait-color', but r2 has higher priority
    registry.register(createDummyRule('r1', 10, true, 'trait-color', 'red'));
    registry.register(createDummyRule('r2', 50, true, 'trait-color', 'blue'));
    // r3 modifies something else
    registry.register(createDummyRule('r3', 5, true, 'trait-size', 'large'));

    const entity = createEntity({ id: 'e1', type: 'SPECIES', name: 'Fish' });
    const decision = engine.evaluate(entity, traversal);

    expect(decision.conflictsDetected).toBe(true);
    expect(decision.matchedRules).toContain('r1');
    expect(decision.matchedRules).toContain('r2');
    expect(decision.matchedRules).toContain('r3');
    
    // final priority score = r2 (50) + r3 (5) = 55 (r1 was discarded due to conflict)
    expect(decision.finalPriorityScore).toBe(55);
    
    // Only r2 and r3 resolutions should be applied
    const appliedRuleIds = decision.appliedResolutions.map(r => r.ruleId);
    expect(appliedRuleIds).toContain('r2');
    expect(appliedRuleIds).toContain('r3');
    expect(appliedRuleIds).not.toContain('r1');
    
    const r2Mod = decision.appliedResolutions.find(r => r.ruleId === 'r2')!;
    expect(r2Mod.modifications[0].value).toBe('blue');
  });

  it('should apply deterministic output ordering (by priority)', () => {
    registry.register(createDummyRule('r1', 10, true, 'trait-1', '1'));
    registry.register(createDummyRule('r2', 30, true, 'trait-2', '2'));
    registry.register(createDummyRule('r3', 20, true, 'trait-3', '3'));

    const entity = createEntity({ id: 'e1', type: 'SPECIES', name: 'Fish' });
    const decision = engine.evaluate(entity, traversal);

    expect(decision.conflictsDetected).toBe(false);
    expect(decision.appliedResolutions.length).toBe(3);
    expect(decision.appliedResolutions[0].ruleId).toBe('r2');
    expect(decision.appliedResolutions[1].ruleId).toBe('r3');
    expect(decision.appliedResolutions[2].ruleId).toBe('r1');
    expect(decision.finalPriorityScore).toBe(60);
  });
});
