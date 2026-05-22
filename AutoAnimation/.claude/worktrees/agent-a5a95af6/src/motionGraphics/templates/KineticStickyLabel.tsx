import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StickyLabelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 23

    // Label style: text inside a rectangular label with dashed border (perforated edges)
    const labelContent = (labelOpacity: number, labelShadow: string) => (
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          border: `2px dashed ${color}`,
          borderRadius: 4,
          padding: 'clamp(12px, 3vw, 32px) clamp(24px, 6vw, 64px)',
          boxShadow: labelShadow,
          opacity: labelOpacity,
        }}
      >
        {/* Left perforation dots */}
        <div
          style={{
            position: 'absolute',
            left: -6,
            top: '10%',
            bottom: '10%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: color,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        {/* Right perforation dots */}
        <div
          style={{
            position: 'absolute',
            right: -6,
            top: '10%',
            bottom: '10%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: color,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: 'clamp(32px, 8vw, 100px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )

    if (phase === 'enter') {
      // Label prints out from left (clip-path reveal)
      const revealPercent = enterProgress * 100
      const easeReveal = 1 - Math.pow(1 - enterProgress, 2)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: `inset(0 ${100 - revealPercent}% 0 0)`,
          }}
        >
          {labelContent(easeReveal, '2px 3px 8px rgba(0,0,0,0.1)')}
        </div>
      )
    }

    if (phase === 'hold') {
      // Label sticks with subtle shadow pulse
      const shadowDepth = 8 + Math.sin(holdProgress * Math.PI * 2 + seed) * 3
      const yShift = Math.sin(holdProgress * Math.PI * 2 + seed * 2) * 1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${yShift}px))`,
          }}
        >
          {labelContent(1, `2px 3px ${shadowDepth}px rgba(0,0,0,0.12)`)}
        </div>
      )
    }

    // Exit: peels off to the right with slight rotation
    const peelX = exitProgress * 300
    const peelRotation = exitProgress * 8
    const peelY = exitProgress * exitProgress * 50

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${peelX}px), calc(-50% + ${peelY}px)) rotate(${peelRotation}deg)`,
          opacity: 1 - exitProgress,
        }}
      >
        {labelContent(1, '2px 3px 8px rgba(0,0,0,0.1)')}
      </div>
    )
  },
}

function StickyLabelComponent(props: MotionGraphicProps<StickyLabelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sticky-label',
  title: 'Kinetic Sticky Label',
  description: 'Label maker tape label with perforated edges, clip-path print reveal, and peel-off exit',
  tags: ['kinetic', 'typography', 'label', 'tape', 'sticker', 'perforated', 'organic', 'office'],
  category: 'captions',
  component: StickyLabelComponent as any,
  defaultConfig: {
    words: ['URGENT', 'FRAGILE', 'HANDLE', 'CARE'],
    colors: ['#C0392B', '#2C3E50', '#8E44AD', '#D35400'],
    bgColor: '#ECEFF1',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['URGENT', 'FRAGILE', 'HANDLE', 'CARE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#2C3E50', '#8E44AD', '#D35400'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ECEFF1', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
