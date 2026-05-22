import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiffractionGratingConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Diffraction grating: parallel grooves split light into spectral orders
// Each diffraction order appears at a different angle with different color
const DIFFRACTION_ORDERS = [
  { angle: 0, hue: 0, label: '0th' }, // 0th order — white
  { angle: -15, hue: 0, label: '+1' }, // +1st order
  { angle: 15, hue: 0, label: '-1' }, // -1st order
  { angle: -28, hue: 0, label: '+2' }, // +2nd order
  { angle: 28, hue: 0, label: '-2' }, // -2nd order
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Grating lines — fine parallel stripes
    const stripes: React.ReactNode[] = []
    const count = 20
    for (let i = 0; i < count; i++) {
      stripes.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(i / count) * 100}%`,
            width: 1,
            background: `rgba(255,255,255,${0.015 + Math.sin(i * 0.8 + time * 2) * 0.008})`,
          }}
        />,
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {stripes}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Diffraction orders separate from center on entry, then collapse back
    const separation =
      phase === 'enter' ? (1 - eased) * 1.2 : phase === 'hold' ? 0.05 + Math.sin(time * 1.5) * 0.03 : exitProgress * 1.4

    // Spectral hue for each order — rainbow spread
    const spectralColors = [
      '#FFFFFF', // 0th: white (all colors)
      '#FF3333', // +1: long wavelength (red end)
      '#FF3333', // -1: red
      '#3333FF', // +2: short wavelength (blue end)
      '#3333FF', // -2: blue
    ]

    const overallOpacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {DIFFRACTION_ORDERS.map((order, i) => {
          const angleRad = (order.angle * separation * Math.PI) / 180
          const translateX = Math.sin(angleRad) * 100
          const translateY = -Math.cos(angleRad) * 5 + Math.cos(angleRad) * 5

          const isZeroth = i === 0
          const orderOpacity = isZeroth ? 1 : separation * 0.7 * (1 - Math.abs(i - 2) * 0.15)
          const orderColor = isZeroth ? color : spectralColors[i]
          const orderBlur = isZeroth ? 0 : separation * 2

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 800,
                color: orderColor,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                opacity: orderOpacity,
                mixBlendMode: isZeroth ? 'normal' : 'screen',
                filter: orderBlur > 0.2 ? `blur(${orderBlur}px)` : undefined,
              }}
            >
              {word}
            </div>
          )
        })}
      </div>
    )
  },
}

function DiffractionGratingComponent(props: MotionGraphicProps<DiffractionGratingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-diffraction-grating',
  title: 'Kinetic Diffraction Grating',
  description:
    'Diffraction grating splits text into spectral orders — colored copies fan out at different angles like light through a CD, then collapse back to white',
  tags: ['kinetic', 'typography', 'diffraction', 'grating', 'spectral', 'interference', 'optical', 'rainbow'],
  category: 'captions',
  component: DiffractionGratingComponent as any,
  defaultConfig: {
    words: ['DIFFRACT', 'SPECTRUM', 'ORDER', 'GRATING'],
    colors: ['#FFFFFF', '#F0F0FF', '#FFF0F0', '#F0FFF0'],
    bgColor: '#04040A',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DIFFRACT', 'SPECTRUM', 'ORDER', 'GRATING'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#04040A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
