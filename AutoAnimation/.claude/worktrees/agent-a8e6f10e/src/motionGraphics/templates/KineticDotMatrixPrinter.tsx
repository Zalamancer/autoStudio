import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DotMatrixPrinterConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Paper feed holes on left and right edges
    const holeCount = Math.floor(height / 24)
    const holes = Array.from({ length: holeCount }, (_, i) => i)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Continuous form paper texture - green bar paper */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`bar-${i}`}
            style={{
              position: 'absolute',
              left: 30,
              right: 30,
              top: i * 28,
              height: 14,
              background: i % 2 === 0 ? 'rgba(180, 220, 180, 0.08)' : 'transparent',
            }}
          />
        ))}

        {/* Left tractor feed holes */}
        {holes.map((i) => (
          <div
            key={`lh-${i}`}
            style={{
              position: 'absolute',
              left: 8,
              top: 6 + i * 24,
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '1px solid rgba(150, 150, 150, 0.15)',
              background: 'rgba(0,0,0,0.03)',
            }}
          />
        ))}

        {/* Right tractor feed holes */}
        {holes.map((i) => (
          <div
            key={`rh-${i}`}
            style={{
              position: 'absolute',
              right: 8,
              top: 6 + i * 24,
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '1px solid rgba(150, 150, 150, 0.15)',
              background: 'rgba(0,0,0,0.03)',
            }}
          />
        ))}

        {/* Print head rail line */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: 28,
            right: 28,
            height: 2,
            background: 'rgba(100, 100, 100, 0.08)',
          }}
        />

        {/* Moving print head carriage */}
        {(() => {
          const headX = 30 + ((time * 120) % Math.max(1, width - 60))
          return (
            <div
              style={{
                position: 'absolute',
                top: 'calc(48% - 6px)',
                left: headX,
                width: 20,
                height: 14,
                background: 'rgba(80, 80, 80, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(100, 100, 100, 0.1)',
              }}
            />
          )
        })()}

        {/* Paper edge perforations (top) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 28,
            right: 28,
            height: 1,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(150,150,150,0.2) 0px, rgba(150,150,150,0.2) 3px, transparent 3px, transparent 8px)',
          }}
        />

        {/* Paper edge perforations (bottom) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 28,
            right: 28,
            height: 1,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(150,150,150,0.2) 0px, rgba(150,150,150,0.2) 3px, transparent 3px, transparent 8px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Print head moves left to right, printing each character
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 0.5))

      // Print head x position follows the latest character
      const charWidth = Math.min(40, width * 0.08)
      const textWidth = totalChars * charWidth
      const startX = (width - textWidth) / 2
      const headX = startX + charsToShow * charWidth

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsToShow) return null
        // Each char fades in with dot-stipple effect
        const charAge = (charsToShow - ci) / totalChars
        const dotOpacity = Math.min(1, charAge * 3)
        return (
          <span key={ci} style={{ opacity: dotOpacity, color }}>
            {ch}
          </span>
        )
      })

      return (
        <>
          {/* Print head indicator */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(50% - 30px)',
              left: headX,
              width: 3,
              height: 60,
              background: 'rgba(0,0,0,0.12)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(32px, 9vw, 120px)',
              fontWeight: 400,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              WebkitFontSmoothing: 'none' as any,
            }}
          >
            {chars}
          </div>
        </>
      )
    } else if (phase === 'hold') {
      // Text sits on paper with slight mechanical vibration
      const vibX = Math.sin(f * 0.3) * 0.4
      const vibY = Math.cos(f * 0.25) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${vibX}px), calc(-50% + ${vibY}px))`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 400,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            // Ink bleed on continuous form paper
            textShadow: `0.5px 0.5px 0 ${color}40, -0.5px 0px 0 ${color}20`,
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: paper feeds upward, text scrolls out
      const feedY = exitProgress * -120

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${feedY}px))`,
            opacity: 1 - exitProgress,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 400,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `0.5px 0.5px 0 ${color}40`,
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DotMatrixPrinterComponent(props: MotionGraphicProps<DotMatrixPrinterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dot-matrix-printer',
  title: 'Kinetic Dot Matrix Printer',
  description:
    'Dot matrix printer with moving print head, tractor feed paper holes, green bar paper, character-by-character pin printing, and paper feed exit',
  tags: ['kinetic', 'typography', 'dot-matrix', 'printer', 'retro', 'paper', 'office', 'computing'],
  category: 'captions',
  component: DotMatrixPrinterComponent as any,
  defaultConfig: {
    words: ['PRINT', 'DRAFT', 'SPOOL', 'FEED'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#f5f0e8',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'DRAFT', 'SPOOL', 'FEED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
