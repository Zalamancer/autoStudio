import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SafelightGlowConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * KineticSafelightGlow
 * Photographic darkroom lit only by a dim red safelight.
 * Letters materialise one-by-one out of the darkness, each arriving with a
 * diffuse red bloom halo that slowly contracts as the letter "fixes" into crisp
 * form. The whole word gently breathes with the safelight's AC flicker.
 * On exit, letters dissolve back into the red ambiance from right to left.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Safelight flicker — subtle AC ripple at ~8 Hz simulation
    const flicker = 0.88 + Math.sin(t * 50.3) * 0.04 + Math.sin(t * 13.7) * 0.08
    // Slow warm pulse (enlarger timer?)
    const warmPulse = 0.05 + Math.sin(t * 0.6) * 0.015

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Safelight source — upper-right corner */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(220,30,10,${(0.22 + warmPulse) * flicker}) 0%, rgba(180,10,0,0.08) 50%, transparent 75%)`,
          pointerEvents: 'none',
        }} />
        {/* Diffuse room fill from safelight */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 80% 10%, rgba(140,20,5,${0.09 * flicker}) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        {/* Floor-level shadow pools */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)',
        }} />
        {/* Safelight lamp silhouette dot */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 12,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: `rgba(255,60,20,${0.55 * flicker})`,
          boxShadow: `0 0 12px 6px rgba(220,30,10,${0.3 * flicker})`,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const chars = word.split('')
    const charCount = chars.length
    const t = (frame ?? 0) / (fps ?? 30)

    // AC safelight flicker on the whole word
    const flicker = 0.95 + Math.sin(t * 50.3) * 0.025 + Math.sin(t * 13.7) * 0.025

    const charElements = chars.map((ch, ci) => {
      // Staggered entry: each letter starts appearing after previous
      const staggerDelay = (ci / charCount) * 0.6   // 0..0.6 of enter phase
      const charP = phase === 'enter'
        ? Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (0.4)))
        : 1
      const entryEased = easeOutBack(Math.min(charP, 1))

      // Staggered exit (right to left)
      const exitDelay = ((charCount - 1 - ci) / charCount) * 0.5
      const exitCharP = phase === 'exit'
        ? Math.max(0, Math.min(1, (exitProgress - exitDelay) / 0.5))
        : 0
      const exitEased = easeInCubic(exitCharP)

      const charOpacity = phase === 'enter'
        ? charP * flicker
        : phase === 'exit'
          ? (1 - exitEased) * flicker
          : flicker

      // Each letter drops in slightly from above on enter
      const charY = phase === 'enter' ? (1 - entryEased) * 18 : 0
      const charScale = phase === 'enter' ? (0.6 + entryEased * 0.4) : 1

      // Bloom halo radius: large when letter just arrives, shrinks as it "fixes"
      const bloomSize = phase === 'enter'
        ? Math.max(0, (1 - charP) * 40 + 10)
        : 10
      const bloomOpacity = phase === 'enter'
        ? Math.max(0, (1 - charP) * 0.5)
        : phase === 'exit'
          ? exitCharP * 0.35
          : 0.06 + Math.sin(t * 0.8 + ci * 0.4) * 0.03

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translateY(${charY}px) scale(${charScale})`,
          }}
        >
          {/* Red bloom behind each letter */}
          <span style={{
            position: 'absolute',
            inset: `-${bloomSize}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(220,30,10,${bloomOpacity}) 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>{ch === ' ' ? '\u00A0' : ch}</span>
        </span>
      )
    })

    // During hold: a faint red aura pulses behind the whole word
    const holdAuraOpacity = phase === 'hold'
      ? 0.06 + Math.sin(holdProgress * Math.PI * 4 + t) * 0.03
      : 0

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        {/* Whole-word red aura during hold */}
        {holdAuraOpacity > 0 && (
          <div style={{
            position: 'absolute',
            inset: -30,
            background: `radial-gradient(ellipse, rgba(200,20,5,${holdAuraOpacity}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(38px, 9vw, 130px)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          display: 'flex',
          position: 'relative',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function SafelightGlowComponent(props: MotionGraphicProps<SafelightGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-safelight-glow',
  title: 'Safelight Glow',
  description: 'Letters emerge one by one from darkroom darkness, each arriving with a diffuse red safelight bloom halo that contracts as the letter fixes into sharp form. Exits right-to-left back into the red ambiance.',
  tags: ['kinetic', 'typography', 'darkroom', 'safelight', 'photography', 'glow', 'red', 'analog', 'stagger'],
  category: 'captions',
  component: SafelightGlowComponent as any,
  defaultConfig: {
    words: ['SAFELIGHT', 'DARKROOM', 'CHEMISTRY', 'SILVER'],
    colors: ['#f5ece0', '#ede0cc', '#f8f0e4', '#e8ddd0'],
    bgColor: '#060202',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SAFELIGHT', 'DARKROOM', 'CHEMISTRY', 'SILVER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f5ece0', '#ede0cc', '#f8f0e4', '#e8ddd0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060202', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
