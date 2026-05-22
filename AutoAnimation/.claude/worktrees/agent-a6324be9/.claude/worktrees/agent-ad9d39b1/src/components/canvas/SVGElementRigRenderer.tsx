/**
 * SVGElementRigRenderer — renders an SVG-native rig by applying per-element
 * bone transforms directly to SVG DOM elements.
 *
 * Instead of rasterising the SVG into a triangle mesh, this renderer:
 *   1. Parses `rig.svgSource` via DOMParser and inserts it into a container <div>
 *   2. Builds a `Map<string, SVGElement>` for each bound element (by ID)
 *   3. On mount, reads `getBBox()` to set accurate pivots
 *   4. Each frame (RAF), calls `applySvgElementTransforms()` which uses the
 *      existing FK engine to compute world joint positions and applies
 *      weighted translate + rotate transforms to each SVG element
 */

import { useRef, useEffect, useCallback, memo } from 'react'
import { useRigStore } from '@/stores/useRigStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { applySvgElementTransforms, computeElementPivots } from '@/services/svgRigService'
import type { BonePose } from '@/types/rig'

interface SVGElementRigRendererProps {
  rigId: string
  characterId: string
  width?: number
  height?: number
}

export const SVGElementRigRenderer = memo(function SVGElementRigRenderer({
  rigId,
  characterId,
  width,
  height,
}: SVGElementRigRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementRefsMap = useRef<Map<string, SVGElement>>(new Map())
  const rafIdRef = useRef<number>(0)
  const pivotsInitialized = useRef(false)

  // Subscriptions — read once at mount & let RAF read from store directly
  const rig = useRigStore((s) => s.rigs[rigId])
  const selectedSvgElementId = useRigStore((s) => s.selectedSvgElementId)

  // Inject SVG source into container and build element refs map
  useEffect(() => {
    const container = containerRef.current
    if (!container || !rig?.svgSource) return

    // Parse SVG source
    const parser = new DOMParser()
    const doc = parser.parseFromString(rig.svgSource, 'image/svg+xml')
    const svgEl = doc.documentElement

    // Ensure the SVG scales to the container
    svgEl.setAttribute('width', '100%')
    svgEl.setAttribute('height', '100%')
    svgEl.style.display = 'block'

    // Clear container and insert
    container.innerHTML = ''
    container.appendChild(svgEl)

    // Build element refs
    const refs = new Map<string, SVGElement>()
    if (rig.svgElementSkinning) {
      for (const binding of rig.svgElementSkinning) {
        const el = svgEl.querySelector(`#${CSS.escape(binding.elementId)}`)
        if (el instanceof SVGElement) {
          refs.set(binding.elementId, el)
        }
      }
    }
    elementRefsMap.current = refs
    pivotsInitialized.current = false

    return () => {
      container.innerHTML = ''
      elementRefsMap.current.clear()
    }
  }, [rig?.svgSource, rig?.svgElementSkinning])

  // Initialize pivots from live getBBox once SVG is mounted
  useEffect(() => {
    if (pivotsInitialized.current) return
    if (!rig?.svgElementSkinning || elementRefsMap.current.size === 0) return

    // Small delay to let the browser lay out the SVG
    const timer = setTimeout(() => {
      const updated = computeElementPivots(elementRefsMap.current, rig.svgElementSkinning!)
      if (updated) {
        useRigStore.getState().updateSvgElementPivots(rigId, updated)
      }
      pivotsInitialized.current = true
    }, 100)

    return () => clearTimeout(timer)
  }, [rigId, rig?.svgElementSkinning])

  // Highlight selected SVG element
  useEffect(() => {
    const refs = elementRefsMap.current
    // Remove previous highlights
    refs.forEach((el) => {
      el.removeAttribute('data-selected')
      ;(el as SVGElement).style.outline = ''
      ;(el as SVGElement).style.outlineOffset = ''
    })

    if (selectedSvgElementId) {
      const el = refs.get(selectedSvgElementId)
      if (el) {
        el.setAttribute('data-selected', 'true')
        ;(el as SVGElement).style.outline = '2px solid #4ade80'
        ;(el as SVGElement).style.outlineOffset = '1px'
      }
    }
  }, [selectedSvgElementId])

  // RAF loop: apply bone transforms every frame
  const animate = useCallback(() => {
    const store = useRigStore.getState()
    const currentRig = store.rigs[rigId]
    if (!currentRig?.svgElementSkinning || !currentRig.skeleton.joints.length || elementRefsMap.current.size === 0) {
      rafIdRef.current = requestAnimationFrame(animate)
      return
    }

    // Get current pose: from store's currentPose, or interpolated from timeline
    let pose: BonePose | null = store.currentPose

    // If playing, try to get interpolated pose from keyframes
    const timeline = useTimelineStore.getState()
    if (timeline.isPlaying) {
      const interpolated = store.getInterpolatedPoseAtFrame(characterId, timeline.currentFrame)
      if (interpolated) pose = interpolated
    }

    if (!pose) {
      rafIdRef.current = requestAnimationFrame(animate)
      return
    }

    applySvgElementTransforms(
      elementRefsMap.current,
      currentRig.svgElementSkinning,
      currentRig.skeleton,
      currentRig.restPose,
      pose,
    )

    rafIdRef.current = requestAnimationFrame(animate)
  }, [rigId, characterId])

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [animate])

  if (!rig?.svgSource) return null

  // Display size: use explicit props, otherwise scale down to max 400px
  let displayWidth: number
  let displayHeight: number
  if (width || height) {
    displayWidth = width ?? rig.imageWidth
    displayHeight = height ?? rig.imageHeight
  } else {
    const MAX_DISPLAY = 400
    const aspect = rig.imageWidth / rig.imageHeight
    if (rig.imageWidth >= rig.imageHeight) {
      displayWidth = Math.min(rig.imageWidth, MAX_DISPLAY)
      displayHeight = displayWidth / aspect
    } else {
      displayHeight = Math.min(rig.imageHeight, MAX_DISPLAY)
      displayWidth = displayHeight * aspect
    }
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none select-none"
      style={{
        width: displayWidth,
        height: displayHeight,
        overflow: 'visible',
      }}
    />
  )
})
