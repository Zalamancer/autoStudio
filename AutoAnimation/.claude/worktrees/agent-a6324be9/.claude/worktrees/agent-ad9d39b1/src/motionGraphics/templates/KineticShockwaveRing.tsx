import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShockwaveRingConfig extends KineticBaseConfig {}

// Variation 1: Concentric shockwave rings expand outward on text impact.
// Same elastic-overshoot text arrival as KaboomScale, but instead of radial lines
// the energy manifests as 5 expanding ring shockwaves — each ring starts tight
// at the text bounds and blasts outward while fading, like a sonic boom.

const RING_COUNT = 5

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const pulse = 0.5 + Math.sin(time * 3.5) * 0.1
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,${pulse * 0.15}) 0%, transparent 70%)`,
          }}
        />
        {/* Subtle grid — energy field */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 83 + 17
    const tilt = ((seed % 7) - 3) * 2
    const maxRadius = Math.max(width, height) * 0.75

    let textScale = 0
    let textOpacity = 0
    let ringPhase = 0   // 0..1 drives ring expansion
    let containerOpacity = 1

    if (phase === 'enter') {
      // Elastic overshoot: identical mechanics to KaboomScale
      const t = enterProgress
      if (t < 0.6) {
        textScale = (t / 0.6) * 1.25
        textOpacity = Math.min(1, t / 0.3)
      } else {
        const settle = (t - 0.6) / 0.4
        textScale = 1.25 - settle * 0.3 + Math.sin(settle * Math.PI * 2) * (1 - settle) * 0.08
        textOpacity = 1
      }
      ringPhase = enterProgress
      containerOpacity = Math.min(1, enterProgress * 2)

    } else if (phase === 'hold') {
      textScale = 1 + Math.sin((frame / 30) * 2 + seed) * 0.02
      textOpacity = 1
      ringPhase = 1
      containerOpacity = 1

    } else {
      const eased = exitProgress * exitProgress
      textScale = 1 - exitProgress * 0.5
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      ringPhase = 1
      containerOpacity = Math.max(0, 1 - exitProgress * 1.2)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: Math.max(0, containerOpacity),
        }}
      >
        {/* Shockwave rings — expand outward from text center on impact */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
          {Array.from({ length: RING_COUNT }).map((_, i) => {
            // Each ring has a staggered delay: ring 0 fires first, ring 4 last
            const ringDelay = i * 0.12
            const ringProgress = Math.max(0, Math.min(1, (ringPhase - ringDelay) / (1 - ringDelay + 0.01)))

            // Ease out: fast expand then slow
            const eased = 1 - Math.pow(1 - ringProgress, 2.5)
            const radius = maxRadius * 0.08 + eased * maxRadius * 0.85
            const opacity = phase === 'hold'
              ? 0
              : Math.max(0, (1 - ringProgress) * (1 - ringProgress) * 0.8)

            // Alternate ring colors: accent color and black
            const isAccent = i % 2 === 0
            const ringColor = isAccent ? color : '#000000'
            const thickness = Math.max(1, 4 - i * 0.6)

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  border: `${thickness}px solid ${ringColor}`,
                  width: `${radius * 2}px`,
                  height: `${radius * 1.55}px`,  // slightly squashed — feels more like a shockwave
                  transform: 'translate(-50%, -50%)',
                  opacity,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
          {/* Inner glow ring that stays during hold — energy halo */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `3px solid ${color}`,
              width: `${maxRadius * 0.35}px`,
              height: `${maxRadius * 0.25}px`,
              transform: 'translate(-50%, -50%)',
              opacity: phase === 'hold' ? 0.35 + Math.sin((frame / 30) * 3 + seed) * 0.15 : 0,
              boxShadow: `0 0 12px 4px ${color}`,
            }}
          />
        </div>

        {/* Text — epicenter of the shockwave */}
        <div
          style={{
            position: 'relative',
            transform: `rotate(${tilt}deg) scale(${textScale})`,
            transformOrigin: 'center center',
            opacity: Math.max(0, textOpacity),
          }}
        >
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(56px, 15vw, 200px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '4px #000000',
              textShadow: '5px 5px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 5px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ShockwaveRingComponent(props: MotionGraphicProps<ShockwaveRingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shockwave-ring',
  title: 'Kinetic Shockwave Ring',
  description: 'Text scales up with elastic overshoot while 5 concentric shockwave rings blast outward from the impact point, fading as they expand — sonic boom energy pattern',
  tags: ['kinetic', 'typography', 'shockwave', 'rings', 'impact', 'scale', 'elastic', 'comic', 'energy', 'concentric'],
  category: 'captions',
  component: ShockwaveRingComponent as any,
  defaultConfig: {
    words: ['BOOM!', 'WOW!', 'EPIC!', 'POW!'],
    colors: ['#FF2200', '#00CCFF', '#FF6600', '#AA00FF'],
    bgColor: '#FFEE00',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM!', 'WOW!', 'EPIC!', 'POW!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF2200', '#00CCFF', '#FF6600', '#AA00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFEE00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
