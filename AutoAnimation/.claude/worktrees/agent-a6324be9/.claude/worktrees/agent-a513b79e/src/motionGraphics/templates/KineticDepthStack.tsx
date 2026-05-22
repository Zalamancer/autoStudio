import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DepthStackConfig extends KineticBaseConfig {
  depthLayers: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const layerCount = 8
    const maxDepthOffset = 12  // px per layer
    const maxShadowLength = layerCount * maxDepthOffset

    // Effect: letters appear as flat, then depth layers extrude beneath them
    // giving a 3D stacked/extruded effect that builds from thin to thick

    let depthProgress = 0  // how many depth layers are visible (0..1)
    let topLayerOpacity = 0
    let topScale = 1
    let depthShift = 0

    if (phase === 'enter') {
      // Top layer slams in first (0-40%)
      topLayerOpacity = Math.min(1, easeOutExpo(Math.min(1, enterProgress / 0.35)) * 1.5)
      topScale = easeOutBack(Math.min(1, enterProgress / 0.4))
      topScale = Math.max(0.3, topScale)
      // Then depth extrudes (30-100%)
      depthProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.7)))
      depthShift = (1 - depthProgress) * 15
    } else if (phase === 'hold') {
      topLayerOpacity = 1
      topScale = 1
      depthProgress = 1
      // Subtle depth breathing — layers pulse in/out slightly
      depthShift = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      // Retract depth layers first, then top layer fades
      depthProgress = 1 - easeInCubic(Math.min(1, exitProgress * 1.5))
      topLayerOpacity = 1 - easeInCubic(Math.max(0, (exitProgress - 0.4) / 0.6))
      topScale = 1
    }

    const visibleLayers = Math.round(depthProgress * layerCount)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Depth shadow layers — built bottom to top */}
        {Array.from({ length: visibleLayers }, (_, li) => {
          const depthLayer = visibleLayers - li  // deepest first
          const layerProgress = Math.min(1, (depthProgress * layerCount - depthLayer + 1))
          const offset = depthLayer * maxDepthOffset / layerCount
          // Darken progressively with depth
          const darkness = 0.3 + (depthLayer / layerCount) * 0.6
          const alpha = Math.round((1 - darkness) * 255).toString(16).padStart(2, '0')

          return (
            <div
              key={li}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${offset * layerProgress + depthShift * 0.5}px), calc(-50% + ${offset * layerProgress * 0.5 + depthShift * 0.3}px))`,
                opacity: layerProgress,
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color: `${color}${alpha}`,
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: 3,
                }}
              >
                {word}
              </span>
            </div>
          )
        })}

        {/* Top/foreground layer */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${topScale}) translateX(${depthShift * -0.2}px)`,
            transformOrigin: 'center center',
            opacity: topLayerOpacity,
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
              letterSpacing: 3,
              textShadow: `0 0 30px ${color}40`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function DepthStackComponent(props: MotionGraphicProps<DepthStackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-depth-stack',
  title: 'Kinetic Depth Stack',
  description: 'Text appears flat first then extruded depth layers build beneath it — creating a 3D stacked typographic structure that grows from paper-thin to fully volumetric.',
  tags: ['kinetic', 'typography', 'depth', 'stack', '3d', 'extrude', 'layer', 'build', 'shadow', 'volumetric'],
  category: 'captions',
  component: DepthStackComponent as any,
  defaultConfig: {
    words: ['DEEP', 'THICK', 'BOLD', 'SOLID'],
    colors: ['#FF4757', '#FFA502', '#2ED573', '#1E90FF'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.7,
    depthLayers: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEEP', 'THICK', 'BOLD', 'SOLID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4757', '#FFA502', '#2ED573', '#1E90FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.5, max: 5, group: 'Timing' },
    { key: 'depthLayers', label: 'Depth Layers', type: 'number', defaultValue: 8, min: 3, max: 16, group: 'Animation' },
  ],
})
