import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RadarSweepConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.min(cx, cy) * 0.9

    // Sweep angle rotates continuously
    const sweepAngle = (time * 60) % 360 // degrees, ~6s per revolution

    // Range rings
    const ringCount = 5
    const rings = Array.from({ length: ringCount }, (_, i) => {
      const r = (maxRadius / ringCount) * (i + 1)
      return (
        <div
          key={`ring-${i}`}
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '1px solid rgba(0,255,0,0.1)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Range rings */}
        {rings}

        {/* Cross-hair lines */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy,
            height: 1,
            background: 'rgba(0,255,0,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: cx,
            width: 1,
            background: 'rgba(0,255,0,0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Sweep line with afterglow trail */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: maxRadius,
            height: 2,
            transformOrigin: '0 50%',
            transform: `rotate(${sweepAngle}deg)`,
            background: 'linear-gradient(90deg, rgba(0,255,0,0.5), rgba(0,255,0,0.05))',
            boxShadow: '0 0 8px rgba(0,255,0,0.3)',
            pointerEvents: 'none',
          }}
        />

        {/* Afterglow cone (triangular gradient behind sweep) */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: maxRadius,
            height: maxRadius,
            transformOrigin: '0 0',
            transform: `rotate(${sweepAngle - 45}deg)`,
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,0,0.06) 20deg, rgba(0,255,0,0.02) 40deg, transparent 45deg)',
            pointerEvents: 'none',
          }}
        />

        {/* Center pip */}
        <div
          style={{
            position: 'absolute',
            left: cx - 3,
            top: cy - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(0,255,0,0.5)',
            boxShadow: '0 0 6px rgba(0,255,0,0.3)',
            pointerEvents: 'none',
          }}
        />

        {/* Phosphor vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Compass ticks */}
        {['N', 'E', 'S', 'W'].map((label, i) => {
          const angle = i * 90 - 90
          const rad = (angle * Math.PI) / 180
          const lx = cx + Math.cos(rad) * (maxRadius + 14)
          const ly = cy + Math.sin(rad) * (maxRadius + 14)
          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: lx - 8,
                top: ly - 8,
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: 'rgba(0,255,0,0.25)',
                pointerEvents: 'none',
              }}
            >
              {label}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const fps = 30 // approximate
    const time = f / fps
    const sweepAngle = (time * 60) % 360

    if (phase === 'enter') {
      // Text revealed by sweep line passing over it
      // Characters light up as sweep passes their angular position
      const totalChars = word.length
      const charsRevealed = Math.floor(enterProgress * (totalChars + 1))
      const overallOpacity = Math.min(1, enterProgress * 2)

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsRevealed)
          return (
            <span key={ci} style={{ opacity: 0 }}>
              {ch}
            </span>
          )
        // Afterglow: recently revealed chars are brightest
        const age = (charsRevealed - ci) / totalChars
        const glow = Math.max(0.4, 1 - age * 0.5)
        return (
          <span
            key={ci}
            style={{
              opacity: glow,
              textShadow: `0 0 ${4 + (1 - age) * 10}px ${color}`,
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
            opacity: overallOpacity,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Phosphor glow with slow afterglow decay cycle
      const pulse = Math.sin(f * 0.08) * 0.08
      const glowSize = 8 + Math.sin(f * 0.05) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity: 0.92 + pulse,
            textShadow: `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 2.5}px rgba(0,255,0,0.15)`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: afterglow fades out like phosphor decay
      const fadeOut = 1 - exitProgress
      const blurDecay = exitProgress * 4
      const dimming = Math.pow(fadeOut, 1.5) // phosphor has nonlinear decay

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity: dimming,
            textShadow: `0 0 ${6 + blurDecay * 2}px ${color}`,
            filter: `blur(${blurDecay * 0.3}px)`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function RadarSweepComponent(props: MotionGraphicProps<RadarSweepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-radar-sweep',
  title: 'Kinetic Radar Sweep',
  description:
    'Radar PPI display with rotating sweep line, range rings, phosphor afterglow trails, compass marks, and character-by-character reveal',
  tags: ['kinetic', 'typography', 'radar', 'sweep', 'military', 'phosphor', 'green', 'aviation'],
  category: 'captions',
  component: RadarSweepComponent as any,
  defaultConfig: {
    words: ['PING', 'BLIP', 'LOCK', 'MARK'],
    colors: ['#00ff44', '#00ff44', '#00ff44', '#00ff44'],
    bgColor: '#060e06',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PING', 'BLIP', 'LOCK', 'MARK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00ff44', '#00ff44', '#00ff44', '#00ff44'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060e06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
