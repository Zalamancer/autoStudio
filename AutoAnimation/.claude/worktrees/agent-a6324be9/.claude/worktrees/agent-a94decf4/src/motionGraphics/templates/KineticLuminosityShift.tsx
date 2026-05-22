import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LuminosityShiftConfig extends KineticBaseConfig {
  sweepSpeed: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Sweeping luminosity bands — bright diagonal bars move across the frame
    const sweep = (t * 40) % (width * 2)
    const sweep2 = ((t * 30) + width) % (width * 2)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Base gradient — subtle color field */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${160 + Math.sin(t * 0.2) * 10}deg, hsla(220,40%,15%,1), hsla(260,30%,12%,1), hsla(200,35%,10%,1))`,
          }}
        />
        {/* Primary luminosity band */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(110deg, transparent ${sweep - 200}px, rgba(255,255,255,0.08) ${sweep - 80}px, rgba(255,255,255,0.15) ${sweep}px, rgba(255,255,255,0.08) ${sweep + 80}px, transparent ${sweep + 200}px)`,
            mixBlendMode: 'luminosity',
          }}
        />
        {/* Secondary luminosity band — opposite direction */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(250deg, transparent ${sweep2 - 150}px, rgba(180,160,255,0.1) ${sweep2 - 50}px, rgba(180,160,255,0.18) ${sweep2}px, rgba(180,160,255,0.1) ${sweep2 + 50}px, transparent ${sweep2 + 150}px)`,
            mixBlendMode: 'luminosity',
          }}
        />
        {/* Fine horizontal scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
            mixBlendMode: 'luminosity',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let luminosity = 1
      let clipPercent = 100

      if (phase === 'enter') {
        // Characters materialize as luminosity band sweeps over them
        const charPos = ci / Math.max(1, chars.length - 1)
        const delay = charPos * 0.45
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.55))
        const ep = easeOutBack(p)
        charOpacity = Math.min(1, p * 2.5)
        luminosity = 0.2 + ep * 0.8
        clipPercent = ep * 100
        yOff = (1 - ep) * 15
      } else if (phase === 'hold') {
        // Shimmer — luminosity oscillates per character as bands pass
        const bandPhase = t * 2.5 + ci * 0.7
        luminosity = 0.85 + Math.sin(bandPhase) * 0.15
        yOff = Math.sin(t * 1.3 + ci * 0.6) * 1.5
        xOff = Math.cos(t * 1.1 + ci * 0.8) * 1
      } else {
        // Characters dissolve as luminosity drains
        const charPos = 1 - ci / Math.max(1, chars.length - 1)
        const delay = charPos * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.65))
        const ep = easeOutCubic(p)
        luminosity = 1 - ep * 0.8
        charOpacity = 1 - ep
        clipPercent = (1 - ep) * 100
        yOff = ep * -20
      }

      // Brightness filter simulates luminosity change on the text itself
      const brightness = 0.5 + luminosity * 0.8

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px)`,
            color,
            filter: `brightness(${brightness})`,
            clipPath: clipPercent < 99.5 ? `inset(0 ${100 - clipPercent}% 0 0)` : 'none',
          }}
        >
          {/* Luminosity blend layer — white text that modulates brightness */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-block',
              color: `rgba(255,255,255,${luminosity * 0.35})`,
              mixBlendMode: 'luminosity',
              pointerEvents: 'none',
              filter: `blur(${2 - luminosity}px)`,
            }}
          >
            {ch}
          </span>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Shadow layer — dark copy beneath for depth */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(calc(-50% + 2px), calc(-50% + 2px))',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.3)',
            mixBlendMode: 'luminosity',
            filter: 'blur(3px)',
          }}
        >
          {word.split('').map((ch, ci) => (
            <span key={ci} style={{ display: 'inline-block', opacity: phase === 'exit' ? 1 - easeOutCubic(exitProgress) : phase === 'enter' ? easeOutCubic(enterProgress) : 1 }}>
              {ch}
            </span>
          ))}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function LuminosityShiftComponent(props: MotionGraphicProps<LuminosityShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-luminosity-shift',
  title: 'Kinetic Luminosity Shift',
  description:
    'Sweeping luminosity bands modulate text brightness as they pass. Characters materialize with brightness ramps, shimmer during hold, and dissolve as luminosity drains away.',
  tags: ['kinetic', 'typography', 'blend', 'luminosity', 'sweep', 'shimmer', 'bands', 'light'],
  category: 'captions',
  component: LuminosityShiftComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'SHIFT', 'SWEEP', 'GLOW'],
    colors: ['#C8B8E8', '#B8C8E8', '#E8C8D8', '#D8E8C8'],
    bgColor: '#0C0A16',
    cycleDuration: 1.1,
    sweepSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'SHIFT', 'SWEEP', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B8E8', '#B8C8E8', '#E8C8D8', '#D8E8C8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0A16', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'sweepSpeed', label: 'Sweep Speed', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
