import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcertFlyerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Radial gradient spotlight from top */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, height }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Fly in from bottom with overshoot
      opacity = Math.min(1, enterProgress * 3)
      // Overshoot: go past target then settle back
      const t = enterProgress
      const overshoot = t < 0.7
        ? (t / 0.7)
        : 1 + (1 - (t - 0.7) / 0.3) * 0.08
      translateY = (1 - overshoot) * (height * 0.5)
    } else if (phase === 'hold') {
      opacity = 1
      // Slight breathing pulse
      scale = 1 + Math.sin(Date.now() * 0.004) * 0.015
    } else {
      // Fly up and away
      opacity = 1 - exitProgress
      translateY = -exitProgress * exitProgress * (height * 0.6)
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) scaleY(1.3)`,
          opacity,
          fontFamily: "Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.05)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ConcertFlyerComponent(props: MotionGraphicProps<ConcertFlyerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-concert-flyer',
  title: 'Kinetic Concert Flyer',
  description: 'Concert poster style with ultra-condensed text flying in from below with spotlight background',
  tags: ['kinetic', 'typography', 'concert', 'poster', 'gig'],
  category: 'captions',
  component: ConcertFlyerComponent as any,
  defaultConfig: {
    words: ['LIVE', 'TONIGHT', 'SOLD', 'OUT'],
    colors: ['#FF2D00', '#FFD700', '#FF6EC7', '#FFFFFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIVE', 'TONIGHT', 'SOLD', 'OUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF2D00', '#FFD700', '#FF6EC7', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
