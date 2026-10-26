import { registry } from '../engine/registry'

import { MinimumWordCountRule, RequiredSectionsRule } from './content'
import { MinimumFaqRule, MinimumLinksRule } from './seo'
import { CoverageSuiteRule } from './coverage'
import { InformationDensityRule } from './density'

// Register all rules
registry.register(MinimumWordCountRule)
registry.register(RequiredSectionsRule)
registry.register(MinimumFaqRule)
registry.register(MinimumLinksRule)
registry.register(CoverageSuiteRule)
registry.register(InformationDensityRule)

export * from './content'
export * from './seo'
export * from './coverage'
export * from './density'
