import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlissandoSweepConfig extends KineticBaseConfig {
  sweepColor: string
  direction: 'ascending' | 'descending'
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Glissando sweep direction alternates
    const cyclePeriod = 2.5
    const cycleT = (time % cyclePeriod) / cyclePeriod
    const ascending = cycleT < 0.5
    const sweepProgress = ascending ? cycleT * 2 : (cycleT - 0.5) * 2

    // Piano key strip at bottom
    const keyCount = 24
    const whiteKeyWidth = width / keyCount
    const blackKeyPattern = [1, 1, 0, 1, 1, 1, 0] // 1 = has black key after

    // Wavy glissando connecting line
    const glissPoints = 40
    const glissLine = Array.from({ length: glissPoints }).map((_, i) => {
      const t = i / (glissPoints - 1)
      const x = width * (0.1 + t * 0.8)
      const baseY = ascending
        ? height * (0.65 - t * 0.35)
        : height * (0.3 + t * 0.35)
      const wave = Math.sin(t * Math.PI * 8 + time * 4) * 6
      const drawT = Math.max(0, Math.min(1, (sweepProgress * 1.5 - t * 0.5)))
      return { x, y: baseY + wave, opacity: drawT }
    })

    // Highlight which keys are being "struck"
    const activeKeyIndex = Math.floor(sweepProgress * keyCount)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ambient glow following sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${10 + sweepProgress * 80}% ${ascending ? 65 - sweepProgress * 35 : 30 + sweepProgress * 35}%, rgba(100,180,255,0.06) 0%, transparent 40%)`,
          }}
        />

        {/* Staff lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              top: height * 0.3 + i * (height * 0.035),
              height: 1,
              background: 'rgba(150,200,255,0.06)',
            }}
          />
        ))}

        {/* Glissando wavy line */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="glissGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4A9EFF" stopOpacity={0.1} />
              <stop offset="50%" stopColor="#80BFFF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#4A9EFF" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* Glissando path */}
          {glissLine.length > 1 && (
            <path
              d={`M ${glissLine[0].x} ${glissLine[0].y} ` +
                glissLine.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="url(#glissGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={1200}
              strokeDashoffset={1200 - sweepProgress * 1200}
            />
          )}

          {/* Sparkle dots along the line */}
          {glissLine.filter((_, i) => i % 4 === 0).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2}
              fill={`rgba(150,200,255,${p.opacity * 0.5})`}
            />
          ))}
        </svg>

        {/* Piano keys strip at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: height * 0.12,
            display: 'flex',
          }}
        >
          {Array.from({ length: keyCount }).map((_, i) => {
            const isActive = Math.abs(i - activeKeyIndex) < 2
            const proximity = 1 - Math.min(1, Math.abs(i - activeKeyIndex) / 3)
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: isActive
                    ? `rgba(100,180,255,${0.15 + proximity * 0.15})`
                    : 'rgba(255,255,255,0.03)',
                  borderRight: '1px solid rgba(0,0,0,0.3)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative',
                }}
              >
                {/* Black key */}
                {blackKeyPattern[i % 7] === 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: -whiteKeyWidth * 0.15,
                      width: whiteKeyWidth * 0.6,
                      height: '60%',
                      background: isActive
                        ? `rgba(60,120,200,${0.2 + proximity * 0.1})`
                        : 'rgba(0,0,0,0.4)',
                      borderRadius: '0 0 2px 2px',
                      zIndex: 2,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Direction arrow indicator */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '8%',
            fontSize: Math.min(width * 0.03, 20),
            color: 'rgba(150,200,255,0.2)',
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
          }}
        >
          {ascending ? 'gliss. \u2197' : 'gliss. \u2198'}
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
    height,
    index,
  }: WordRenderProps) => {
    // Glissando: text slides in diagonally like a pitch sweep
    const ascending = index % 2 === 0
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let scale = 1
    let skewX = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      // Diagonal slide-in from bottom-left (ascending) or top-left (descending)
      const startX = -width * 0.3
      const startY = ascending ? height * 0.2 : -height * 0.2
      translateX = startX * (1 - eased)
      translateY = startY * (1 - eased)
      scale = 0.7 + 0.3 * eased
      skewX = (1 - eased) * (ascending ? -8 : 8)
    } else if (phase === 'hold') {
      // Gentle pitch-like oscillation during hold
      const wave = easeInOutQuad((Math.sin(holdProgress * Math.PI * 3) + 1) / 2)
      translateY = (wave - 0.5) * 10 * (ascending ? -1 : 1)
      skewX = (wave - 0.5) * 2
    } else {
      const exitEased = easeOutCubic(exitProgress)
      opacity = 1 - exitEased
      // Slide out in the continuing direction
      const endX = width * 0.3
      const endY = ascending ? -height * 0.2 : height * 0.2
      translateX = endX * exitEased
      translateY = endY * exitEased
      scale = 1 + 0.2 * exitEased
      skewX = exitEased * (ascending ? 8 : -8)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale}) skewX(${skewX}deg)`,
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
            letterSpacing: '0.06em',
            textShadow: `0 2px 16px rgba(0,0,0,0.5), 0 0 24px rgba(100,180,255,0.15)`,
          }}
        >
          {word}
        </div>

        {/* Wavy glissando line under text */}
        <svg
          style={{
            display: 'block',
            margin: '6px auto 0',
            width: '90%',
            height: 10,
            opacity: phase === 'enter' ? enterProgress * 0.5 : phase === 'exit' ? (1 - exitProgress) * 0.5 : 0.5,
          }}
          viewBox="0 0 200 12"
          preserveAspectRatio="none"
        >
          <path
            d={ascending
              ? 'M 10 10 Q 30 2, 50 8 Q 70 2, 90 6 Q 110 1, 130 5 Q 150 0, 170 3 L 190 1'
              : 'M 10 1 Q 30 8, 50 3 Q 70 9, 90 5 Q 110 10, 130 6 Q 150 11, 170 8 L 190 10'}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.4}
          />
        </svg>
      </div>
    )
  },
}

function GlissandoSweepComponent(props: MotionGraphicProps<GlissandoSweepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glissando-sweep',
  title: 'Kinetic Glissando Sweep',
  description:
    'Glissando sweep: text slides in with a pitch-like diagonal slide (like a piano glissando), wavy connecting line, alternating ascending/descending.',
  tags: ['kinetic', 'music', 'glissando', 'sweep', 'slide', 'piano', 'pitch', 'diagonal'],
  category: 'captions',
  component: GlissandoSweepComponent as any,
  defaultConfig: {
    words: ['SLIDE', 'SWEEP', 'GLIDE', 'SOAR'],
    colors: ['#80BFFF', '#4A9EFF', '#A0D0FF', '#60AAFF'],
    bgColor: '#080C14',
    cycleDuration: 1.3,
    sweepColor: '#4A9EFF',
    direction: 'ascending',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SLIDE', 'SWEEP', 'GLIDE', 'SOAR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#80BFFF', '#4A9EFF', '#A0D0FF', '#60AAFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
