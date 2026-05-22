import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JapaneseStreetConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: (_props: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 100%)',
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      // Slide in from right with motion blur
      const eased = 1 - Math.pow(1 - enterProgress, 3) // ease out cubic
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = (1 - eased) * (width * 0.5)
      blur = (1 - enterProgress) * 12
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle neon flicker
      const flicker = Math.sin(Date.now() * 0.01 + index * 3) > 0.92 ? 0.7 : 1
      opacity = flicker
    } else {
      // Slide out to left with blur
      const eased = exitProgress * exitProgress // ease in quad
      opacity = 1 - exitProgress
      translateX = -eased * (width * 0.5)
      blur = exitProgress * 12
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 10,
          color,
          textShadow: [
            `0 0 10px ${color}`,
            `0 0 30px ${color}`,
            `0 0 60px rgba(255,255,255,0.1)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function JapaneseStreetComponent(props: MotionGraphicProps<JapaneseStreetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-japanese-street',
  title: 'Kinetic Japanese Street',
  description: 'Shibuya-inspired neon street signs with fast slide-in motion blur and neon glow',
  tags: ['kinetic', 'typography', 'japanese', 'neon', 'shibuya', 'street'],
  category: 'captions',
  component: JapaneseStreetComponent as any,
  defaultConfig: {
    words: ['TOKYO', 'NIGHTS', 'NEON', 'DREAMS'],
    colors: ['#FF3366', '#00FFFF', '#FF6600', '#66FF00'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TOKYO', 'NIGHTS', 'NEON', 'DREAMS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00FFFF', '#FF6600', '#66FF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
