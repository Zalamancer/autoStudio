/**
 * A/B Test Types — Configuration, results, and scored variants.
 */

import type { VariationVariable } from '@/types/orchestrator'

export interface ABTestConfig {
  basePrompt: string
  variables: VariationVariable[]
  strategy: 'isolated' | 'random' | 'guided'
  variantCount: 2 | 3
}

export interface ScoredVariant {
  variantIndex: number
  label: string
  viralScore: number
  dimensionScores: Record<string, number>
  thumbnailDataUrl: string | null
}

export interface ABTestResult {
  id: string
  timestamp: number
  config: ABTestConfig
  variants: ScoredVariant[]
  winnerId: number | null
}
