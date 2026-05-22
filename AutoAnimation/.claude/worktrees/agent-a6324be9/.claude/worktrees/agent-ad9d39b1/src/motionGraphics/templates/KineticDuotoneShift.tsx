import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DuotoneShiftConfig extends KineticBaseConfig {}

// Duotone shift: two color layers (magenta + cyan) that slide in from
// opposite directions and converge — like a risograph press on a dark ground.
// Screen blend on dark background produces vivid color overlap at convergence.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const driftX = 50 + Math.sin(time * 0.7) * 6
    const driftY = 50 + Math.cos(time * 0.5) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warm paper tint drift */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${driftX}% ${driftY}%, rgba(255,220,80,0.04), transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Ink bleed at edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(255,40,120,0.04), inset 0 0 100px rgba(0,180,255,0.03)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 71 + 17

    // Magenta layer slides from left, cyan from right — converge at center
    let magX = 0, magY = 0
    let cyanX = 0, cyanY = 0
    let mainOpacity = 0

    if (phase === 'enter') {
      const spread = (1 - enterProgress) * 28
      magX = -spread * 1.1
      magY = -spread * 0.2
      cyanX = spread * 0.9
      cyanY = spread * 0.25
      mainOpacity = enterProgress
    } else if (phase === 'hold') {
      // Subtle misregistration wobble on hold
      const wobble = Math.sin(f * 0.07 + seed) * 0.5 + Math.sin(f * 0.13 + seed * 0.5) * 0.3
      magX = -wobble * 2.5
      magY = wobble * 1.0
      cyanX = wobble * 2.0
      cyanY = -wobble * 1.2
      mainOpacity = 1
    } else {
      // Layers peel apart diagonally on exit
      const spread = exitProgress * 32
      magX = -spread * 1.0
      magY = spread * 0.6
      cyanX = spread * 0.8
      cyanY = -spread * 0.7
      mainOpacity = 1 - exitProgress
    }

    const convergence = Math.max(0, 1 - (Math.abs(magX) + Math.abs(cyanX)) / 22)

    const fontStyle = {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(40px, 10vw, 140px)',
      fontWeight: 800 as const,
      whiteSpace: 'nowrap' as const,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    }

    return (
      <>
        {/* Magenta ink layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${magX}px), calc(-50% + ${magY}px))`,
            ...fontStyle,
            color: 'rgba(255,45,120,0.75)',
            opacity: mainOpacity * 0.85,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Cyan ink layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${cyanX}px), calc(-50% + ${cyanY}px))`,
            ...fontStyle,
            color: 'rgba(0,210,240,0.75)',
            opacity: mainOpacity * 0.85,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Registered main text — bright when layers overlap */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...fontStyle,
            color,
            opacity: mainOpacity * convergence * 0.9,
            textShadow: '0 0 6px rgba(255,255,255,0.15)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DuotoneShiftComponent(props: MotionGraphicProps<DuotoneShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-duotone-shift',
  title: 'Kinetic Duotone Shift',
  description: 'Duotone shift: magenta and cyan layers slide in from opposite sides and converge with screen blending, producing vivid overlap on dark ground',
  tags: ['kinetic', 'typography', 'duotone', 'shift', 'screen', 'colorful', 'misregistration'],
  category: 'captions',
  component: DuotoneShiftComponent as any,
  defaultConfig: {
    words: ['BOLD', 'SHIFT', 'INK', 'PRESS'],
    colors: ['#ffffff', '#f5f0e8', '#fffbe6', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'SHIFT', 'INK', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#f5f0e8', '#fffbe6', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
