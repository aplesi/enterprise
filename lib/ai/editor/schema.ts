import { z } from 'zod'

export const ActionTypeSchema = z.enum([
  'REWRITE_SECTION', 
  'ADD_FAQ', 
  'REPLACE_TERM', 
  'ADD_REFERENCE', 
  'EXPAND_SECTION', 
  'CLARIFY_CONCEPT',
  'ADD_SECTION'
])

export const ActionPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW'])

export const EditorialActionItemSchema = z.object({
  type: ActionTypeSchema,
  targetSection: z.string(),
  instruction: z.string(),
  priority: ActionPrioritySchema
})

export const EditorialMetricsSchema = z.object({
  accuracy: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100)
})

export const EditorialReportSchema = z.object({
  status: z.enum(['PASS', 'WARNING', 'FAIL']),
  confidenceScore: z.number().min(0).max(100),
  needsHumanVerification: z.boolean(),
  overall: z.number().min(0).max(100),
  metrics: EditorialMetricsSchema,
  hallucinationRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  missingTopics: z.array(z.string()),
  weakSections: z.array(z.string()),
  strengths: z.array(z.string()),
  editorNotes: z.array(z.string()),
  actionList: z.array(EditorialActionItemSchema)
})
