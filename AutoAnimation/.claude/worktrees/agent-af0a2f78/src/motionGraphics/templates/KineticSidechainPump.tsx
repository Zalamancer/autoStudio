import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Scale Pulse 2/4 — Sidechain Pump
// Classic sidechain compression effect: text ducks on the kick, swells back up

interface SidechainPumpConfig extends KineticBaseConfig {
  duckDepth: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // 4-on-floor at ~2Hz reference for sidechain trigger
    const beatFreq = 2.0
    const beatPhase = (t * beatFreq) % 1
    // Kick trigger: sharp attack
    const kickOn = beatPhase < 0.08 ? 1 - beatPhase / 0.08 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Kick flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${kickOn * 0.12})`,
          }}
        />
        {/* Sidechain compression indicator bars */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const barPhase = ((t * beatFreq + i * 0.1) % 1)
          // Ducking: low on kick, rising back
          const duckAmount = barPhase < 0.1 ? 1 - barPhase / 0.1 : Math.exp(-(barPhase - 0.1) * 3)
          const barH = 8 + (1 - duckAmount * 0.7) * 24
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 20,
                left: `${10 + i * 14}%`,
                width: 8,
                height: barH,
                borderRadius: 2,
                background: `rgba(255,255,255,${0.1 + (1 - duckAmount) * 0.3})`,
              }}
            />
          )
        })}
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
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      scale = 1.4 - enterProgress * 0.4
    } else if (phase === 'hold') {
      opacity = 1
      // Sidechain pump: duck to 0.75 on each beat, exponential recovery
      const beatFreq = 2.0
      const beatPhase = (holdProgress * beatFreq * 2) % 1
      let duck: number
      if (beatPhase < 0.08) {
        // Instant duck on kick
        duck = beatPhase / 0.08
      } else {
        // Exponential swell back (release time)
        duck = 1 - Math.exp(-(beatPhase - 0.08) * 6)
      }
      // Scale: ducks from 1.0 to 0.78, swells back
      scale = 0.78 + duck * 0.22
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(50px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `0 0 40px ${color}60, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SidechainPumpComponent(props: MotionGraphicProps<SidechainPumpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sidechain-pump',
  title: 'Kinetic Sidechain Pump',
  description:
    'Sidechain compression effect: text instantly ducks on the kick drum and exponentially swells back up. Classic EDM pumping feel.',
  tags: ['kinetic', 'scale', 'sidechain', 'pump', 'edm', 'compression', 'kick', 'beat', 'music'],
  category: 'captions',
  component: SidechainPumpComponent as any,
  defaultConfig: {
    words: ['PUMP', 'IT', 'UP'],
    colors: ['#06D6A0', '#118AB2', '#FFD166'],
    bgColor: '#073B4C',
    cycleDuration: 1.0,
    duckDepth: 0.22,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUMP', 'IT', 'UP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#06D6A0', '#118AB2', '#FFD166'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#073B4C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
    { key: 'duckDepth', label: 'Duck Depth', type: 'number', defaultValue: 0.22, min: 0.05, max: 0.5, group: 'Animation' },
  ],
})
