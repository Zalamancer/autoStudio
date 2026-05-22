import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExitSignConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Battery flicker simulation — occasional dim/brighten cycle
    const flickerSeed = Math.floor(time * 8)
    const flickerVal = Math.sin(flickerSeed * 127.1 + 311.7) * 43758.5453
    const flicker = (flickerVal - Math.floor(flickerVal))
    const batteryDim = flicker < 0.08 ? 0.4 : flicker < 0.12 ? 0.7 : 1.0
    // Institutional glow ambient pulse
    const glowPulse = 0.85 + Math.sin(time * 0.8) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark institutional background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 40%, rgba(0,80,40,${0.08 * glowPulse * batteryDim}), transparent 60%)`,
          }}
        />
        {/* Sign housing border */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            right: '10%',
            bottom: '15%',
            border: `2px solid rgba(0,200,80,${0.15 * batteryDim})`,
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        />
        {/* Running man pictogram (right side) */}
        <svg
          width={60}
          height={70}
          style={{
            position: 'absolute',
            right: '15%',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.18 * batteryDim,
          }}
          viewBox="0 0 60 70"
        >
          {/* Head */}
          <circle cx="22" cy="10" r="6" fill="#00DD66" />
          {/* Body */}
          <line x1="22" y1="16" x2="22" y2="38" stroke="#00DD66" strokeWidth="3" />
          {/* Arms */}
          <line x1="22" y1="24" x2="8" y2="30" stroke="#00DD66" strokeWidth="3" />
          <line x1="22" y1="24" x2="36" y2="18" stroke="#00DD66" strokeWidth="3" />
          {/* Legs */}
          <line x1="22" y1="38" x2="10" y2="56" stroke="#00DD66" strokeWidth="3" />
          <line x1="22" y1="38" x2="36" y2="56" stroke="#00DD66" strokeWidth="3" />
          {/* Door frame */}
          <rect x="40" y="4" width="16" height="50" fill="none" stroke="#00DD66" strokeWidth="2" />
        </svg>
        {/* LED dot matrix overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent, transparent 3px,
              rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px
            ), repeating-linear-gradient(
              90deg,
              transparent, transparent 3px,
              rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Battery flicker for text too
    const flickerSeed = Math.floor(f * 0.27)
    const flickerVal = Math.sin(flickerSeed * 127.1 + 311.7) * 43758.5453
    const flicker = (flickerVal - Math.floor(flickerVal))
    const batteryDim = flicker < 0.06 ? 0.5 : 1.0

    let opacity = 0
    let letterSpacing = 8

    if (phase === 'enter') {
      // LED segments light up progressively — letters appear left to right
      opacity = enterProgress * batteryDim
      letterSpacing = 8 + (1 - enterProgress) * 12
    } else if (phase === 'hold') {
      opacity = batteryDim
      // Subtle LED hum
      const hum = Math.sin(f * 0.4 + index * 5) * 0.03
      opacity = Math.max(0.5, batteryDim - Math.abs(hum))
    } else {
      opacity = (1 - exitProgress) * batteryDim
      letterSpacing = 8 + exitProgress * 10
    }

    return (
      <>
        {/* Diffuse green glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 700,
            color: 'rgba(0,220,100,0.25)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing,
            opacity: opacity * 0.8,
            filter: 'blur(12px)',
          }}
        >
          {word}
        </div>
        {/* Main LED text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing,
            opacity,
            textShadow: `0 0 8px rgba(0,220,100,0.5), 0 0 24px rgba(0,180,80,0.2)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ExitSignComponent(props: MotionGraphicProps<ExitSignConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-exit-sign',
  title: 'Kinetic Exit Sign',
  description: 'Emergency exit sign with LED green-on-dark text, running man pictogram, backup battery flicker, and institutional dot-matrix glow',
  tags: ['kinetic', 'typography', 'exit', 'emergency', 'led', 'green', 'safety', 'sign'],
  category: 'captions',
  component: ExitSignComponent as any,
  defaultConfig: {
    words: ['EXIT', 'ESCAPE', 'RUN', 'LEAVE'],
    colors: ['#00DD66', '#00DD66', '#00DD66', '#00DD66'],
    bgColor: '#080808',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXIT', 'ESCAPE', 'RUN', 'LEAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DD66', '#00DD66', '#00DD66', '#00DD66'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
