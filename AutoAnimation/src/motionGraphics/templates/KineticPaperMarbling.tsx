import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperMarblingConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Paper marbling (Ebru): oil-based paint floated on size (thickened water).
// Colors are added and manipulated with combs/stylus into patterns.
// Paper laid on surface, LIFTS the pattern.
// Animation: swirling color patterns condense into letter shapes as paper "lifts"
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Marbling tank — the floating paint surface
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Floating paint swirls on size */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 60% 20% at ${50 + Math.sin(f * 0.04) * 10}% ${30 + Math.cos(f * 0.03) * 5}%, rgba(180,140,200,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at ${70 + Math.sin(f * 0.06) * 8}% ${60 + Math.cos(f * 0.05) * 8}%, rgba(140,200,180,0.07) 0%, transparent 60%),
              radial-gradient(ellipse 50% 25% at ${30 + Math.cos(f * 0.04) * 12}% ${70 + Math.sin(f * 0.035) * 6}%, rgba(200,160,140,0.07) 0%, transparent 60%)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Marbled wave lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const y = (i / 8) * 100
            const amp = 3 + rand(i * 7) * 4
            const freq = 0.015 + rand(i * 11) * 0.01
            const pts = Array.from({ length: 20 }, (_, j) => {
              const x = (j / 19) * 100
              const dy = Math.sin((j * freq * 100 + f * 0.05 + i) * Math.PI) * amp
              return `${x},${y + dy}`
            }).join(' ')
            return (
              <polyline
                key={i}
                points={pts}
                fill="none"
                stroke="#8B6080"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
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

    // Marbling process phases:
    // 1. Paint swirls condense (float → shape)
    // 2. Paper lifts — transfer reveals text
    // 3. Hold: marbling pattern lives inside letters
    // 4. Exit: paint disperses back

    let transferProgress = 0   // How much has been "lifted" from tank
    let swirling = 0           // Swirl motion intensity
    let opacity = 0

    if (phase === 'enter') {
      transferProgress = easeInOutCubic(enterProgress)
      swirling = Math.max(0, 1 - enterProgress * 2)
      opacity = Math.min(1, enterProgress * 1.5)
    } else if (phase === 'hold') {
      transferProgress = 1
      swirling = 0
      opacity = 1
    } else {
      transferProgress = 1 - easeInOutCubic(exitProgress)
      swirling = exitProgress
      opacity = Math.max(0, 1 - exitProgress * 1.3)
    }

    // Marbled color palette
    const marblingColors = [
      ['#8B4A82', '#5B6FA8', '#4A8B6F', '#A87A4A'],
      ['#C4553D', '#3D7EC4', '#3DC46B', '#C4C13D'],
      ['#9B3D8E', '#3D9B5A', '#8E9B3D', '#3D5A9B'],
    ]
    const palette = marblingColors[index % marblingColors.length]

    const fontSize = 'clamp(52px, 14vw, 190px)'

    // Swirl distortion (simulated via perspective transform)
    const swirlX = swirling > 0 ? Math.sin(f * 0.5) * swirling * 8 : 0
    const swirlY = swirling > 0 ? Math.cos(f * 0.4) * swirling * 5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${swirlX}px), calc(-50% + ${swirlY}px))`,
          opacity,
        }}
      >
        {/* Marbling swirl layers within text shape */}
        {palette.map((swColor, si) => {
          const waveAmp = (1 - transferProgress) * 12 + 2
          const phase2 = si * Math.PI * 0.6 + f * 0.2
          const offsetX = Math.sin(phase2) * waveAmp + (si - 1.5) * (1 - transferProgress) * 6
          const offsetY = Math.cos(phase2 * 0.7) * waveAmp * 0.5

          return (
            <div
              key={si}
              style={{
                position: si === 0 ? 'relative' : 'absolute',
                top: si === 0 ? undefined : offsetY,
                left: si === 0 ? undefined : offsetX,
                fontFamily: "'Georgia', 'Palatino', serif",
                fontSize,
                fontWeight: 800,
                letterSpacing: 3,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                color: swColor,
                opacity: si === palette.length - 1 ? 0.9 : 0.45 - si * 0.05,
                filter: si < 2 ? `blur(${(1 - transferProgress) * 4 + 1}px)` : undefined,
                mixBlendMode: si < 3 ? 'multiply' : 'normal',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Main color — fully transferred */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize,
            fontWeight: 800,
            letterSpacing: 3,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color,
            opacity: transferProgress * 0.9,
            textShadow: `1px 1px 0 rgba(0,0,0,0.08)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PaperMarblingComponent(props: MotionGraphicProps<PaperMarblingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-marbling',
  title: 'Kinetic Paper Marbling',
  description: 'Swirling oil paint on size condenses from fluid marbling pattern into letter shapes as paper lifts from the tank — multiple color layers merge and settle into transferred text with characteristic watery movement',
  tags: ['kinetic', 'typography', 'marbling', 'paper', 'ebru', 'craft', 'swirl', 'paint', 'watercolor', 'pattern', 'Turkish'],
  category: 'captions',
  component: PaperMarblingComponent as any,
  defaultConfig: {
    words: ['SWIRL', 'FLOAT', 'LIFT', 'MARBLE'],
    colors: ['#5B3A7E', '#3A5B7E', '#7E5B3A', '#3A7E5B'],
    bgColor: '#F0EDF8',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWIRL', 'FLOAT', 'LIFT', 'MARBLE'], group: 'Content' },
    { key: 'colors', label: 'Paint Colors', type: 'text-array', defaultValue: ['#5B3A7E', '#3A5B7E', '#7E5B3A', '#3A7E5B'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#F0EDF8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
