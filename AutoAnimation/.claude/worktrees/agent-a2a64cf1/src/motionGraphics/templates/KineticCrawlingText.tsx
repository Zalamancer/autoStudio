import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrawlingTextConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, #0a1a0a 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const currentFrame = frame ?? 0
    let opacity = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress
    }

    // Each letter gets independent micro-movement
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          whiteSpace: 'nowrap',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 37 + i * 13
          // Different oscillation frequency per letter
          const freqX = 2 + rand(seed) * 4
          const freqY = 3 + rand(seed + 1) * 5
          const phaseOffsetX = rand(seed + 2) * Math.PI * 2
          const phaseOffsetY = rand(seed + 3) * Math.PI * 2
          const ampX = 1.5 + rand(seed + 4) * 2
          const ampY = 1 + rand(seed + 5) * 2

          let crawlX = 0
          let crawlY = 0

          if (phase === 'enter') {
            // Start with more intense crawling, settle down
            const intensity = 1 - enterProgress * 0.5
            crawlX = Math.sin(currentFrame * 0.15 * freqX + phaseOffsetX) * ampX * intensity * 2
            crawlY = Math.cos(currentFrame * 0.15 * freqY + phaseOffsetY) * ampY * intensity * 2
          } else if (phase === 'hold') {
            // Unsettling constant micro-movement
            crawlX = Math.sin(currentFrame * 0.12 * freqX + phaseOffsetX) * ampX
            crawlY = Math.cos(currentFrame * 0.12 * freqY + phaseOffsetY) * ampY
          } else {
            // Intensify crawling as text exits
            const intensity = 1 + exitProgress * 2
            crawlX = Math.sin(currentFrame * 0.15 * freqX + phaseOffsetX) * ampX * intensity
            crawlY = Math.cos(currentFrame * 0.15 * freqY + phaseOffsetY) * ampY * intensity
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translate(${crawlX}px, ${crawlY}px)`,
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color,
                textShadow: `0 0 8px ${color}, 0 0 20px rgba(0, 80, 0, 0.4)`,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function CrawlingTextComponent(props: MotionGraphicProps<CrawlingTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crawling-text',
  title: 'Kinetic Crawling Text',
  description: 'Letters with independent micro-movements that crawl and writhe, unsettling organic movement in dark green',
  tags: ['kinetic', 'typography', 'horror', 'crawling', 'organic', 'dark', 'unsettling', 'creepy'],
  category: 'captions',
  component: CrawlingTextComponent as any,
  defaultConfig: {
    words: ['CRAWL', 'WRITHE', 'INFEST', 'SWARM'],
    colors: ['#2D8B2D', '#1A6B1A', '#3DA63D', '#0F4F0F'],
    bgColor: '#040804',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRAWL', 'WRITHE', 'INFEST', 'SWARM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2D8B2D', '#1A6B1A', '#3DA63D', '#0F4F0F'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040804', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
