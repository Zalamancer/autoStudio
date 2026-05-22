import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// 2025 TikTok Trend: Delusional Girlboss
// Hot pink chaos energy — affirmations typed with unhinged confidence,
// words slam in bold with a slight rotation then hold perfectly still
// like "I said what I said", exit with a hair-flip toss upward

interface DelusionalGirlbossConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Floating ✦ sparkle glyphs
    const sparks = Array.from({ length: 10 }, (_, i) => {
      const seed = i * 53 + 17
      const x = ((seed * 11 + 200) % 85) + 5
      const y = ((seed * 7 + 100) % 80) + 5
      const phase = (time * 1.5 + i * 0.7) % 2
      const sparkOp = Math.sin(phase * Math.PI) * 0.4
      const rot = (time * 60 + i * 36) % 360
      const size = 10 + (seed % 8)

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            opacity: Math.max(0, sparkOp),
            transform: `rotate(${rot}deg)`,
            color: ['#ff3ea5', '#ff80cc', '#ff006e'][i % 3],
            fontSize: size,
            fontWeight: 900,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          ✦
        </div>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#ffe0f0'
            ? 'linear-gradient(145deg, #ffe0f0 0%, #ffb3d9 40%, #ff80cc 100%)'
            : bgColor,
        }}
      >
        {/* Diagonal hot-pink stripe */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,62,165,0.07) 0px, rgba(255,62,165,0.07) 2px, transparent 2px, transparent 40px)',
            pointerEvents: 'none',
          }}
        />
        {sparks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotate = 0
    let translateY = 0

    if (phase === 'enter') {
      // Slam in from below, slight overshoot rotation
      const t = enterProgress
      const eased = t < 0.7
        ? Math.pow(t / 0.7, 0.5)
        : 1 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.06 * (1 - t)
      opacity = Math.min(t / 0.2, 1)
      scale = 0.6 + eased * 0.4
      rotate = (1 - eased) * -4
      translateY = (1 - eased) * 40
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotate = 0
    } else {
      // Hair-flip: toss up and fade
      opacity = 1 - exitProgress
      translateY = -exitProgress * 50
      rotate = exitProgress * 8
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Impact', 'Franklin Gothic Heavy', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
          color,
          WebkitTextStroke: '2px rgba(0,0,0,0.15)',
          filter: 'drop-shadow(0 4px 0px rgba(0,0,0,0.2))',
        }}
      >
        {word}
      </div>
    )
  },
}

function DelusionalGirlbossComponent(props: MotionGraphicProps<DelusionalGirlbossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-delusional-girlboss',
  title: 'Kinetic Delusional Girlboss',
  description: '2025 TikTok aesthetic — hot pink chaos energy with bold Impact slam-in, sparkle glyphs, and hair-flip exit',
  tags: ['kinetic', 'typography', 'girlboss', 'tiktok', 'hot-pink', 'bold', 'trending', '2025'],
  category: 'captions',
  component: DelusionalGirlbossComponent as any,
  defaultConfig: {
    words: ['PERIOD', 'ICONIC', 'RENT FREE', 'SLAY'],
    colors: ['#ff006e', '#cc0055', '#ff3ea5', '#880033'],
    bgColor: '#ffe0f0',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PERIOD', 'ICONIC', 'RENT FREE', 'SLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff006e', '#cc0055', '#ff3ea5', '#880033'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffe0f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
