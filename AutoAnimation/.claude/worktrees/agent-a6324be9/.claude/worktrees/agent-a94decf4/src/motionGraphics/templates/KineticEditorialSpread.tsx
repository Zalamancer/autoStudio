import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EditorialSpreadConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Double-page center gutter line */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          bottom: '8%',
          left: '50%',
          width: 0.5,
          background: 'rgba(255,255,255,0.04)',
        }}
      />
      {/* Page margin guides */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          left: '8%',
          right: '8%',
          border: '0.5px solid rgba(255,255,255,0.02)',
        }}
      />
      {/* Column guides -- 4 columns */}
      {[25, 50, 75].map((pct) => (
        <div
          key={pct}
          style={{
            position: 'absolute',
            top: '10%',
            bottom: '10%',
            left: `${pct}%`,
            width: 0,
            borderLeft: '0.5px dashed rgba(255,255,255,0.015)',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    // Text flows around an invisible circular shape at center
    // Split word into individual characters and position them along a path
    const letters = word.split('')
    const letterCount = letters.length

    // Layout: large text wraps around center void
    // Position letters in two groups: left side and right side of invisible circle
    const circleRadius = Math.min(width, height) * 0.15
    const leftLetters = letters.slice(0, Math.ceil(letterCount / 2))
    const rightLetters = letters.slice(Math.ceil(letterCount / 2))

    let opacity = 0
    let revealProg = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2.5)
      opacity = Math.min(1, enterProgress * 2.5)
      revealProg = eased
    } else if (phase === 'hold') {
      opacity = 1
      revealProg = 1
    } else {
      opacity = 1 - exitProgress
      revealProg = 1 - exitProgress * exitProgress
    }

    // Alternate layout between left-heavy and right-heavy based on index
    const isLeftLayout = index % 2 === 0

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Invisible shape indicator -- faint circle outline */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: circleRadius * 2,
            height: circleRadius * 2,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            border: `0.5px solid rgba(255,255,255,${0.03 * revealProg})`,
          }}
        />
        {/* Large word -- positioned to wrap around circle */}
        <div
          style={{
            position: 'absolute',
            top: isLeftLayout ? '28%' : '35%',
            left: isLeftLayout ? '8%' : undefined,
            right: isLeftLayout ? undefined : '8%',
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            clipPath: `inset(0 ${(1 - revealProg) * 100}% 0 0)`,
          }}
        >
          {leftLetters.join('')}
        </div>
        <div
          style={{
            position: 'absolute',
            top: isLeftLayout ? '55%' : '48%',
            left: isLeftLayout ? undefined : '8%',
            right: isLeftLayout ? '8%' : undefined,
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            clipPath: `inset(0 0 0 ${(1 - revealProg) * 100}%)`,
          }}
        >
          {rightLetters.join('')}
        </div>
        {/* Page number at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '8%',
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(8px, 1.8vw, 14px)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            color,
            opacity: 0.25 * revealProg,
          }}
        >
          {String((index + 1) * 2).padStart(3, '0')}
        </div>
        {/* "EDITORIAL" small caps label */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '8%',
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(7px, 1.4vw, 11px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.5em',
            color,
            opacity: 0.2 * revealProg,
          }}
        >
          Editorial
        </div>
        {/* Season label top-right */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            right: '8%',
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(7px, 1.4vw, 11px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color,
            opacity: 0.2 * revealProg,
          }}
        >
          SS 2026
        </div>
      </div>
    )
  },
}

function KineticEditorialSpreadComponent(props: MotionGraphicProps<EditorialSpreadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-editorial-spread',
  title: 'Editorial Spread',
  description: 'Double-page editorial spread layout with text flowing around invisible shape, column guides, page numbers, and gutter line.',
  tags: ['kinetic', 'typography', 'fashion', 'editorial', 'spread', 'magazine', 'layout', 'luxury'],
  category: 'captions',
  component: KineticEditorialSpreadComponent as any,
  defaultConfig: {
    words: ['ELEGANCE', 'COUTURE', 'OPULENCE', 'RADIANCE'],
    colors: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'],
    bgColor: '#0A0A0A',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ELEGANCE', 'COUTURE', 'OPULENCE', 'RADIANCE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
