import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Content Format: Hot Take Callout
// Aggressive neon-yellow/black. Words enter with a sharp SHAKE
// (horizontal jitter) simulating someone slamming a desk, then hold
// with a pulsing outline border. A bold "!" counter-corner accent
// animates in. Exit: words get slapped sideways off screen.

interface HotTakeCalloutConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Rapid pulse on background — warning strobe
    const pulse = Math.pow(Math.abs(Math.sin(time * Math.PI * 3)), 8) * 0.06

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#111111' ? '#111111' : bgColor,
        }}
      >
        {/* Yellow pulse burst from center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, rgba(255,230,0,${pulse}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Corner ! marks */}
        {[['5%', '5%'], ['88%', '5%'], ['5%', '85%'], ['88%', '85%']].map(([l, t], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: l,
              top: t,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(12px, 3vw, 40px)',
              color: '#ffe600',
              opacity: 0.3,
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            !
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let outlineOpacity = 0

    if (phase === 'enter') {
      // Desk slam: shake horizontal jitter on entry
      const t = enterProgress
      opacity = Math.min(t / 0.15, 1)
      if (t < 0.5) {
        // Jitter
        const jitterDecay = 1 - t / 0.5
        const jitterPhase = Math.floor(t * 40)
        translateX = (jitterPhase % 2 === 0 ? 6 : -6) * jitterDecay
      }
    } else if (phase === 'hold') {
      opacity = 1
      outlineOpacity = 1
    } else {
      // Slap sideways off screen
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - exitProgress
      translateX = eased * 200
      translateY = exitProgress * -10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px)`,
          opacity,
        }}
      >
        {/* Pulsing outline layer */}
        {outlineOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              fontFamily: "'Impact', 'Arial Black', 'Franklin Gothic Heavy', sans-serif",
              fontSize: 'clamp(44px, 11vw, 155px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 2,
              whiteSpace: 'nowrap',
              color: 'transparent',
              WebkitTextStroke: `3px ${color}`,
              opacity: outlineOpacity * (0.4 + Math.sin(Date.now() * 0.008) * 0.3),
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%) scale(1.04)',
            }}
          >
            {word}
          </div>
        )}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', 'Franklin Gothic Heavy', sans-serif",
            fontSize: 'clamp(44px, 11vw, 155px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function HotTakeCalloutComponent(props: MotionGraphicProps<HotTakeCalloutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hot-take-callout',
  title: 'Kinetic Hot Take Callout',
  description: 'TikTok hot take format — desk-slam jitter entry, pulsing outline hold, slap-sideways exit, neon yellow on black',
  tags: ['kinetic', 'typography', 'hot-take', 'callout', 'bold', 'tiktok', 'aggressive', 'content-format'],
  category: 'captions',
  component: HotTakeCalloutComponent as any,
  defaultConfig: {
    words: ['ACTUALLY', 'NO ONE', 'ASKED', 'WRONG'],
    colors: ['#ffe600', '#ffe600', '#ffe600', '#ffe600'],
    bgColor: '#111111',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ACTUALLY', 'NO ONE', 'ASKED', 'WRONG'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffe600', '#ffe600', '#ffe600', '#ffe600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
  ],
})
