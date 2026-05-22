/**
 * Quality Assurance System
 *
 * Automated quality checking and iteration for generated clips.
 * Provides visual quality scoring, audio quality checks, content
 * completeness verification, platform compliance, pre-publish
 * checklists, and integration with the orchestrator for automated
 * iteration.
 */

// Visual quality scoring
export { scoreVisualQuality } from './visualQuality'

// Audio quality checking
export { scoreAudioQuality } from './audioQuality'

// Content completeness verification
export { scoreContentCompleteness } from './contentCompleteness'

// Platform compliance
export {
  checkPlatformCompliance,
  getPlatformSpec,
  PLATFORM_SPECS,
} from './platformCompliance'

// Pre-publish checklist
export { generatePrePublishChecklist } from './prePublishChecklist'

// Quality gate (main orchestrator)
export {
  generateQAReport,
  evaluateQualityGate,
  extractQAInputFromStores,
  DEFAULT_QUALITY_GATE_CONFIG,
  type QAInput,
} from './qualityGate'

// Auto-fix iteration loop
export {
  autoFixAndRecheck,
  type AutoFixResult,
} from './autoFix'

// A/B variant generation
export {
  generateVariants,
  applyVariant,
} from './variantGenerator'

// Re-export types
export type {
  QAReport,
  QACheckResult,
  QACategoryScore,
  QACheckCategory,
  QACheckSeverity,
  QACheckStatus,
  QAGrade,
  QAImprovement,
  QualityGateConfig,
  QualityGateResult,
  AppliedFix,
  VisualQualityInput,
  AudioQualityInput,
  ContentCompletenessInput,
  CanvasElementBounds,
  TextOverlayInfo,
  AudioSegment,
  AudioTrackInfo,
  PlatformSpec,
  PlatformComplianceResult,
  SafeZoneViolation,
  VariantTreatment,
  VariantConfig,
  GeneratedVariant,
  PrePublishChecklist,
  PrePublishChecklistItem,
} from '@/types/qualityAssurance'
