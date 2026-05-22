import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FunhouseMirrorConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Funhouse mirror: non-planar mirror surface creates wild warping distortions
// Alternates between fat/squat and tall/thin, with wavy side distortions
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 80%, rgba(255,180,0,0.06) 0%, transparent 70%)`,
          }}
        />
        {/* Mirror frame suggestion */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            left: '15%',
            right: '15%',
            border: '2px solid rgba(255,200,80,0.08)',
            borderRadius: 8,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Mirror distortion oscillates between tall-thin and fat-squat
    const distortCycle =
      phase === 'hold'
        ? time * 0.7 // slow cycling through mirror types on hold
        : phase === 'enter'
          ? (1 - eased) * 2
          : exitProgress * 3

    // scaleX / scaleY oscillate in opposition
    const fat = Math.sin(distortCycle * Math.PI) * 0.5 // -0.5 to +0.5
    const scaleX = 1 + fat * (phase === 'enter' ? (1 - eased) * 1.2 + 0.5 : 0.5)
    const scaleY = 1 - fat * (phase === 'enter' ? (1 - eased) * 0.8 + 0.3 : 0.3)

    // Wavy side distortion using skewX cycling
    const skewX = Math.sin(distortCycle * Math.PI * 2 + 0.5) * (phase === 'enter' ? (1 - eased) * 20 + 5 : 5)

    // Entry: scale from tiny distorted to normal, then settle into hold cycle
    const entryScale = phase === 'enter' ? 0.4 + backEased * 0.6 : 1

    // Exit: squash to 0 on one axis
    const exitScaleX = phase === 'exit' ? 1 - exitProgress * 0.8 : 1
    const exitScaleY = phase === 'exit' ? 1 + exitProgress * 0.6 : 1

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Mirror frame reflections — faint copies at distorted scales */}
        {[-0.3, 0.3].map((side, si) => (
          <div
            key={si}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${(scaleX + side) * 0.35}) scaleY(${scaleY * 0.4}) skewX(${-skewX * 0.5}deg)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.12,
              filter: 'blur(2px)',
            }}
          >
            {word}
          </div>
        ))}

        {/* Main distorted text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${entryScale}) scaleX(${scaleX * exitScaleX}) scaleY(${scaleY * exitScaleY}) skewX(${skewX}deg)`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: `2px 0 rgba(255,100,0,0.2), -2px 0 rgba(0,100,255,0.2)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FunhouseMirrorComponent(props: MotionGraphicProps<FunhouseMirrorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-funhouse-mirror',
  title: 'Kinetic Funhouse Mirror',
  description:
    'Funhouse / carnival mirror distortion — text oscillates between fat-squat and tall-thin with wavy skew, cycling through every mirror-type while holding',
  tags: ['kinetic', 'typography', 'funhouse', 'mirror', 'reflection', 'distort', 'carnival', 'warp'],
  category: 'captions',
  component: FunhouseMirrorComponent as any,
  defaultConfig: {
    words: ['WARP', 'TWIST', 'FUN', 'WILD'],
    colors: ['#FFDD44', '#FF8822', '#FFEE66', '#FFAA33'],
    bgColor: '#0A0500',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WARP', 'TWIST', 'FUN', 'WILD'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFDD44', '#FF8822'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0500', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
