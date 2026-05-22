import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScreenPrintBuildConfig extends KineticBaseConfig {
  layerCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Screen print colors — typically 3-4 spot colors
const SCREEN_LAYERS = [
  { offsetX: 8, offsetY: 6, opacity: 0.55, blendMode: 'multiply' as const, hueShift: 40 },
  { offsetX: -5, offsetY: 8, opacity: 0.5, blendMode: 'multiply' as const, hueShift: -30 },
  { offsetX: 4, offsetY: -6, opacity: 0.45, blendMode: 'multiply' as const, hueShift: 60 },
  { offsetX: 0, offsetY: 0, opacity: 1, blendMode: 'normal' as const, hueShift: 0 },  // final layer
]

function hueRotate(color: string, deg: number): string {
  // Simple hue rotation — approximate by returning a shifted color
  // For simplicity, we use CSS filter on the element
  return color
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Paper texture dots — halftone feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '6px 6px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Layers print one by one — each subsequent layer narrows offset
    // giving the "one squeegee pass at a time" screen print feel

    let globalOpacity = 1

    if (phase === 'enter') {
      globalOpacity = Math.min(1, enterProgress * 1.5)
    } else if (phase === 'exit') {
      globalOpacity = 1 - easeInCubic(exitProgress)
    }

    const totalLayers = SCREEN_LAYERS.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          opacity: globalOpacity,
        }}
      >
        {SCREEN_LAYERS.map((layer, li) => {
          // Each layer stamps in staggered
          const layerDelay = (li / totalLayers) * 0.6
          const isTopLayer = li === totalLayers - 1

          let layerP = 0
          let layerOpacity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - layerDelay) / (1 - layerDelay)))
            // Stamp in effect — snap from above
            layerP = easeOutExpo(p)
            layerOpacity = Math.min(1, p * 4)
          } else if (phase === 'hold') {
            layerP = 1
            layerOpacity = layer.opacity
            // Top layer subtle breathe
            if (isTopLayer) {
              layerOpacity = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.05
            }
          } else {
            layerP = 1
            layerOpacity = layer.opacity * (1 - easeInCubic(exitProgress))
          }

          // Stamp from above — translateY animates in
          const stampY = (1 - layerP) * -60

          // Slightly misregistered offset persists but reduces
          const regProgress = isTopLayer ? 1 : Math.min(1, layerP * 1.5)
          const offsetX = layer.offsetX * (1 - regProgress * 0.7)
          const offsetY = layer.offsetY * (1 - regProgress * 0.7)

          return (
            <div
              key={li}
              style={{
                position: li === 0 ? 'relative' : 'absolute',
                top: li === 0 ? undefined : '50%',
                left: li === 0 ? undefined : '50%',
                transform: li === 0
                  ? `translate(${offsetX}px, ${offsetY + stampY}px)`
                  : `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + stampY}px))`,
                opacity: layerOpacity,
                mixBlendMode: layer.blendMode,
                filter: layer.hueShift !== 0 ? `hue-rotate(${layer.hueShift}deg)` : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: 2,
                  // Ink bleed on offset layers
                  filter: !isTopLayer
                    ? `blur(${(1 - Math.min(1, layerP)) * 1}px)`
                    : undefined,
                }}
              >
                {word}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function ScreenPrintBuildComponent(props: MotionGraphicProps<ScreenPrintBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-screen-print-build',
  title: 'Kinetic Screen Print Build',
  description: 'Three color layers stamp in one by one like a screen printing press — each layer slightly misregistered with a different hue, until the final layer snaps into perfect alignment.',
  tags: ['kinetic', 'typography', 'screen', 'print', 'layer', 'stamp', 'misregistration', 'offset', 'build', 'ink'],
  category: 'captions',
  component: ScreenPrintBuildComponent as any,
  defaultConfig: {
    words: ['PRINT', 'LAYER', 'STAMP', 'PRESS'],
    colors: ['#E8320A', '#1A1A1A', '#FF6B00', '#2D0A00'],
    bgColor: '#F2EFE8',
    cycleDuration: 1.8,
    layerCount: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'LAYER', 'STAMP', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8320A', '#1A1A1A', '#FF6B00', '#2D0A00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2EFE8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'layerCount', label: 'Layer Count', type: 'number', defaultValue: 4, min: 2, max: 6, group: 'Animation' },
  ],
})
