import { Rule, RuleContext } from '../types';

export class RuleEvaluator {
  /**
   * Evaluates a set of rules against a given context.
   * Returns only the rules that evaluate to true.
   */
  public evaluateRules(rules: Rule[], context: RuleContext): Rule[] {
    const matchedRules: Rule[] = [];

    for (const rule of rules) {
      if (rule.evaluate(context)) {
        matchedRules.push(rule);
      }
    }

    return matchedRules;
  }
}
