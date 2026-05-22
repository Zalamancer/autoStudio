import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DamReleaseConfig extends KineticBaseConfig {
  gateCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Dam / floodgate: vertical gate panels lift upward, text rushes through the gap below
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const config = (globalThis as any).__damConfig ?? { gateCount: 3 }
    const gateCount = config.gateCount ?? 3
    const gateW = width / gateCount

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dam gate structure lines */}
        {Array.from({ length: gateCount - 1 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i + 1) * gateW,
              top: 0,
              width: 3,
              height: '100%',
              background: 'rgba(140,120,90,0.4)',
            }}
          />
        ))}
        {/* Horizontal sill at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8%',
            background: 'rgba(100,80,50,0.5)',
          }}
        />
        {/* Water surface suggestion above sill */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(100,180,220,0.2)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__damConfig ?? { gateCount: 3 }
    const gateCount = Math.max(1, Math.min(6, config.gateCount ?? 3))

    // Gates lift upward — staggered by gate index
    // openProgress per gate: 0 = gate fully down (blocking), 1 = gate fully raised
    const globalOpen = phase === 'enter'
      ? easeOutExpo(enterProgress)
      : phase === 'hold'
      ? 1
      : 1 - easeInQuad(exitProgress)

    const gateW = width / gateCount
    // Gate height = full height (gate covers full column when closed)
    const gateH = height

    const gateElements = []
    for (let i = 0; i < gateCount; i++) {
      // Stagger: center gates open last for dramatic effect
      const distFromCenter = Math.abs(i - (gateCount - 1) / 2) / ((gateCount - 1) / 2 || 1)
      const staggerDelay = (1 - distFromCenter) * 0.35
      const gateOpen = Math.max(0, Math.min(1, (globalOpen - staggerDelay) / (1 - staggerDelay)))

      // Gate slides up: translateY from 0 to -gateH
      const liftY = -(gateH * gateOpen)

      gateElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * gateW,
            top: 0,
            width: gateW - 1,
            height: gateH,
            transform: `translateY(${liftY.toFixed(1)}px)`,
            background: `linear-gradient(180deg, rgba(140,120,80,0.92) 0%, rgba(100,80,50,0.95) 80%, rgba(80,60,30,0.98) 100%)`,
            borderLeft: i > 0 ? '1px solid rgba(200,180,120,0.2)' : 'none',
            boxShadow: '2px 0 8px rgba(0,0,0,0.4)',
          }}
        />,
      )
    }

    // Text revealed as gates rise — clip: text only shows in the cleared gap area
    // Since gates lift upward, text appears from the top of the cleared area
    // We let text show fully once any gate has opened enough
    const textOpacity = Math.min(1, globalOpen * 2.5)
    // Text clip: horizontal strip that corresponds to region below lifted gates
    // As global open → 1, reveal grows from bottom upward
    const revealTop = (1 - globalOpen) * height
    const textClip = globalOpen > 0.01
      ? `polygon(0% ${(revealTop / height * 100).toFixed(1)}%, 100% ${(revealTop / height * 100).toFixed(1)}%, 100% 100%, 0% 100%)`
      : 'polygon(50% 100%, 50% 100%, 50% 100%)'

    return (
      <>
        {/* Text rushing through the opened gate */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            clipPath: textClip,
          }}
        >
          {word}
        </div>
        {/* Gate panels on top */}
        {gateElements}
        {/* Gate channel guides (vertical rails) */}
        {Array.from({ length: gateCount + 1 }, (_, i) => (
          <div
            key={`rail-${i}`}
            style={{
              position: 'absolute',
              left: i * gateW - 2,
              top: 0,
              width: 4,
              height: '100%',
              background: 'rgba(180,150,90,0.3)',
            }}
          />
        ))}
      </>
    )
  },
}

function DamReleaseComponent(props: MotionGraphicProps<DamReleaseConfig>) {
  ;(globalThis as any).__damConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dam-release',
  title: 'Kinetic Dam Release',
  description: 'Dam floodgate panels lift upward with staggered timing, text rushes through the opening like released water',
  tags: ['kinetic', 'typography', 'dam', 'floodgate', 'gate', 'industrial', 'reveal', 'mechanical', 'aperture'],
  category: 'captions',
  component: DamReleaseComponent as any,
  defaultConfig: {
    words: ['FLOOD', 'SURGE', 'RUSH', 'POWER'],
    colors: ['#A0C8E8', '#78B0D8', '#B8D8F0', '#60A0C8'],
    bgColor: '#0a1520',
    cycleDuration: 1.6,
    gateCount: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLOOD', 'SURGE', 'RUSH', 'POWER'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#A0C8E8', '#78B0D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
    {
      key: 'gateCount',
      label: 'Gate Panels',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      group: 'Animation',
    },
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
