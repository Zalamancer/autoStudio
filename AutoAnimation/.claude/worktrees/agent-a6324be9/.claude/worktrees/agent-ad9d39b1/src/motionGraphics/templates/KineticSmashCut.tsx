import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmashCutConfig extends KineticBaseConfig {
  impactScale: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Shockwave ring emanating from center on each new word
    // Concentric rings that expand outward
    const ringProgress = (time * 2.5) % 1
    const ring2Progress = ((time * 2.5) + 0.4) % 1
    const ringRadius = ringProgress * 150
    const ring2Radius = ring2Progress * 120

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Shockwave ring 1 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ringRadius * 2,
            height: ringRadius * 2,
            transform: 'translate(-50%, -50%)',
            border: `2px solid rgba(255,255,255,${Math.max(0, 0.3 - ringProgress * 0.3)})`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        {/* Shockwave ring 2 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ring2Radius * 2,
            height: ring2Radius * 2,
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(255,200,50,${Math.max(0, 0.2 - ring2Progress * 0.2)})`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // SMASH CUT: text hits at 100% intensity with zero easing
    // enter: binary — frame 0 it doesn't exist, frame 1 it's at full size and full opacity
    // A single over-scale slam then snap to normal
    const impactScale = 1.2

    let opacity = 0
    let scale = 1
    let skewX = 0

    if (phase === 'enter') {
      // No fade, no ease — instant appearance
      opacity = 1
      // Brief over-scale impact that immediately snaps back
      if (enterProgress < 0.15) {
        // Slam in at impact scale instantly
        scale = impactScale - (enterProgress / 0.15) * (impactScale - 1)
      } else {
        scale = 1
      }
      // Micro chromatic skew on impact
      skewX = enterProgress < 0.1 ? (1 - enterProgress / 0.1) * 3 * (index % 2 === 0 ? 1 : -1) : 0
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      skewX = 0
    } else {
      // Exit: instant cut to black — no fade
      opacity = exitProgress < 0.05 ? 1 : 0
      scale = 1
    }

    // Impact lines radiating from text on entrance
    const showImpact = phase === 'enter' && enterProgress < 0.2
    const impactAlpha = showImpact ? (1 - enterProgress / 0.2) * 0.6 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Impact radiating lines */}
        {impactAlpha > 0 && [0, 45, 90, 135].map((angle) => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 200,
              height: 2,
              background: `rgba(255,255,255,${impactAlpha})`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Main text — zero easing, full force */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) skewX(${skewX}deg)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: -1,
            textShadow: phase === 'enter' && enterProgress < 0.15
              ? `0 0 30px ${color}, 0 0 60px rgba(255,200,100,0.5)`
              : `3px 3px 0 rgba(0,0,0,0.8)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SmashCutComponent(props: MotionGraphicProps<SmashCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smash-cut',
  title: 'Kinetic Smash Cut',
  description: 'Hard cut from nothing to full-intensity text with zero easing — the editing smash cut brought to typography',
  tags: ['kinetic', 'typography', 'smash-cut', 'film', 'impact', 'dramatic', 'cinematic'],
  category: 'captions',
  component: SmashCutComponent as any,
  defaultConfig: {
    words: ['BAM', 'POW', 'HIT', 'NOW'],
    colors: ['#FFFFFF', '#FF3333', '#FFCC00', '#FFFFFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.0,
    impactScale: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BAM', 'POW', 'HIT', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF3333', '#FFCC00', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
    { key: 'impactScale', label: 'Impact Scale', type: 'number', defaultValue: 1.2, min: 1.0, max: 2.0, group: 'Animation' },
  ],
})
