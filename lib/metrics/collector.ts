import fs from 'fs'
import path from 'path'
import { VERSION } from '../version'

export interface AplesiMetric {
  timestamp: string
  topic?: string
  articleSlug: string
  model?: string
  
  generatorVersion?: string
  promptVersion?: string
  qualityVersion?: string
  editorialVersion?: string

  durationMs: number
  wordCount: number
  chunkCount?: number
  retryCount?: number

  coverageScore?: number
  densityScore?: number
  qualityScore: number
  editorialScore: number

  publishDecision?: 'PUBLISH' | 'DRAFT' | 'REJECT'
}

export class MetricsCollector {
  private logPath = path.join(process.cwd(), '.metrics.jsonl')
  
  // Non-blocking log (Fire and forget)
  public log(metric: AplesiMetric) {
    const payload = {
      ...metric,
      generatorVersion: metric.generatorVersion || VERSION.generator,
      promptVersion: metric.promptVersion || VERSION.prompt,
      qualityVersion: metric.qualityVersion || VERSION.quality,
      editorialVersion: metric.editorialVersion || VERSION.editorial,
    }
    setImmediate(() => {
      try {
        const line = JSON.stringify(payload) + '\n'
        fs.appendFileSync(this.logPath, line)
      } catch (err) {
        console.error('Failed to write metrics:', err)
      }
    })
  }
}

export const metrics = new MetricsCollector()
