import type { BoilingLineSettings } from '@/types/boilingLine'

const SEED_COUNT = 8

const BASE_FREQUENCY: Record<BoilingLineSettings['detail'], number> = {
  low: 0.01,
  medium: 0.025,
  high: 0.05,
}

/** Map intensity (1-10) to feDisplacementMap scale value. */
export function getDisplacementScale(intensity: number): number {
  return 1 + intensity * 1.4
}

/** Map detail level to feTurbulence baseFrequency. */
export function getBaseFrequency(detail: BoilingLineSettings['detail']): number {
  return BASE_FREQUENCY[detail]
}

/** Detail level abbreviation for filter IDs. */
function detailAbbrev(detail: BoilingLineSettings['detail']): string {
  return detail[0] // 'l' | 'm' | 'h'
}

/**
 * Build the filter ID for a given frame + settings.
 * Seed cycles every `frameHold` frames across 8 variants.
 */
export function getBoilFilterId(frame: number, settings: BoilingLineSettings): string {
  const seed = Math.floor(frame / settings.frameHold) % SEED_COUNT
  return `boil-i${settings.intensity}-d${detailAbbrev(settings.detail)}-s${seed}`
}

/**
 * Generate the <filter> XML string for one (intensity, detail, seed) combination.
 */
export function generateFilterXML(intensity: number, detail: BoilingLineSettings['detail'], seed: number): string {
  const scale = getDisplacementScale(intensity)
  const freq = getBaseFrequency(detail)
  const id = `boil-i${intensity}-d${detailAbbrev(detail)}-s${seed}`
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="turb"/><feDisplacementMap in="SourceGraphic" in2="turb" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`
}

// --- Roughen Edges ---

/** Map intensity (1-10) to feMorphology erode radius. */
export function getErodeRadius(intensity: number): number {
  return 0.2 + intensity * 0.15
}

/** Map intensity (1-10) to edge displacement scale (much smaller than full boil). */
export function getEdgeDisplacementScale(intensity: number): number {
  return 0.5 + intensity * 0.5
}

/** Build the roughen filter ID for a given frame + settings. */
export function getRoughFilterId(frame: number, settings: BoilingLineSettings): string {
  const seed = Math.floor(frame / settings.frameHold) % SEED_COUNT
  return `rough-i${settings.intensity}-d${detailAbbrev(settings.detail)}-s${seed}`
}

/** Generate the roughen edge <filter> XML for one (intensity, detail, seed) combo. */
export function generateRoughenFilterXML(intensity: number, detail: BoilingLineSettings['detail'], seed: number): string {
  const erodeRadius = getErodeRadius(intensity)
  const dilateRadius = erodeRadius + 0.1
  const edgeScale = getEdgeDisplacementScale(intensity)
  const freq = getBaseFrequency(detail)
  const id = `rough-i${intensity}-d${detailAbbrev(detail)}-s${seed}`
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feMorphology operator="erode" radius="${erodeRadius.toFixed(2)}" in="SourceGraphic" result="eroded"/><feMorphology operator="dilate" radius="${dilateRadius.toFixed(2)}" in="eroded" result="dilated"/><feTurbulence type="turbulence" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="turb"/><feDisplacementMap in="dilated" in2="turb" scale="${edgeScale.toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/></filter>`
}

/**
 * Build the composed CSS filter style string for a given frame + settings.
 * Returns the appropriate `url(#...)` references based on which effects are enabled.
 */
export function getComposedFilterStyle(frame: number, settings: BoilingLineSettings): string {
  if (!settings.enabled) return ''
  const parts: string[] = []
  parts.push(`url(#${getBoilFilterId(frame, settings)})`)
  if (settings.roughenEdges) {
    parts.push(`url(#${getRoughFilterId(frame, settings)})`)
  }
  return parts.join(' ')
}

/** Unique key for deduplicating (intensity, detail) combinations. */
export function settingsKey(intensity: number, detail: BoilingLineSettings['detail']): string {
  return `${intensity}-${detail}`
}

/**
 * Given a set of active BoilingLineSettings, generate all needed filter XML strings.
 * Deduplicates by (intensity, detail) and emits 8 seed variants per combination.
 * Also emits roughen filters when any setting has roughenEdges enabled.
 */
export function generateAllFilters(settingsList: BoilingLineSettings[]): string[] {
  const seenBoil = new Set<string>()
  const seenRough = new Set<string>()
  const filters: string[] = []

  for (const s of settingsList) {
    if (!s.enabled) continue
    const key = settingsKey(s.intensity, s.detail)

    // Displacement boil filters
    if (!seenBoil.has(key)) {
      seenBoil.add(key)
      for (let seed = 0; seed < SEED_COUNT; seed++) {
        filters.push(generateFilterXML(s.intensity, s.detail, seed))
      }
    }

    // Roughen edge filters
    if (s.roughenEdges && !seenRough.has(key)) {
      seenRough.add(key)
      for (let seed = 0; seed < SEED_COUNT; seed++) {
        filters.push(generateRoughenFilterXML(s.intensity, s.detail, seed))
      }
    }
  }

  return filters
}
