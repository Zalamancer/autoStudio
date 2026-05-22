/**
 * SVG filter generation for style effects.
 *
 * Converts Canvas 2D effects into SVG filter chains that run entirely on the
 * GPU via CSS `filter: url(#id)`. Same architecture as boiling line.
 *
 * Supported effects (SVG filter): woodcut, woodcut-mask, cel-shade,
 * neon-outline, noise-grain, glitch, vhs-retro, sketch-hatch, watercolor-bleed,
 * voxel, mosaic.
 *
 * Unsupported (keep Canvas 2D): halftone, pixel-art.
 */

import type { StyleEffectType, ActiveStyleEffect } from '@/types/styleEffects'
import { isAnimatedEffect } from '@/types/styleEffects'

const SEED_COUNT = 8

// ---------------------------------------------------------------------------
// Effect types that use SVG filters (vs Canvas 2D)
// ---------------------------------------------------------------------------

const SVG_FILTER_EFFECTS: Set<StyleEffectType> = new Set([
  'woodcut', 'woodcut-mask',
  'cel-shade', 'neon-outline',
  'noise-grain', 'glitch', 'vhs-retro',
  'sketch-hatch', 'watercolor-bleed',
  'voxel', 'mosaic',
])

/** Returns true if this effect type uses SVG filters instead of Canvas 2D. */
export function isSVGFilterEffect(type: StyleEffectType): boolean {
  return SVG_FILTER_EFFECTS.has(type)
}

// ---------------------------------------------------------------------------
// Settings hash — compact unique ID per (type, settings)
// ---------------------------------------------------------------------------

function settingsHash(type: string, s: Record<string, any>): string {
  switch (type) {
    case 'woodcut':
    case 'woodcut-mask':
      return `t${s.threshold}w${s.lineWeight}c${Math.round((s.contrast ?? 1.8) * 10)}${s.invert ? 'i' : ''}`
    case 'cel-shade':
      return `l${s.levels}e${s.edgeThickness}s${s.edgeSensitivity}c${(s.edgeColor || '').replace('#', '')}`
    case 'neon-outline':
      return `c${(s.glowColor || '').replace('#', '')}r${s.glowRadius}i${Math.round((s.glowIntensity ?? 1.5) * 10)}t${s.edgeThreshold}d${Math.round((s.backgroundDarken ?? 0.7) * 10)}`
    case 'noise-grain':
      return `i${Math.round((s.intensity ?? 0.3) * 100)}g${s.grainSize}${s.monochrome ? 'm' : 'c'}`
    case 'glitch':
      return `i${s.intensity}r${s.rgbSplit}s${Math.round((s.scanlineOpacity ?? 0.3) * 10)}b${s.blockDisplace}`
    case 'vhs-retro':
      return `a${s.chromaticAberration}s${Math.round((s.scanlineOpacity ?? 0.3) * 100)}k${s.scanlineSpacing}t${s.tracking}b${Math.round((s.colorBleed ?? 0.3) * 100)}`
    case 'sketch-hatch':
      return `s${s.lineSpacing}t${s.lineThickness}${s.crossHatch ? 'x' : ''}d${Math.round((s.lineDarkness ?? 0.8) * 10)}p${(s.paperColor || '').replace('#', '')}`
    case 'watercolor-bleed':
      return `b${s.bleedAmount}r${Math.round((s.edgeRoughness ?? 0.5) * 10)}s${Math.round((s.saturation ?? 1.3) * 10)}p${Math.round((s.paperTexture ?? 0.15) * 100)}w${Math.round((s.wetEdge ?? 0.4) * 10)}`
    case 'voxel':
      return `c${s.cubeSize}h${Math.round((s.heightScale ?? 1.5) * 10)}t${Math.round((s.topBrightness ?? 1) * 10)}a${Math.round((s.ambient ?? 0.2) * 10)}${s.gridLines ? 'g' : ''}`
    case 'mosaic':
      return `n${s.cellCount}b${s.borderWidth}c${(s.borderColor || '').replace('#', '')}s${s.seed}v${Math.round((s.colorVariation ?? 0.1) * 100)}`
    default:
      return JSON.stringify(s).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)
  }
}

// ---------------------------------------------------------------------------
// Filter ID
// ---------------------------------------------------------------------------

export function getStyleFilterId(type: string, settings: Record<string, any>, seed: number): string {
  return `fx-${type}-${settingsHash(type, settings)}-s${seed}`
}

/**
 * Subtle displacement jitter for "static" effects.
 * Adds a very small turbulence displacement (~2px) that varies by seed,
 * giving inherently static effects a subtle hand-drawn animation feel.
 */
function jitterXML(inputResult: string, seed: number, scale = 2): string {
  return `<feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="2" seed="${seed}" result="jitterNoise"/>` +
    `<feDisplacementMap in="${inputResult}" in2="jitterNoise" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="jittered"/>`
}

// ---------------------------------------------------------------------------
// Per-effect filter XML generators
// ---------------------------------------------------------------------------

/**
 * Woodcut: grayscale → contrast → threshold → displacement roughness → paper.
 * Uses feTurbulence for edge roughness (displacement), NOT as line patterns.
 */
function woodcutFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const threshold = (s.threshold ?? 128) / 255
  const contrast = s.contrast ?? 1.8
  const lineWeight = s.lineWeight ?? 2
  const invert = s.invert ?? false

  const cSlope = contrast
  const cIntercept = -(contrast - 1) * 0.5
  const tSlope = 50
  const tIntercept = 0.5 - tSlope * threshold

  // Displacement scale for edge roughness
  const dispScale = lineWeight * 3
  // Morphology erode to thicken black areas (min filter expands 0-valued pixels)
  const thickenRadius = Math.max(0, (lineWeight - 1) * 0.4)

  const common =
    `<feColorMatrix type="saturate" values="0" in="SourceGraphic" result="gray"/>` +
    `<feComponentTransfer in="gray" result="c"><feFuncR type="linear" slope="${cSlope}" intercept="${cIntercept}"/><feFuncG type="linear" slope="${cSlope}" intercept="${cIntercept}"/><feFuncB type="linear" slope="${cSlope}" intercept="${cIntercept}"/></feComponentTransfer>` +
    `<feComponentTransfer in="c" result="bin"><feFuncR type="linear" slope="${tSlope}" intercept="${tIntercept}"/><feFuncG type="linear" slope="${tSlope}" intercept="${tIntercept}"/><feFuncB type="linear" slope="${tSlope}" intercept="${tIntercept}"/></feComponentTransfer>`

  let thickenStep = ''
  let thickResult = 'bin'
  if (thickenRadius > 0) {
    thickenStep = `<feMorphology operator="erode" radius="${thickenRadius.toFixed(1)}" in="bin" result="thick"/>`
    thickResult = 'thick'
  }

  const roughen =
    `<feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed="${seed}" result="turb"/>` +
    `<feDisplacementMap in="${invert ? 'binInv' : thickResult}" in2="turb" scale="${dispScale}" xChannelSelector="R" yChannelSelector="G" result="rough"/>`

  if (invert) {
    return `<filter id="${id}" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%">` +
      common + thickenStep +
      // Invert threshold: white ink on dark
      `<feComponentTransfer in="${thickResult}" result="binInv"><feFuncR type="linear" slope="-1" intercept="1"/><feFuncG type="linear" slope="-1" intercept="1"/><feFuncB type="linear" slope="-1" intercept="1"/></feComponentTransfer>` +
      roughen +
      // Dark paper clipped to source alpha
      `<feFlood flood-color="#080808" result="paper"/>` +
      `<feComposite operator="in" in="paper" in2="SourceGraphic" result="pa"/>` +
      // Screen: light areas of rough (white ink) brighten dark paper
      `<feBlend mode="screen" in="rough" in2="pa" result="r"/>` +
      `<feComposite operator="in" in="r" in2="SourceGraphic"/>` +
      `</filter>`
  }

  return `<filter id="${id}" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%">` +
    common + thickenStep +
    roughen +
    // Paper clipped to source alpha
    `<feFlood flood-color="#f5f0e0" result="paper"/>` +
    `<feComposite operator="in" in="paper" in2="SourceGraphic" result="pa"/>` +
    // Multiply: dark threshold areas darken the paper
    `<feBlend mode="multiply" in="rough" in2="pa" result="r"/>` +
    `<feComposite operator="in" in="r" in2="SourceGraphic"/>` +
    `</filter>`
}

/**
 * Cel-shade: posterize + edge outlines.
 *
 * FIX: Previous version used feComposite operator="in" to clip flood color
 * to edge mask, but "in" clips by ALPHA channel — which was the source's
 * original alpha (opaque everywhere), not the edge brightness. This caused
 * the entire character to fill with edge color (all black).
 *
 * Fix: Convert edge brightness (RGB) to alpha via feColorMatrix before
 * clipping with feComposite. Now alpha=1 only at actual edge pixels.
 */
function celShadeFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const levels = s.levels ?? 4
  const edgeThickness = s.edgeThickness ?? 2
  const edgeColor = s.edgeColor ?? '#000000'
  const edgeSensitivity = s.edgeSensitivity ?? 40

  const table = Array.from({ length: levels }, (_, i) =>
    levels <= 1 ? '0.5' : (i / (levels - 1)).toFixed(3),
  ).join(' ')

  const edgeThresh = 1.0 - edgeSensitivity / 100
  const eSensSlope = 50
  const eSensIntercept = 0.5 - eSensSlope * edgeThresh
  const dilateRadius = Math.max(0, (edgeThickness - 1) * 0.5)

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-2%" y="-2%" width="104%" height="104%">` +
    `<feComponentTransfer in="SourceGraphic" result="poster"><feFuncR type="discrete" tableValues="${table}"/><feFuncG type="discrete" tableValues="${table}"/><feFuncB type="discrete" tableValues="${table}"/></feComponentTransfer>`

  if (edgeThickness > 0) {
    xml +=
      // Edge detection (Laplacian on source)
      `<feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" in="SourceGraphic" result="rawEdge" preserveAlpha="true" edgeMode="none" divisor="1" bias="0.5"/>` +
      // Absolute edge strength: fold around 0.5 (non-edges ≈ 0.5 → 0, edges → 1)
      `<feComponentTransfer in="rawEdge" result="absEdge"><feFuncR type="table" tableValues="1 0 1"/><feFuncG type="table" tableValues="1 0 1"/><feFuncB type="table" tableValues="1 0 1"/></feComponentTransfer>` +
      // Grayscale + threshold
      `<feColorMatrix type="saturate" values="0" in="absEdge" result="grayEdge"/>` +
      `<feComponentTransfer in="grayEdge" result="edgeMask"><feFuncR type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/><feFuncG type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/><feFuncB type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/></feComponentTransfer>` +
      // FIX: Convert edge brightness (R) to alpha channel.
      // This makes alpha=1 at edge pixels and alpha=0 elsewhere.
      // Without this, feComposite "in" clips by the SOURCE alpha (opaque everywhere).
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" in="edgeMask" result="edgeAlpha"/>`

    // Thicken edges via dilation (operates on alpha now)
    let edgeResult = 'edgeAlpha'
    if (dilateRadius > 0) {
      xml += `<feMorphology operator="dilate" radius="${dilateRadius.toFixed(1)}" in="edgeAlpha" result="thickEdge"/>`
      edgeResult = 'thickEdge'
    }

    xml +=
      `<feFlood flood-color="${edgeColor}" result="ec"/>` +
      `<feComposite operator="in" in="ec" in2="${edgeResult}" result="coloredEdge"/>` +
      `<feMerge result="celResult"><feMergeNode in="poster"/><feMergeNode in="coloredEdge"/></feMerge>` +
      jitterXML('celResult', seed)
  } else {
    xml += jitterXML('poster', seed) +
      `<feComposite operator="in" in="jittered" in2="SourceGraphic"/>`
  }

  xml += `</filter>`
  return xml
}

/**
 * Neon outline: glowing colored edges on darkened background.
 *
 * FIX: Same alpha bug as cel-shade. Added RGB-to-alpha conversion so
 * the glow color only appears at actual edge pixels, not the entire character.
 */
function neonOutlineFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const glowColor = s.glowColor ?? '#00ffff'
  const glowRadius = s.glowRadius ?? 10
  const glowIntensity = s.glowIntensity ?? 1.5
  const edgeThreshold = s.edgeThreshold ?? 30
  const bgDarken = s.backgroundDarken ?? 0.7

  const edgeThresh = 1.0 - edgeThreshold / 100
  const eSensSlope = 50
  const eSensIntercept = 0.5 - eSensSlope * edgeThresh
  const bgScale = 1 - bgDarken
  const filterRegion = Math.max(20, glowRadius * 2)

  return `<filter id="${id}" color-interpolation-filters="sRGB" x="-${filterRegion}%" y="-${filterRegion}%" width="${100 + filterRegion * 2}%" height="${100 + filterRegion * 2}%">` +
    // Darken background
    `<feComponentTransfer in="SourceGraphic" result="dark"><feFuncR type="linear" slope="${bgScale}"/><feFuncG type="linear" slope="${bgScale}"/><feFuncB type="linear" slope="${bgScale}"/></feComponentTransfer>` +
    // Edge detection (Laplacian)
    `<feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" in="SourceGraphic" result="rawEdge" preserveAlpha="true" edgeMode="none" divisor="1" bias="0.5"/>` +
    `<feComponentTransfer in="rawEdge" result="absEdge"><feFuncR type="table" tableValues="1 0 1"/><feFuncG type="table" tableValues="1 0 1"/><feFuncB type="table" tableValues="1 0 1"/></feComponentTransfer>` +
    `<feColorMatrix type="saturate" values="0" in="absEdge" result="grayEdge"/>` +
    `<feComponentTransfer in="grayEdge" result="edgeMask"><feFuncR type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/><feFuncG type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/><feFuncB type="linear" slope="${eSensSlope}" intercept="${eSensIntercept}"/></feComponentTransfer>` +
    // FIX: Convert edge brightness to alpha (same fix as cel-shade)
    `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" in="edgeMask" result="edgeAlpha"/>` +
    // Glow color clipped to edge alpha
    `<feFlood flood-color="${glowColor}" result="gc"/>` +
    `<feComposite operator="in" in="gc" in2="edgeAlpha" result="coloredEdge"/>` +
    // Blur for glow emanation
    `<feGaussianBlur in="coloredEdge" stdDeviation="${glowRadius * 0.5}" result="glow"/>` +
    // Boost glow intensity (also boost alpha so glow is visible)
    `<feComponentTransfer in="glow" result="brightGlow"><feFuncR type="linear" slope="${glowIntensity}"/><feFuncG type="linear" slope="${glowIntensity}"/><feFuncB type="linear" slope="${glowIntensity}"/><feFuncA type="linear" slope="${glowIntensity}"/></feComponentTransfer>` +
    // Screen glow onto dark background, then overlay sharp edges
    `<feBlend mode="screen" in="brightGlow" in2="dark" result="glowed"/>` +
    `<feMerge result="neonResult"><feMergeNode in="glowed"/><feMergeNode in="coloredEdge"/></feMerge>` +
    jitterXML('neonResult', seed) +
    `</filter>`
}

/**
 * Noise grain: film grain overlay on source.
 *
 * FIX: feTurbulence generates varying alpha values. Force alpha=1 on scaled
 * noise so overlay blend doesn't make the character semi-transparent.
 * Clip final result to source alpha so grain doesn't appear in transparent areas.
 */
function noiseGrainFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const intensity = s.intensity ?? 0.3
  const grainSize = s.grainSize ?? 1
  const monochrome = s.monochrome ?? true

  const freq = 0.5 / grainSize
  const nSlope = intensity
  const nIntercept = (1 - intensity) * 0.5

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" result="noise"/>`

  if (monochrome) {
    xml += `<feColorMatrix type="saturate" values="0" in="noise" result="noise"/>`
  }

  xml +=
    // Scale intensity + force alpha=1 (feTurbulence has varying alpha)
    `<feComponentTransfer in="noise" result="scaled"><feFuncR type="linear" slope="${nSlope}" intercept="${nIntercept}"/><feFuncG type="linear" slope="${nSlope}" intercept="${nIntercept}"/><feFuncB type="linear" slope="${nSlope}" intercept="${nIntercept}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    `<feBlend mode="overlay" in="SourceGraphic" in2="scaled" result="noisy"/>` +
    // Clip to source alpha so grain doesn't appear in transparent areas
    `<feComposite operator="in" in="noisy" in2="SourceGraphic"/>` +
    `</filter>`

  return xml
}

/**
 * Glitch: RGB channel split + block displacement + scanlines.
 *
 * FIX: Scanlines are clipped to the current image's alpha before multiply
 * blend, preventing the opaque scanline texture from filling transparent
 * areas with white/gray.
 */
function glitchFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const rgbSplit = s.rgbSplit ?? 8
  const scanlineOpacity = s.scanlineOpacity ?? 0.3
  const blockDisplace = s.blockDisplace ?? 10

  const filterW = Math.max(10, rgbSplit * 2 + 5)

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-${filterW}%" y="-5%" width="${100 + filterW * 2}%" height="110%">`

  if (rgbSplit > 0) {
    xml +=
      `<feOffset dx="${rgbSplit}" in="SourceGraphic" result="rShift"/>` +
      `<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="rShift" result="r"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="g"/>` +
      `<feOffset dx="-${rgbSplit}" in="SourceGraphic" result="bShift"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" in="bShift" result="b"/>` +
      `<feBlend mode="screen" in="r" in2="g" result="rg"/>` +
      `<feBlend mode="screen" in="rg" in2="b" result="split"/>`
  } else {
    xml += `<feOffset dx="0" in="SourceGraphic" result="split"/>`
  }

  let lastResult = 'split'

  // Block displacement via turbulence
  if (blockDisplace > 0) {
    xml +=
      `<feTurbulence type="turbulence" baseFrequency="0.005 0.08" numOctaves="1" seed="${seed}" result="blockNoise"/>` +
      `<feDisplacementMap in="${lastResult}" in2="blockNoise" scale="${blockDisplace}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>`
    lastResult = 'displaced'
  }

  // Scanlines
  if (scanlineOpacity > 0) {
    const scanDark = 1 - scanlineOpacity
    xml +=
      `<feTurbulence type="turbulence" baseFrequency="0.001 0.5" numOctaves="1" seed="${seed * 13}" result="scanNoise"/>` +
      `<feComponentTransfer in="scanNoise" result="scanlines"><feFuncR type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncG type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncB type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
      // Clip scanlines to current image alpha so they don't fill transparent areas
      `<feComposite operator="in" in="scanlines" in2="${lastResult}" result="clippedScan"/>` +
      `<feBlend mode="multiply" in="${lastResult}" in2="clippedScan" result="scanned"/>`
    lastResult = 'scanned'
  }

  xml += `</filter>`
  return xml
}

/**
 * VHS retro: chromatic aberration + warm color + scanlines + tracking.
 *
 * FIX: Scanlines clipped to current image alpha before multiply blend.
 */
function vhsRetroFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const chromaticAberration = s.chromaticAberration ?? 3
  const scanlineOpacity = s.scanlineOpacity ?? 0.3
  const scanlineSpacing = s.scanlineSpacing ?? 4
  const tracking = s.tracking ?? 5
  const colorBleed = s.colorBleed ?? 0.3

  // Per-seed jitter for chromatic aberration (simulates unstable tape heads)
  // Pseudo-random small offset: varies ±1.5px between seeds
  const caJitter = ((seed * 7 + 3) % 5 - 2) * 0.5
  const rDx = chromaticAberration + caJitter
  const bDx = -(chromaticAberration - caJitter * 0.7)

  const filterW = Math.max(10, chromaticAberration * 2 + 5)

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-${filterW}%" y="-5%" width="${100 + filterW * 2}%" height="110%">`

  if (chromaticAberration > 0) {
    xml +=
      `<feOffset dx="${rDx.toFixed(1)}" in="SourceGraphic" result="rShift"/>` +
      `<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="rShift" result="r"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" in="SourceGraphic" result="g"/>` +
      `<feOffset dx="${bDx.toFixed(1)}" in="SourceGraphic" result="bShift"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" in="bShift" result="b"/>` +
      `<feBlend mode="screen" in="r" in2="g" result="rg"/>` +
      `<feBlend mode="screen" in="rg" in2="b" result="aberrated"/>`
  } else {
    xml += `<feOffset dx="0" in="SourceGraphic" result="aberrated"/>`
  }

  let lastResult = 'aberrated'

  // Color warmth
  xml += `<feColorMatrix type="matrix" values="1.05 0.05 0 0 0.02  0 0.95 0.05 0 0  0 0 0.85 0 0  0 0 0 1 0" in="${lastResult}" result="warm"/>`
  lastResult = 'warm'

  // Color bleed (horizontal blur)
  if (colorBleed > 0) {
    xml += `<feGaussianBlur in="${lastResult}" stdDeviation="${colorBleed * 3} 0" result="bled"/>`
    lastResult = 'bled'
  }

  // Scanlines — use animation seed so scanline pattern shifts each frame (rolling tape)
  if (scanlineOpacity > 0) {
    const scanFreq = 1 / (scanlineSpacing * 2)
    const scanDark = 1 - scanlineOpacity
    xml +=
      `<feTurbulence type="turbulence" baseFrequency="0.001 ${scanFreq.toFixed(4)}" numOctaves="1" seed="${seed * 17}" result="scanNoise"/>` +
      `<feComponentTransfer in="scanNoise" result="scanlines"><feFuncR type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncG type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncB type="discrete" tableValues="1 ${scanDark.toFixed(2)}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
      // Clip scanlines to current image alpha so they don't fill transparent areas
      `<feComposite operator="in" in="scanlines" in2="${lastResult}" result="clippedScan"/>` +
      `<feBlend mode="multiply" in="${lastResult}" in2="clippedScan" result="scanned"/>`
    lastResult = 'scanned'
  }

  // Tracking distortion
  if (tracking > 0) {
    xml +=
      `<feTurbulence type="turbulence" baseFrequency="0.002 0.08" numOctaves="2" seed="${seed * 3 + 5}" result="trackNoise"/>` +
      `<feDisplacementMap in="${lastResult}" in2="trackNoise" scale="${tracking}" xChannelSelector="R" yChannelSelector="G" result="tracked"/>`
    lastResult = 'tracked'
  }

  xml += `</filter>`
  return xml
}

/**
 * Sketch hatch: hatching lines modulated by source darkness on paper.
 *
 * FIX: Previous version used inverted grayscale with lighten blend, which
 * showed lines in LIGHT areas instead of dark areas (backwards).
 * Fix: Use non-inverted gray with lighten blend:
 *   lighten(lines, gray) → dark areas (gray≈0) show lines, light areas (gray≈1) hide them.
 * Also force alpha=1 on turbulence output.
 */
function sketchHatchFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const lineSpacing = s.lineSpacing ?? 4
  const lineThickness = s.lineThickness ?? 1
  const crossHatch = s.crossHatch ?? true
  const lineDarkness = s.lineDarkness ?? 0.8
  const paperColor = s.paperColor ?? '#f5f0e8'

  const freqPrimary = 0.3 / lineSpacing
  const freqCross = 0.2 / lineSpacing
  const lSlope = 12 + lineThickness * 4
  const lIntercept = -(lSlope * 0.5 - 0.5)

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB">` +
    // Grayscale source (0=dark, 1=light)
    `<feColorMatrix type="saturate" values="0" in="SourceGraphic" result="gray"/>` +
    // Primary hatch pattern (anisotropic turbulence → streak-like texture)
    `<feTurbulence type="turbulence" baseFrequency="${freqPrimary} 0.005" numOctaves="1" seed="${seed}" result="lines45"/>` +
    // Threshold to sharp lines + force alpha=1
    `<feComponentTransfer in="lines45" result="sharpLines"><feFuncR type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncG type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncB type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    // FIX: lighten(lines, gray) — lines visible where source is dark (gray≈0),
    // hidden where light (gray≈1, which wins the lighten comparison)
    `<feBlend mode="lighten" in="sharpLines" in2="gray" result="maskedLines"/>` +
    // Apply ink darkness
    `<feComponentTransfer in="maskedLines" result="inkLines"><feFuncR type="linear" slope="${lineDarkness}"/><feFuncG type="linear" slope="${lineDarkness}"/><feFuncB type="linear" slope="${lineDarkness}"/></feComponentTransfer>` +
    // Paper background clipped to source alpha
    `<feFlood flood-color="${paperColor}" result="paper"/>` +
    `<feComposite operator="in" in="paper" in2="SourceGraphic" result="pa"/>` +
    // Multiply lines onto paper
    `<feBlend mode="multiply" in="pa" in2="inkLines" result="primary"/>`

  if (crossHatch) {
    // Cross-hatch at ~135° (perpendicular to primary)
    xml +=
      `<feTurbulence type="turbulence" baseFrequency="0.005 ${freqCross}" numOctaves="1" seed="${seed + 100}" result="lines135"/>` +
      `<feComponentTransfer in="lines135" result="sharpCross"><feFuncR type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncG type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncB type="linear" slope="${lSlope}" intercept="${lIntercept}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
      // Stricter gray mask: cross-hatching only in darkest areas
      // slope=3, intercept=-1: gray<0.33 → 0 (shows), gray>0.67 → 1 (hides)
      `<feComponentTransfer in="gray" result="grayStrict"><feFuncR type="linear" slope="3" intercept="-1"/><feFuncG type="linear" slope="3" intercept="-1"/><feFuncB type="linear" slope="3" intercept="-1"/></feComponentTransfer>` +
      `<feBlend mode="lighten" in="sharpCross" in2="grayStrict" result="maskedCross"/>` +
      `<feComponentTransfer in="maskedCross" result="inkCross"><feFuncR type="linear" slope="${lineDarkness * 0.6}"/><feFuncG type="linear" slope="${lineDarkness * 0.6}"/><feFuncB type="linear" slope="${lineDarkness * 0.6}"/></feComponentTransfer>` +
      `<feBlend mode="multiply" in="primary" in2="inkCross" result="result"/>`
  }

  const finalResult = crossHatch ? 'result' : 'primary'
  xml +=
    `<feComposite operator="in" in="${finalResult}" in2="SourceGraphic"/>` +
    `</filter>`

  return xml
}

/**
 * Watercolor: blur + edge roughness + saturation + paper texture.
 * Intentionally bleeds beyond character bounds (watercolor look).
 */
function watercolorFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const bleedAmount = s.bleedAmount ?? 8
  const edgeRoughness = s.edgeRoughness ?? 0.5
  const saturation = s.saturation ?? 1.3
  const paperTexture = s.paperTexture ?? 0.15
  const wetEdge = s.wetEdge ?? 0.4

  const filterPad = Math.max(10, bleedAmount)

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-${filterPad}%" y="-${filterPad}%" width="${100 + filterPad * 2}%" height="${100 + filterPad * 2}%">` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${bleedAmount * 0.5}" result="blurred"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${seed * 7 + 42}" result="roughNoise"/>` +
    `<feDisplacementMap in="blurred" in2="roughNoise" scale="${edgeRoughness * 15}" xChannelSelector="R" yChannelSelector="G" result="roughed"/>` +
    `<feColorMatrix type="saturate" values="${saturation}" in="roughed" result="saturated"/>`

  let lastResult = 'saturated'

  if (paperTexture > 0) {
    const pSlope = paperTexture
    const pIntercept = 1 - paperTexture
    xml +=
      `<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="${seed * 13 + 99}" result="paperNoise"/>` +
      `<feColorMatrix type="saturate" values="0" in="paperNoise" result="paperMono"/>` +
      // Force alpha=1 on paper texture
      `<feComponentTransfer in="paperMono" result="paperSubtle"><feFuncR type="linear" slope="${pSlope}" intercept="${pIntercept}"/><feFuncG type="linear" slope="${pSlope}" intercept="${pIntercept}"/><feFuncB type="linear" slope="${pSlope}" intercept="${pIntercept}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
      // Clip paper texture to current image alpha before multiply
      `<feComposite operator="in" in="paperSubtle" in2="${lastResult}" result="clippedPaper"/>` +
      `<feBlend mode="multiply" in="${lastResult}" in2="clippedPaper" result="textured"/>`
    lastResult = 'textured'
  }

  if (wetEdge > 0) {
    const wetBlur = bleedAmount * 0.3
    xml +=
      `<feGaussianBlur in="${lastResult}" stdDeviation="${wetBlur}" result="wetBlur"/>` +
      `<feComposite operator="arithmetic" k1="0" k2="${1 + wetEdge * 0.3}" k3="${-wetEdge * 0.3}" k4="0" in="${lastResult}" in2="wetBlur" result="wetResult"/>`
    lastResult = 'wetResult'
  }

  xml += `</filter>`
  return xml
}

/**
 * Voxel: blocky/pixelated look with 3D emboss shading.
 *
 * Uses morphological closing (erode → dilate) to create blocky regions,
 * posterization for flat-shaded faces, and emboss convolution for 3D depth.
 * GPU-accelerated — replaces the O(w×h×k²) Canvas 2D per-cube rendering.
 */
function voxelFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const cubeSize = s.cubeSize ?? 10
  const heightScale = s.heightScale ?? 1.5
  const topBrightness = s.topBrightness ?? 1.0
  const ambient = s.ambient ?? 0.2
  const gridLines = s.gridLines ?? false

  // Morphological closing radius = half cube size
  const morphRadius = Math.max(1, Math.round(cubeSize / 2))

  // Posterization: larger cubes = fewer levels for flatter look
  const levels = Math.max(3, Math.round(24 / cubeSize) + 2)
  const table = Array.from({ length: levels }, (_, i) =>
    levels <= 1 ? '0.5' : (i / (levels - 1)).toFixed(3),
  ).join(' ')

  // Emboss strength from heightScale
  const embossStrength = heightScale * 0.15

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-2%" y="-2%" width="104%" height="104%">` +
    // Blocky regions via morphological closing (erode + dilate)
    `<feMorphology operator="erode" radius="${morphRadius}" in="SourceGraphic" result="eroded"/>` +
    `<feMorphology operator="dilate" radius="${morphRadius}" in="eroded" result="blocky"/>` +
    // Flat-shade colors via posterization
    `<feComponentTransfer in="blocky" result="flat"><feFuncR type="discrete" tableValues="${table}"/><feFuncG type="discrete" tableValues="${table}"/><feFuncB type="discrete" tableValues="${table}"/></feComponentTransfer>` +
    // 3D emboss: lit from top-left to simulate isometric face shading
    `<feConvolveMatrix order="3" kernelMatrix="-1 -1 0 -1 1 1 0 1 1" in="flat" result="embossRaw" preserveAlpha="true" divisor="1" bias="0.5" edgeMode="none"/>` +
    `<feColorMatrix type="saturate" values="0" in="embossRaw" result="embossGray"/>` +
    // Scale emboss intensity and center around 1.0 for multiply
    `<feComponentTransfer in="embossGray" result="emboss"><feFuncR type="linear" slope="${embossStrength}" intercept="${1 - embossStrength * 0.5}"/><feFuncG type="linear" slope="${embossStrength}" intercept="${1 - embossStrength * 0.5}"/><feFuncB type="linear" slope="${embossStrength}" intercept="${1 - embossStrength * 0.5}"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    // Apply depth shading
    `<feBlend mode="multiply" in="flat" in2="emboss" result="shaded"/>` +
    // Apply top face brightness
    `<feComponentTransfer in="shaded" result="lit"><feFuncR type="linear" slope="${topBrightness}"/><feFuncG type="linear" slope="${topBrightness}"/><feFuncB type="linear" slope="${topBrightness}"/></feComponentTransfer>`

  let lastResult = 'lit'

  if (gridLines) {
    const edgeRadius = Math.max(0.5, morphRadius * 0.15)
    xml +=
      `<feMorphology operator="erode" radius="${edgeRadius}" in="${lastResult}" result="gridEroded"/>` +
      `<feComposite operator="out" in="${lastResult}" in2="gridEroded" result="gridEdges"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" in="gridEdges" result="gridAlpha"/>` +
      `<feFlood flood-color="rgba(0,0,0,${(0.3 + ambient).toFixed(2)})" result="gridColor"/>` +
      `<feComposite operator="in" in="gridColor" in2="gridAlpha" result="gridOverlay"/>` +
      `<feMerge result="gridded"><feMergeNode in="${lastResult}"/><feMergeNode in="gridOverlay"/></feMerge>`
    lastResult = 'gridded'
  }

  // Add jitter for animation
  xml += jitterXML(lastResult, seed)
  lastResult = 'jittered'

  xml +=
    `<feComposite operator="in" in="${lastResult}" in2="SourceGraphic"/>` +
    `</filter>`

  return xml
}

/**
 * Mosaic / Stained Glass: irregular cells with flat colors and borders.
 *
 * Uses Gaussian blur for color averaging, turbulence displacement for
 * irregular cell boundaries, posterization for flat cell colors, and
 * morphology-based edge detection for borders.
 * GPU-accelerated — replaces the O(w×h×cellCount) Voronoi Canvas 2D computation.
 */
function mosaicFilterXML(id: string, s: Record<string, any>, seed: number): string {
  const cellCount = s.cellCount ?? 100
  const borderWidth = s.borderWidth ?? 1
  const borderColor = s.borderColor ?? '#333333'
  const baseSeed = s.seed ?? 42
  const colorVariation = s.colorVariation ?? 0.1

  // Blur radius inversely proportional to cell count (more cells = less blur = smaller cells)
  const blurRadius = Math.max(2, Math.round(30 * Math.sqrt(20 / cellCount)))

  // Turbulence frequency: more cells = higher frequency = smaller regions
  const turbFreq = 0.005 + (cellCount / 500) * 0.03

  // Displacement scale: creates irregular cell boundaries
  const dispScale = blurRadius * 1.5

  // Posterization levels: less colorVariation = fewer levels = more uniform cells
  const levels = Math.max(3, Math.round(4 + colorVariation * 12))
  const table = Array.from({ length: levels }, (_, i) =>
    levels <= 1 ? '0.5' : (i / (levels - 1)).toFixed(3),
  ).join(' ')

  const filterPad = Math.max(5, Math.round(blurRadius * 0.3))

  let xml = `<filter id="${id}" color-interpolation-filters="sRGB" x="-${filterPad}%" y="-${filterPad}%" width="${100 + filterPad * 2}%" height="${100 + filterPad * 2}%">` +
    // Blur for color averaging within cells
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${blurRadius}" result="averaged"/>` +
    // Turbulence for irregular cell boundaries
    `<feTurbulence type="fractalNoise" baseFrequency="${turbFreq.toFixed(4)}" numOctaves="2" seed="${baseSeed + seed * 11}" result="cellNoise"/>` +
    // Displace averaged image to create cell-like regions
    `<feDisplacementMap in="averaged" in2="cellNoise" scale="${dispScale}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>` +
    // Posterize for flat cell colors
    `<feComponentTransfer in="displaced" result="flat"><feFuncR type="discrete" tableValues="${table}"/><feFuncG type="discrete" tableValues="${table}"/><feFuncB type="discrete" tableValues="${table}"/></feComponentTransfer>`

  let lastResult = 'flat'

  // Cell borders via morphology edge detection
  if (borderWidth > 0) {
    const edgeRadius = Math.max(0.5, borderWidth * 0.5)
    xml +=
      `<feMorphology operator="erode" radius="${edgeRadius}" in="${lastResult}" result="mosaicEroded"/>` +
      `<feComposite operator="out" in="${lastResult}" in2="mosaicEroded" result="mosaicEdges"/>` +
      // Convert edge luminance to alpha
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" in="mosaicEdges" result="borderAlpha"/>` +
      `<feFlood flood-color="${borderColor}" result="bc"/>` +
      `<feComposite operator="in" in="bc" in2="borderAlpha" result="borders"/>` +
      `<feMerge result="bordered"><feMergeNode in="${lastResult}"/><feMergeNode in="borders"/></feMerge>`
    lastResult = 'bordered'
  }

  xml +=
    `<feComposite operator="in" in="${lastResult}" in2="SourceGraphic"/>` +
    `</filter>`

  return xml
}

// ---------------------------------------------------------------------------
// Filter dispatch
// ---------------------------------------------------------------------------

function generateFilterForEffect(type: string, settings: Record<string, any>, seed: number): string | null {
  const id = getStyleFilterId(type, settings, seed)

  switch (type) {
    case 'woodcut':
    case 'woodcut-mask':
      return woodcutFilterXML(id, settings, seed)
    case 'cel-shade':
      return celShadeFilterXML(id, settings, seed)
    case 'neon-outline':
      return neonOutlineFilterXML(id, settings, seed)
    case 'noise-grain':
      return noiseGrainFilterXML(id, settings, seed)
    case 'glitch':
      return glitchFilterXML(id, settings, seed)
    case 'vhs-retro':
      return vhsRetroFilterXML(id, settings, seed)
    case 'sketch-hatch':
      return sketchHatchFilterXML(id, settings, seed)
    case 'watercolor-bleed':
      return watercolorFilterXML(id, settings, seed)
    case 'voxel':
      return voxelFilterXML(id, settings, seed)
    case 'mosaic':
      return mosaicFilterXML(id, settings, seed)
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate all needed SVG filter XMLs for a set of active style effects.
 * All SVG filter effects get 8 seed variants for animation (subtle jitter
 * for inherently static effects, visible animation for glitch/VHS/noise).
 */
export function generateAllStyleFilters(effects: ActiveStyleEffect[]): string[] {
  const seen = new Set<string>()
  const filters: string[] = []

  for (const effect of effects) {
    if (!isSVGFilterEffect(effect.type)) continue
    if (!effect.settings?.enabled) continue

    const hash = `${effect.type}|${settingsHash(effect.type, effect.settings)}`
    if (seen.has(hash)) continue
    seen.add(hash)

    // All SVG filter effects generate 8 seed variants for animation
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const xml = generateFilterForEffect(effect.type, effect.settings, seed)
      if (xml) filters.push(xml)
    }
  }

  return filters
}

/**
 * Get the CSS filter style string for a style effect at a given frame.
 * Returns `url(#filter-id)` for SVG filter effects, empty string otherwise.
 */
export function getStyleEffectFilterStyle(frame: number, effect: ActiveStyleEffect): string {
  if (!isSVGFilterEffect(effect.type)) return ''
  if (!effect.settings?.enabled) return ''

  // All SVG filter effects animate — glitch/VHS/noise use fast speed,
  // inherently static effects use slower speed for subtle jitter
  const defaultSpeed = isAnimatedEffect(effect.type) ? 2 : 3
  const speed = effect.settings.speed ?? defaultSpeed
  const seed = Math.floor(frame / speed) % SEED_COUNT

  const id = getStyleFilterId(effect.type, effect.settings, seed)
  return `url(#${id})`
}
