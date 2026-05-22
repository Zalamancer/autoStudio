import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MeditationBellConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle warm gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(218,165,32,0.06) 0%, transparent 60%)`,
          }}
        />

        {/* Bell silhouette at top */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: Math.min(width, height) * 0.12,
            height: Math.min(width, height) * 0.15,
            borderRadius: '50% 50% 45% 45%',
            background: 'linear-gradient(180deg, rgba(218,165,32,0.2) 0%, rgba(218,165,32,0.08) 100%)',
            boxShadow: '0 0 20px rgba(218,165,32,0.1)',
          }}
        />

        {/* Ripple waves emanating from center */}
        {Array.from({ length: 6 }, (_, i) => {
          const cycleTime = (time * 0.8 + i * 0.7) % 4
          const rippleProgress = Math.min(1, cycleTime / 3)
          const rippleSize = Math.min(width, height) * 0.1 + rippleProgress * Math.min(width, height) * 0.5
          const rippleOpacity = (1 - rippleProgress) * 0.08

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: rippleSize,
                height: rippleSize,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `1px solid rgba(218,165,32,${rippleOpacity})`,
                background: 'transparent',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    let rippleScale = 0
    let rippleOpacity = 0

    if (phase === 'enter') {
      // Bell strike — word appears suddenly then settles
      const strikePoint = 0.15
      if (enterProgress < strikePoint) {
        opacity = 0
        scale = 0.3
        blur = 12
      } else {
        const afterStrike = (enterProgress - strikePoint) / (1 - strikePoint)
        const eased = easeOutExpo(afterStrike)
        opacity = Math.min(1, afterStrike * 4)
        scale = 1.3 - eased * 0.3
        blur = (1 - eased) * 4
        // Ripple effect on strike
        rippleScale = eased * 2.5
        rippleOpacity = (1 - eased) * 0.6
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle vibration like a ringing bell
      const vibration = Math.sin(holdProgress * Math.PI * 12) * Math.exp(-holdProgress * 3)
      scale = 1 + vibration * 0.02
    } else {
      const eased = easeOutQuart(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased * 0.1
      blur = eased * 6
    }

    return (
      <>
        {/* Ripple ring on strike */}
        {rippleOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(80px, 20vw, 200px)',
              height: 'clamp(80px, 20vw, 200px)',
              transform: `translate(-50%, -50%) scale(${rippleScale})`,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              opacity: rippleOpacity,
            }}
          />
        )}
        {/* Second ripple ring */}
        {rippleOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(80px, 20vw, 200px)',
              height: 'clamp(80px, 20vw, 200px)',
              transform: `translate(-50%, -50%) scale(${rippleScale * 0.7})`,
              borderRadius: '50%',
              border: `1px solid ${color}`,
              opacity: rippleOpacity * 0.5,
            }}
          />
        )}
        {/* Word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: 'clamp(36px, 11vw, 140px)',
            fontWeight: 400,
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            color,
            textShadow: `0 0 20px ${color}50, 0 0 40px ${color}25`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function MeditationBellComponent(props: MotionGraphicProps<MeditationBellConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-meditation-bell',
  title: 'Kinetic Meditation Bell',
  description: 'Text appears with a bell-strike ripple effect and gentle vibration, with background ripple waves and golden bell silhouette',
  tags: ['kinetic', 'typography', 'meditation', 'bell', 'singing-bowl', 'zen', 'mindfulness', 'calm'],
  category: 'captions',
  component: MeditationBellComponent as any,
  defaultConfig: {
    words: ['LISTEN', 'SILENCE', 'AWARE', 'STILL'],
    colors: ['#DAA520', '#C9A84C', '#E8D48B', '#B8942E'],
    bgColor: '#0d0d12',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LISTEN', 'SILENCE', 'AWARE', 'STILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DAA520', '#C9A84C', '#E8D48B', '#B8942E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
