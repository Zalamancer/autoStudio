import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MirrorReflectConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Water/mirror surface at vertical center
    const surfaceY = height * 0.52

    // Animated ripple rings on the water surface
    const ripples = Array.from({ length: 4 }, (_, i) => {
      const rippleAge = ((time * 0.6 + i * 1.8) % 4) / 4 // 0..1 lifecycle
      const radius = rippleAge * 200
      const opacity = Math.max(0, 0.12 * (1 - rippleAge))
      const cx = 30 + ((i * 37 + 13) % 40)
      return (
        <div
          key={`ripple-${i}`}
          style={{
            position: 'absolute',
            left: `${cx}%`,
            top: surfaceY,
            width: radius * 2,
            height: radius * 0.3,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${opacity})`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Upper half: dark ambient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: surfaceY,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Mirror/water surface line */}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: surfaceY,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.2), rgba(255,255,255,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Lower half: darker with blue tint (water) */}
        <div
          style={{
            position: 'absolute',
            top: surfaceY,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(20,40,80,0.15), rgba(10,20,50,0.3))',
            pointerEvents: 'none',
          }}
        />
        {ripples}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const surfaceY = height * 0.52

    // Text position: above the mirror line
    const textBaseY = surfaceY - 60 // Position text center above surface

    let mainOpacity = 1
    let mainScale = 1
    let mainTranslateY = 0

    // Ripple distortion for the reflection
    const rippleTime = f * 0.05
    const rippleAmount = phase === 'hold' ? 2 + Math.sin(holdProgress * Math.PI * 2) * 1.5 : phase === 'enter' ? 3 * (1 - enterProgress) : 3 * exitProgress

    if (phase === 'enter') {
      // Text drops from above with reflection appearing
      const t = easeOutQuart(enterProgress)
      mainTranslateY = (1 - t) * -80
      mainOpacity = Math.min(1, enterProgress * 2)
      mainScale = 0.8 + t * 0.2
    } else if (phase === 'hold') {
      // Subtle float
      mainTranslateY = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      // Rise up and fade
      const t = easeInQuad(exitProgress)
      mainTranslateY = -t * 100
      mainOpacity = 1 - t
      mainScale = 1 - t * 0.2
    }

    // Build per-char reflection with ripple distortion
    const chars = word.split('')
    const reflectionChars = chars.map((ch, ci) => {
      const rippleOffset = Math.sin(rippleTime + ci * 0.6) * rippleAmount
      const charScaleY = 0.95 + Math.sin(rippleTime * 1.3 + ci * 0.8) * 0.05
      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${rippleOffset}px) scaleY(${charScaleY})`,
            transformOrigin: 'center top',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Main text above surface */}
        <div
          style={{
            position: 'absolute',
            top: textBaseY,
            left: '50%',
            transform: `translateX(-50%) translateY(${mainTranslateY}px) scale(${mainScale})`,
            transformOrigin: 'center bottom',
            opacity: mainOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            color,
            textShadow: `0 2px 15px ${color}44`,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: 3,
          }}
        >
          {word}
        </div>

        {/* Mirror reflection below surface */}
        <div
          style={{
            position: 'absolute',
            top: surfaceY + 8,
            left: '50%',
            transform: `translateX(-50%) scaleY(-0.6) translateY(${-mainTranslateY * 0.6}px)`,
            transformOrigin: 'center top',
            opacity: mainOpacity * 0.3,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: 3,
            filter: 'blur(1.5px)',
            display: 'flex',
          }}
        >
          {reflectionChars}
        </div>

        {/* Secondary faint deeper reflection */}
        <div
          style={{
            position: 'absolute',
            top: surfaceY + 50,
            left: '50%',
            transform: `translateX(-50%) scaleY(-0.3)`,
            transformOrigin: 'center top',
            opacity: mainOpacity * 0.08,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: 3,
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MirrorReflectComponent(props: MotionGraphicProps<MirrorReflectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mirror-reflect',
  title: 'Kinetic Mirror Reflect',
  description: 'Text reflects across a water/mirror surface with per-character ripple distortion, animated ripple rings, and layered depth reflections',
  tags: ['kinetic', 'typography', 'mirror', 'reflection', 'water', 'ripple', 'elegant', 'distortion'],
  category: 'captions',
  component: MirrorReflectComponent as any,
  defaultConfig: {
    words: ['REFLECT', 'MIRROR', 'WATER', 'DEPTH'],
    colors: ['#93C5FD', '#A5B4FC', '#C4B5FD', '#DDD6FE'],
    bgColor: '#080c18',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REFLECT', 'MIRROR', 'WATER', 'DEPTH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#93C5FD', '#A5B4FC', '#C4B5FD', '#DDD6FE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
