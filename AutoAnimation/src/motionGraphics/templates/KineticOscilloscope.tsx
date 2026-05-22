import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OscilloscopeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Grid divisions
    const gridCols = 10
    const gridRows = 8
    const cellW = width / gridCols
    const cellH = height / gridRows

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, borderRadius: 12, overflow: 'hidden' }}>
        {/* Graticule grid lines - vertical */}
        {Array.from({ length: gridCols + 1 }, (_, i) => (
          <div
            key={`gv-${i}`}
            style={{
              position: 'absolute',
              left: i * cellW,
              top: 0,
              width: 1,
              height: '100%',
              background: i === gridCols / 2 ? 'rgba(0,255,0,0.12)' : 'rgba(0,255,0,0.05)',
            }}
          />
        ))}
        {/* Graticule grid lines - horizontal */}
        {Array.from({ length: gridRows + 1 }, (_, i) => (
          <div
            key={`gh-${i}`}
            style={{
              position: 'absolute',
              top: i * cellH,
              left: 0,
              height: 1,
              width: '100%',
              background: i === gridRows / 2 ? 'rgba(0,255,0,0.12)' : 'rgba(0,255,0,0.05)',
            }}
          />
        ))}
        {/* Phosphor screen glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,200,0,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Screen curvature vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Faint horizontal sweep line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(0,255,0,0.06)',
            boxShadow: '0 0 6px rgba(0,255,0,0.03)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Trace drawing: characters revealed left-to-right as if drawn by oscilloscope beam
    const totalChars = word.length
    let charsVisible = totalChars
    let traceOpacity = 1
    let afterglowDecay = 0

    if (phase === 'enter') {
      // Beam traces each letter progressively
      charsVisible = Math.floor(enterProgress * (totalChars + 0.5))
      traceOpacity = 1
    } else if (phase === 'hold') {
      charsVisible = totalChars
      traceOpacity = 1
      // Subtle beam jitter during hold
      afterglowDecay = 0
    } else {
      // Afterglow decay: phosphor fades out
      charsVisible = totalChars
      afterglowDecay = exitProgress
      traceOpacity = 1 - exitProgress * 0.8
    }

    const chars = word.split('').map((ch, ci) => {
      if (ci >= charsVisible) return null
      // Earlier chars have more afterglow decay (dimmer)
      const charAge =
        phase === 'exit'
          ? afterglowDecay + (ci / totalChars) * 0.2
          : phase === 'enter'
            ? Math.max(0, 1 - ((charsVisible - ci) / Math.max(1, totalChars)) * 2)
            : 0
      const charOpacity = Math.max(0.15, 1 - charAge * 0.6)
      // Beam intensity: newest char is brightest
      const isNewest = ci === charsVisible - 1 && phase === 'enter'
      const glowIntensity = isNewest ? 1.0 : 0.6

      return (
        <span
          key={ci}
          style={{
            opacity: charOpacity,
            textShadow: `0 0 ${4 + glowIntensity * 8}px ${color}, 0 0 ${12 + glowIntensity * 20}px ${color}`,
            filter: isNewest ? 'brightness(1.3)' : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: traceOpacity,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(36px, 9vw, 130px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textShadow: `0 0 6px ${color}, 0 0 16px ${color}, 0 0 40px rgba(0,255,0,0.15)`,
        }}
      >
        {chars}
        {/* Trace beam dot */}
        {phase === 'enter' && charsVisible > 0 && charsVisible <= totalChars && (
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(6px, 1.5vw, 14px)',
              height: 'clamp(6px, 1.5vw, 14px)',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
              marginLeft: 2,
              verticalAlign: 'middle',
            }}
          />
        )}
      </div>
    )
  },
}

function OscilloscopeComponent(props: MotionGraphicProps<OscilloscopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-oscilloscope',
  title: 'Kinetic Oscilloscope',
  description:
    'Oscilloscope waveform trace with green phosphor letterforms, graticule grid, beam dot tracing, and afterglow decay',
  tags: ['kinetic', 'typography', 'oscilloscope', 'phosphor', 'waveform', 'science', 'retro', 'green'],
  category: 'captions',
  component: OscilloscopeComponent as any,
  defaultConfig: {
    words: ['WAVE', 'SYNC', 'TRACE', 'PEAK'],
    colors: ['#00ff41', '#00ff41', '#00ff41', '#00ff41'],
    bgColor: '#050a05',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAVE', 'SYNC', 'TRACE', 'PEAK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00ff41', '#00ff41', '#00ff41', '#00ff41'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a05', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
