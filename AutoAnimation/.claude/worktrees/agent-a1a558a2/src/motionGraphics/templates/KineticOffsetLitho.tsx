import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OffsetLithoConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Offset lithography: 4-color CMYK process where each plate feeds ink
// through rubber blanket to paper in sequence — slight misregistration
// is key to the aesthetic
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Uncoated paper texture with subtle halftone grain
    const dots: React.ReactNode[] = []
    for (let i = 0; i < 300; i++) {
      dots.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${rand(i * 13) * 100}%`,
            top: `${rand(i * 29) * 100}%`,
            width: rand(i * 7) * 2 + 0.5,
            height: rand(i * 7) * 2 + 0.5,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.04)',
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {dots}
        {/* Plate pressure lines — faint horizontal banding */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 47px, rgba(0,0,0,0.012) 47px, rgba(0,0,0,0.012) 48px)`,
            pointerEvents: 'none',
          }}
        />
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    // 4 CMYK color plates
    const plates = [
      { color: '#00AEEF', label: 'C' },  // Cyan plate
      { color: '#EC008C', label: 'M' },  // Magenta plate
      { color: '#FFF200', label: 'Y' },  // Yellow plate
      { color: '#231F20', label: 'K' },  // Key/Black plate
    ]

    // Plate registration offsets — each plate feeds in slightly misaligned
    // then registers precisely when all 4 are down
    const getOffset = (plateIdx: number, progress: number, phase: string) => {
      const baseOffsets = [
        { x: -4, y: -3 },   // Cyan: top-left
        { x: 3, y: -2 },    // Magenta: top-right
        { x: -2, y: 3 },    // Yellow: bottom-left
        { x: 0, y: 0 },     // Black: registered
      ]
      const base = baseOffsets[plateIdx]

      if (phase === 'enter') {
        // Plates slam in one by one — each plate has a staggered reveal
        const plateDelay = plateIdx * 0.18
        const plateProgress = Math.max(0, Math.min(1, (progress - plateDelay) / 0.55))
        const eased = easeOutCubic(plateProgress)
        // Start far out, crash to registered position
        const startX = base.x * 6 - (plateIdx % 2 === 0 ? -60 : 60)
        const startY = base.y * 6 - 40
        return {
          x: startX + (base.x - startX) * eased,
          y: startY + (base.y - startY) * eased,
          opacity: plateProgress > 0 ? Math.min(1, plateProgress * 4) : 0,
          scale: 0.92 + eased * 0.08,
        }
      } else if (phase === 'hold') {
        // Tiny vibration — press machine rumble
        const vibX = Math.sin(f * 0.7 + plateIdx * 1.2) * 0.3
        const vibY = Math.cos(f * 0.5 + plateIdx * 0.8) * 0.2
        return { x: base.x + vibX, y: base.y + vibY, opacity: 1, scale: 1 }
      } else {
        // Exit: plates pull away in reverse order
        const plateDelay = (3 - plateIdx) * 0.12
        const plateProgress = Math.max(0, Math.min(1, (exitProgress - plateDelay) / 0.6))
        const eased = easeOutCubic(plateProgress)
        const exitX = plateIdx % 2 === 0 ? -80 : 80
        return {
          x: base.x + exitX * eased,
          y: base.y - 30 * eased,
          opacity: 1 - eased,
          scale: 1 - eased * 0.1,
        }
      }
    }

    const fontStyle: React.CSSProperties = {
      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      fontSize: 'clamp(52px, 13vw, 180px)',
      fontWeight: 900,
      letterSpacing: -2,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      userSelect: 'none',
    }

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {plates.map((plate, pi) => {
          const off = getOffset(pi, enterProgress || exitProgress || 0, phase)
          return (
            <div
              key={pi}
              style={{
                ...fontStyle,
                position: 'absolute',
                left: off.x,
                top: off.y,
                color: plate.color,
                opacity: off.opacity * (pi === 3 ? 0.95 : 0.55),
                mixBlendMode: pi === 3 ? 'multiply' : 'multiply',
                transform: `scale(${off.scale})`,
                transformOrigin: 'center',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Invisible spacer so container has right size */}
        <div style={{ ...fontStyle, opacity: 0, position: 'relative' }}>{word}</div>
      </div>
    )
  },
}

function OffsetLithoComponent(props: MotionGraphicProps<OffsetLithoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-offset-litho',
  title: 'Kinetic Offset Litho',
  description: 'Four CMYK plates slam onto paper one by one with visible misregistration between cyan, magenta, yellow, and key layers — offset lithography process animated',
  tags: ['kinetic', 'typography', 'print', 'offset', 'lithography', 'CMYK', 'registration', 'press', 'process'],
  category: 'captions',
  component: OffsetLithoComponent as any,
  defaultConfig: {
    words: ['PRESS', 'PLATE', 'PROOF', 'PRINT'],
    colors: ['#231F20', '#EC008C', '#00AEEF', '#FFF200'],
    bgColor: '#F8F5F0',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRESS', 'PLATE', 'PROOF', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#231F20', '#EC008C', '#00AEEF', '#FFF200'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#F8F5F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
