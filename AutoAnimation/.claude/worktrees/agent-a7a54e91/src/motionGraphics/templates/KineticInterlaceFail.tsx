import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InterlaceFailConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Interlaced scan-line texture — alternating even/odd field lines
    const fieldOffset = Math.floor(time * 25) % 2 // field flip at 25Hz (interlaced 50i)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Interlace scan lines — every other line slightly different */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.035) 0px,
              rgba(255,255,255,0.035) 1px,
              transparent 1px,
              transparent 2px
            )`,
            backgroundPositionY: fieldOffset === 0 ? 0 : 1,
            pointerEvents: 'none',
          }}
        />
        {/* Interlace fringing — horizontal ghosting lines that appear periodically */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(0,200,255,0.04) 3px,
              rgba(0,200,255,0.04) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Progressive vs interlace battle line — sweeping indicator */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${((time * 20) % 110) - 5}%`,
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 89 + 61

    // Interlace combing: the even and odd fields are displaced vertically by 1px
    // At rest: slight constant comb. During enter/exit: severe combing (big field separation)

    let opacity = 1
    let fieldSeparation = 1 // pixels between even/odd fields
    let fieldShiftX = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.4)
      // Dramatic comb on entry: fields separated widely then converge
      fieldSeparation = (1 - enterProgress) * 16 + 1
      fieldShiftX = (1 - enterProgress) * (rand(seed) > 0.5 ? 8 : -8)
    } else if (phase === 'hold') {
      opacity = 1
      // Normal interlace comb (1px) with occasional re-comb bursts
      const combEvent = holdProgress > 0.55 && holdProgress < 0.62
      fieldSeparation = combEvent ? 8 : 1
      fieldShiftX = combEvent ? (rand(seed + Math.floor(holdProgress * 20)) - 0.5) * 6 : 0
    } else {
      opacity = 1 - exitProgress
      fieldSeparation = exitProgress * 18 + 1
      fieldShiftX = exitProgress * (rand(seed + 2) > 0.5 ? 10 : -10)
    }

    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontBase: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    // Number of comb slices — each line-pair shows one field
    const numLines = 40
    const lineH = 100 / numLines

    return (
      <>
        {/* Even field — clips to even rows */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${fieldShiftX * 0.5}px), calc(-50% - ${fieldSeparation * 0.5}px))`,
            opacity,
            ...fontBase,
            // Even field: clip to every other line (even rows only)
            // Simulated by using alternating clipPath on a wrapper
          }}
        >
          <div
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent ${lineH * 0.5}%, black ${lineH * 0.5}%, black ${lineH}%)`,
              backgroundSize: `100% ${lineH * 2}%`,
              WebkitMaskImage: `repeating-linear-gradient(0deg, black 0px, black 50%, transparent 50%, transparent 100%)`,
              WebkitMaskSize: `100% 4px`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Odd field */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${fieldShiftX * 0.5}px), calc(-50% + ${fieldSeparation * 0.5}px))`,
            opacity,
            ...fontBase,
          }}
        >
          <div
            style={{
              WebkitMaskImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 50%, black 50%, black 100%)`,
              WebkitMaskSize: `100% 4px`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Cyan fringe on the comb teeth */}
        {fieldSeparation > 3 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${fieldShiftX}px), calc(-50% + ${fieldSeparation * 0.25}px))`,
              opacity: opacity * 0.25,
              color: 'rgba(0,220,255,1)',
              mixBlendMode: 'screen',
              ...fontBase,
            }}
          >
            {word}
          </div>
        )}

        {/* Full composite text on top — visible during hold for readability */}
        {phase === 'hold' && fieldSeparation <= 2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity,
              textShadow: `0 0 6px ${color}40`,
              ...fontBase,
            }}
          >
            {word}
          </div>
        )}
      </>
    )
  },
}

function InterlaceFailComponent(props: MotionGraphicProps<InterlaceFailConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-interlace-fail',
  title: 'Kinetic Interlace Fail',
  description: 'Interlace combing artifact — even and odd scan fields separate with 1px to 18px vertical displacement, cyan field fringe',
  tags: ['kinetic', 'typography', 'interlace', 'combing', 'hardware', 'broadcast', 'glitch', 'fields'],
  category: 'captions',
  component: InterlaceFailComponent as any,
  defaultConfig: {
    words: ['FIELD', 'COMB', 'SCAN', 'LINES'],
    colors: ['#00ddff', '#ffffff', '#00ddff', '#cccccc'],
    bgColor: '#0a0a12',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIELD', 'COMB', 'SCAN', 'LINES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ddff', '#ffffff', '#00ddff', '#cccccc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
