import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DoubleExposureBuildConfig extends KineticBaseConfig {
  exposureCount: number
  offsetAmount: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Blend mode layers for photographic double exposure feel
const EXPOSURE_LAYERS = [
  { blend: 'screen' as const, offsetX: -18, offsetY: -8, opacity: 0.45, colorMod: 0.6, delay: 0 },
  { blend: 'multiply' as const, offsetX: 12, offsetY: 14, opacity: 0.5, colorMod: 0.7, delay: 0.12 },
  { blend: 'overlay' as const, offsetX: -6, offsetY: 20, opacity: 0.4, colorMod: 0.85, delay: 0.24 },
  { blend: 'normal' as const, offsetX: 0, offsetY: 0, opacity: 1, colorMod: 1, delay: 0.36 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Film negative grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let blendP = 0
    let separateP = 0

    if (phase === 'enter') {
      blendP = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      blendP = 1
    } else {
      blendP = 1
      separateP = easeInCubic(exitProgress)
    }

    const layers = EXPOSURE_LAYERS.map((layer, li) => {
      const layerDelay = layer.delay
      const layerP = Math.max(0, Math.min(1, (blendP - layerDelay) / (1 - layerDelay + 0.01)))
      const easedLayer = li < EXPOSURE_LAYERS.length - 1 ? easeOutBack(layerP) : easeOutCubic(layerP)

      // Offset converges to 0 as layers blend into single image
      const currentOffsetX = layer.offsetX * (1 - easedLayer) + layer.offsetX * separateP
      const currentOffsetY = layer.offsetY * (1 - easedLayer) + layer.offsetY * separateP

      // Opacity: layers fade in, then final layer at full
      const currentOpacity =
        li === EXPOSURE_LAYERS.length - 1
          ? easedLayer * (1 - separateP)
          : layer.opacity * easedLayer * (1 - separateP * 0.8)

      if (currentOpacity <= 0.01) return null

      return (
        <div
          key={li}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${currentOffsetX}px), calc(-50% + ${currentOffsetY}px))`,
            mixBlendMode: layer.blend,
            opacity: Math.max(0, currentOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 700,
              color: li === EXPOSURE_LAYERS.length - 1 ? color : `rgba(255,255,255,${layer.colorMod})`,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      )
    })

    // Aperture control indicator (photographic touch)
    const shutterVisible = phase === 'enter' && blendP < 0.6
    const shutterOpacity = Math.max(0, shutterVisible ? (1 - blendP / 0.6) * 0.5 : 0)

    return (
      <>
        {layers}
        {/* Camera shutter circle closing */}
        {shutterOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${(1 - blendP) * width * 0.8}px`,
              height: `${(1 - blendP) * height * 0.8}px`,
              borderRadius: '50%',
              border: `2px solid rgba(255,255,255,0.3)`,
              opacity: shutterOpacity,
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    )
  },
}

function DoubleExposureBuildComponent(props: MotionGraphicProps<DoubleExposureBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-double-exposure-build',
  title: 'Kinetic Double Exposure Build',
  description:
    'Multiple photographic exposures of the text appear offset and staggered — screen, multiply, overlay blend modes converge together into a single sharp image with a cinematic photography feel.',
  tags: ['kinetic', 'typography', 'double', 'exposure', 'blend', 'layer', 'photo', 'film', 'composite', 'assembly'],
  category: 'captions',
  component: DoubleExposureBuildComponent as any,
  defaultConfig: {
    words: ['EXPOSE', 'BLEND', 'LAYER', 'LIGHT'],
    colors: ['#FFFFFF', '#F5F0E8', '#E8E0D0', '#FFFAF0'],
    bgColor: '#0C0C0C',
    cycleDuration: 2.0,
    exposureCount: 4,
    offsetAmount: 18,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['EXPOSE', 'BLEND', 'LAYER', 'LIGHT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F5F0E8', '#E8E0D0', '#FFFAF0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C0C', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'exposureCount',
      label: 'Exposure Count',
      type: 'number',
      defaultValue: 4,
      min: 2,
      max: 6,
      group: 'Animation',
    },
    {
      key: 'offsetAmount',
      label: 'Offset Amount (px)',
      type: 'number',
      defaultValue: 18,
      min: 5,
      max: 60,
      group: 'Animation',
    },
  ],
})
