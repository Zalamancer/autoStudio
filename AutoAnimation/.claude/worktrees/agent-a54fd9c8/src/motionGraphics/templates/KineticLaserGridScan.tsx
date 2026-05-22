import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserGridScanConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Laser grid scan: a grid of laser beams sweeps across, revealing text where it hits
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Laser grid background — dim persistent grid
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal laser lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: `${(i + 1) * 11}%`,
              left: 0,
              right: 0,
              height: 1,
              background: `rgba(0,255,180,${0.04 + Math.sin(time * 1.5 + i * 0.7) * 0.02})`,
            }}
          />
        ))}
        {/* Vertical laser lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: `${(i + 1) * 11}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `rgba(0,255,180,${0.04 + Math.cos(time * 1.2 + i * 0.5) * 0.02})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Scan position — horizontal scan line sweeps top to bottom revealing text
    const scanY =
      phase === 'enter'
        ? enterProgress * 100 // scan sweeps 0% to 100% top-to-bottom during entry
        : phase === 'hold'
          ? 100 + Math.sin(time * 0.8) * 5 // hovering at bottom with slight oscillation
          : 100 + exitProgress * 20 // scan retreats off-screen

    // Clip the text reveal based on scan position
    const revealProgress = phase === 'enter' ? eased : phase === 'exit' ? 1 - easeOutExpo(exitProgress) : 1

    // Scan line glow
    const scanLineOpacity = phase === 'enter' ? 1 : phase === 'hold' ? 0.3 : 0.5

    // Laser hit glow on revealed portions
    const laserGlow =
      phase === 'hold'
        ? `0 0 12px rgba(0,255,180,0.3), 0 0 24px rgba(0,255,180,0.12)`
        : phase === 'enter'
          ? `0 0 ${(1 - eased) * 8 + 8}px rgba(0,255,180,0.4)`
          : 'none'

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Text revealed by scan */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'hidden',
            clipPath: `inset(0 0 ${(1 - revealProgress) * 100}% 0)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'monospace'",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: laserGlow,
            }}
          >
            {word}
          </div>
        </div>

        {/* Scan line itself */}
        <div
          style={{
            position: 'absolute',
            top: `${scanY}%`,
            left: '5%',
            right: '5%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(0,255,180,${scanLineOpacity}), rgba(0,255,180,${scanLineOpacity}), transparent)`,
            boxShadow: `0 0 8px rgba(0,255,180,${scanLineOpacity * 0.8}), 0 0 16px rgba(0,255,180,${scanLineOpacity * 0.4})`,
            transform: 'translateY(-50%)',
          }}
        />

        {/* Scan line leading edge — brighter dot */}
        <div
          style={{
            position: 'absolute',
            top: `${scanY}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00FFB4',
            boxShadow: '0 0 12px rgba(0,255,180,0.8)',
            opacity: scanLineOpacity,
          }}
        />
      </div>
    )
  },
}

function LaserGridScanComponent(props: MotionGraphicProps<LaserGridScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-grid-scan',
  title: 'Kinetic Laser Grid Scan',
  description:
    'Laser scan line sweeps top-to-bottom revealing text as it passes — a persistent laser grid glows in the background and the scan line leaves a glowing trail',
  tags: ['kinetic', 'typography', 'laser', 'scan', 'projection', 'grid', 'reveal', 'sci-fi'],
  category: 'captions',
  component: LaserGridScanComponent as any,
  defaultConfig: {
    words: ['SCAN', 'DETECT', 'LOCK', 'TARGET'],
    colors: ['#00FFB4', '#00EEA0', '#40FFC0', '#00DD90'],
    bgColor: '#020A08',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SCAN', 'DETECT', 'LOCK', 'TARGET'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB4', '#00EEA0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020A08', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
