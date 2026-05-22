/**
 * WhiteboardLayer
 *
 * Canvas layer that renders whiteboard-style stroke-dashoffset reveal animation.
 * Strokes appear to be drawn progressively over time with an optional hand overlay.
 */

import { useRef, useEffect, memo, useMemo } from 'react'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { useTimelineStore } from '@/stores'
import {
  computeWhiteboardFrame,
  getHandOverlaySVG,
  generateDraftingSvgOverlay,
  createDefaultDraftingConfig,
} from '@/services/whiteboardAnimation'

// ── Code Background iframe template ──────────────────────────────────
function buildCodeBackgroundSrcdoc(code: string): string {
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { overflow: hidden; background: #000; }
  canvas { display: block; width: 100vw; height: 100vh; }
</style></head><body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

const _controls = {};
function addControl(id, label, a, b, c, d) {
  if (a === 'color')    { _controls[id] = { id, type:'color',    label, value: b }; return; }
  if (a === 'toggle')   { _controls[id] = { id, type:'toggle',   label, value: !!b }; return; }
  if (a === 'text')     { _controls[id] = { id, type:'text',     label, value: String(b || '') }; return; }
  if (a === 'dropdown') { _controls[id] = { id, type:'dropdown', label, value: b, options: c || [] }; return; }
  _controls[id] = { id, type:'slider', label, min:a, max:b, value:c, step: d || 0.01 };
}

try {
  ${code}
} catch(e) { console.error('[CodeBG]', e); }

window.parent.postMessage({ type: 'CONTROLS_READY', controls: Object.values(_controls) }, '*');

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CONFIG_UPDATE') {
    for (const [k, v] of Object.entries(e.data.values)) {
      if (_controls[k]) _controls[k].value = v;
    }
  }
});

let startTime = performance.now();
function animate() {
  // Re-check dimensions each frame so canvas is never 0x0
  const nw = document.documentElement.clientWidth || window.innerWidth;
  const nh = document.documentElement.clientHeight || window.innerHeight;
  if (nw !== W || nh !== H) {
    W = nw; H = nh;
    canvas.width = W; canvas.height = H;
  }
  if (W > 0 && H > 0 && typeof draw === 'function') {
    const t = (performance.now() - startTime) / 1000;
    const vals = {};
    for (const [k, c] of Object.entries(_controls)) vals[k] = c.value;
    try { draw(ctx, W, H, t, vals); } catch(e) {}
  }
  requestAnimationFrame(animate);
}
animate();
</script></body></html>`
}

interface WhiteboardLayerProps {
  canvasWidth: number
  canvasHeight: number
}

/**
 * DraftingOverlay — renders the drafting SVG overlay as an <img> data URI.
 */
const DraftingOverlay = memo(function DraftingOverlay({ canvasWidth, canvasHeight }: WhiteboardLayerProps) {
  const draftingConfig = useWhiteboardStore((s) => s.config.draftingConfig)

  const dataUri = useMemo(() => {
    const cfg = draftingConfig ?? createDefaultDraftingConfig()
    const inner = generateDraftingSvgOverlay(canvasWidth, canvasHeight, cfg)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${inner}</svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [canvasWidth, canvasHeight, draftingConfig])

  return (
    <img
      src={dataUri}
      alt=""
      style={{
        position: 'absolute',
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'none',
      }}
      draggable={false}
    />
  )
})

/**
 * WhiteboardBackground — always-visible canvas background layer.
 * Renders preset color, image, video, or code backgrounds independently
 * of the whiteboard enabled toggle.
 */
export const WhiteboardBackground = memo(function WhiteboardBackground({
  canvasWidth,
  canvasHeight,
}: WhiteboardLayerProps) {
  const config = useWhiteboardStore((s) => s.config)
  const codeIframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const codeSrcdoc = useMemo(() => {
    if (config.backgroundType === 'code' && config.backgroundCode) {
      return buildCodeBackgroundSrcdoc(config.backgroundCode)
    }
    return ''
  }, [config.backgroundType, config.backgroundCode])

  // Send control values to code iframe when they change
  useEffect(() => {
    if (config.backgroundType !== 'code' || !codeIframeRef.current?.contentWindow) return
    const values: Record<string, string | number | boolean> = {}
    for (const ctrl of config.backgroundCodeControls ?? []) {
      values[ctrl.id] = ctrl.value
    }
    codeIframeRef.current.contentWindow.postMessage({ type: 'CONFIG_UPDATE', values }, '*')
  }, [config.backgroundType, config.backgroundCodeControls])

  // Sync video to timeline frame
  useEffect(() => {
    if (config.backgroundType !== 'video' || !videoRef.current) return
    let rafId: number
    let lastFrame = -1
    const fps = 30
    const sync = () => {
      const frame = useTimelineStore.getState().currentFrame
      if (frame !== lastFrame && videoRef.current) {
        lastFrame = frame
        videoRef.current.currentTime = frame / fps
      }
      rafId = requestAnimationFrame(sync)
    }
    rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [config.backgroundType])

  const bgColor = config.backgroundColor
  const bgType = config.backgroundType ?? 'preset'

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* ── Preset background (solid color or gradient + optional drafting overlay) ── */}
      {bgType === 'preset' && bgColor && bgColor !== 'transparent' && (
        <div
          style={{
            position: 'absolute',
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: bgColor,
            background: config.backgroundStyle?.startsWith('gradient-') ? config.backgroundGradient : bgColor,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Drafting overlay ──────────────────────────────────── */}
      {bgType === 'preset' && config.backgroundStyle === 'drafting' && (
        <DraftingOverlay canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      )}

      {/* ── Image background ────────────────────────────────── */}
      {bgType === 'image' && config.backgroundImageUrl && (
        <img
          src={config.backgroundImageUrl}
          alt=""
          style={{
            position: 'absolute',
            width: canvasWidth,
            height: canvasHeight,
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {/* ── Video background ────────────────────────────────── */}
      {bgType === 'video' && config.backgroundVideoUrl && (
        <video
          ref={videoRef}
          src={config.backgroundVideoUrl}
          muted
          playsInline
          style={{
            position: 'absolute',
            width: canvasWidth,
            height: canvasHeight,
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Code background (sandboxed iframe) ──────────────── */}
      {bgType === 'code' && codeSrcdoc && (
        <iframe
          ref={codeIframeRef}
          srcDoc={codeSrcdoc}
          sandbox="allow-scripts"
          style={{
            position: 'absolute',
            width: canvasWidth,
            height: canvasHeight,
            border: 'none',
            pointerEvents: 'none',
          }}
          title="Code background"
        />
      )}
    </div>
  )
})

/**
 * WhiteboardLayer — strokes + hand overlay, only rendered when enabled.
 */
export const WhiteboardLayer = memo(function WhiteboardLayer({ canvasWidth, canvasHeight }: WhiteboardLayerProps) {
  const enabled = useWhiteboardStore((s) => s.enabled)
  const strokes = useWhiteboardStore((s) => s.config.strokes)
  const config = useWhiteboardStore((s) => s.config)
  const imgRef = useRef<HTMLImageElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const prevMarkupRef = useRef('')

  // Render current frame whenever config/strokes/enabled change
  useEffect(() => {
    if (!enabled) return

    let rafId: number
    let lastFrame = -1

    const render = () => {
      const frame = useTimelineStore.getState().currentFrame

      if (frame !== lastFrame || lastFrame === -1) {
        lastFrame = frame

        const state = computeWhiteboardFrame(config, frame, canvasWidth, canvasHeight)

        if (state.svgMarkup !== prevMarkupRef.current && imgRef.current) {
          prevMarkupRef.current = state.svgMarkup
          const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(state.svgMarkup)}`
          imgRef.current.src = dataUri
        }

        if (handRef.current) {
          if (state.handPosition && config.showHand && config.handType !== 'none') {
            const handSvg = getHandOverlaySVG(config.handType, state.handPosition, config.handScale)
            const handFullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">${handSvg}</svg>`
            const handUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(handFullSvg)}`
            handRef.current.style.display = 'block'
            handRef.current.style.backgroundImage = `url("${handUri}")`
          } else {
            handRef.current.style.display = 'none'
          }
        }
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [enabled, config, strokes, canvasWidth, canvasHeight])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Whiteboard strokes SVG */}
      <img
        ref={imgRef}
        alt=""
        style={{
          position: 'absolute',
          width: canvasWidth,
          height: canvasHeight,
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* Hand overlay */}
      <div
        ref={handRef}
        style={{
          position: 'absolute',
          width: canvasWidth,
          height: canvasHeight,
          pointerEvents: 'none',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          display: 'none',
        }}
      />
    </div>
  )
})
