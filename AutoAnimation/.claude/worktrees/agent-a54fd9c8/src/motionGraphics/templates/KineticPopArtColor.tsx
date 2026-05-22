import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PopArtColorConfig extends KineticBaseConfig {}

// Warhol-style: text shown in a 2×2 grid of 4 color variations simultaneously.
// Each quadrant is a different color-key treatment — like silkscreen color separations.
// The text IS the repeated grid; each copy cycles through its own color phase.

const WARHOL_PALETTES = [
  // Classic Marilyn-style: warm vivid primary combos
  { bg: '#FF2A6D', fg: '#FFFF00', outline: '#000' },
  { bg: '#00BFFF', fg: '#FF6600', outline: '#000' },
  { bg: '#7FFF00', fg: '#FF0066', outline: '#000' },
  { bg: '#FFD700', fg: '#0000FF', outline: '#000' },
  // Mao series: cool/warm alternation
  { bg: '#FF4500', fg: '#00FFFF', outline: '#000' },
  { bg: '#9400D3', fg: '#FFFF00', outline: '#000' },
  { bg: '#00FF7F', fg: '#FF0080', outline: '#000' },
  { bg: '#FF1493', fg: '#00FF00', outline: '#000' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Grid dividers — the silkscreen registration lines */}
        {/* Vertical center */}
        <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: '100%', background: '#000', transform: 'translateX(-50%)' }} />
        {/* Horizontal center */}
        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 4, background: '#000', transform: 'translateY(-50%)' }} />
        {/* Outer border */}
        <div style={{ position: 'absolute', inset: 0, border: '4px solid #000', pointerEvents: 'none' }} />
        {/* Ben-Day background dots per quadrant */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)',
            backgroundSize: '8px 8px',
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 53 + 7

    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Each quadrant stagger-fades in sequentially
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.85 + enterProgress * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      // Slight breathing
      scale = 1 + Math.sin((frame / 30) * 1.5 + seed) * 0.015
    } else {
      opacity = Math.max(0, 1 - exitProgress * 2)
      scale = 1 - exitProgress * 0.1
    }

    // 4 quadrant positions
    const quadrants = [
      { x: 0, y: 0 },
      { x: width / 2, y: 0 },
      { x: 0, y: height / 2 },
      { x: width / 2, y: height / 2 },
    ]

    const quadW = width / 2 - 4
    const quadH = height / 2 - 4

    // Pick 4 palettes offset by index for variety
    const palettes = [
      WARHOL_PALETTES[(seed + 0) % WARHOL_PALETTES.length],
      WARHOL_PALETTES[(seed + 2) % WARHOL_PALETTES.length],
      WARHOL_PALETTES[(seed + 4) % WARHOL_PALETTES.length],
      WARHOL_PALETTES[(seed + 6) % WARHOL_PALETTES.length],
    ]

    return (
      <>
        {quadrants.map((q, i) => {
          // Stagger enter per quadrant
          let qOpacity = opacity
          if (phase === 'enter') {
            const stagger = i * 0.15
            qOpacity = Math.min(1, Math.max(0, (enterProgress - stagger) / (1 - stagger)))
          }
          if (phase === 'exit') {
            const stagger = (3 - i) * 0.1
            qOpacity = Math.min(1, Math.max(0, 1 - (exitProgress - stagger) / (1 - stagger) * 2))
          }

          const pal = palettes[i]

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: q.x + 2,
                top: q.y + 2,
                width: quadW,
                height: quadH,
                background: pal.bg,
                overflow: 'hidden',
                opacity: Math.max(0, qOpacity),
              }}
            >
              {/* Ben-Day dots on each quadrant */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.14) 1.5px, transparent 1.5px)`,
                  backgroundSize: '7px 7px',
                  backgroundPosition: `${i * 3}px ${i * 2}px`,
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                }}
              />

              {/* Text centered in quadrant */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              >
                <div
                  style={{
                    fontFamily: "Impact, 'Arial Black', sans-serif",
                    // Scale font to fit quadrant
                    fontSize: `clamp(18px, ${Math.min(quadW, quadH) * 0.22}px, 90px)`,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: pal.fg,
                    WebkitTextStroke: `2px ${pal.outline}`,
                    textShadow: `2px 2px 0 ${pal.outline}, -1px -1px 0 ${pal.outline}, 1px -1px 0 ${pal.outline}, -1px 1px 0 ${pal.outline}`,
                    whiteSpace: 'nowrap',
                    letterSpacing: 2,
                    userSelect: 'none',
                  }}
                >
                  {word}
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  },
}

function PopArtColorComponent(props: MotionGraphicProps<PopArtColorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pop-art-color',
  title: 'Kinetic Pop Art Color',
  description: 'Warhol silkscreen grid — same word shown 4 times in a 2×2 grid, each quadrant in bold contrasting pop-art colors with Ben-Day dots, staggered reveal',
  tags: ['kinetic', 'typography', 'comic', 'warhol', 'pop-art', 'silkscreen', 'grid', 'color', 'ben-day', 'four-color'],
  category: 'captions',
  component: PopArtColorComponent as any,
  defaultConfig: {
    words: ['BANG', 'LOVE', 'FAME', 'NOW'],
    colors: ['#FF0000', '#00AAFF', '#FF8800', '#AA00FF'],
    bgColor: '#111111',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BANG', 'LOVE', 'FAME', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors (unused — set by palettes)', type: 'text-array', defaultValue: ['#FF0000', '#00AAFF', '#FF8800', '#AA00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Grid Border Color', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
