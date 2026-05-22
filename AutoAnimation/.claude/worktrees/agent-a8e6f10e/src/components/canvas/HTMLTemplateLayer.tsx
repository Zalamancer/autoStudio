import { useRef, useCallback, useEffect, useState, useMemo, memo } from 'react'
import {
  useHTMLTemplateLayerStore,
  computeTemplateDimensions,
  type CanvasHTMLTemplate,
} from '@/stores/useHTMLTemplateLayerStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import { bakeConfigIntoHtml } from '@/services/templateBridge'

interface HTMLTemplateLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function HTMLTemplateLayer({
  canvasWidth,
  canvasHeight,
}: HTMLTemplateLayerProps) {
  const templates = useHTMLTemplateLayerStore((s) => s.templates)
  // REMOVED: currentFrame subscription — visibility is now handled per-child via useFrameVisibility

  // Filter only by static `visible` flag — frame-range visibility handled per-child via RAF
  const visibleTemplates = templates.filter((t) => t.visible)

  if (visibleTemplates.length === 0) return null

  return (
    <>
      {visibleTemplates.map((template) => (
        <HTMLTemplateElement
          key={template.id}
          template={template}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  )
}

interface HTMLTemplateElementProps {
  template: CanvasHTMLTemplate
  canvasWidth: number
  canvasHeight: number
}

const HTMLTemplateElement = memo(function HTMLTemplateElement({
  template,
  canvasWidth,
  canvasHeight,
}: HTMLTemplateElementProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeReady, setIframeReady] = useState(false)

  const selectedTemplateId = useHTMLTemplateLayerStore(
    (s) => s.selectedTemplateId
  )
  const setSelectedTemplateId = useHTMLTemplateLayerStore(
    (s) => s.setSelectedTemplateId
  )
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  const isSelected = selectedTemplateId === template.id

  // Zero-re-render frame-range visibility (RAF + CSS display toggle)
  useFrameVisibility(targetRef, template.startFrame, template.endFrame)

  // ── Rebuild srcDoc with updated CONFIG values baked in ──
  // Kinetic typography templates read CONFIG once during init and never check
  // again, so postMessage updates have no effect. Baking values into HTML and
  // letting the iframe reload with new srcDoc ensures the template re-inits.
  const patchedHtml = useMemo(() => {
    if (template.customConfig.length === 0) return template.htmlContent
    return bakeConfigIntoHtml(template.htmlContent, template.customConfig)
  }, [template.htmlContent, template.customConfig])

  // ── Listen for TEMPLATE_READY from the injected bridge ──
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TEMPLATE_READY') {
        // Only mark ready if the message came from this template's iframe
        if (iframeRef.current?.contentWindow && e.source === iframeRef.current.contentWindow) {
          setIframeReady(true)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Reset iframeReady when srcDoc changes so we wait for TEMPLATE_READY again
  const prevHtmlRef = useRef(patchedHtml)
  useEffect(() => {
    if (prevHtmlRef.current !== patchedHtml) {
      prevHtmlRef.current = patchedHtml
      setIframeReady(false)
    }
  }, [patchedHtml])

  // ── Send config updates to iframe via postMessage (for templates with DOM bindings) ──
  useEffect(() => {
    if (!iframeReady) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    if (template.customConfig.length === 0) return

    // Build values map from current customConfig
    const values: Record<string, unknown> = {}
    for (const prop of template.customConfig) {
      values[prop.key] = prop.value
    }
    iframe.contentWindow.postMessage(
      { type: 'CONFIG_BULK_UPDATE', values },
      '*'
    )
  }, [iframeReady, template.customConfig])

  // ── Send FRAME_UPDATE to frame-synced templates via RAF (no React subscription) ──
  useEffect(() => {
    if (!template.frameSync || !iframeReady) return
    let rafId: number
    let lastSentFrame = -1

    const syncFrame = () => {
      const state = useTimelineStore.getState()
      const iframe = iframeRef.current
      if (iframe?.contentWindow && state.currentFrame !== lastSentFrame) {
        lastSentFrame = state.currentFrame
        iframe.contentWindow.postMessage({
          type: 'FRAME_UPDATE',
          currentFrame: state.currentFrame,
          isPlaying: state.isPlaying,
          fps: state.fps,
          totalFrames: state.totalFrames,
        }, '*')
      }
      rafId = requestAnimationFrame(syncFrame)
    }

    rafId = requestAnimationFrame(syncFrame)
    return () => cancelAnimationFrame(rafId)
  }, [template.frameSync, iframeReady])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedTemplateId(template.id)
      setRightPanelTab('html-template-properties')
    },
    [template.id, setSelectedTemplateId, setRightPanelTab]
  )

  // ── Live transform feedback during drag/resize ──
  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      // Compute unscaled (scale=1) fitted width as the reference baseline
      const baseDims = computeTemplateDimensions(
        template.templateAspectRatio,
        canvasWidth,
        canvasHeight,
        1,
      )
      const newScale = Math.max(0.01, values.width / baseDims.displayWidth)
      setLiveTransform({
        type: 'html-template',
        id: template.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: newScale,
      })
    },
    [template.templateAspectRatio, canvasWidth, canvasHeight, template.id, setLiveTransform]
  )

  // ── Commit final transform ──
  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || template.position.x
      const finalTop = parseFloat(el.style.top) || template.position.y

      // Compute scale from the final width relative to the unscaled baseline
      const baseDims = computeTemplateDimensions(
        template.templateAspectRatio,
        canvasWidth,
        canvasHeight,
        1,
      )
      const newScale = Math.max(0.01, state.width / baseDims.displayWidth)

      updateTemplate(template.id, {
        position: { x: finalLeft, y: finalTop },
        rotation: Math.round(state.rotate),
        scale: newScale,
      })
    },
    [template.id, template.templateAspectRatio, template.position.x, template.position.y,
     canvasWidth, canvasHeight, updateTemplate, clearLiveTransform]
  )

  const dims = computeTemplateDimensions(
    template.templateAspectRatio,
    canvasWidth,
    canvasHeight,
    template.scale,
  )

  return (
    <>
      <div
        ref={targetRef}
        data-canvas-element="template"
        style={{
          position: 'absolute',
          left: template.position.x,
          top: template.position.y,
          width: dims.displayWidth,
          height: dims.displayHeight,
          opacity: template.opacity,
          zIndex: template.zIndex,
          transform: template.rotation !== 0
            ? `rotate(${template.rotation}deg)`
            : undefined,
          overflow: 'hidden',
          cursor: 'move',
        }}
        onClick={handleClick}
      >
        {/* Transparent click interceptor above the iframe */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        />
        <iframe
          ref={iframeRef}
          srcDoc={patchedHtml}
          sandbox="allow-scripts"
          title={template.name}
          style={{
            width: dims.nativeWidth,
            height: dims.nativeHeight,
            border: 'none',
            pointerEvents: 'none',
            display: 'block',
            transformOrigin: 'top left',
            transform: dims.iframeScale !== 1
              ? `scale(${dims.iframeScale})`
              : undefined,
          }}
        />
      </div>

      {/* Moveable control box — only shown when selected */}
      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={true}
          color="#3b82f6"
        />
      )}
    </>
  )
})
