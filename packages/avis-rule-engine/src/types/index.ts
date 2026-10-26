import { Entity, TraitId } from 'avis-ontology';
import { GraphTraversal } from 'avis-graph-loader';

export interface RuleContext {
  entity: Entity;
  traversal: GraphTraversal;
}

export interface TraitModification {
  traitId: TraitId | string;
  value: unknown;
}

export interface RuleResolution {
  ruleId: string;
  modifications: TraitModification[];
  messages: string[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  /**
   * Base priority of the rule. Higher number means higher priority.
   */
  priority: number;
  
  /**
   * Pure function to determine if the rule applies to the given context.
   */
  evaluate(context: RuleContext): boolean;
  
  /**
   * Pure function to generate the resolution if the rule applies.
   */
  resolve(context: RuleContext): RuleResolution;
}

export interface DecisionObject {
  entityId: string;
  matchedRules: string[];
  appliedResolutions: RuleResolution[];
  conflictsDetected: boolean;
  finalPriorityScore: number;
}
