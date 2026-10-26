import { QualityRule } from './context'

class RuleRegistry {
  private rules: QualityRule[] = []

  register(rule: QualityRule) {
    // Avoid duplicates
    if (!this.rules.find(r => r.id === rule.id)) {
      this.rules.push(rule)
    }
  }

  registerMany(rules: QualityRule[]) {
    rules.forEach(rule => this.register(rule))
  }

  getRules(): QualityRule[] {
    return this.rules
  }

  clear() {
    this.rules = []
  }
}

export const registry = new RuleRegistry()
