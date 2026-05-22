import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NoCapConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Pseudo-random from seed for deterministic case alternation */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/** Convert text to alternating case with chaotic energy */
function chaosCase(text: string, seed: number): string {
  return text
    .split('')
    .map((ch, i) => (seededRandom(seed + i) > 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}

const EMOJIS = ['\u{1F480}', '\u{1F4AF}', '\u{1F525}', '\u{2764}\u{FE0F}', '\u{1F62D}', '\u{1F923}', '\u{1F4A0}']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateX = 0
    let translateY = 0
    let rotation = 0

    const frameNum = frame || 0

    if (phase === 'enter') {
      // Glitch in: flicker and jitter
      const eased = easeOutExpo(enterProgress)
      opacity = enterProgress < 0.3
        ? (Math.sin(enterProgress * 40) > 0 ? 1 : 0)
        : 1
      scale = 0.8 + eased * 0.2
      translateX = (1 - eased) * (seededRandom(index) > 0.5 ? 30 : -30)
      translateY = (1 - eased) * (seededRandom(index + 5) > 0.5 ? 20 : -20)
      rotation = (1 - eased) * (seededRandom(index + 10) > 0.5 ? 8 : -8)
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle jitter during hold
      translateX = Math.sin(frameNum * 0.3) * 2
      rotation = Math.sin(frameNum * 0.2) * 1
    } else {
      // Exit: skull emoji replaces text
      if (exitProgress > 0.3) {
        return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${1 + exitProgress * 0.3})`,
              opacity: 1 - (exitProgress - 0.3) / 0.7,
              fontSize: 'clamp(60px, 16vw, 200px)',
            }}
          >
            &#x1F480;
          </div>
        )
      }
      opacity = 1 - exitProgress * 3
      scale = 1 - exitProgress * 0.2
    }

    // Apply chaotic case, varying per frame during hold
    const caseSeed = phase === 'hold' ? Math.floor(frameNum / 4) : index
    const displayText = chaosCase(word, caseSeed)

    // Pick a random emoji based on index
    const emoji = EMOJIS[index % EMOJIS.length]

    // Alternate bold/italic mix
    const isItalic = index % 2 === 0
    const fontStyle = isItalic ? 'italic' : 'normal'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity: Math.max(0, opacity),
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1.5vw, 16px)',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 11vw, 140px)',
            fontWeight: 900,
            fontStyle,
            color,
            letterSpacing: '0.02em',
            textShadow: `2px 2px 0 rgba(0,0,0,0.4), -1px -1px 0 ${color}40`,
          }}
        >
          {displayText}
        </span>
        <span style={{ fontSize: 'clamp(24px, 6vw, 60px)' }}>
          {emoji}
        </span>
      </div>
    )
  },
}

function NoCapTextComponent(props: MotionGraphicProps<NoCapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-no-cap-text',
  title: 'No Cap Text',
  description: 'Gen-Z chaotic text with alternating case, random emojis, glitch entrance, and skull exit',
  tags: ['kinetic', 'meme', 'gen-z', 'viral', 'chaotic', 'glitch', 'no-cap'],
  category: 'captions',
  component: NoCapTextComponent as any,
  defaultConfig: {
    words: ['no cap', 'frfr', 'lowkey', 'bussin'],
    colors: ['#FF69B4', '#00FF88', '#FFD700', '#FF4444'],
    bgColor: '#0a0a0a',
    cycleDuration: 0.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['no cap', 'frfr', 'lowkey', 'bussin'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF69B4', '#00FF88', '#FFD700', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.7, min: 0.2, max: 3, group: 'Timing' },
  ],
})
