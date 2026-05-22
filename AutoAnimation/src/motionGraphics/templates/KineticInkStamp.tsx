import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InkStampConfig extends KineticBaseConfig {
  inkSpread: number
}

function easeOutBack(t: number): number {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper texture — subtle cross-hatch fibers */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0px, transparent 1px, transparent 8px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0px, transparent 1px, transparent 8px)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Subtle paper warmth vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${0.06 + Math.sin(t * 0.3) * 0.01}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let scale = 1
    let opacity = 1
    let translateY = 0
    let inkBlur = 0
    let inkSpread = 0
    let rotate = 0

    if (phase === 'enter') {
      // Stamp DOWN from above: scale drops from huge, crashes with a micro-overshoot
      const crashed = easeOutBack(Math.min(1, enterProgress * 1.15))
      scale = 2.2 - crashed * 1.2 // 2.2 → 1.0 with slight undershoot
      translateY = -(1 - crashed) * 80 // drops from above
      opacity = Math.min(1, enterProgress * 3)
      // Ink spreads outward on impact
      const impactPhase = Math.max(0, 1 - Math.abs(enterProgress - 0.6) / 0.4)
      inkBlur = impactPhase * 6
      inkSpread = impactPhase * 8
      rotate = (1 - easeOutExpo(enterProgress)) * (index % 2 === 0 ? 3 : -3)
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      // Ink breathes — subtle swell of the spread
      inkSpread = 1 + Math.sin(holdProgress * Math.PI * 2.5) * 1.5
      inkBlur = 0.5 + Math.sin(holdProgress * Math.PI * 2) * 0.4
    } else {
      // Exit: lifts and fades, ink retracts
      const ep = easeInExpo(exitProgress)
      scale = 1 + ep * 0.15
      opacity = 1 - ep
      translateY = -ep * 30
      inkBlur = ep * 4
    }

    const spreadColor = color + 'aa'
    const stampShadow = [
      `0 0 ${inkBlur + inkSpread}px ${spreadColor}`,
      `0 0 ${inkBlur * 2 + inkSpread * 2}px ${color}55`,
      `2px 3px 0px ${color}33`,
      `-1px -1px 0px ${color}22`,
    ].join(', ')

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Ink bleed halo — radial under-wash */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${40 + inkSpread * 3}%`,
            height: `${30 + inkSpread * 2}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse at 50% 55%, ${color}${Math.round(inkSpread * 6)
              .toString(16)
              .padStart(2, '0')} 0%, transparent 70%)`,
            filter: `blur(${inkBlur * 2 + 4}px)`,
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Main stamped text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 11vw, 148px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: stampShadow,
            // Roughen the edges slightly — ink absorption
            WebkitTextStroke: `${0.5 + inkSpread * 0.15}px ${color}88`,
          }}
        >
          {word}
        </div>

        {/* Impact crack — brief flash on stamp */}
        {phase === 'enter' && enterProgress > 0.4 && enterProgress < 0.7 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 55%, ${color}18 0%, transparent 50%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function InkStampComponent(props: MotionGraphicProps<InkStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ink-stamp',
  title: 'Ink Stamp',
  description:
    'Text crashes down like a rubber stamp on paper — scaling in with overshoot, ink bleeds outward on impact, then breathes with a living ink-spread during hold. Paper texture background. Exit lifts clean.',
  tags: ['kinetic', 'typography', 'ink', 'stamp', 'texture', 'paper', 'impact', 'print', 'tactile', 'handcrafted'],
  category: 'captions',
  component: InkStampComponent as any,
  defaultConfig: {
    words: ['BOLD', 'STAMP', 'MARK', 'PRESS'],
    colors: ['#1A1A1A', '#C0392B', '#1A1A1A', '#2C3E50'],
    bgColor: '#F4EFE6',
    cycleDuration: 1.3,
    inkSpread: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOLD', 'STAMP', 'MARK', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A1A1A', '#C0392B', '#1A1A1A', '#2C3E50'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4EFE6', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'inkSpread',
      label: 'Ink Spread',
      type: 'number',
      defaultValue: 8,
      min: 2,
      max: 20,
      group: 'Animation',
    },
  ],
})
