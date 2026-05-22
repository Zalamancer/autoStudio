import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlayfulBouncyConfig extends KineticBaseConfig {
  squashAmount: number
}

// Playful / bouncy mood: rubber-hose animation feel, squash-and-stretch,
// bright candy colors, bubbly shapes in background. Letters drop in one by one
// with springy overshoot, wobble during hold, exit by launching upward
// with a stretch trail — like a kids' show title card.

function springBounce(t: number): number {
  // Damped spring with three bounces
  if (t < 0.36) return Math.pow(t / 0.36, 2) * 1.3
  if (t < 0.54) return 1.3 - ((t - 0.36) / 0.18) * 0.45
  if (t < 0.72) return 0.85 + ((t - 0.54) / 0.18) * 0.25
  if (t < 0.84) return 1.1 - ((t - 0.72) / 0.12) * 0.15
  return 0.95 + ((t - 0.84) / 0.16) * 0.05
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CANDY_COLORS = ['#FF6B9D', '#C44DFF', '#00D2FF', '#FFE66D', '#51E898', '#FF8A5C']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Floating bubbly circles
    const bubbles = Array.from({ length: 10 }, (_, i) => {
      const baseX = rand(i * 37 + 5) * 100
      const baseY = rand(i * 59 + 11) * 100
      const size = 30 + rand(i * 23) * 70
      // Bouncy sine float
      const floatY = Math.sin(t * 0.5 + i * 0.9) * 15
      const floatX = Math.cos(t * 0.3 + i * 1.1) * 8
      const colorIdx = i % CANDY_COLORS.length
      // Squash-stretch on bubbles themselves
      const squashPhase = t * 0.8 + i * 0.5
      const scaleX = 1 + Math.sin(squashPhase) * 0.1
      const scaleY = 1 - Math.sin(squashPhase) * 0.08

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${baseX + floatX}%`,
            top: `${baseY + floatY}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${CANDY_COLORS[colorIdx]}30, ${CANDY_COLORS[colorIdx]}10 60%, transparent)`,
            border: `2px solid ${CANDY_COLORS[colorIdx]}18`,
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            mixBlendMode: 'screen' as const,
          }}
        />
      )
    })

    // Confetti dots
    const confetti = Array.from({ length: 8 }, (_, i) => {
      const x = rand(i * 71 + 13) * 100
      const y = rand(i * 43 + 29) * 100
      const rotation = t * (40 + i * 15) + i * 90
      const colorIdx = (i + 3) % CANDY_COLORS.length
      const wobble = Math.sin(t * 1.2 + i * 2) * 10

      return (
        <div
          key={`c${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y + wobble}%`,
            width: 8,
            height: 14,
            borderRadius: '2px',
            background: CANDY_COLORS[colorIdx] + '35',
            transform: `rotate(${rotation}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {bubbles}
        {confetti}
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
    const chars = word.split('').map((ch, ci) => {
      const total = word.length || 1
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotation = 0

      if (phase === 'enter') {
        // Drop in from above with spring bounce — staggered per character
        const delay = (ci / (total + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const bounce = springBounce(p)

        charOpacity = Math.min(1, p * 3)
        yOff = (1 - Math.min(1, bounce)) * -80
        // Squash on landing: wide & short when bounce > 1 (overshoot)
        if (bounce > 1) {
          scaleX = 1 + (bounce - 1) * 1.5
          scaleY = 1 - (bounce - 1) * 0.6
        } else {
          scaleX = 1
          scaleY = 1
        }
        rotation = (1 - Math.min(1, p)) * (ci % 2 === 0 ? 20 : -20)
      } else if (phase === 'hold') {
        // Rubbery wobble — each letter has its own rhythm
        const wt = holdProgress * Math.PI * 4 + ci * 1.2 + index * 0.7
        yOff = Math.sin(wt) * 6
        scaleX = 1 + Math.sin(wt * 1.3) * 0.06
        scaleY = 1 - Math.sin(wt * 1.3) * 0.05
        rotation = Math.sin(wt * 0.8) * 4
      } else {
        // Launch upward with stretch trail
        const delay = ((total - 1 - ci) / (total + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const ep = p * p

        charOpacity = 1 - ep
        yOff = -ep * 120
        // Vertical stretch as it launches
        scaleY = 1 + ep * 0.8
        scaleX = 1 - ep * 0.3
        rotation = ep * (ci % 2 === 0 ? 30 : -30)
      }

      // Cycle through candy colors per character
      const charColor = phase === 'hold' ? CANDY_COLORS[(ci + index) % CANDY_COLORS.length] : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
            textShadow: `2px 4px 0 rgba(0,0,0,0.15), 0 0 12px ${charColor}40`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Bubbly shadow behind text */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 8px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fredoka One', 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(0,0,0,0.12)',
            filter: 'blur(4px)',
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
            fontFamily: "'Fredoka One', 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function PlayfulBouncyComponent(props: MotionGraphicProps<PlayfulBouncyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-playful-bouncy',
  title: 'Kinetic Playful Bouncy',
  description:
    'Rubber-hose animation feel with spring-bounce letter drops, squash-and-stretch, candy-colored character cycling, bubbly background shapes, and upward launch exit.',
  tags: ['kinetic', 'typography', 'playful', 'bouncy', 'cartoon', 'kids', 'squash', 'stretch', 'mood', 'atmosphere'],
  category: 'captions',
  component: PlayfulBouncyComponent as any,
  defaultConfig: {
    words: ['BOING', 'POP', 'FIZZ', 'ZOOM'],
    colors: ['#FF6B9D', '#C44DFF', '#00D2FF', '#FFE66D'],
    bgColor: '#1A0A2E',
    cycleDuration: 1.1,
    squashAmount: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOING', 'POP', 'FIZZ', 'ZOOM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B9D', '#C44DFF', '#00D2FF', '#FFE66D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A2E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'squashAmount',
      label: 'Squash Amount',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 3,
      group: 'Animation',
    },
  ],
})
