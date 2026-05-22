import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PowerWordConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Background darkens around a central spotlight
    const pulseRadius = 30 + Math.sin(time * 2) * 5
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${bgColor} 0%, rgba(0,0,0,0.95) ${pulseRadius}%, #000000 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let glowRadius = 20
    let glowOpacity = 0.4
    let spotlightSize = 0

    const time = (frame || 0) / 30

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      opacity = eased
      scale = 0.5 + eased * 0.5
      spotlightSize = eased * 100
      glowRadius = 10 + eased * 30
      glowOpacity = eased * 0.5
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.02
      // Pulsing spotlight
      glowRadius = 30 + Math.sin(time * 3) * 10
      glowOpacity = 0.4 + Math.sin(time * 2.5) * 0.15
      spotlightSize = 100
    } else {
      const eased = easeInQuart(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.3
      glowRadius = 30 * (1 - eased)
      glowOpacity = 0.4 * (1 - eased)
      spotlightSize = 100 * (1 - eased)
    }

    return (
      <>
        {/* Radial spotlight glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${spotlightSize * 3}px`,
            height: `${spotlightSize * 3}px`,
            background: `radial-gradient(circle, ${color}${Math.round(glowOpacity * 40).toString(16).padStart(2, '0')} 0%, ${color}10 40%, transparent 70%)`,
            opacity,
          }}
        />
        {/* Secondary glow ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${spotlightSize * 4.5}px`,
            height: `${spotlightSize * 4.5}px`,
            background: `radial-gradient(circle, transparent 30%, ${color}08 50%, transparent 70%)`,
            opacity: opacity * 0.5,
          }}
        />
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(60px, 20vw, 260px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            color,
            textShadow: `0 0 ${glowRadius}px ${color}88, 0 0 ${glowRadius * 2}px ${color}44, 0 0 ${glowRadius * 3}px ${color}22`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function PowerWordComponent(props: MotionGraphicProps<PowerWordConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-power-word',
  title: 'Kinetic Power Word',
  description: 'Single powerful word dominates screen with dramatic pulsing spotlight and darkened background.',
  tags: ['kinetic', 'typography', 'power', 'spotlight', 'dramatic', 'motivational', 'glow'],
  category: 'captions',
  component: PowerWordComponent as any,
  defaultConfig: {
    words: ['STRENGTH', 'COURAGE', 'VICTORY'],
    colors: ['#FFD700', '#FF6B35', '#FF4444'],
    bgColor: '#1A1A1A',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STRENGTH', 'COURAGE', 'VICTORY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF6B35', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
