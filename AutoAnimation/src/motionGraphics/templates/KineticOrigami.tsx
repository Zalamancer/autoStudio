import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OrigamiConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height, bgColor }: BackgroundRenderProps) => {
    const time = frame / fps

    // Paper texture with subtle fold lines
    const foldLines = [
      { x1: 0, y1: 30, x2: 100, y2: 70, delay: 0 },
      { x1: 25, y1: 0, x2: 75, y2: 100, delay: 0.5 },
      { x1: 0, y1: 60, x2: 100, y2: 40, delay: 1.0 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Paper grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.015) 2px,
              rgba(255,255,255,0.015) 4px
            )`,
          }}
        />
        {/* Fold crease lines */}
        {foldLines.map((line, i) => {
          const progress = Math.max(0, Math.min(1, (time - line.delay) * 0.8))
          const eased = 1 - Math.pow(1 - progress, 2)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${line.x1}%`,
                top: `${line.y1}%`,
                width: `${Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))}%`,
                height: 1,
                background: `rgba(255,255,255,${0.04 * eased})`,
                transform: `rotate(${Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * (180 / Math.PI)}deg)`,
                transformOrigin: '0 0',
                opacity: eased,
              }}
            />
          )
        })}
        {/* Decorative origami triangles in corners */}
        {[
          { top: '5%', left: '5%', rotate: 0, size: 40 },
          { top: '5%', right: '5%', rotate: 90, size: 35 },
          { bottom: '5%', left: '8%', rotate: 270, size: 30 },
          { bottom: '5%', right: '5%', rotate: 180, size: 38 },
        ].map((tri, i) => {
          const bobY = Math.sin(time * 1.2 + i * 1.5) * 3
          const { rotate: triRotate, size: triSize, ...triPos } = tri
          return (
            <div
              key={`tri-${i}`}
              style={{
                position: 'absolute',
                ...triPos,
                width: 0,
                height: 0,
                borderLeft: `${triSize / 2}px solid transparent`,
                borderRight: `${triSize / 2}px solid transparent`,
                borderBottom: `${triSize}px solid rgba(255,255,255,0.06)`,
                transform: `rotate(${triRotate}deg) translateY(${bobY}px)`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let rotateX = 0
    let rotateY = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Origami unfold: text folds in from a crease
      const foldPhase1 = Math.min(1, enterProgress / 0.5)
      const foldPhase2 = Math.max(0, (enterProgress - 0.4) / 0.6)
      const eased1 = 1 - Math.pow(1 - foldPhase1, 3)
      const eased2 = 1 - Math.pow(1 - foldPhase2, 2)

      rotateX = (1 - eased1) * -90
      rotateY = (1 - eased1) * 45
      opacity = eased1
      scale = 0.7 + eased2 * 0.3
      translateY = (1 - eased1) * 30
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle paper flutter
      rotateX = Math.sin(Date.now() * 0.002 + index) * 1.5
      rotateY = Math.cos(Date.now() * 0.0015 + index * 0.5) * 1
    } else {
      // Fold back up and out
      const eased = exitProgress * exitProgress
      rotateX = eased * 90
      rotateY = eased * -45
      opacity = 1 - eased
      scale = 1 - eased * 0.3
      translateY = eased * -20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
          opacity,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Paper backing */}
        <div
          style={{
            position: 'absolute',
            inset: '-15% -10%',
            background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transform: 'translateZ(-2px)',
          }}
        />
        {/* Fold line on text */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(255,255,255,0.08)`,
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function OrigamiComponent(props: MotionGraphicProps<OrigamiConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-origami',
  title: 'Kinetic Origami',
  description:
    'Text folds in like origami paper with 3D perspective rotation, paper backing, crease lines, and gentle flutter hold',
  tags: ['kinetic', 'typography', 'origami', 'paper', 'fold', 'japanese', '3d', 'craft'],
  category: 'captions',
  component: OrigamiComponent as any,
  defaultConfig: {
    words: ['FOLD', 'CRAFT', 'PAPER', 'ART'],
    colors: ['#F0E6D3', '#E8D5C0', '#D4C4B0', '#C8B8A0'],
    bgColor: '#1A1510',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOLD', 'CRAFT', 'PAPER', 'ART'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F0E6D3', '#E8D5C0', '#D4C4B0', '#C8B8A0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
