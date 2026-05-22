import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LibraryShelfConfig extends KineticBaseConfig {}

// Deterministic book spine colors on shelves
const SHELF_BOOKS = Array.from({ length: 24 }).map((_, i) => ({
  x: (i % 8) * 12.5,
  row: Math.floor(i / 8),
  width: 8 + (i % 5) * 3,
  hue: (i * 37 + 15) % 360,
  lightness: 25 + (i % 4) * 10,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #2a1f14 0%, ${bgColor} 50%, #1a1209 100%)`,
        }}
      >
        {/* Library shelves */}
        {[0, 1, 2].map((row) => (
          <div key={row}>
            {/* Shelf board */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${22 + row * 28}%`,
                height: 4,
                background: 'linear-gradient(180deg, #5c422e, #3d2b1f)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                zIndex: 2,
              }}
            />
            {/* Books on shelf */}
            {SHELF_BOOKS.filter((b) => b.row === row).map((book, j) => {
              const sway = Math.sin(time * 0.5 + j * 0.8) * 1
              return (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: `${book.x + 2}%`,
                    top: `${8 + row * 28}%`,
                    width: `${book.width}px`,
                    height: `${14}%`,
                    background: `hsl(${book.hue}, 30%, ${book.lightness}%)`,
                    borderRadius: '1px 2px 0 0',
                    opacity: 0.35,
                    transform: `rotate(${sway}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                />
              )
            })}
          </div>
        ))}
        {/* Warm library lamp glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,200,100,0.08) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
    width: canvasWidth,
  }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let scaleY = 1

    if (phase === 'enter') {
      // Slides in like a book being pushed onto a shelf
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2)
      translateX = (1 - eased) * canvasWidth * 0.5
      // Slight tilt as book slides in
      scaleY = 0.9 + eased * 0.1
      translateY = (1 - eased) * 8
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle settle into shelf
      const settle = Math.sin(holdProgress * Math.PI * 2) * 2
      translateX = settle
    } else {
      // Pulled off shelf
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = -eased * canvasWidth * 0.4
      translateY = eased * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scaleY(${scaleY})`,
          opacity,
        }}
      >
        {/* Book spine background */}
        <div
          style={{
            position: 'absolute',
            inset: '-15% -6%',
            background: `linear-gradient(90deg, ${color}18, ${color}08, ${color}18)`,
            borderRadius: 3,
            borderLeft: `3px solid ${color}30`,
            borderRight: `1px solid ${color}15`,
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 800,
            color,
            textShadow: '1px 2px 4px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            padding: '0 0.15em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LibraryShelfComponent(props: MotionGraphicProps<LibraryShelfConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-library-shelf',
  title: 'Kinetic Library Shelf',
  description:
    'Words slide in like books on library shelves with warm wood tones, book spine styling, and a background of gently swaying books',
  tags: ['kinetic', 'typography', 'library', 'shelf', 'book', 'reading', 'literary', 'literature'],
  category: 'captions',
  component: LibraryShelfComponent as any,
  defaultConfig: {
    words: ['READ', 'MORE', 'BOOKS', 'NOW'],
    colors: ['#C9A96E', '#8B6D4C', '#D4B896', '#A0845C'],
    bgColor: '#1a130a',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['READ', 'MORE', 'BOOKS', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C9A96E', '#8B6D4C', '#D4B896', '#A0845C'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a130a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
