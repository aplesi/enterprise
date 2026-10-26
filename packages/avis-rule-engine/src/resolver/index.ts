import { Rule, RuleContext, RuleResolution } from '../types';

export class ConflictResolver {
  /**
   * Resolves conflicts by ordering matched rules by priority.
   * If there are conflicting trait modifications, the higher priority rule wins.
   * A conflict is defined as multiple rules trying to modify the same traitId with different values.
   * 
   * Returns a tuple: [orderedResolutions, boolean indicating if conflicts were detected]
   */
  public resolve(matchedRules: Rule[], context: RuleContext): { resolutions: RuleResolution[], conflictsDetected: boolean } {
    // Sort rules by priority descending
    const sortedRules = [...matchedRules].sort((a, b) => b.priority - a.priority);
    
    let conflictsDetected = false;
    const finalResolutions: RuleResolution[] = [];
    const modifiedTraits = new Map<string, string>(); // Map<traitId, ruleId that claimed it>

    for (const rule of sortedRules) {
      const resolution = rule.resolve(context);
      const safeModifications = [];

      for (const mod of resolution.modifications) {
        const traitIdStr = mod.traitId as string;
        
        if (modifiedTraits.has(traitIdStr)) {
          // Conflict detected! A higher priority rule already modified this trait.
          conflictsDetected = true;
          // We discard this modification because a higher priority rule claimed it.
        } else {
          modifiedTraits.set(traitIdStr, rule.id);
          safeModifications.push(mod);
        }
      }

      // If a rule has no valid modifications after resolution, we might still want to keep its messages.
      // But we will only add it if it actually has modifications or messages left.
      if (safeModifications.length > 0 || resolution.messages.length > 0) {
        finalResolutions.push({
          ruleId: resolution.ruleId,
          modifications: safeModifications,
          messages: resolution.messages
        });
      }
    }

    return { resolutions: finalResolutions, conflictsDetected };
  }
}

export class PriorityEvaluator {
  /**
   * Calculates the final priority score for the decision object.
   * For simplicity, this is the sum of the priorities of the applied rules.
   */
  public calculateFinalScore(appliedRules: Rule[]): number {
    return appliedRules.reduce((sum, rule) => sum + rule.priority, 0);
  }
}
