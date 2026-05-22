/**
 * AI Director — Orchestration Service
 *
 * Takes a high-level user prompt, calls Gemini to generate a structured ClipPlan,
 * then executes the plan step-by-step across all platform stores.
 *
 * This barrel file re-exports the public API so that existing imports
 * from '@/services/orchestrator' continue to work unchanged.
 */

// ── Shared types and constants ──
export {
  type ExecutionContext,
  type StepRunner,
  createExecutionContext,
} from './constants'

// ── Plan generation ──
export { generateClipPlan } from './planGenerator'

// ── Step building ──
export { buildStepsFromPlan } from './stepBuilder'

// ── Step executor router ──
export { getStepExecutor } from './stepExecutors'

// ── Individual step executors (re-exported for direct access if needed) ──
export { executeSetupCanvas } from './steps/setupCanvas'
export { executeSetupCamera } from './steps/setupCamera'
export { executeSetupBackground } from './steps/setupBackground'
export { executeSetupCharacters } from './steps/setupCharacters'
export { executeGenerateVoices } from './steps/generateVoices'
export { executeSetupDialogue } from './steps/setupDialogue'
export { executeGenerateMusic } from './steps/generateMusic'
export { executeSetupTextOverlays } from './steps/setupTextOverlays'
export { executeSetupShapes } from './steps/setupShapes'
export { executeSetupGestures } from './steps/setupGestures'
export { executeSetupCharacterMotion } from './steps/setupCharacterMotion'
export { executeSetupSmartBroll } from './steps/setupSmartBroll'
export { executeSetupCaptions } from './steps/setupCaptions'
export { executeFinalizeTimeline } from './steps/finalizeTimeline'
export { executeSetupHTMLTemplates } from './steps/setupHTMLTemplates'
export { executeGenerateSVGObjects } from './steps/generateSVGObjects'
export { executeSetupStockMedia } from './steps/setupStockMedia'
export { executeSetupSoundEffects } from './steps/setupSoundEffects'
export { executeSyncToBeat } from './steps/syncToBeat'
export { executeSetupRetentionHooks } from './steps/setupRetentionHooks'
export { executeAutoAnimateElements } from './steps/autoAnimateElements'
export { executeGenerateThumbnail } from './steps/generateThumbnail'
export { executeQualityGate } from './steps/qualityGate'
export { executeSetupAutoCamera } from './steps/setupAutoCamera'
export { executeGenerateCharacters } from './steps/generateCharacters'
export { executeSetupMotionGraphics } from './steps/setupMotionGraphics'
