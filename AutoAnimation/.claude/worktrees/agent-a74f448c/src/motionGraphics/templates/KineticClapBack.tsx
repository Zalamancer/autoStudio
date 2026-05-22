import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClapBackConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateY = 0
    let rotation = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      // Slam in from below with overshoot
      scale = 0.3 + eased * 0.7
      translateY = (1 - eased) * 80
      opacity = Math.min(1, enterProgress * 5)
      // Quick impact rotation
      if (enterProgress > 0.5 && enterProgress < 0.8) {
        const shakeT = (enterProgress - 0.5) / 0.3
        rotation = Math.sin(shakeT * Math.PI * 4) * 3 * (1 - shakeT)
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Aggressive pulse
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.03
    } else {
      opacity = 1 - exitProgress * 2
      scale = 1 + exitProgress * 0.3
    }

    // Add clap emoji between words
    const isEvenIndex = index % 2 === 0
    const displayWord = word

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity: Math.max(0, opacity),
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 24px)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Leading clap for even-indexed words */}
        {isEvenIndex && (
          <span style={{ fontSize: 'clamp(28px, 7vw, 80px)' }}>
            &#x1F44F;
          </span>
        )}
        <span
          style={{
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            letterSpacing: '0.03em',
            textShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {displayWord}
        </span>
        {/* Trailing clap */}
        <span style={{ fontSize: 'clamp(28px, 7vw, 80px)' }}>
          &#x1F44F;
        </span>
      </div>
    )
  },
}

function ClapBackComponent(props: MotionGraphicProps<ClapBackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clap-back',
  title: 'Clap Back',
  description: 'Words slam in with clap emojis between them, aggressive TikTok-viral rhythm with quick succession',
  tags: ['kinetic', 'meme', 'clap', 'viral', 'tiktok', 'aggressive', 'emphasis'],
  category: 'captions',
  component: ClapBackComponent as any,
  defaultConfig: {
    words: ['STOP', 'DOING', 'THIS', 'PLEASE'],
    colors: ['#FF4444', '#FF8800', '#FF4444', '#FF8800'],
    bgColor: '#0d0d0d',
    cycleDuration: 0.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STOP', 'DOING', 'THIS', 'PLEASE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF8800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.6, min: 0.2, max: 3, group: 'Timing' },
  ],
})
