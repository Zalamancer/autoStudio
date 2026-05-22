import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SnapBraceletConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 2.5
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
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
    width,
  }: WordRenderProps) => {
    // Snap bracelet: flat (scaleY near 0, wide) → curls → snaps into band (normal scale, slight arc)
    let scaleY = 1
    let scaleX = 1
    let translateY = 0
    let opacity = 1
    let borderRadius = 0
    let rotateZ = 0

    if (phase === 'enter') {
      if (enterProgress < 0.35) {
        // Flat strip state — thin and wide
        const flatT = enterProgress / 0.35
        scaleY = 0.08 + flatT * 0.12 // very flat
        scaleX = 1.6 - flatT * 0.3  // wide
        opacity = 0.4 + flatT * 0.6
        translateY = 20 * (1 - flatT)
        borderRadius = 4
      } else if (enterProgress < 0.55) {
        // Curl begins — quick intermediate curl phase
        const curlT = (enterProgress - 0.35) / 0.20
        scaleY = 0.2 + curlT * 0.5
        scaleX = 1.3 - curlT * 0.4
        rotateZ = curlT * 8
        borderRadius = 8 * curlT
        opacity = 1
      } else {
        // SNAP — spring into bracelet form
        const snapT = (enterProgress - 0.55) / 0.45
        const snapped = easeOutElastic(snapT)
        scaleY = 0.7 + 0.3 * snapped
        scaleX = 0.9 + 0.1 * snapped
        rotateZ = 8 * (1 - snapped)
        borderRadius = 8 * snapped
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Gentle radial spring settle
      const pulse = Math.sin(holdProgress * Math.PI * 6) * Math.exp(-holdProgress * 4)
      scaleY = 1 + pulse * 0.04
      scaleX = 1 - pulse * 0.02
      borderRadius = 8
    } else {
      // Exit: flattens back out and slides off
      const exitEased = easeOutCubic(exitProgress)
      scaleY = 1 - exitEased * 0.92
      scaleX = 1 + exitEased * 0.6
      translateY = -30 * exitEased
      opacity = exitProgress < 0.6 ? 1 : (1 - exitProgress) / 0.4
    }

    // Snap sheen effect during snap
    const showSheen = phase === 'enter' && enterProgress >= 0.55 && enterProgress < 0.75
    const sheenOpacity = showSheen
      ? Math.sin(((enterProgress - 0.55) / 0.2) * Math.PI) * 0.6
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotateZ(${rotateZ}deg)`,
            transformOrigin: 'center center',
            opacity,
          }}
        >
          {/* Bracelet backing strip */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px -16px',
              background: `${color}22`,
              border: `2px solid ${color}44`,
              borderRadius: `${borderRadius * 3}px`,
            }}
          />
          {/* Sheen flash on snap */}
          {sheenOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: '-8px -16px',
                background: `linear-gradient(90deg, transparent 20%, rgba(255,255,255,${sheenOpacity}) 50%, transparent 80%)`,
                borderRadius: `${borderRadius * 3}px`,
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 138px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: `0 2px 0 rgba(0,0,0,0.3), 0 0 30px ${color}55`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SnapBraceletComponent(props: MotionGraphicProps<SnapBraceletConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-snap-bracelet',
  title: 'Snap Bracelet',
  description:
    'Text appears as a flat strip then snaps into a curved bracelet with elastic spring rebound, sheen flash on impact.',
  tags: ['kinetic', 'typography', 'snap', 'bracelet', 'spring', 'elastic', 'mechanical', 'curl'],
  category: 'captions',
  component: SnapBraceletComponent as any,
  defaultConfig: {
    words: ['SNAP', 'SLAP', 'WRAP', 'CLICK'],
    colors: ['#FF69B4', '#00CED1', '#FFD700', '#98FB98'],
    bgColor: '#0a0a14',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'SLAP', 'WRAP', 'CLICK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF69B4', '#00CED1', '#FFD700', '#98FB98'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
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
