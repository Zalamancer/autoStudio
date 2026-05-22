/**
 * Step Executor Router — maps StepType to executor functions.
 */

import type { StepType } from '@/types/orchestrator'
import type { StepRunner } from './constants'
import { executeSetupCanvas } from './steps/setupCanvas'
import { executeSetupBackground } from './steps/setupBackground'
import { executeSetupCharacters } from './steps/setupCharacters'
import { executeGenerateVoices } from './steps/generateVoices'
import { executeSetupDialogue } from './steps/setupDialogue'
import { executeGenerateMusic } from './steps/generateMusic'
import { executeSetupTextOverlays } from './steps/setupTextOverlays'
import { executeSetupShapes } from './steps/setupShapes'
import { executeSetupHTMLTemplates } from './steps/setupHTMLTemplates'
import { executeGenerateSVGObjects } from './steps/generateSVGObjects'
import { executeGenerateStockAssets } from './steps/generateStockAssets'
import { executeSetupStockMedia } from './steps/setupStockMedia'
import { executeSetupSoundEffects } from './steps/setupSoundEffects'
import { executeSetupGestures } from './steps/setupGestures'
import { executeSetupCharacterMotion } from './steps/setupCharacterMotion'
import { executeSetupSmartBroll } from './steps/setupSmartBroll'
import { executeSetupCamera } from './steps/setupCamera'
import { executeSetupAutoCamera } from './steps/setupAutoCamera'
import { executeSetupRetentionHooks } from './steps/setupRetentionHooks'
import { executeSyncToBeat } from './steps/syncToBeat'
import { executeSetupCaptions } from './steps/setupCaptions'
import { executeGenerateThumbnail } from './steps/generateThumbnail'
import { executeFinalizeTimeline } from './steps/finalizeTimeline'
import { executeGenerateCharacters } from './steps/generateCharacters'
import { executeSetupMotionGraphics } from './steps/setupMotionGraphics'
import { executeAutoAnimateElements } from './steps/autoAnimateElements'
import { executeQualityGate } from './steps/qualityGate'
import { executeClassifyImageStoryWords } from './steps/classifyImageStoryWords'
import { executeSearchFreepikAssets } from './steps/searchFreepikAssets'
import { executeComposeImageStoryScenes } from './steps/composeImageStoryScenes'
import { executeSetupFillerTypography } from './steps/setupFillerTypography'

const STEP_EXECUTORS: Record<StepType, StepRunner> = {
  'setup-canvas': executeSetupCanvas,
  'setup-camera': executeSetupCamera,
  'setup-auto-camera': executeSetupAutoCamera,
  'setup-background': executeSetupBackground,
  'generate-characters': executeGenerateCharacters,
  'setup-characters': executeSetupCharacters,
  'generate-voices': executeGenerateVoices,
  'setup-dialogue': executeSetupDialogue,
  'setup-gestures': executeSetupGestures,
  'setup-character-motion': executeSetupCharacterMotion,
  'setup-smart-broll': executeSetupSmartBroll,
  'generate-music': executeGenerateMusic,
  'sync-to-beat': executeSyncToBeat,
  'setup-text-overlays': executeSetupTextOverlays,
  'setup-shapes': executeSetupShapes,
  'setup-html-templates': executeSetupHTMLTemplates,
  'setup-motion-graphics': executeSetupMotionGraphics,
  'generate-svg-objects': executeGenerateSVGObjects,
  'generate-stock-assets': executeGenerateStockAssets,
  'setup-stock-media': executeSetupStockMedia,
  'setup-sound-effects': executeSetupSoundEffects,
  'setup-retention-hooks': executeSetupRetentionHooks,
  'auto-animate-elements': executeAutoAnimateElements,
  'setup-captions': executeSetupCaptions,
  'generate-thumbnail': executeGenerateThumbnail,
  'quality-gate': executeQualityGate,
  'finalize-timeline': executeFinalizeTimeline,
  // Image story step executors
  'classify-image-story-words': executeClassifyImageStoryWords,
  'search-freepik-assets': executeSearchFreepikAssets,
  'compose-image-story-scenes': executeComposeImageStoryScenes,
  'setup-filler-typography': executeSetupFillerTypography,
}

export function getStepExecutor(stepType: StepType): StepRunner {
  const executor = STEP_EXECUTORS[stepType]
  if (!executor) {
    return async (_plan, _ctx) => {
      console.warn(`[Orchestrator] No executor for step type "${stepType}", skipping.`)
    }
  }
  return executor
}
