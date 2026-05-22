import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KernCollideConfig extends KineticBaseConfig {
  collisionForce: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Kern Collide — letters start with absurd positive tracking (far apart),
 * then fly toward each other and collide at their optically-corrected kern pairs.
 * Each adjacent pair arrives at a slightly different time, simulating the
 * typographer manually tightening kern pairs one at a time. On hold, pairs
 * breathe slightly as if the typographer is nudging them. Exit: letters
 * scatter outward from collision point.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline guide */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: '38%',
          height: 1,
          background: 'rgba(128,128,128,0.12)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')
    const n = letters.length
    const fontSize = Math.min(width * 0.15, height * 0.18, 130)
    // Natural (tight) spacing — simulated optical kern
    const naturalSpacing = fontSize * 0.58
    const totalNatural = n * naturalSpacing
    const centerX = width / 2
    const centerY = height / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      // Final resting x for each letter (optically tight)
      const finalX = centerX - totalNatural / 2 + i * naturalSpacing

      let x: number
      let opacity: number
      let scale: number = 1

      if (phase === 'enter') {
        // Each letter starts wide apart and collides inward
        // Stagger: pairs collide from outside in
        const distFromCenter = i - (n - 1) / 2
        // Pair index — outer pairs collide later
        const pairDelay = (Math.abs(distFromCenter) / ((n - 1) / 2)) * 0.35
        const charT = Math.max(0, Math.min(1, (enterProgress - pairDelay * (1 - enterProgress)) / 1))
        const eased = easeOutBack(Math.min(1, charT * 1.15))

        // Start spread wide — each letter offset by distance from center
        const startX = centerX + distFromCenter * fontSize * 2.2
        x = startX + (finalX - startX) * eased
        opacity = Math.min(1, charT * 4)
        // Squash on impact
        scale = charT > 0.75 ? 1 + (1 - (charT - 0.75) / 0.25) * 0.12 : 1
      } else if (phase === 'hold') {
        // Gentle kern nudge — sinusoidal micro-adjustment per letter pair
        const nudge = Math.sin(holdProgress * Math.PI * 4 + i * 0.8) * fontSize * 0.012
        x = finalX + nudge
        opacity = 1
      } else {
        // Exit: letters scatter outward from center
        const distFromCenter = i - (n - 1) / 2
        const t = easeInOutQuart(exitProgress)
        x = finalX + distFromCenter * fontSize * t * 1.8
        opacity = 1 - t * t
        scale = 1 + t * 0.15
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: centerY,
            transform: `translateY(-50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 700,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 0,
          }}
        >
          {letters[i]}
        </div>
      )
    }

    // Kern annotation
    const annotationOpacity = phase === 'hold' ? 0.18 + Math.sin(holdProgress * Math.PI) * 0.08 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '22%',
            transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: annotationOpacity,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          kern collision
        </div>
      </div>
    )
  },
}

function KernCollideComponent(props: MotionGraphicProps<KernCollideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kern-collide',
  title: 'Kern Collide',
  description:
    'Letters start far apart with extreme positive tracking and collide inward to their optically-correct kern positions. Pairs stagger their arrival, simulating a typographer hand-setting kern values one pair at a time. Exit scatters from collision point.',
  tags: ['kinetic', 'typography', 'kerning', 'collision', 'spacing', 'optical', 'craft', 'per-letter'],
  category: 'captions',
  component: KernCollideComponent as any,
  defaultConfig: {
    words: ['KERN', 'PAIR', 'TYPE', 'SNAP'],
    colors: ['#1a1a1a', '#cc3300', '#1a1a1a', '#cc3300'],
    bgColor: '#f7f4ef',
    cycleDuration: 2.2,
    collisionForce: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KERN', 'PAIR', 'TYPE', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#cc3300', '#1a1a1a', '#cc3300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f7f4ef', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 5, group: 'Timing' },
    { key: 'collisionForce', label: 'Spread Distance (px)', type: 'number', defaultValue: 100, min: 40, max: 300, group: 'Animation' },
  ],
})
