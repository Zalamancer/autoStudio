import { useRef, useEffect, useState } from 'react'
import { useFrame, useComposition } from '@/engine'
import { computeTemplateDimensions } from '@/stores/useHTMLTemplateLayerStore'
import type { HTMLTemplateExportData } from './types'

interface RemotionHTMLTemplateLayerProps {
  htmlTemplates: HTMLTemplateExportData[]
  canvasWidth: number
  canvasHeight: number
}

export function RemotionHTMLTemplateLayer({
  htmlTemplates,
  canvasWidth,
  canvasHeight,
}: RemotionHTMLTemplateLayerProps) {
  if (!htmlTemplates || htmlTemplates.length === 0) return null

  return (
    <>
      {htmlTemplates.map((template) => (
        <RemotionHTMLTemplate
          key={template.id}
          template={template}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  )
}

function RemotionHTMLTemplate({
  template,
  canvasWidth,
  canvasHeight,
}: {
  template: HTMLTemplateExportData
  canvasWidth: number
  canvasHeight: number
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeReady, setIframeReady] = useState(false)
  const currentFrame = useFrame()
  const { fps, durationInFrames } = useComposition()

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TEMPLATE_READY') setIframeReady(true)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Send initial config to the iframe when it signals ready
  useEffect(() => {
    if (!iframeReady || template.customConfig.length === 0) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const values: Record<string, unknown> = {}
    for (const prop of template.customConfig) {
      values[prop.key] = prop.value
    }
    iframe.contentWindow.postMessage({ type: 'CONFIG_BULK_UPDATE', values }, '*')
  }, [iframeReady, template.customConfig])

  // Send FRAME_UPDATE for frame-synced templates
  useEffect(() => {
    if (!iframeReady || !template.frameSync) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      {
        type: 'FRAME_UPDATE',
        currentFrame,
        isPlaying: true,
        fps,
        totalFrames: durationInFrames,
      },
      '*',
    )
  }, [currentFrame, iframeReady, template.frameSync, fps, durationInFrames])

  // Frame-range visibility — after all hooks
  if (currentFrame < template.startFrame || currentFrame >= template.endFrame) return null

  const dims = computeTemplateDimensions(
    template.templateAspectRatio,
    canvasWidth,
    canvasHeight,
    template.scale,
  )

  return (
    <div
      style={{
        position: 'absolute',
        left: template.position.x,
        top: template.position.y,
        width: dims.displayWidth,
        height: dims.displayHeight,
        opacity: template.opacity,
        zIndex: template.zIndex,
        transform: template.rotation !== 0 ? `rotate(${template.rotation}deg)` : undefined,
        overflow: 'hidden',
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={template.htmlContent}
        sandbox="allow-scripts"
        title={template.name}
        style={{
          width: dims.nativeWidth,
          height: dims.nativeHeight,
          border: 'none',
          display: 'block',
          transformOrigin: 'top left',
          transform: dims.iframeScale !== 1 ? `scale(${dims.iframeScale})` : undefined,
        }}
      />
    </div>
  )
}
