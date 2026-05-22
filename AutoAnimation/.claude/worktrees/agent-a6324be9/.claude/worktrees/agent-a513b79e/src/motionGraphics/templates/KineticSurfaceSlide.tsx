import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Surface Slide -------------------------------------------------------------
// Text slides in from the right on a "surface" -- a glossy white platform with
// a colored accent edge. Background has floating gradient orbs (blue, green,
// purple). Clean, airy, lots of white space. Text has subtle drop shadow for
// depth. Microsoft Surface ad aesthetic.

interface SurfaceSlideConfig extends KineticBaseConfig {
  slideDistance: number
}

const MS = {
  blue: '#0078D4',
  green: '#107C10',
  yellow: '#FFB900',
  orange: '#D83B01',
  purple: '#8661C5',
  lightBlue: '#50E6FF',
  teal: '#00B7C3',
}

const ACCENT_PALETTE = [MS.blue, MS.green, MS.purple, MS.lightBlue, MS.teal, MS.orange]

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Floating gradient orbs -- large, soft, pastel
    const orbs = Array.from({ length: 5 }, (_, i) => {
      const orbColors = [MS.blue, MS.green, MS.purple, MS.lightBlue, MS.teal]
      const positions = [
        { x: 15, y: 20 },
        { x: 80, y: 30 },
        { x: 50, y: 75 },
        { x: 25, y: 65 },
        { x: 70, y: 15 },
      ]
      const pos = positions[i]
      const size = 180 + hash(i * 41 + 7) * 180
      const ox = Math.sin(t * 0.18 + i * 1.9) * 10
      const oy = Math.cos(t * 0.14 + i * 1.5) * 8
      const pulseScale = 1 + Math.sin(t * 0.25 + i * 1.2) * 0.06

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${pos.x + ox}%`,
            top: `${pos.y + oy}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orbColors[i]}10, ${orbColors[i]}04 50%, transparent 75%)`,
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            mixBlendMode: 'multiply' as const,
          }}
        />
      )
    })

    // Subtle grid dots -- very faint, Microsoft-style precision grid
    const dots = Array.from({ length: 20 }, (_, i) => {
      const x = hash(i * 53 + 11) * 100
      const y = hash(i * 79 + 23) * 100
      const pulse = 0.4 + Math.sin(t * 0.6 + i * 0.7) * 0.2

      return (
        <div
          key={`dot${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: `rgba(0,0,0,${0.04 * pulse})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {orbs}
        {dots}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const chars = word.split('')
    const total = chars.length || 1
    const accentColor = ACCENT_PALETTE[index % ACCENT_PALETTE.length]

    // Surface platform animation
    let platformX = 0
    let platformOpacity = 0
    let platformScaleX = 0.3
    let accentWidth = 0

    if (phase === 'enter') {
      const pp = easeOutCubic(Math.min(1, enterProgress * 1.4))
      platformX = (1 - pp) * 60
      platformOpacity = Math.min(1, enterProgress * 2.5)
      platformScaleX = 0.3 + pp * 0.7
      accentWidth = pp * 100
    } else if (phase === 'hold') {
      platformOpacity = 1
      platformScaleX = 1
      accentWidth = 100
      platformX = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      const ep = easeInCubic(Math.min(1, exitProgress * 1.3))
      platformX = -ep * 80
      platformOpacity = 1 - exitProgress * 1.2
      platformScaleX = 1 - ep * 0.3
      accentWidth = (1 - ep) * 100
    }

    // Per-character slide-in animation
    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let xOff = 0
      let yOff = 0
      let scale = 1

      if (phase === 'enter') {
        // Staggered slide from right with overshoot
        const delay = (ci / (total + 1)) * 0.45
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.55))
        const e = easeOutBack(p)

        charOpacity = Math.min(1, p * 2)
        xOff = (1 - Math.min(1, e)) * 80
        scale = 0.6 + Math.min(1, e) * 0.4
      } else if (phase === 'hold') {
        // Subtle gentle drift
        const wt = holdProgress * Math.PI * 3.5 + ci * 0.6
        yOff = Math.sin(wt) * 2
        xOff = Math.cos(wt * 0.8 + 0.3) * 1
        scale = 1 + Math.sin(wt * 1.1) * 0.015
      } else {
        // Slide out to left -- staggered from first to last
        const delay = (ci / (total + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.55))
        const e = easeInCubic(p)

        charOpacity = 1 - Math.min(1, p * 1.6)
        xOff = -e * 100
        scale = 1 - e * 0.3
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Surface platform -- glossy white card with accent edge */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${platformX}px), -50%) scaleX(${platformScaleX})`,
            opacity: platformOpacity,
            width: '75%',
            maxWidth: 700,
            height: '38%',
            maxHeight: 190,
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.80))',
            boxShadow: `0 12px 40px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)`,
            overflow: 'hidden',
          }}
        >
          {/* Accent color edge -- bottom border */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: `${accentWidth}%`,
              height: 4,
              borderRadius: '0 4px 0 0',
              background: `linear-gradient(90deg, ${accentColor}, ${ACCENT_PALETTE[(index + 2) % ACCENT_PALETTE.length]})`,
              transition: 'width 0.1s ease',
            }}
          />
          {/* Subtle inner highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)',
              borderRadius: '16px 16px 0 0',
            }}
          />
        </div>
        {/* Soft glow underneath the platform */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 70px)',
            left: '50%',
            width: '50%',
            height: 40,
            transform: 'translate(-50%, 0)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${accentColor}0A, transparent 70%)`,
            opacity: platformOpacity,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Text shadow for depth */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 3px)',
            left: 'calc(50% + 2px)',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'SF Pro Display', 'Inter', system-ui, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            color: 'rgba(0,0,0,0.05)',
            filter: 'blur(3px)',
            opacity: phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'SF Pro Display', 'Inter', system-ui, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function SurfaceSlideComponent(props: MotionGraphicProps<SurfaceSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-surface-slide',
  title: 'Kinetic Surface Slide',
  description:
    'Microsoft Surface ad aesthetic. Text slides in from the right on a glossy white platform with a colored accent edge. Floating gradient orbs in blue, green, and purple drift across a clean white background. Airy and professional.',
  tags: ['kinetic', 'typography', 'surface', 'microsoft', 'clean', 'light', 'slide', 'corporate', 'professional', 'minimal'],
  category: 'captions',
  component: SurfaceSlideComponent as any,
  defaultConfig: {
    words: ['CREATE', 'FLOW', 'FOCUS', 'SHIP'],
    colors: ['#0078D4', '#107C10', '#8661C5', '#D83B01'],
    bgColor: '#FAFAFA',
    cycleDuration: 0.7,
    slideDistance: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CREATE', 'FLOW', 'FOCUS', 'SHIP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#0078D4', '#107C10', '#8661C5', '#D83B01'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 0.7,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'slideDistance',
      label: 'Slide Distance',
      type: 'number',
      defaultValue: 80,
      min: 30,
      max: 200,
      group: 'Animation',
    },
  ],
})
