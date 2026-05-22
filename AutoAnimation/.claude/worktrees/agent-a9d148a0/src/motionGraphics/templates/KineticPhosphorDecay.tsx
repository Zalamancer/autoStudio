import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhosphorDecayConfig extends KineticBaseConfig {
  phosphorColor: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Phosphor persistence curve — real P31 phosphor decay is roughly exponential */
function phosphorDecay(t: number): number {
  // P31 green phosphor: fast initial decay, long tail
  // Modeled as double-exponential
  return 0.7 * Math.exp(-t * 12) + 0.3 * Math.exp(-t * 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // CRT face — slight green phosphor ambient
    const ambientGreen = 0.03 + Math.sin(time * 0.4) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Phosphor green ambient glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,${Math.floor(180 + Math.sin(time * 0.7) * 20)},0,${ambientGreen}) 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving electron beam — the scan refresh line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(time * 38) % 100}%`,
            height: 2,
            background: 'rgba(0,255,80,0.06)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* Screen curvature vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Corner phosphor glow bleed */}
        {['0% 0%', '100% 0%', '0% 100%', '100% 100%'].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos.split(' ')[0],
              top: pos.split(' ')[1],
              transform: 'translate(-50%, -50%)',
              width: '25%',
              height: '20%',
              background: `radial-gradient(ellipse at center, rgba(0,${100 + i * 20},0,0.02) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const fp = fps ?? 30
    const time = f / fp
    const seed = index * 127 + 43

    // Phosphor decay behaviour:
    // ENTER: electron beam hits phosphor — text burns bright white, then decays to green
    // HOLD: settled phosphor glow — dim but steady at natural color
    // EXIT: burst of brightness as beam sweeps off, then fast decay to nothing

    let brightness = 1
    let glowRadius = 4
    let opacity = 1
    let colorMix = 0  // 0=phosphor color, 1=white-hot

    if (phase === 'enter') {
      // Beam hits: instant white flash, then exponential phosphor decay to normal color
      if (enterProgress < 0.15) {
        // Beam strike — white-hot
        colorMix = 1 - enterProgress / 0.15
        brightness = 1.5 + (1 - enterProgress / 0.15) * 2
        glowRadius = 20 + (1 - enterProgress / 0.15) * 30
        opacity = enterProgress / 0.15
      } else {
        // Phosphor afterglow decay
        const decayT = (enterProgress - 0.15) / 0.85
        const decay = phosphorDecay(decayT * 1.5)
        colorMix = decay * 0.4  // partial white hot fading
        brightness = 1 + decay * 0.8
        glowRadius = 4 + decay * 20
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Steady phosphor state — gentle slow dim pulsing (scan refresh)
      brightness = 0.9 + Math.sin(holdProgress * Math.PI * 2 + seed) * 0.1
      glowRadius = 5 + Math.sin(holdProgress * Math.PI * 3) * 2
      opacity = 1
      colorMix = 0
    } else {
      // Beam sweeps off — last refresh then decay
      if (exitProgress < 0.1) {
        // Final beam pass — brief flare
        colorMix = (0.1 - exitProgress) / 0.1 * 0.6
        brightness = 1 + colorMix
        glowRadius = 10 + colorMix * 15
        opacity = 1
      } else {
        // Phosphor decay — no more excitation
        const decayT = (exitProgress - 0.1) / 0.9
        const decay = phosphorDecay(decayT * 2)
        brightness = 0.3 + decay * 0.7
        glowRadius = 2 + decay * 8
        opacity = 0.2 + decay * 0.8
      }
    }

    // Blend between phosphor color and white-hot
    // phosphorColor is typically P31 green: #00ff00 or user-set
    const phosphorR = 0, phosphorG = 255, phosphorB = 60
    const hotR = 255, hotG = 255, hotB = 200

    const r = Math.round(phosphorR + (hotR - phosphorR) * colorMix)
    const g = Math.round(phosphorG + (hotG - phosphorG) * colorMix)
    const b = Math.round(phosphorB + (hotB - phosphorB) * colorMix)
    const displayColor = `rgb(${Math.min(255, Math.round(r * brightness))},${Math.min(255, Math.round(g * brightness))},${Math.min(255, Math.round(b * brightness))})`

    // Subtle per-character timing offset — electron beam sweeps left to right
    const chars = word.split('').map((ch, ci) => {
      const charDelay = (ci / word.length) * 0.08
      const charT = Math.max(0, Math.min(1, (phase === 'enter' ? enterProgress - charDelay : phase === 'exit' ? exitProgress : holdProgress)))
      // Characters near beam position are slightly brighter
      const charBrightBoost = phase === 'enter' && enterProgress < 0.15 && Math.abs(ci / word.length - enterProgress * 4) < 0.2 ? 0.3 : 0
      return (
        <span
          key={ci}
          style={{
            opacity: phase === 'enter' && ci / word.length > enterProgress * 1.8 ? 0 : 1,
            filter: charBrightBoost > 0 ? `brightness(${1 + charBrightBoost})` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <>
        {/* Phosphor glow halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: opacity * 0.4,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: displayColor,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            filter: `blur(${glowRadius * 0.5}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
        {/* Main phosphor text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: displayColor,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            textShadow: `0 0 ${glowRadius}px ${displayColor}, 0 0 ${glowRadius * 2}px rgba(0,255,60,${0.1 + colorMix * 0.3})`,
          }}
        >
          {chars}
        </div>
      </>
    )
  },
}

function PhosphorDecayComponent(props: MotionGraphicProps<PhosphorDecayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-phosphor-decay',
  title: 'Kinetic Phosphor Decay',
  description: 'CRT P31 phosphor lifecycle — electron beam strikes white-hot then decays through characteristic exponential afterglow to settled green phosphor emission',
  tags: ['kinetic', 'typography', 'phosphor', 'crt', 'decay', 'glow', 'display', 'hardware', 'electron', 'retro'],
  category: 'captions',
  component: PhosphorDecayComponent as any,
  defaultConfig: {
    words: ['BURN', 'GLOW', 'DECAY', 'FADE'],
    colors: ['#00ff50', '#20ff60', '#00ef40', '#40ff80'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
    phosphorColor: '#00ff50',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURN', 'GLOW', 'DECAY', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ff50', '#20ff60', '#00ef40', '#40ff80'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'phosphorColor', label: 'Phosphor Color', type: 'color', defaultValue: '#00ff50', group: 'Animation' },
  ],
})
