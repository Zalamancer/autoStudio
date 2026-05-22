import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrutalTypeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Raw grid lines — brutalist aesthetic */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            'linear-gradient(0deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 71 + 17
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let rotate = 0
    let scale = 1

    // Jagged off-grid positions per word
    const offsetX = ((seed * 3) % 60) - 30
    const offsetY = ((seed * 7) % 40) - 20
    const wordRotate = ((seed * 11) % 6) - 3

    if (phase === 'enter') {
      // Slam in from random direction with overshoot
      const t = enterProgress
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

      opacity = Math.min(t / 0.15, 1)
      scale = 1 + (1 - eased) * 1.5
      translateX = (1 - eased) * ((seed % 2 === 0) ? -200 : 200) + offsetX * eased
      translateY = offsetY * eased
      rotate = wordRotate * eased + (1 - eased) * ((seed % 2 === 0) ? -10 : 10)
    } else if (phase === 'hold') {
      opacity = 1
      translateX = offsetX
      translateY = offsetY
      rotate = wordRotate
    } else {
      const t = exitProgress
      opacity = 1 - t
      translateX = offsetX + t * ((seed % 2 === 0) ? 100 : -100)
      translateY = offsetY + t * 50
      rotate = wordRotate + t * ((seed % 2 === 0) ? 8 : -8)
      scale = 1 + t * 0.3
    }

    // Determine if we add an underline or background block (brutalist accent)
    const hasBlock = index % 3 === 0
    const blockColor = color === '#000000' ? '#ff0000' : color

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg) scale(${scale})`,
          opacity,
        }}
      >
        {/* Optional brutalist accent block behind text */}
        {hasBlock && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: -8,
              right: -8,
              height: 12,
              background: blockColor,
              opacity: 0.9,
            }}
          />
        )}
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', 'Impact', sans-serif",
            fontSize: 'clamp(50px, 15vw, 200px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: -3,
            lineHeight: 0.85,
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BrutalTypeComponent(props: MotionGraphicProps<BrutalTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-brutal-type',
  title: 'Kinetic Brutal Type',
  description: 'Brutalist raw typography with oversized bold text, jagged off-grid positioning, and anti-design aesthetic',
  tags: ['kinetic', 'typography', 'brutalist', 'bold', 'raw', 'anti-design', 'harsh'],
  category: 'captions',
  component: BrutalTypeComponent as any,
  defaultConfig: {
    words: ['RAW', 'TYPE', 'BOLD', 'HARD'],
    colors: ['#000000', '#000000', '#ff0000', '#000000'],
    bgColor: '#ffffff',
    cycleDuration: 0.9,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAW', 'TYPE', 'BOLD', 'HARD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#000000', '#000000', '#ff0000', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 5, group: 'Timing' },
  ],
})
