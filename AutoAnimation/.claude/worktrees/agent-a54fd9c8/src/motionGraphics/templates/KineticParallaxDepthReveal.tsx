import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParallaxDepthRevealConfig extends KineticBaseConfig {
  depthLayers: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Distant depth layers shift slowly
    const layer1X = Math.sin(t * 0.15) * 12
    const layer2X = Math.sin(t * 0.22 + 0.8) * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Far layer: subtle horizontal bands */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${layer1X}px)`,
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 60px,
              rgba(150,170,200,0.025) 60px,
              rgba(150,170,200,0.025) 61px
            )`,
          }}
        />
        {/* Mid layer: vertical depth guides */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${layer2X}px)`,
            background: `repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 80px,
              rgba(120,150,190,0.02) 80px,
              rgba(120,150,190,0.02) 81px
            )`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__parallaxDepthConfig ?? { depthLayers: 4 }
    const depthLayers = cfg.depthLayers ?? 4

    // Parallax depth shift: multiple depth copies of the word shift by different amounts
    // then converge to the sharp foreground word — simulating a depth-of-field shift

    // The foreground/true text
    let foregroundX = 0
    let textOpacity = 0
    let textBlur = 0
    let textScale = 1

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      // Text arrives from slightly left, parallax layers from right
      foregroundX = (1 - ep) * -width * 0.08
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.05) / 0.95))
      textBlur = (1 - ep) * 3
      textScale = 0.92 + ep * 0.08
    } else if (phase === 'hold') {
      // Gentle parallax drift during hold
      foregroundX = Math.sin(t * 0.6) * 3
      textOpacity = 1
      textBlur = 0
      textScale = 1 + Math.sin(t * 0.8) * 0.005
    } else {
      const ep = easeInQuad(exitProgress)
      foregroundX = ep * width * 0.08
      textOpacity = 1 - ep
      textBlur = ep * 3
    }

    // Depth layers: behind/before foreground word, each shifted by depth factor
    const depthElements: React.ReactNode[] = []
    for (let l = 0; l < depthLayers; l++) {
      const layerNorm = (l + 1) / (depthLayers + 1)  // 0 = far, 1 = close
      const depthFactor = (1 - layerNorm) * 2  // farther layers shift more

      let layerX = 0
      let layerOpacity = 0
      let layerBlur = 0
      let layerScale = 1

      if (phase === 'enter') {
        const ep = easeOutExpo(Math.max(0, (enterProgress - l * 0.06) / 0.8))
        layerX = (1 - ep) * width * 0.08 * depthFactor + foregroundX * 0.5
        layerOpacity = ep * (0.08 - layerNorm * 0.06)
        layerBlur = (1 - ep) * 4 + depthFactor * 2
        layerScale = 1 - (1 - layerNorm) * 0.04
      } else if (phase === 'hold') {
        layerX = Math.sin(t * 0.6 + l * 0.3) * (3 + depthFactor * 4) + foregroundX
        layerOpacity = 0.05 - layerNorm * 0.04
        layerBlur = depthFactor * 2 + 1
        layerScale = 1 - depthFactor * 0.02
      } else {
        const ep = easeInQuad(exitProgress)
        layerX = ep * width * 0.08 * depthFactor
        layerOpacity = (0.08 - layerNorm * 0.06) * (1 - ep)
        layerBlur = ep * 4 + depthFactor * 2
      }

      if (layerOpacity < 0.005) continue

      depthElements.push(
        <div
          key={l}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${layerX}px), -50%) scale(${layerScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: layerOpacity,
            filter: `blur(${layerBlur}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>,
      )
    }

    // Depth haze: atmospheric perspective gradient
    const hazeAlpha = Math.max(0, (1 - easeOutExpo(enterProgress)) * 0.15)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Depth haze */}
        {hazeAlpha > 0.005 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, rgba(100,140,200,${hazeAlpha}), transparent 30%, transparent 70%, rgba(100,140,200,${hazeAlpha}))`,
            }}
          />
        )}

        {/* Background depth copies */}
        {depthElements}

        {/* Foreground word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${foregroundX}px), -50%) scale(${textScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: textBlur > 0.1 ? `blur(${textBlur}px)` : 'none',
            textShadow: `0 0 20px ${color}30`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ParallaxDepthRevealComponent(props: MotionGraphicProps<ParallaxDepthRevealConfig>) {
  ;(globalThis as any).__parallaxDepthConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-parallax-depth-reveal',
  title: 'Kinetic Parallax Depth Reveal',
  description: 'Multiple depth copies of text arrive from different lateral offsets with atmospheric blur, converging into a sharp foreground word',
  tags: ['kinetic', 'typography', 'parallax', 'depth', '3d', 'dimensional', 'blur', 'reveal', 'perspective'],
  category: 'captions',
  component: ParallaxDepthRevealComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'LAYER', 'FOCUS', 'SHARP'],
    colors: ['#E0ECFF', '#C4D8FF', '#F0F6FF', '#B8CCFF'],
    bgColor: '#080c16',
    cycleDuration: 1.4,
    depthLayers: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPTH', 'LAYER', 'FOCUS', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0ECFF', '#C4D8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c16', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'depthLayers', label: 'Depth Layers', type: 'number', defaultValue: 4, min: 1, max: 8, group: 'Animation' },
  ],
})
