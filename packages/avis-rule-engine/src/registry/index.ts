import { Rule } from '../types';
import { RuleEngineError } from '../errors';

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();

  public register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new RuleEngineError(`Rule with ID '${rule.id}' is already registered.`);
    }
    this.rules.set(rule.id, rule);
  }

  public registerMany(rules: Rule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  public getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  public getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  public clear(): void {
    this.rules.clear();
  }
}
