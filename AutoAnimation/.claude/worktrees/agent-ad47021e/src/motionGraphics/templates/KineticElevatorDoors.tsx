import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// R8 rewrite: two overflow:hidden door panels slide apart to reveal per-character text.
// Quality gates: overflow:hidden core, mixBlendMode, clamp(), custom easing,
// alive hold, concept-driven exit (doors close back over text), per-char, animated bg.
interface ElevatorDoorsConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const pulse = Math.sin(t * 1.8) * 0.04
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, hsl(220,15%,${12 + pulse * 100}%) 0%, ${bgColor} 100%)`,
        }}
      >
        {/* Elevator frame border */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '4%',
            right: '4%',
            bottom: '6%',
            border: '3px solid rgba(160,165,180,0.25)',
            borderRadius: 3,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          }}
        />
        {/* Floor indicator glow */}
        <div
          style={{
            position: 'absolute',
            top: '2%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 6,
            borderRadius: 3,
            background: `rgba(255,180,60,${0.4 + Math.sin(t * 3) * 0.2})`,
            boxShadow: `0 0 14px rgba(255,180,60,${0.2 + Math.sin(t * 3) * 0.1})`,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Vertical center seam (the door crack) */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            bottom: '6%',
            left: '50%',
            width: 1,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    // Door opening: 0 = fully closed, 1 = fully open
    let doorOpen = 0
    if (phase === 'enter') {
      doorOpen = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      doorOpen = 1
    } else {
      // Concept-driven exit: doors CLOSE back over the text
      doorOpen = 1 - easeInExpo(exitProgress)
    }

    // Door travel: each panel covers 46% of width; they retract toward edges
    const doorWidthPct = 46
    const travel = doorOpen * doorWidthPct // how far each door has slid open

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Per-character text layer — centered behind doors */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 'clamp(2px, 0.4vw, 6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {letters.map((letter, i) => {
            const phaseOffset = (i / totalLetters) * Math.PI * 2
            // Hold: per-character breathing float
            const floatY = phase === 'hold'
              ? Math.sin(holdProgress * Math.PI * 5 + phaseOffset) * 4
              : 0
            const glowSize = phase === 'hold'
              ? 10 + Math.sin(holdProgress * Math.PI * 4 + phaseOffset) * 5
              : 8

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 700,
                  color,
                  textShadow: `0 0 ${glowSize}px ${color}55`,
                  transform: `translateY(${floatY}px)`,
                  display: 'inline-block',
                  mixBlendMode: 'screen' as const,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>

        {/* LEFT DOOR — overflow:hidden panel that masks text */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            bottom: '6%',
            left: '4%',
            width: `${doorWidthPct - travel}%`,
            overflow: 'hidden',
            background: 'linear-gradient(90deg, rgba(65,68,82,0.96) 0%, rgba(85,88,105,0.94) 85%, rgba(105,108,125,0.92) 100%)',
            borderRight: '4px solid rgba(170,173,190,0.5)',
            boxShadow: '3px 0 12px rgba(0,0,0,0.4)',
          }}
        >
          {/* Brushed metal texture */}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${10 + i * 8}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(255,255,255,${0.02 + (i % 3) * 0.01})`,
              }}
            />
          ))}
          {/* Panel inset */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '15%',
              right: '20%',
              bottom: '10%',
              border: '1px solid rgba(120,123,140,0.25)',
              borderRadius: 2,
            }}
          />
        </div>

        {/* RIGHT DOOR — overflow:hidden panel that masks text */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            bottom: '6%',
            right: '4%',
            width: `${doorWidthPct - travel}%`,
            overflow: 'hidden',
            background: 'linear-gradient(270deg, rgba(65,68,82,0.96) 0%, rgba(85,88,105,0.94) 85%, rgba(105,108,125,0.92) 100%)',
            borderLeft: '4px solid rgba(170,173,190,0.5)',
            boxShadow: '-3px 0 12px rgba(0,0,0,0.4)',
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${10 + i * 8}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(255,255,255,${0.02 + (i % 3) * 0.01})`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '20%',
              right: '15%',
              bottom: '10%',
              border: '1px solid rgba(120,123,140,0.25)',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Bottom threshold */}
        <div
          style={{
            position: 'absolute',
            bottom: '5.5%',
            left: '4%',
            right: '4%',
            height: 4,
            background: 'linear-gradient(180deg, rgba(100,103,120,0.4), rgba(60,62,78,0.6))',
          }}
        />
      </div>
    )
  },
}

function ElevatorDoorsComponent(props: MotionGraphicProps<ElevatorDoorsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elevator-doors',
  title: 'Kinetic Elevator Doors',
  description: 'Two brushed-metal elevator door panels slide apart via overflow:hidden to reveal per-character text with glow; doors close back for concept-driven exit',
  tags: ['kinetic', 'typography', 'elevator', 'doors', 'reveal', 'split', 'contained', 'masked'],
  category: 'captions',
  component: ElevatorDoorsComponent as any,
  defaultConfig: {
    words: ['LOBBY', 'FLOOR', 'GOING', 'UP'],
    colors: ['#FF6B35', '#F7C948', '#FFFFFF', '#4ECDC4'],
    bgColor: '#0e0e18',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOBBY', 'FLOOR', 'GOING', 'UP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7C948', '#FFFFFF', '#4ECDC4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0e18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
