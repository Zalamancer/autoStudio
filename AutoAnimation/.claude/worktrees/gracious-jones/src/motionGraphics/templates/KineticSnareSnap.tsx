import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SnareSnapConfig extends KineticBaseConfig {
  snapColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Snare on 2 & 4 in 4/4 at 120 BPM — 1 Hz backbeat feel but sharp
    const snapFreq = 1.5
    const snapPhase = (time * snapFreq) % 1
    // Very sharp transient, crackle feel
    const snap = snapPhase < 0.03 ? 1.0 : Math.pow(1 - (snapPhase - 0.03) / 0.97, 6)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* White flash across full horizontal band on snap */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '35%',
            height: '30%',
            background: `linear-gradient(to right,
              transparent 0%,
              rgba(255,255,255,${snap * 0.12}) 20%,
              rgba(255,255,255,${snap * 0.25}) 50%,
              rgba(255,255,255,${snap * 0.12}) 80%,
              transparent 100%)`,
          }}
        />
        {/* Horizontal crack lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const delay = i * 0.04
          const lp = Math.max(0, (time * snapFreq - delay) % 1)
          const lineOpacity = Math.max(0, (1 - lp * 8) * snap)
          const lineY = 30 + i * 8
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${10 + i * 3}%`,
                right: `${10 + i * 2}%`,
                top: `${lineY}%`,
                height: 1,
                background: `rgba(255,220,180,${lineOpacity * 0.8})`,
                transform: `scaleX(${snap})`,
                transformOrigin: 'center',
              }}
            />
          )
        })}
        {/* Rim shot sparks */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2
          const dist = 0.2 + snap * 0.35
          const px = 0.5 + Math.cos(angle) * dist
          const py = 0.5 + Math.sin(angle) * dist * 0.6
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${px * 100}%`,
                top: `${py * 100}%`,
                width: 3 + snap * 3,
                height: 3 + snap * 3,
                borderRadius: '50%',
                background: `rgba(255,230,180,${snap * 0.9})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Dark vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 35%, ${bgColor}BB 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    let opacity = 1
    let scale = 1
    let rotate = 0
    let translateX = 0

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 5)
      scale = 0.4 + 0.6 * eased
      rotate = (1 - enterProgress) * -12
      translateX = (1 - eased) * -60
    } else if (phase === 'hold') {
      // Snare crack: lateral snap jitter
      const snapFreq = 1.5
      const snapPhase = (time * snapFreq) % 1
      const snap = snapPhase < 0.03 ? 1.0 : Math.pow(1 - (snapPhase - 0.03) / 0.97, 5)
      translateX = snap * 8
      scale = 1 + snap * 0.08
      rotate = snap * 2
    } else {
      opacity = 1 - exitProgress * exitProgress
      scale = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          textShadow: `
            2px 2px 0 rgba(0,0,0,0.8),
            0 0 30px ${color}60,
            0 4px 20px rgba(0,0,0,0.6)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function SnareSnapComponent(props: MotionGraphicProps<SnareSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-snare-snap',
  title: 'Kinetic Snare Snap',
  description:
    'Sharp snare-crack percussive impact: text arrives with lateral snap and rotation. Horizontal flash lines and rim-shot spark particles on every hit.',
  tags: ['kinetic', 'music', 'snare', 'snap', 'crack', 'drum', 'beat', 'percussion', 'rhythm'],
  category: 'captions',
  component: SnareSnapComponent as any,
  defaultConfig: {
    words: ['SNARE', 'CRACK', 'SNAP', 'HIT'],
    colors: ['#FFFFFF', '#FFE8C8', '#FFD080', '#FFFFFF'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.1,
    snapColor: '#FFFFFF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNARE', 'CRACK', 'SNAP', 'HIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFE8C8', '#FFD080', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'snapColor', label: 'Snap Flash Color', type: 'color', defaultValue: '#FFFFFF', group: 'Animation' },
  ],
})
