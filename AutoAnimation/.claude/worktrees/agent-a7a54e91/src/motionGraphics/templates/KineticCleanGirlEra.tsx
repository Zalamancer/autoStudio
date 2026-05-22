import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// 2025 TikTok Trend: Clean Girl Era
// Skin-tone minimal palette, ultra-thin sans-serif, words breathe in slowly
// from opacity 0 with microscopic upward drift — "quiet but unshakeable"
// Subtle gold hair-clip accent line animates under the word during hold

interface CleanGirlEraConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#faf7f4'
          ? 'linear-gradient(160deg, #faf7f4 0%, #f3ede6 60%, #ede6dc 100%)'
          : bgColor,
      }}
    >
      {/* Warm light from top-right — morning sun */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 80% 10%, rgba(255,230,180,0.18) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateY = (1 - eased) * 12
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      opacity = Math.pow(1 - exitProgress, 2)
      translateY = exitProgress * -10
    }

    // Gold accent line width tracks hold phase
    const lineWidth = phase === 'hold'
      ? Math.min(holdProgress * 2, 1) * 100
      : phase === 'enter'
        ? enterProgress * 60
        : (1 - exitProgress) * 100

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(28px, 7vw, 100px)',
            fontWeight: 100,
            letterSpacing: 14,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
        {/* Gold hair-clip accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    )
  },
}

function CleanGirlEraComponent(props: MotionGraphicProps<CleanGirlEraConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clean-girl-era',
  title: 'Kinetic Clean Girl Era',
  description: '2025 TikTok clean girl aesthetic — ultra-thin sans-serif, warm neutral bg, slow breath-in fade with animated gold accent line',
  tags: ['kinetic', 'typography', 'clean-girl', 'tiktok', 'minimal', 'neutral', 'trending', '2025'],
  category: 'captions',
  component: CleanGirlEraComponent as any,
  defaultConfig: {
    words: ['EFFORTLESS', 'GLOWING', 'GROUNDED', 'SOFT'],
    colors: ['#5c4a3a', '#5c4a3a', '#5c4a3a', '#5c4a3a'],
    bgColor: '#faf7f4',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EFFORTLESS', 'GLOWING', 'GROUNDED', 'SOFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5c4a3a', '#5c4a3a', '#5c4a3a', '#5c4a3a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf7f4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
