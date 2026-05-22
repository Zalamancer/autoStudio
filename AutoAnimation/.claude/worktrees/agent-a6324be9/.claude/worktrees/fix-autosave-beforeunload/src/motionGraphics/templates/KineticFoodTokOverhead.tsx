import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Community: FoodTok Overhead
// Top-down flat-lay aesthetic. Warm marble/linen background.
// Words drop in from above like ingredients being placed on a
// flat-lay — with a slight elastic snap and subtle shadow landing.
// A thin steam-wisp line rises from the bottom during hold.

interface FoodTokOverheadConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#f8f4ee'
            ? 'linear-gradient(180deg, #f8f4ee 0%, #f0e8dc 100%)'
            : bgColor,
        }}
      >
        {/* Marble/linen texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'repeating-linear-gradient(78deg, rgba(180,140,100,0.04) 0px, rgba(180,140,100,0.04) 1px, transparent 1px, transparent 12px)',
              'repeating-linear-gradient(-15deg, rgba(180,140,100,0.03) 0px, rgba(180,140,100,0.03) 1px, transparent 1px, transparent 20px)',
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
        {/* Steam wisps from bottom — food's still hot */}
        {[25, 50, 75].map((x, i) => {
          const steamY = ((time * 20 + i * 10) % 80)
          const steamOp = steamY < 40 ? steamY / 40 * 0.12 : (80 - steamY) / 40 * 0.12
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                bottom: `${steamY}%`,
                width: 2,
                height: 20,
                background: `linear-gradient(0deg, transparent, rgba(255,255,255,${steamOp}), transparent)`,
                borderRadius: 2,
                transform: `translateX(${Math.sin(time + i) * 8}px)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1
    let shadowBlur = 0
    let shadowOpacity = 0

    if (phase === 'enter') {
      // Drop from above with elastic snap
      const t = enterProgress
      const elastic = t < 0.7
        ? Math.pow(t / 0.7, 2)
        : 1 + Math.sin((t - 0.7) / 0.3 * Math.PI * 1.5) * 0.05 * (1 - t)
      opacity = Math.min(t / 0.2, 1)
      translateY = (1 - elastic) * -60
      scale = elastic
      shadowBlur = elastic * 8
      shadowOpacity = elastic * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      scale = 1
      shadowBlur = 8
      shadowOpacity = 0.15
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      translateY = eased * 20
      shadowBlur = (1 - eased) * 8
      shadowOpacity = (1 - eased) * 0.15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(34px, 8.5vw, 120px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            color,
            filter: `drop-shadow(0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowOpacity}))`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FoodTokOverheadComponent(props: MotionGraphicProps<FoodTokOverheadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-foodtok-overhead',
  title: 'Kinetic FoodTok Overhead',
  description: 'FoodTok flat-lay aesthetic — ingredient drop-in with elastic snap, marble linen bg, steam wisps',
  tags: ['kinetic', 'typography', 'foodtok', 'overhead', 'flatlay', 'food', 'warm', 'community'],
  category: 'captions',
  component: FoodTokOverheadComponent as any,
  defaultConfig: {
    words: ['FRESH', 'CRISPY', 'DRIZZLE', 'SERVE'],
    colors: ['#2d1a0a', '#5a2d0a', '#2d1a0a', '#8b3a0a'],
    bgColor: '#f8f4ee',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FRESH', 'CRISPY', 'DRIZZLE', 'SERVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2d1a0a', '#5a2d0a', '#2d1a0a', '#8b3a0a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8f4ee', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
