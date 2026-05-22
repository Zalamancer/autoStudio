import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DarkroomConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Red safelight glow that pulses gently
    const redIntensity = 0.06 + Math.sin(frame * 0.03) * 0.02

    // Liquid ripple effect (chemical tray)
    const ripples = Array.from({ length: 4 }).map((_, i) => {
      const speed = 0.02 + i * 0.008
      const phase = frame * speed + i * 1.5
      const x = 50 + Math.sin(phase) * 20
      const y = 50 + Math.cos(phase * 0.7) * 15
      const size = 100 + Math.sin(phase * 0.5) * 30
      return { x, y, size, opacity: 0.02 + Math.sin(phase) * 0.01 }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Red safelight cast from above */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, rgba(180,20,20,${redIntensity}) 0%, transparent 70%)`,
          }}
        />
        {/* Chemical tray ripples */}
        {ripples.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: r.size,
              height: r.size,
              borderRadius: '50%',
              border: `1px solid rgba(180,30,30,${r.opacity})`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {/* Film strip hanging line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: 2,
            background: 'rgba(100,80,60,0.3)',
          }}
        />
        {/* Clothespin clips */}
        {[30, 50, 70].map((x) => (
          <div
            key={x}
            style={{
              position: 'absolute',
              top: 0,
              left: `${x}%`,
              width: 8,
              height: 14,
              background: 'rgba(140,120,80,0.25)',
              borderRadius: '0 0 2px 2px',
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    let opacity = 0
    let contrast = 1
    let blur = 0

    if (phase === 'enter') {
      // Photo developing: starts invisible, gradually appears like chemicals revealing image
      // Slow fade with low contrast that builds to full
      const eased = easeOutCubic(enterProgress)
      // First the faintest ghost, then slowly materializes
      opacity = enterProgress < 0.3
        ? enterProgress / 0.3 * 0.15
        : 0.15 + eased * 0.85
      contrast = 0.3 + eased * 0.7
      blur = (1 - eased) * 3
    } else if (phase === 'hold') {
      opacity = 1
      contrast = 1
      // Subtle chemical shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 6) * 0.03
      opacity = 1 - Math.abs(shimmer)
    } else {
      // Fades back like photo fixer washing out
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      contrast = 1 - eased * 0.5
      blur = eased * 2
    }

    // Sepia tone shift during developing
    const sepiaAmount = phase === 'enter' ? (1 - enterProgress) * 0.6 : 0

    return (
      <>
        {/* Chemical wash glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'clamp(200px, 50vw, 500px)',
            height: 'clamp(80px, 15vw, 150px)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(180,30,30,${opacity * 0.06}) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Developing text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            filter: `contrast(${contrast}) blur(${blur}px) sepia(${sepiaAmount})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color,
            letterSpacing: 6,
            textShadow: `0 0 ${20 * opacity}px rgba(180,30,30,${opacity * 0.3})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Photo paper border (appears during hold) */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(240px, 60vw, 500px)',
              height: 'clamp(100px, 18vw, 180px)',
              border: `1px solid rgba(200,180,150,${0.1 + holdProgress * 0.05})`,
              borderRadius: 2,
            }}
          />
        )}
      </>
    )
  },
}

function DarkroomComponent(props: MotionGraphicProps<DarkroomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-darkroom',
  title: 'Kinetic Darkroom',
  description: 'Text develops like a photo in a darkroom with red safelight, chemical ripples, and gradual reveal from invisible to full contrast',
  tags: ['kinetic', 'typography', 'darkroom', 'photography', 'developing', 'vintage', 'film'],
  category: 'captions',
  component: DarkroomComponent as any,
  defaultConfig: {
    words: ['EXPOSE', 'DEVELOP', 'PRINT', 'FIX'],
    colors: ['#E8D8C0', '#D4C0A0', '#F0E0C8', '#C8B898'],
    bgColor: '#0A0505',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPOSE', 'DEVELOP', 'PRINT', 'FIX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8C0', '#D4C0A0', '#F0E0C8', '#C8B898'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
