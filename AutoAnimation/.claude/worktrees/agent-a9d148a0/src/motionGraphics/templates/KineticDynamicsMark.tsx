import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DynamicsMarkConfig extends KineticBaseConfig {
  hairpinColor: string
  markingColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Crescendo/decrescendo cycle
    const cyclePeriod = 3.0
    const cycleT = (time % cyclePeriod) / cyclePeriod
    // First half: crescendo (pp -> ff), second half: decrescendo (ff -> pp)
    const dynamicLevel = cycleT < 0.5 ? cycleT * 2 : 2 - cycleT * 2

    // Hairpin wedge dimensions
    const wedgeWidth = width * 0.6
    const wedgeMaxHeight = height * 0.12
    const wedgeX = width * 0.2
    const wedgeY = height * 0.72

    // Dynamic markings along the bottom
    const markings = ['pp', 'p', 'mp', 'mf', 'f', 'ff']
    const activeMarkIndex = Math.floor(dynamicLevel * (markings.length - 1))

    // Background pulse intensity tied to dynamic level
    const pulseIntensity = dynamicLevel * 0.08

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dynamic intensity glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(180,140,60,${pulseIntensity}) 0%, transparent 60%)`,
          }}
        />

        {/* Staff lines subtle */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: height * 0.35 + i * (height * 0.04),
              height: 1,
              background: 'rgba(200,180,140,0.1)',
            }}
          />
        ))}

        {/* Crescendo hairpin wedge < */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Crescendo wedge (opening right) */}
          <line
            x1={wedgeX}
            y1={wedgeY}
            x2={wedgeX + wedgeWidth * dynamicLevel}
            y2={wedgeY - wedgeMaxHeight * dynamicLevel}
            stroke="rgba(200,170,100,0.35)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={wedgeX}
            y1={wedgeY}
            x2={wedgeX + wedgeWidth * dynamicLevel}
            y2={wedgeY + wedgeMaxHeight * dynamicLevel}
            stroke="rgba(200,170,100,0.35)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Moving vertical "current position" marker */}
          <line
            x1={wedgeX + wedgeWidth * dynamicLevel}
            y1={wedgeY - wedgeMaxHeight * dynamicLevel - 5}
            x2={wedgeX + wedgeWidth * dynamicLevel}
            y2={wedgeY + wedgeMaxHeight * dynamicLevel + 5}
            stroke="rgba(255,220,120,0.4)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        </svg>

        {/* Dynamic marking labels */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '10%',
            right: '10%',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {markings.map((mark, i) => {
            const isActive = i === activeMarkIndex
            return (
              <div
                key={mark}
                style={{
                  fontSize: Math.min(width * 0.035, 24),
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: 'italic',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'rgba(255,220,120,0.8)' : 'rgba(200,180,140,0.25)',
                  textShadow: isActive ? '0 0 12px rgba(255,220,120,0.3)' : 'none',
                }}
              >
                {mark}
              </div>
            )
          })}
        </div>

        {/* Volume meter bars */}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: '20%',
            bottom: '30%',
            width: 6,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: 2,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const barLevel = i / 10
            const isLit = barLevel < dynamicLevel
            const barColor = i >= 8 ? '#CC3333' : i >= 6 ? '#CCAA33' : '#66AA44'
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: isLit ? barColor : 'rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  opacity: isLit ? 0.6 : 0.3,
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
  }: WordRenderProps) => {
    // Core effect: text starts tiny (pp) and crescendos to huge (ff)
    let opacity = 1
    let scale = 0.3
    let letterSpacing = '0em'

    if (phase === 'enter') {
      // pp -> mf: text grows from tiny to medium
      const eased = easeOutExpo(enterProgress)
      opacity = 0.4 + 0.6 * eased
      scale = 0.2 + 0.6 * eased
      letterSpacing = `${0.02 + 0.06 * eased}em`
    } else if (phase === 'hold') {
      // mf -> ff: continue growing to full fortissimo
      const growPhase = easeOutExpo(Math.min(1, holdProgress * 2))
      scale = 0.8 + 0.5 * growPhase
      letterSpacing = `${0.08 + 0.04 * growPhase}em`
      opacity = 1
    } else {
      // ff -> pp: diminuendo exit
      const exitEased = easeOutExpo(exitProgress)
      scale = 1.3 - 1.0 * exitEased
      opacity = 1 - exitEased
      letterSpacing = `${0.12 - 0.1 * exitEased}em`
    }

    const dynamicLabel = phase === 'enter'
      ? (enterProgress < 0.5 ? 'pp' : 'p')
      : phase === 'hold'
        ? (holdProgress < 0.3 ? 'mf' : 'f')
        : 'ff'

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Georgia', 'Palatino', serif",
            letterSpacing,
            textShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 ${scale * 20}px rgba(255,220,120,${scale * 0.15})`,
          }}
        >
          {word}
        </div>

        {/* Dynamic marking underneath */}
        <div
          style={{
            marginTop: 8,
            fontSize: 'clamp(14px, 3vw, 28px)',
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            color: 'rgba(200,180,140,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          {dynamicLabel}
        </div>
      </div>
    )
  },
}

function DynamicsMarkComponent(props: MotionGraphicProps<DynamicsMarkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dynamics-mark',
  title: 'Kinetic Dynamics Mark',
  description:
    'Musical dynamics: text enters pp (pianissimo/tiny) then crescendo grows to ff (fortissimo/huge) with hairpin wedge symbol and volume indication.',
  tags: ['kinetic', 'music', 'dynamics', 'crescendo', 'fortissimo', 'pianissimo', 'volume', 'expression'],
  category: 'captions',
  component: DynamicsMarkComponent as any,
  defaultConfig: {
    words: ['RISE', 'GROW', 'SWELL', 'ROAR'],
    colors: ['#F5E6C8', '#FFD98E', '#FFC857', '#FFAA22'],
    bgColor: '#0E0B06',
    cycleDuration: 1.5,
    hairpinColor: '#C8A96E',
    markingColor: '#F5E6C8',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RISE', 'GROW', 'SWELL', 'ROAR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5E6C8', '#FFD98E', '#FFC857', '#FFAA22'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0B06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
