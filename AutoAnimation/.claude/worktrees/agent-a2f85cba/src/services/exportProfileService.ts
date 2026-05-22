import type { ExportProfile } from '@/types/audioExpanded'
import { EXPORT_PROFILES } from '@/data/exportProfiles'

/**
 * Get export profile by platform ID.
 */
export function getExportProfile(platform: string): ExportProfile | undefined {
  return EXPORT_PROFILES.find(p => p.id === platform)
}

/**
 * Get all available export profiles.
 */
export function getAllProfiles(): ExportProfile[] {
  return EXPORT_PROFILES
}

/**
 * Get recommended export settings based on profile and project settings.
 */
export function getRecommendedSettings(
  profile: ExportProfile,
  projectSettings: { aspectRatio: string; duration: number; fps: number },
): {
  aspectRatio: string
  resolution: { width: number; height: number }
  bitrate: number
  codec: string
  warnings: string[]
} {
  const warnings: string[] = []

  // Use project aspect ratio if supported, otherwise use platform default
  const aspectRatio = profile.aspectRatios.includes(projectSettings.aspectRatio)
    ? projectSettings.aspectRatio
    : profile.defaultAspectRatio

  if (!profile.aspectRatios.includes(projectSettings.aspectRatio)) {
    warnings.push(`${profile.platform} prefers ${profile.defaultAspectRatio}. Your project uses ${projectSettings.aspectRatio}.`)
  }

  if (profile.maxDuration > 0 && projectSettings.duration > profile.maxDuration) {
    warnings.push(`Video exceeds ${profile.platform} max duration of ${profile.maxDuration}s.`)
  }

  const resolution = profile.maxResolution

  return {
    aspectRatio,
    resolution,
    bitrate: profile.recommendedBitrate,
    codec: profile.videoCodec,
    warnings,
  }
}

/**
 * Validate project against platform requirements.
 */
export function validateForPlatform(
  project: { aspectRatio: string; duration: number; fileSize?: number },
  profile: ExportProfile,
): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!profile.aspectRatios.includes(project.aspectRatio)) {
    issues.push(`Aspect ratio ${project.aspectRatio} not supported. Use: ${profile.aspectRatios.join(', ')}`)
  }

  if (profile.maxDuration > 0 && project.duration > profile.maxDuration) {
    issues.push(`Duration ${project.duration}s exceeds maximum ${profile.maxDuration}s`)
  }

  if (project.fileSize && project.fileSize > profile.maxFileSize) {
    issues.push(`File size exceeds ${formatBytes(profile.maxFileSize)} limit`)
  }

  return { valid: issues.length === 0, issues }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  return `${(bytes / 1_000).toFixed(0)} KB`
}
