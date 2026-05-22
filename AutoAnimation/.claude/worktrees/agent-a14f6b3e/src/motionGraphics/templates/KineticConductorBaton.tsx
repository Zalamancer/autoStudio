import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConductorBatonConfig extends KineticBaseConfig {
  batonColor: string
  stageColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// 4/4 conducting pattern: Down -> In -> Out -> Up
function getConductingPosition(t: number): { x: number; y: number; beat: number } {
  const beat = (t * 4) % 4
  const beatFrac = beat % 1
  const eased = easeOutCubic(beatFrac)
  const currentBeat = Math.floor(beat)

  // Positions normalized to -1..1 range
  // Beat 1 (Down): center-top to center-bottom (strongest)
  // Beat 2 (In/Left): center-bottom to left-middle
  // Beat 3 (Out/Right): left-middle to right-middle
  // Beat 4 (Up): right-middle to center-top
  const positions = [
    { from: { x: 0, y: -0.6 }, to: { x: 0, y: 0.6 } },      // Down
    { from: { x: 0, y: 0.6 }, to: { x: -0.5, y: 0 } },       // In
    { from: { x: -0.5, y: 0 }, to: { x: 0.5, y: 0 } },       // Out
    { from: { x: 0.5, y: 0 }, to: { x: 0, y: -0.6 } },       // Up
  ]

  const pos = positions[currentBeat]
  return {
    x: pos.from.x + (pos.to.x - pos.from.x) * eased,
    y: pos.from.y + (pos.to.y - pos.from.y) * eased,
    beat: currentBeat,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const conducting = getConductingPosition(time * 0.8)

    const centerX = width * 0.5
    const centerY = height * 0.45
    const range = Math.min(width, height) * 0.15

    const tipX = centerX + conducting.x * range
    const tipY = centerY + conducting.y * range

    // Trail points for baton path
    const trailCount = 12
    const trailPoints = Array.from({ length: trailCount }).map((_, i) => {
      const trailTime = time * 0.8 - i * 0.015
      const tp = getConductingPosition(trailTime)
      return {
        x: centerX + tp.x * range,
        y: centerY + tp.y * range,
        opacity: (1 - i / trailCount) * 0.3,
      }
    })

    // Downbeat emphasis flash
    const downbeatPhase = (time * 0.8 * 4) % 4
    const isDownbeat = downbeatPhase < 0.3
    const downbeatFlash = isDownbeat ? (1 - downbeatPhase / 0.3) * 0.15 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Orchestral stage darkness gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 30%, rgba(60,40,20,0.08) 0%, transparent 50%),
              linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)
            `,
          }}
        />

        {/* Stage floor line */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '10%',
            right: '10%',
            height: 1,
            background: 'rgba(200,170,120,0.12)',
          }}
        />

        {/* Music stand silhouettes */}
        {[-0.3, -0.15, 0.15, 0.3].map((offset, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '16%',
              left: `${50 + offset * 100}%`,
              width: 20,
              height: 40,
              background: 'rgba(255,255,255,0.03)',
              transform: 'translateX(-50%)',
              borderRadius: '2px 2px 0 0',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: -15,
                left: '50%',
                width: 2,
                height: 15,
                background: 'rgba(255,255,255,0.03)',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        ))}

        {/* Downbeat flash */}
        {downbeatFlash > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 55%, rgba(255,220,150,${downbeatFlash}) 0%, transparent 40%)`,
            }}
          />
        )}

        {/* Baton trail */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {trailPoints.slice(1).map((pt, i) => {
            const prev = trailPoints[i]
            return (
              <line
                key={i}
                x1={prev.x}
                y1={prev.y}
                x2={pt.x}
                y2={pt.y}
                stroke={`rgba(255,240,200,${pt.opacity})`}
                strokeWidth={2 - i * 0.15}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Baton */}
        <div
          style={{
            position: 'absolute',
            left: tipX - 2,
            top: tipY,
            width: 4,
            height: 50,
            background: 'linear-gradient(to bottom, #FFFFF0, #E8DCC8 20%, #1A1A1A 22%, #1A1A1A 100%)',
            borderRadius: '2px 2px 1px 1px',
            transform: `rotate(${conducting.x * 25 + 15}deg)`,
            transformOrigin: 'top center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 3,
          }}
        />

        {/* Baton tip glow */}
        <div
          style={{
            position: 'absolute',
            left: tipX - 4,
            top: tipY - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(255,250,230,0.6)',
            boxShadow: '0 0 12px rgba(255,240,200,0.4)',
            zIndex: 4,
          }}
        />

        {/* Beat number indicators */}
        {[1, 2, 3, 4].map((beat) => {
          const isActive = conducting.beat === beat - 1
          return (
            <div
              key={beat}
              style={{
                position: 'absolute',
                bottom: '6%',
                left: `${35 + (beat - 1) * 10}%`,
                fontSize: Math.min(width * 0.025, 18),
                fontFamily: "'Georgia', serif",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'rgba(255,220,150,0.7)' : 'rgba(255,255,255,0.15)',
                transition: 'color 0.1s',
              }}
            >
              {beat}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    width,
    height,
    frame = 0,
  }: WordRenderProps) => {
    const time = frame / 30
    const conducting = getConductingPosition(time * 0.8)

    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.7 + 0.3 * eased
      translateY = (1 - eased) * 30
    } else if (phase === 'hold') {
      // Subtle bob following conducting pattern
      translateY = conducting.y * 6
      scale = 1 + (conducting.beat === 0 ? 0.04 : 0) // Slight emphasis on downbeat
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      scale = 1 - 0.2 * exitProgress
      translateY = -exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textShadow: '0 3px 20px rgba(0,0,0,0.6), 0 0 40px rgba(255,220,150,0.1)',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function ConductorBatonComponent(props: MotionGraphicProps<ConductorBatonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-conductor-baton',
  title: 'Kinetic Conductor Baton',
  description:
    "Conductor's baton: text follows the arc of a 4/4 conducting pattern with downbeat emphasis, orchestral stage setting, formal elegance.",
  tags: ['kinetic', 'music', 'conductor', 'baton', 'orchestra', 'classical', 'conducting', 'formal'],
  category: 'captions',
  component: ConductorBatonComponent as any,
  defaultConfig: {
    words: ['MOLTO', 'VIVACE', 'CON', 'BRIO'],
    colors: ['#FFF5E0', '#F5E6C8', '#E8D5B0', '#DCCAA0'],
    bgColor: '#0D0A06',
    cycleDuration: 1.4,
    batonColor: '#FFFFF0',
    stageColor: '#0D0A06',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MOLTO', 'VIVACE', 'CON', 'BRIO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFF5E0', '#F5E6C8', '#E8D5B0', '#DCCAA0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0A06', group: 'Style' },
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
