import { groqChatWithRotation } from '../groq'
import { EditorContext, EditorialReport } from './types'
import { SYSTEM_PROMPT_EDITOR } from './prompts'
import { formatContextForLLM } from './context'
import { EditorialReportSchema } from './schema'

export async function runEditorialReview(context: EditorContext): Promise<EditorialReport> {
  const llmInput = formatContextForLLM(context)
  
  try {
    const jsonString = await groqChatWithRotation({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_EDITOR },
        { role: 'user', content: llmInput }
      ],
      temperature: 0.1, // Keep it deterministic for reviews
      response_format: { type: 'json_object' }
    })

    // Attempt to parse and validate
    const rawData = JSON.parse(jsonString)
    const validatedData = EditorialReportSchema.parse(rawData)
    
    return validatedData
  } catch (error) {
    console.error('Editorial Review Engine Error:', error)
    
    // Return a safe fallback FAIL report if LLM crashes or validation fails
    return {
      status: 'FAIL',
      confidenceScore: 0,
      needsHumanVerification: true,
      overall: 0,
      metrics: { accuracy: 0, clarity: 0, consistency: 0 },
      hallucinationRisk: 'HIGH',
      missingTopics: [],
      weakSections: [],
      strengths: [],
      editorNotes: [
        'SYSTEM ERROR: LLM failed to return a valid JSON format or validation crashed.',
        error instanceof Error ? error.message : String(error)
      ],
      actionList: []
    }
  }
}
