import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SheetMusicConfig extends KineticBaseConfig {
  staffColor: string
  inkColor: string
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const staffLineCount = 5
    const staffSets = 3
    const staffSpacing = height / (staffSets + 1)
    const lineGap = Math.min(height * 0.018, 12)

    // Musical note symbols scattered across the staff
    const noteSymbols = ['\u2669', '\u266A', '\u266B', '\u266C', '\u{1D13B}', '\u{1D13C}']
    const notePositions = Array.from({ length: 14 }).map((_, i) => ({
      x: ((i * 137 + 47) % 100) / 100,
      staffSet: i % staffSets,
      lineOffset: ((i * 53 + 29) % 5) - 2,
      symbol: noteSymbols[i % noteSymbols.length],
      delay: i * 0.25,
      size: 0.7 + (i % 3) * 0.3,
    }))

    // Pen nib drawing animation
    const penX = ((time * 0.12) % 1) * width
    const penY = staffSpacing + Math.sin(time * 0.8) * lineGap * 2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Parchment texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(160,130,80,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(160,130,80,0.04) 0%, transparent 50%)
            `,
          }}
        />

        {/* Aged paper edge stains */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(120,90,50,0.15)',
          }}
        />

        {/* Staff lines */}
        {Array.from({ length: staffSets }).map((_, setIdx) => {
          const baseY = staffSpacing * (setIdx + 1) - (staffLineCount * lineGap) / 2
          return Array.from({ length: staffLineCount }).map((__, lineIdx) => (
            <div
              key={`${setIdx}-${lineIdx}`}
              style={{
                position: 'absolute',
                left: '6%',
                right: '6%',
                top: baseY + lineIdx * lineGap,
                height: 1.5,
                background: 'rgba(60,40,20,0.25)',
                borderRadius: 1,
              }}
            />
          ))
        })}

        {/* Treble clef at start of each staff */}
        {Array.from({ length: staffSets }).map((_, setIdx) => {
          const baseY = staffSpacing * (setIdx + 1)
          return (
            <div
              key={`clef-${setIdx}`}
              style={{
                position: 'absolute',
                left: '7%',
                top: baseY - lineGap * 3.5,
                fontSize: lineGap * 6,
                color: 'rgba(60,40,20,0.3)',
                fontFamily: 'serif',
                lineHeight: 1,
              }}
            >
              {'\u{1D11E}'}
            </div>
          )
        })}

        {/* Scattered notes */}
        {notePositions.map((note, i) => {
          const setBaseY = staffSpacing * (note.staffSet + 1)
          const noteY = setBaseY + note.lineOffset * lineGap
          const noteX = width * 0.1 + note.x * width * 0.8
          const animatedOpacity = 0.15 + 0.1 * Math.sin(time * 1.2 + note.delay)

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: noteX,
                top: noteY - lineGap,
                fontSize: lineGap * 2.5 * note.size,
                color: `rgba(60,40,20,${animatedOpacity})`,
                fontFamily: 'serif',
                transform: `translateX(-50%)`,
              }}
            >
              {note.symbol}
            </div>
          )
        })}

        {/* Pen nib */}
        <div
          style={{
            position: 'absolute',
            left: penX - 3,
            top: penY - 20,
            width: 6,
            height: 24,
            background: 'linear-gradient(to bottom, #2C1810, #1A0E08)',
            borderRadius: '1px 1px 3px 3px',
            transform: 'rotate(-20deg)',
            opacity: 0.4,
            boxShadow: '1px 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {/* Nib tip */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 1,
              width: 4,
              height: 6,
              background: '#8B7355',
              clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
            }}
          />
        </div>

        {/* Ink trail from pen */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <path
            d={`M ${penX - 60} ${penY + 2} Q ${penX - 30} ${penY - 4} ${penX} ${penY}`}
            fill="none"
            stroke="#2C1810"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const eased = easeOutQuart(enterProgress)
    let opacity = 1
    let clipX = 100

    if (phase === 'enter') {
      opacity = eased
      clipX = eased * 100
    } else if (phase === 'exit') {
      opacity = 1 - easeOutQuart(exitProgress)
    }

    const fontSize = Math.min(width * 0.12, height * 0.18)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 10,
        }}
      >
        {/* Staff lines behind text */}
        <div style={{ position: 'absolute', inset: '-30% -15%', zIndex: -1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${20 + i * 15}%`,
                height: 2,
                background: 'rgba(80,55,30,0.35)',
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: `clamp(36px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Georgia', 'Playfair Display', 'Times New Roman', serif",
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            textShadow: '1px 2px 6px rgba(44,24,16,0.4)',
            clipPath: phase === 'enter' ? `inset(0 ${100 - clipX}% 0 0)` : undefined,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SheetMusicComponent(props: MotionGraphicProps<SheetMusicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sheet-music',
  title: 'Kinetic Sheet Music',
  description:
    'Sheet music notation: text appears on musical staff lines, notes and rests interspersed, pen nib draws staves, classical manuscript aesthetic.',
  tags: ['kinetic', 'music', 'sheet', 'notation', 'classical', 'manuscript', 'staff', 'pen'],
  category: 'captions',
  component: SheetMusicComponent as any,
  defaultConfig: {
    words: ['ADAGIO', 'ALLEGRO', 'VIVACE', 'FORTE'],
    colors: ['#2C1810', '#3D2415', '#4A2C17', '#5C3A20'],
    bgColor: '#F5ECD7',
    cycleDuration: 1.4,
    staffColor: '#3D2415',
    inkColor: '#2C1810',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ADAGIO', 'ALLEGRO', 'VIVACE', 'FORTE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#2C1810', '#3D2415', '#4A2C17', '#5C3A20'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5ECD7', group: 'Style' },
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
