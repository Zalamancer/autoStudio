import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmokeRiseRevealConfig extends KineticBaseConfig {
  smokeDensity: number
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
    // Slow-rising ambient smoke wisps in background
    const wispCount = 5
    const wisps: React.ReactNode[] = []
    for (let w = 0; w < wispCount; w++) {
      const cycleT = (t * (0.4 + w * 0.1) + w * 0.7) % 1
      const wx = width * (0.1 + rand(w * 31) * 0.8)
      const wy = height * (1.1 - cycleT * 1.4)
      const wAlpha = Math.min(cycleT * 4, 1) * Math.min((1 - cycleT) * 3, 1) * 0.07
      wisps.push(
        <div
          key={w}
          style={{
            position: 'absolute',
            left: wx - 60,
            top: wy,
            width: 90 + rand(w * 53) * 70,
            height: 60 + rand(w * 41) * 50,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(160,170,185,${wAlpha}), transparent 70%)`,
            filter: 'blur(18px)',
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__smokeRiseConfig ?? { smokeDensity: 5 }
    const smokeDensity = cfg.smokeDensity ?? 5

    // Smoke rises from bottom, dissipates upward to reveal text.
    // On exit, smoke descends back down and re-covers text.
    let riseOffset = 0     // smoke panels' vertical offset (0=covering, 1=risen away)
    let smokeOpacity = 0
    let textBlur = 0
    let textOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      riseOffset = ep
      smokeOpacity = 1 - ep
      textBlur = (1 - ep) * 10
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.1) / 0.9))
    } else if (phase === 'hold') {
      riseOffset = 1
      smokeOpacity = 0
      textBlur = 0.4 + Math.sin(t * 0.9) * 0.25
      textOpacity = 1
    } else {
      const ep = easeInCubic(exitProgress)
      riseOffset = 1 - ep
      smokeOpacity = ep
      textBlur = ep * 10
      textOpacity = 1 - ep
    }

    const smokeElements: React.ReactNode[] = []

    // Main smoke curtain rising from bottom
    const curtainY = height * (1 - riseOffset * 1.5)
    smokeElements.push(
      <div
        key="curtain"
        style={{
          position: 'absolute',
          left: 0,
          top: curtainY,
          width: '100%',
          height: height * 1.2,
          background: `linear-gradient(180deg,
            transparent,
            rgba(130,140,160,${0.45 * smokeOpacity}) 20%,
            rgba(110,120,140,${0.6 * smokeOpacity}) 60%,
            rgba(90,100,120,${0.7 * smokeOpacity})
          )`,
          filter: 'blur(22px)',
        }}
      />,
    )

    // Smoke tendrils — individual columns rising at different rates
    for (let s = 0; s < smokeDensity; s++) {
      const tx = width * (0.05 + (s / smokeDensity) * 0.9)
      const tendrilRise = riseOffset * (0.6 + rand(s * 37 + index) * 0.6)
      const ty = height * (1.2 - tendrilRise * 1.5) + Math.sin(t * 0.5 + s * 1.3) * 12
      const tW = 60 + rand(s * 53 + index) * 80
      const tAlpha = (0.12 + rand(s * 29 + index) * 0.1) * smokeOpacity

      smokeElements.push(
        <div
          key={`st${s}`}
          style={{
            position: 'absolute',
            left: tx - tW / 2,
            top: ty,
            width: tW,
            height: 90 + rand(s * 41) * 70,
            borderRadius: '50% 50% 30% 30%',
            background: `radial-gradient(ellipse at 50% 80%, rgba(150,160,180,${tAlpha}), transparent 70%)`,
            filter: 'blur(16px)',
          }}
        />,
      )
    }

    // Per-character smoke clearance (center clears first)
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      const distFromCenter = Math.abs(charNorm - 0.5) * 2
      const charReveal = Math.max(0, riseOffset - distFromCenter * 0.25)
      const charBlur = textBlur * (0.4 + distFromCenter * 0.6) * Math.max(0, 1 - charReveal)
      const charOpacity = textOpacity * (0.35 + charReveal * 0.65)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: charBlur > 0.1 ? `blur(${charBlur}px)` : 'none',
            textShadow: charReveal > 0.75 ? `0 0 20px ${color}50, 0 2px 8px rgba(0,0,0,0.4)` : 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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
        {smokeElements}
      </div>
    )
  },
}

function SmokeRiseRevealComponent(props: MotionGraphicProps<SmokeRiseRevealConfig>) {
  ;(globalThis as any).__smokeRiseConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smoke-rise-reveal',
  title: 'Kinetic Smoke Rise Reveal',
  description: 'Smoke rises from the bottom and dissipates upward to reveal text, with per-character clearance stagger and ambient wisps',
  tags: ['kinetic', 'typography', 'smoke', 'rise', 'reveal', 'overlay', 'atmospheric', 'transition'],
  category: 'captions',
  component: SmokeRiseRevealComponent as any,
  defaultConfig: {
    words: ['BEGIN', 'SHIFT', 'ASCEND', 'CLEAR'],
    colors: ['#F0EDE8', '#E8E0D5', '#F5F2EE', '#D8D0C5'],
    bgColor: '#0d0c0a',
    cycleDuration: 1.4,
    smokeDensity: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BEGIN', 'SHIFT', 'ASCEND', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0EDE8', '#E8E0D5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0c0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'smokeDensity', label: 'Smoke Density', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Animation' },
  ],
})
