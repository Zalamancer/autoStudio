import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKMoireConfig extends KineticBaseConfig {
  angleIntensity: number
}

// CMYK channels with their standard halftone screen angles
const CMYK_SCREENS = [
  { color: '#00FFFF', label: 'C', targetAngle: 15, startAngle: -60 },
  { color: '#FF00FF', label: 'M', targetAngle: 75, startAngle: 150 },
  { color: '#FFFF00', label: 'Y', targetAngle: 0, startAngle: -90 },
  { color: '#000000', label: 'K', targetAngle: 45, startAngle: 120 },
]

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const grainOffset = Math.floor(t * 8) * 1.3
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle 0.5px, rgba(255,255,255,0.03) 100%, transparent 100%)`,
            backgroundSize: '3px 3px',
            backgroundPosition: `${grainOffset}px ${grainOffset * 0.5}px`,
          }}
        />
        {/* Halftone screen angle reference marks */}
        <div style={{ position: 'absolute', top: 6, left: 6, opacity: 0.15 }}>
          {CMYK_SCREENS.map((s, i) => (
            <div
              key={s.label}
              style={{
                fontFamily: 'monospace',
                fontSize: 8,
                color: s.color === '#000000' ? '#666' : s.color,
                lineHeight: 1.4,
              }}
            >
              {s.label}: {s.targetAngle}deg
            </div>
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_SCREENS.map((ch, idx) => {
          const isKey = ch.label === 'K'

          let angle = ch.startAngle
          let channelOpacity = 1

          if (phase === 'enter') {
            // Rotate from extreme angles to proper screen angles
            const delay = idx * 0.1
            const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
            const ep = easeOutElastic(p)
            angle = ch.startAngle + (ch.targetAngle - ch.startAngle) * ep
            channelOpacity = Math.min(1, p * 2.5)
          } else if (phase === 'hold') {
            // Very slow angle drift creating living moire
            const drift = Math.sin(holdProgress * Math.PI * 2 + idx * 1.2) * 1.5
            angle = ch.targetAngle + drift
            channelOpacity = isKey ? 1 : 0.85
          } else {
            // Spin to extreme angles and fade
            const delay = (3 - idx) * 0.08
            const p = Math.max(0, Math.min(1, (exitProgress - delay) / (1 - delay)))
            const ep = easeInCubic(p)
            const exitAngle = ch.startAngle + (ch.startAngle > 0 ? 180 : -180)
            angle = ch.targetAngle + (exitAngle - ch.targetAngle) * ep
            channelOpacity = 1 - easeOutQuint(p)
          }

          return (
            <div
              key={ch.label}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                mixBlendMode: isKey ? 'normal' : 'multiply',
                opacity: channelOpacity,
                transformOrigin: 'center center',
              }}
            >
              <span style={{ ...sharedFont, color: ch.color, display: 'block' }}>
                {word}
              </span>
            </div>
          )
        })}

        {/* Moire interference overlay — appears when angles are close */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                ${45 + Math.sin(t * 0.8) * 3}deg,
                transparent,
                transparent 3px,
                rgba(255,255,255,0.015) 3px,
                rgba(255,255,255,0.015) 4px
              )`,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function CMYKMoireComponent(props: MotionGraphicProps<CMYKMoireConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-moire',
  title: 'Kinetic CMYK Moire',
  description:
    'CMYK layers offset at different angles create moire interference patterns. On enter, layers rotate from extreme angles to their proper screen angles (C=15deg, M=75deg, Y=0deg, K=45deg). Hold drifts angles slowly for a living moire. Exit spins layers away.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'moire', 'halftone', 'screen', 'multiply', 'rotation', 'interference'],
  category: 'captions',
  component: CMYKMoireComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
    angleIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'angleIntensity', label: 'Angle Intensity', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
