import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FogDefogRevealConfig extends KineticBaseConfig {
  fogLayers: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Drifting fog wisps in background
    const wispCount = 6
    const wisps: React.ReactNode[] = []
    for (let w = 0; w < wispCount; w++) {
      const wx = ((t * (3 + w * 0.7) + w * 150) % (width + 200)) - 100
      const wy = height * (0.15 + (w / wispCount) * 0.7) + Math.sin(t * 0.4 + w) * 20
      const wW = 120 + rand(w * 41) * 180
      const wH = 40 + rand(w * 67) * 60
      const wAlpha = 0.04 + rand(w * 53) * 0.04

      wisps.push(
        <div
          key={w}
          style={{
            position: 'absolute',
            left: wx,
            top: wy,
            width: wW,
            height: wH,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(200,220,240,${wAlpha}), transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {wisps}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__fogDefogConfig ?? { fogLayers: 5 }
    const fogLayers = cfg.fogLayers ?? 5

    // Three-zone defog reveal: a circular clear zone expands from center
    // while fog drifts away on both sides

    let clearRadius = 0    // 0 = fully fogged, 1 = clear
    let fogDriftX = 0      // fog panels drift horizontally
    let textBlur = 0
    let textOpacity = 0
    let fogOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      clearRadius = ep
      // Fog splits and drifts to left/right
      fogDriftX = ep * width * 0.6
      textBlur = (1 - ep) * 8
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.08) / 0.92))
      fogOpacity = 1 - ep
    } else if (phase === 'hold') {
      clearRadius = 1
      fogDriftX = width * 0.6
      textBlur = 0.5 + Math.sin(t * 1.2) * 0.3
      textOpacity = 1
      fogOpacity = 0
    } else {
      // Fog rolls back in from sides
      const ep = easeInCubic(exitProgress)
      clearRadius = 1 - ep
      fogDriftX = width * 0.6 * (1 - ep)
      textBlur = ep * 8
      textOpacity = 1 - ep
      fogOpacity = ep
    }

    // Fog layers: left panel, right panel, center haze
    const fogElements: React.ReactNode[] = []

    // Left fog bank
    fogElements.push(
      <div
        key="fogL"
        style={{
          position: 'absolute',
          top: 0,
          left: -fogDriftX,
          width: width * 0.6,
          height: '100%',
          background: `linear-gradient(90deg,
            rgba(200,215,235,${0.6 * (1 - fogDriftX / (width * 0.6))}),
            rgba(180,200,225,${0.5 * (1 - fogDriftX / (width * 0.6))}) 50%,
            transparent
          )`,
          filter: 'blur(20px)',
          opacity: Math.max(0, fogOpacity + (1 - fogOpacity) * Math.max(0, 1 - fogDriftX / (width * 0.6))),
        }}
      />,
    )

    // Right fog bank
    fogElements.push(
      <div
        key="fogR"
        style={{
          position: 'absolute',
          top: 0,
          right: -fogDriftX,
          width: width * 0.6,
          height: '100%',
          background: `linear-gradient(270deg,
            rgba(200,215,235,${0.6 * (1 - fogDriftX / (width * 0.6))}),
            rgba(180,200,225,${0.5 * (1 - fogDriftX / (width * 0.6))}) 50%,
            transparent
          )`,
          filter: 'blur(20px)',
          opacity: Math.max(0, fogOpacity + (1 - fogOpacity) * Math.max(0, 1 - fogDriftX / (width * 0.6))),
        }}
      />,
    )

    // Multiple fog depth layers
    for (let l = 0; l < fogLayers; l++) {
      const layerOffset = (l / fogLayers - 0.5) * height * 0.8
      const layerAlpha = (0.08 + rand(l * 41 + index) * 0.08) * (1 - clearRadius)
      const layerDrift = (Math.sin(t * 0.3 + l * 1.2) * 0.5 + 0.5) * 20 - 10
      const layerW = width * (0.5 + rand(l * 53 + index) * 0.5)

      fogElements.push(
        <div
          key={`fl${l}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: height * 0.5 + layerOffset + layerDrift,
            width: layerW,
            height: 80 + rand(l * 67 + index) * 60,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(210,225,245,${layerAlpha}), transparent 70%)`,
            filter: 'blur(25px)',
          }}
        />,
      )
    }

    // Per-character reveal with fog edge shimmer
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      const distFromCenter = Math.abs(charNorm - 0.5) * 2
      const charClearness = Math.max(0, clearRadius - distFromCenter * 0.3)
      const charBlur = textBlur * (0.5 + distFromCenter * 0.5) * Math.max(0, 1 - charClearness)
      const charOpacity = textOpacity * (0.4 + charClearness * 0.6)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: charBlur > 0.1 ? `blur(${charBlur}px)` : 'none',
            textShadow:
              charClearness > 0.7
                ? `0 0 15px ${color}60, 0 0 5px rgba(200,225,255,0.3)`
                : 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {/* Fog layers on top */}
        {fogElements}
      </div>
    )
  },
}

function FogDefogRevealComponent(props: MotionGraphicProps<FogDefogRevealConfig>) {
  ;(globalThis as any).__fogDefogConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fog-defog-reveal',
  title: 'Kinetic Fog Defog Reveal',
  description: 'Dense fog banks split from center and drift outward to reveal text, with layered depth haze and per-character blur-to-sharp transitions',
  tags: ['kinetic', 'typography', 'fog', 'mist', 'defog', 'reveal', 'overlay', 'atmospheric', 'blur'],
  category: 'captions',
  component: FogDefogRevealComponent as any,
  defaultConfig: {
    words: ['EMERGE', 'APPEAR', 'CLEAR', 'RISE'],
    colors: ['#E8F4FF', '#D0E8FF', '#F0F8FF', '#C0DEFF'],
    bgColor: '#080e18',
    cycleDuration: 1.6,
    fogLayers: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EMERGE', 'APPEAR', 'CLEAR', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8F4FF', '#D0E8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080e18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'fogLayers', label: 'Fog Layers', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Animation' },
  ],
})
