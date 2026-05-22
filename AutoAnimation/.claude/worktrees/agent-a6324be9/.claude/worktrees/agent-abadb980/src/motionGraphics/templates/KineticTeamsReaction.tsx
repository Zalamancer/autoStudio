import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Teams Reaction ------------------------------------------------------------
// Text enters with emoji-reaction-style bounce (like Teams reactions floating
// up). Each letter bounces up from bottom with elastic overshoot and slight
// rotation. Background has soft gradient + floating rounded pill shapes in
// Teams purple/blue. Playful but professional.

interface TeamsReactionConfig extends KineticBaseConfig {
  elasticity: number
}

const MS = {
  blue: '#0078D4',
  green: '#107C10',
  yellow: '#FFB900',
  orange: '#D83B01',
  purple: '#8661C5',
  teamsPurple: '#6264A7',
  teamsLight: '#7B83EB',
  lightBlue: '#50E6FF',
}

const PILL_COLORS = [MS.teamsPurple, MS.teamsLight, MS.blue, MS.purple, MS.lightBlue, MS.green, MS.yellow]

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.35
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Soft gradient overlay -- Teams purple to blue
    const gradientAngle = 135 + Math.sin(t * 0.1) * 5

    // Floating rounded pill shapes -- Teams UI language
    const pills = Array.from({ length: 12 }, (_, i) => {
      const baseX = hash(i * 43 + 7) * 100
      const baseY = hash(i * 61 + 19) * 100
      const pillWidth = 30 + hash(i * 29 + 5) * 50
      const pillHeight = 12 + hash(i * 37 + 13) * 14
      const colorIdx = i % PILL_COLORS.length
      const color = PILL_COLORS[colorIdx]
      const rotation = hash(i * 71 + 31) * 360

      // Gentle floating
      const driftX = Math.sin(t * 0.2 + i * 1.1) * 8
      const driftY = Math.cos(t * 0.18 + i * 0.8) * 6
      const rotDrift = Math.sin(t * 0.15 + i * 1.4) * 8
      const scale = 1 + Math.sin(t * 0.3 + i * 0.9) * 0.05

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${baseX + driftX}%`,
            top: `${baseY + driftY}%`,
            width: pillWidth,
            height: pillHeight,
            borderRadius: pillHeight,
            background: `${color}10`,
            border: `1px solid ${color}15`,
            transform: `translate(-50%, -50%) rotate(${rotation + rotDrift}deg) scale(${scale})`,
          }}
        />
      )
    })

    // Small floating circles -- like reaction bubbles rising
    const bubbles = Array.from({ length: 6 }, (_, i) => {
      const baseX = 15 + hash(i * 57 + 3) * 70
      const size = 6 + hash(i * 33 + 9) * 8
      const color = PILL_COLORS[(i + 2) % PILL_COLORS.length]
      // Rising motion, looping
      const cycleT = (t * 0.12 + hash(i * 41 + 17) * 3) % 3
      const baseY = 90 - cycleT * 35
      const wobbleX = Math.sin(t * 0.5 + i * 2) * 6
      const fadeOpacity = cycleT < 0.3 ? cycleT / 0.3 : cycleT > 2.5 ? (3 - cycleT) / 0.5 : 1

      return (
        <div
          key={`b${i}`}
          style={{
            position: 'absolute',
            left: `${baseX + wobbleX}%`,
            top: `${baseY}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `${color}20`,
            opacity: fadeOpacity * 0.6,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Soft gradient wash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${gradientAngle}deg, ${MS.teamsPurple}06, ${MS.blue}04, transparent 60%)`,
            mixBlendMode: 'multiply' as const,
          }}
        />
        {pills}
        {bubbles}
        {/* Central ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 400,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${MS.teamsPurple}06, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen' as const,
          }}
        />
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

    // Per-character reaction bounce
    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scale = 1
      let rotation = 0

      if (phase === 'enter') {
        // Bounce up from bottom with elastic overshoot -- like a Teams reaction
        const delay = (ci / (total + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const e = elasticOut(p)

        charOpacity = Math.min(1, p * 2.5)
        // Rise from below
        yOff = (1 - Math.min(1, e)) * 100
        scale = 0.2 + Math.min(1.15, e) * 0.85
        // Slight rotation on bounce -- alternating direction
        rotation = (1 - Math.min(1, p)) * (ci % 2 === 0 ? 20 : -20)
        // Extra wobble during overshoot
        if (e > 1) {
          rotation += (e - 1) * (ci % 2 === 0 ? 30 : -30)
        }
      } else if (phase === 'hold') {
        // Gentle floating bob -- like reactions hovering
        const wt = holdProgress * Math.PI * 4 + ci * 0.7
        yOff = Math.sin(wt) * 4
        scale = 1 + Math.sin(wt * 1.3 + 0.4) * 0.025
        rotation = Math.sin(wt * 0.6 + ci * 0.5) * 3
      } else {
        // Float upward and fade -- like reactions dissolving
        const delay = (ci / (total + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const e = easeOutBack(Math.min(1, p))

        charOpacity = 1 - Math.min(1, p * 1.5)
        yOff = -e * 90
        scale = 1 + e * 0.3 // Slightly enlarge as it floats away
        rotation = e * (ci % 2 === 0 ? 25 : -25)
      }

      // Color cycling during hold for playful energy
      const charColor =
        phase === 'hold'
          ? PILL_COLORS[(ci + index + Math.floor(holdProgress * 2)) % PILL_COLORS.length]
          : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
            textShadow: `0 2px 10px rgba(0,0,0,0.06), 0 0 20px ${charColor}15`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Reaction "burst" ring behind text on enter
    let burstScale = 0
    let burstOpacity = 0
    if (phase === 'enter' && enterProgress > 0.3) {
      const bp = (enterProgress - 0.3) / 0.7
      burstScale = easeOutBack(Math.min(1, bp)) * 1.2
      burstOpacity = Math.max(0, 1 - bp * 1.5) * 0.3
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Reaction burst ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: `3px solid ${MS.teamsPurple}`,
            transform: `translate(-50%, -50%) scale(${burstScale})`,
            opacity: burstOpacity,
          }}
        />
        {/* Secondary inner burst */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${MS.teamsPurple}08, transparent 70%)`,
            transform: `translate(-50%, -50%) scale(${burstScale * 0.8})`,
            opacity: burstOpacity * 1.5,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Blurred text shadow layer */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 4px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'SF Pro Display', 'Inter', system-ui, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            color: `${MS.teamsPurple}10`,
            filter: 'blur(6px)',
            opacity: phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress,
            mixBlendMode: 'multiply' as const,
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
            fontWeight: 700,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function TeamsReactionComponent(props: MotionGraphicProps<TeamsReactionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-teams-reaction',
  title: 'Kinetic Teams Reaction',
  description:
    'Teams-inspired reaction bounce. Letters bounce up from the bottom with elastic overshoot and slight rotation, like emoji reactions floating up. Floating rounded pill shapes in Teams purple and blue. Playful but professional.',
  tags: ['kinetic', 'typography', 'teams', 'microsoft', 'reaction', 'bounce', 'elastic', 'playful', 'professional', 'light'],
  category: 'captions',
  component: TeamsReactionComponent as any,
  defaultConfig: {
    words: ['REACT', 'LOVE', 'WOW', 'NICE'],
    colors: ['#6264A7', '#0078D4', '#107C10', '#FFB900'],
    bgColor: '#F3F2F1',
    cycleDuration: 0.7,
    elasticity: 0.35,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REACT', 'LOVE', 'WOW', 'NICE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#6264A7', '#0078D4', '#107C10', '#FFB900'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F3F2F1', group: 'Style' },
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
      key: 'elasticity',
      label: 'Elasticity',
      type: 'number',
      defaultValue: 0.35,
      min: 0.1,
      max: 0.8,
      group: 'Animation',
    },
  ],
})
