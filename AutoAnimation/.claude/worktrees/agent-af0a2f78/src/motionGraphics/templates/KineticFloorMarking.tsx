import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FloorMarkingConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Generate deterministic tire marks
    const tireMarks: { x: number; y: number; angle: number; length: number; opacity: number }[] = []
    for (let i = 0; i < 6; i++) {
      tireMarks.push({
        x: seededRand(i * 7 + 1) * width * 0.8 + width * 0.1,
        y: seededRand(i * 7 + 2) * height * 0.6 + height * 0.2,
        angle: seededRand(i * 7 + 3) * 30 - 15,
        length: 60 + seededRand(i * 7 + 4) * 100,
        opacity: 0.03 + seededRand(i * 7 + 5) * 0.05,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Concrete floor texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent, transparent 8px,
                rgba(180,170,160,0.03) 8px, rgba(180,170,160,0.03) 9px
              ),
              repeating-linear-gradient(
                90deg,
                transparent, transparent 12px,
                rgba(180,170,160,0.02) 12px, rgba(180,170,160,0.02) 13px
              )
            `,
          }}
        />
        {/* Concrete joint lines (expansion joints in warehouse floor) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '33%',
            width: 2,
            background: 'rgba(0,0,0,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '66%',
            width: 2,
            background: 'rgba(0,0,0,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 2,
            background: 'rgba(0,0,0,0.06)',
          }}
        />
        {/* Safety yellow walkway boundary lines */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '8%',
            right: '8%',
            height: 6,
            background: 'rgba(255,208,0,0.25)',
            borderRadius: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '8%',
            right: '8%',
            height: 6,
            background: 'rgba(255,208,0,0.25)',
            borderRadius: 1,
          }}
        />
        {/* Forklift tire marks */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {tireMarks.map((mark, i) => (
            <line
              key={i}
              x1={mark.x}
              y1={mark.y}
              x2={mark.x + Math.cos(mark.angle * Math.PI / 180) * mark.length}
              y2={mark.y + Math.sin(mark.angle * Math.PI / 180) * mark.length}
              stroke={`rgba(40,35,30,${mark.opacity})`}
              strokeWidth={8 + seededRand(i * 7 + 6) * 12}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Dust/grime overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 70%, rgba(100,90,80,0.06), transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(100,90,80,0.04), transparent 40%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 41 + 23
    let opacity = 0
    let scaleY = 1

    if (phase === 'enter') {
      // Paint roller effect — text appears as if being stenciled onto concrete
      opacity = Math.min(1, enterProgress * 1.6)
      // Slight vertical stretch as paint is applied
      scaleY = 0.9 + enterProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle concrete vibration from warehouse machinery
      const vibration = Math.sin(f * 1.5 + seed) * 0.3
      opacity = 1 - Math.abs(vibration) * 0.02
    } else {
      // Fade as if paint wearing off
      opacity = 1 - exitProgress
      scaleY = 1 - exitProgress * 0.05
    }

    return (
      <>
        {/* Paint bleed shadow (paint on rough concrete spreads slightly) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(${scaleY})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color: 'rgba(200,180,0,0.15)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 10,
            opacity: opacity * 0.5,
            filter: 'blur(4px)',
          }}
        >
          {word}
        </div>
        {/* Main stencil text — painted on concrete */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(${scaleY})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 10,
            opacity,
            textShadow: '1px 1px 0 rgba(0,0,0,0.2)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function FloorMarkingComponent(props: MotionGraphicProps<FloorMarkingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-floor-marking',
  title: 'Kinetic Floor Marking',
  description: 'Factory floor safety marking with stencil text painted on concrete, forklift tire marks, safety yellow walkway lines, and warehouse industrial texture',
  tags: ['kinetic', 'typography', 'factory', 'floor', 'warehouse', 'industrial', 'stencil', 'safety'],
  category: 'captions',
  component: FloorMarkingComponent as any,
  defaultConfig: {
    words: ['YIELD', 'NO ENTRY', 'LOADING', 'HARDHAT'],
    colors: ['#FFD000', '#FFD000', '#FFD000', '#FFD000'],
    bgColor: '#6B6560',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['YIELD', 'NO ENTRY', 'LOADING', 'HARDHAT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD000', '#FFD000', '#FFD000', '#FFD000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#6B6560', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
