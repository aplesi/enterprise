import { bench, describe } from 'vitest'
import fs from 'fs'
import path from 'path'
import { evaluateMarkdown } from '@/lib/quality/engine/core'

describe('Quality Engine Benchmark', () => {
  const perfectRaw = fs.readFileSync(path.join(__dirname, '../fixtures/markdown/article-perfect.md'), 'utf-8')

  bench('evaluateMarkdown - Perfect Article', () => {
    evaluateMarkdown(perfectRaw)
  }, { time: 1000 })
})
