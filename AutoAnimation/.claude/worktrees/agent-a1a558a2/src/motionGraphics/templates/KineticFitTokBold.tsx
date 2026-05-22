import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Community: FitTok Bold
// High-contrast black/white with orange accent. Words explode in
// from scale 0 with a sharp impact-burst — like a PR being hit.
// Background pulses with an energy-ring emanation on each word arrival.
// Hold: word vibrates micro with "muscles tensed" energy.
// Exit: slam down off-screen.

interface FitTokBoldConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Energy ring pulse — timing based on frame
    const pulse = (time * 1.5) % 2
    const ringOpacity = pulse < 1 ? pulse * 0.15 : (2 - pulse) * 0.15
    const ringScale = 0.2 + pulse * 0.6

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#0a0a0a' ? '#0a0a0a' : bgColor,
        }}
      >
        {/* Energy ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            paddingBottom: '100%',
            marginLeft: '-50%',
            marginTop: '-50%',
            borderRadius: '50%',
            border: '2px solid rgba(255,100,0,0.6)',
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
            pointerEvents: 'none',
          }}
        />
        {/* Orange corner accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'clamp(20px, 5%, 50px)',
            height: 4,
            background: '#ff6600',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 'clamp(20px, 5%, 50px)',
            height: 4,
            background: '#ff6600',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    let skewX = 0

    if (phase === 'enter') {
      // Explosive burst-in from nothing
      const t = enterProgress
      const burst = t < 0.5
        ? Math.pow(t / 0.5, 0.4) * 1.1
        : 1.1 - Math.sin((t - 0.5) / 0.5 * Math.PI * 0.5) * 0.1
      opacity = Math.min(t / 0.15, 1)
      scale = burst
      skewX = (1 - t) * -5
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Micro-vibration — muscles tensed
      const vibrate = Math.sin(Date.now() * 0.04) * 0.5
      translateY = vibrate
    } else {
      // Slam down off screen
      const eased = Math.pow(exitProgress, 3)
      opacity = exitProgress < 0.3 ? 1 : 1 - (exitProgress - 0.3) / 0.7
      translateY = eased * 80
      scale = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) skewX(${skewX}deg)`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', 'Franklin Gothic Heavy', sans-serif",
          fontSize: 'clamp(48px, 13vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: -2,
          whiteSpace: 'nowrap',
          color,
          filter: `drop-shadow(0 0 ${10 * (1 - exitProgress)}px rgba(255,100,0,0.4))`,
        }}
      >
        {word}
      </div>
    )
  },
}

function FitTokBoldComponent(props: MotionGraphicProps<FitTokBoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fittok-bold',
  title: 'Kinetic FitTok Bold',
  description: 'FitTok community aesthetic — explosive burst-in, orange energy rings, micro-vibration hold, slam-down exit',
  tags: ['kinetic', 'typography', 'fittok', 'fitness', 'bold', 'gym', 'energy', 'community'],
  category: 'captions',
  component: FitTokBoldComponent as any,
  defaultConfig: {
    words: ['LIFT', 'GRIND', 'GAINS', 'GO'],
    colors: ['#ff6600', '#ffffff', '#ff6600', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIFT', 'GRIND', 'GAINS', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6600', '#ffffff', '#ff6600', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
  ],
})
