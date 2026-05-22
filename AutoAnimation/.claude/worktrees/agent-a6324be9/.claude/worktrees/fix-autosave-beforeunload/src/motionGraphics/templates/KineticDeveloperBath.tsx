import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeveloperBathConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Chemical wash wave across the tray
    const waveX = 50 + Math.sin(time * 1.2) * 30
    // Amber safelight glow oscillation
    const safelightPulse = 0.6 + Math.sin(time * 0.5) * 0.1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Amber safelight overhead glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, rgba(200,120,30,${safelightPulse * 0.08}), transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Developer tray edges — slightly raised liquid surface */}
        <div
          style={{
            position: 'absolute',
            inset: 20,
            border: '1px solid rgba(200,120,30,0.08)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        {/* Chemical solution wave — gentle rocking of the tray */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${waveX - 15}%`,
            width: '30%',
            background: 'linear-gradient(90deg, transparent, rgba(200,160,80,0.04), rgba(200,160,80,0.06), rgba(200,160,80,0.04), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Liquid surface ripple highlights */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(${90 + Math.sin(time * 0.8) * 5}deg, transparent, transparent 8px, rgba(200,150,60,0.015) 8px, rgba(200,150,60,0.015) 9px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Warm vignette from safelight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(10,5,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 83 + 37
    let opacity = 0
    let developerWash = 0

    if (phase === 'enter') {
      // Slow chemical development — image emerges from blank paper
      // First very faint, then contrast builds dramatically in the last 40%
      if (enterProgress < 0.6) {
        // Ghost image forming — barely visible
        opacity = enterProgress / 0.6 * 0.2
      } else {
        // Contrast builds rapidly as developer activates the silver halide
        const buildPhase = (enterProgress - 0.6) / 0.4
        opacity = 0.2 + buildPhase * 0.8
      }
      // Chemical wash wave influence
      developerWash = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle liquid surface motion
      developerWash = Math.sin(f * 0.06 + seed) * 0.8
    } else {
      // Over-development / bleaching if left too long
      opacity = 1 - exitProgress * 0.9
      developerWash = exitProgress * 2
    }

    // Tray rocking causes subtle text shift
    const rockX = Math.sin(f * 0.04 + seed) * 1.5
    const rockY = Math.cos(f * 0.035 + seed) * 0.8

    return (
      <>
        {/* Under-developed ghost — barely visible warm-tone preview */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rockX}px), calc(-50% + ${rockY}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(180,140,80,0.1)',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: phase === 'enter' && enterProgress < 0.5 ? (enterProgress / 0.5) * 0.6 : 0,
            filter: 'blur(4px)',
          }}
        >
          {word}
        </div>
        {/* Main developed text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rockX + developerWash}px), calc(-50% + ${rockY}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity,
            textShadow: '0 0 6px rgba(200,140,60,0.2)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DeveloperBathComponent(props: MotionGraphicProps<DeveloperBathConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-developer-bath',
  title: 'Kinetic Developer Bath',
  description: 'Darkroom developing tray: text emerges slowly from blank paper as chemical developer washes over under warm amber safelight',
  tags: ['kinetic', 'typography', 'darkroom', 'developer', 'chemical', 'photography', 'analog', 'safelight'],
  category: 'captions',
  component: DeveloperBathComponent as any,
  defaultConfig: {
    words: ['DEVELOP', 'EMERGE', 'REVEAL', 'PRINT'],
    colors: ['#e8dcc8', '#d8ccb8', '#f0e4d0', '#c8bcaa'],
    bgColor: '#0e0804',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEVELOP', 'EMERGE', 'REVEAL', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8dcc8', '#d8ccb8', '#f0e4d0', '#c8bcaa'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0804', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
