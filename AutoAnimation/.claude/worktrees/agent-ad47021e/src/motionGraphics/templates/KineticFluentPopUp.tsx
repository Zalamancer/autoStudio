import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Fluent Pop Up -------------------------------------------------------------
// Microsoft Fluent Design inspired. Text pops up from behind colorful rounded
// rectangle cards that float in space. Cards have subtle depth shadows.
// Background has drifting geometric shapes (circles, rounded squares) in pastel
// Microsoft colors. Per-character pop with easeOutBack overshoot.

interface FluentPopUpConfig extends KineticBaseConfig {
  cardDepth: number
}

const MS = {
  blue: '#0078D4',
  green: '#107C10',
  yellow: '#FFB900',
  orange: '#D83B01',
  purple: '#8661C5',
  lightBlue: '#50E6FF',
  pink: '#E3008C',
}

const FLUENT_ACCENTS = [MS.blue, MS.green, MS.purple, MS.orange, MS.yellow, MS.lightBlue, MS.pink]

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Floating Fluent Design geometric shapes -- circles and rounded squares
    const shapes = Array.from({ length: 14 }, (_, i) => {
      const baseX = hash(i * 47 + 3) * 100
      const baseY = hash(i * 67 + 17) * 100
      const size = 20 + hash(i * 31 + 7) * 60
      const isCircle = i % 3 !== 0
      const colorIdx = i % FLUENT_ACCENTS.length
      const color = FLUENT_ACCENTS[colorIdx]

      // Gentle drift
      const driftX = Math.sin(t * 0.25 + i * 1.3) * 12
      const driftY = Math.cos(t * 0.2 + i * 0.9) * 10
      const rotation = t * (3 + i * 0.7) + i * 45
      const scale = 1 + Math.sin(t * 0.3 + i * 0.8) * 0.08

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${baseX + driftX}%`,
            top: `${baseY + driftY}%`,
            width: size,
            height: size,
            borderRadius: isCircle ? '50%' : `${size * 0.25}px`,
            background: `${color}12`,
            border: `1.5px solid ${color}18`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
            boxShadow: `0 2px 12px ${color}08`,
          }}
        />
      )
    })

    // Soft large gradient orbs for ambient warmth
    const orbs = Array.from({ length: 3 }, (_, i) => {
      const orbColors = [MS.blue, MS.purple, MS.green]
      const positions = [
        { x: 20, y: 25 },
        { x: 75, y: 70 },
        { x: 55, y: 15 },
      ]
      const pos = positions[i]
      const ox = Math.sin(t * 0.15 + i * 2.1) * 6
      const oy = Math.cos(t * 0.12 + i * 1.7) * 5

      return (
        <div
          key={`orb${i}`}
          style={{
            position: 'absolute',
            left: `${pos.x + ox}%`,
            top: `${pos.y + oy}%`,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orbColors[i]}0A, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'multiply' as const,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {orbs}
        {shapes}
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

    // Floating card behind the text -- colored rounded rectangle
    const cardColor = FLUENT_ACCENTS[(index + 2) % FLUENT_ACCENTS.length]
    let cardOpacity = 0
    let cardScaleX = 0.7
    let cardScaleY = 0.5
    let cardY = 30

    if (phase === 'enter') {
      const cp = easeOutBack(Math.min(1, enterProgress * 1.3))
      cardOpacity = Math.min(1, enterProgress * 3)
      cardScaleX = 0.7 + cp * 0.3
      cardScaleY = 0.5 + cp * 0.5
      cardY = 30 * (1 - cp)
    } else if (phase === 'hold') {
      cardOpacity = 1
      cardScaleX = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.015
      cardScaleY = 1 + Math.cos(holdProgress * Math.PI * 2.5) * 0.01
      cardY = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      const ep = easeInBack(Math.min(1, exitProgress * 1.2))
      cardOpacity = 1 - exitProgress
      cardScaleX = 1 - ep * 0.4
      cardScaleY = 1 - ep * 0.5
      cardY = -ep * 50
    }

    // Per-character animation
    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scale = 1
      let rotation = 0

      if (phase === 'enter') {
        // Staggered pop from below with easeOutBack
        const delay = (ci / (total + 1)) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const e = easeOutBack(p)

        charOpacity = Math.min(1, p * 2.5)
        yOff = (1 - Math.min(1, e)) * 60
        scale = 0.3 + Math.min(1, e) * 0.7
        // Slight overshoot rotation
        rotation = (1 - Math.min(1, e)) * (ci % 2 === 0 ? 12 : -12)
      } else if (phase === 'hold') {
        // Gentle floating bob per character
        const wt = holdProgress * Math.PI * 4 + ci * 0.8
        yOff = Math.sin(wt) * 3
        scale = 1 + Math.sin(wt * 1.2 + 0.5) * 0.03
        rotation = Math.sin(wt * 0.7) * 1.5
      } else {
        // Pop down and shrink -- reverse stagger
        const delay = ((total - 1 - ci) / (total + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.5))
        const e = easeInBack(p)

        charOpacity = 1 - Math.min(1, p * 1.5)
        yOff = e * 60
        scale = 1 - e * 0.5
        rotation = e * (ci % 2 === 0 ? -15 : 15)
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
            textShadow: `0 2px 8px rgba(0,0,0,0.08)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Fluent card behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${cardY}px)) scaleX(${cardScaleX}) scaleY(${cardScaleY})`,
            opacity: cardOpacity,
            width: '70%',
            maxWidth: 650,
            height: '35%',
            maxHeight: 180,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${cardColor}18, ${cardColor}0C)`,
            border: `1.5px solid ${cardColor}20`,
            boxShadow: `0 8px 32px ${cardColor}12, 0 2px 8px rgba(0,0,0,0.04)`,
            backdropFilter: 'blur(8px)',
          }}
        />
        {/* Secondary accent card -- offset, smaller */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 35px)',
            left: 'calc(50% + 40px)',
            transform: `translate(-50%, calc(-50% + ${cardY * 0.6}px)) scaleX(${cardScaleX * 0.8}) scaleY(${cardScaleY * 0.8}) rotate(6deg)`,
            opacity: cardOpacity * 0.5,
            width: '25%',
            maxWidth: 200,
            height: '18%',
            maxHeight: 80,
            borderRadius: 14,
            background: `${FLUENT_ACCENTS[(index + 4) % FLUENT_ACCENTS.length]}10`,
            border: `1px solid ${FLUENT_ACCENTS[(index + 4) % FLUENT_ACCENTS.length]}15`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.03)`,
          }}
        />
        {/* Soft glow layer for depth */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '50%',
            height: '30%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${cardColor}08, transparent 70%)`,
            opacity: cardOpacity,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'SF Pro Display', 'Inter', system-ui, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function FluentPopUpComponent(props: MotionGraphicProps<FluentPopUpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fluent-pop-up',
  title: 'Kinetic Fluent Pop Up',
  description:
    'Microsoft Fluent Design inspired. Text pops up from behind colorful rounded rectangle cards with depth shadows. Floating geometric shapes in pastel Microsoft accent colors drift across a clean white background. Per-character easeOutBack overshoot.',
  tags: ['kinetic', 'typography', 'fluent', 'microsoft', 'corporate', 'clean', 'light', 'pop', 'playful', 'professional'],
  category: 'captions',
  component: FluentPopUpComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'BUILD', 'SHARE', 'GROW'],
    colors: ['#0078D4', '#107C10', '#8661C5', '#D83B01'],
    bgColor: '#F5F5F5',
    cycleDuration: 0.7,
    cardDepth: 20,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DESIGN', 'BUILD', 'SHARE', 'GROW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#0078D4', '#107C10', '#8661C5', '#D83B01'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
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
      key: 'cardDepth',
      label: 'Card Depth',
      type: 'number',
      defaultValue: 20,
      min: 5,
      max: 50,
      group: 'Animation',
    },
  ],
})
