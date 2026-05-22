import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Bounce Patterns 1/4 — Triplet Bounce
// Text bounces in a 1-2-3 triplet pattern (jazz/swing feel)

interface TripletBounceConfig extends KineticBaseConfig {
  bounceIntensity: number
}

function springOut(t: number): number {
  const c4 = (2 * Math.PI) / 3
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      translateY = (1 - springOut(Math.min(enterProgress * 1.2, 1))) * height * 0.5
    } else if (phase === 'hold') {
      opacity = 1
      // Triplet bounce: 3 even hops per cycle (1-2-3, 1-2-3)
      const t = holdProgress * Math.PI * 6 // 3 full cycles
      const bounce = Math.max(0, Math.sin(t))
      const squash = bounce > 0.9 ? 1 - (bounce - 0.9) * 0.8 : 1
      translateY = -bounce * 18
      scaleX = squash > 0.5 ? 2 - squash : squash
      scaleY = squash
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * height * 0.25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontSize: 'clamp(48px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Fredoka One', 'Nunito', 'Arial Rounded MT Bold', cursive, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `0 6px 0 rgba(0,0,0,0.25), 0 2px 12px ${color}40`,
        }}
      >
        {word}
      </div>
    )
  },
}

function TripletBounceComponent(props: MotionGraphicProps<TripletBounceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-triplet-bounce',
  title: 'Kinetic Triplet Bounce',
  description:
    'Text bounces in a 1-2-3 triplet musical pattern with spring physics entry and rhythmic three-beat hop during hold. Jazz/swing feel.',
  tags: ['kinetic', 'bounce', 'rhythm', 'triplet', 'music', 'jazz', 'swing', 'beat'],
  category: 'captions',
  component: TripletBounceComponent as any,
  defaultConfig: {
    words: ['ONE', 'TWO', 'THREE'],
    colors: ['#FF6B35', '#F7C59F', '#EFEFD0'],
    bgColor: '#1B1B2F',
    cycleDuration: 1.2,
    bounceIntensity: 18,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ONE', 'TWO', 'THREE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7C59F', '#EFEFD0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1B1B2F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'bounceIntensity', label: 'Bounce Intensity', type: 'number', defaultValue: 18, min: 4, max: 60, group: 'Animation' },
  ],
})
