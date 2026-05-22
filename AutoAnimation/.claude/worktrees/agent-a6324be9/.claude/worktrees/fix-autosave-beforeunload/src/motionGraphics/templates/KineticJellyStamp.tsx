import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Text drops from above and stamps onto the screen with jelly-squish physics.
// On impact: squash wide + short, then elastic rebound tall + narrow, settles to normal.
// Ink splat rings radiate outward on impact. During hold: soft jelly breathing bob.
// Exit: peels back up with overshoot. Great for unboxing reactions & cooking videos.

interface JellyStampConfig extends KineticBaseConfig {
  splashColor: string
}

function easeOutBack(t: number, overshoot = 1.7): number {
  const c3 = overshoot + 1
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Splat ring ring data — deterministic per word index
function buildRings(seed: number): Array<{ angle: number; dist: number; size: number; opacity: number }> {
  const rings = []
  const count = 12
  for (let i = 0; i < count; i++) {
    const s = seed + i * 53 + 7
    const angle = (i / count) * 360 + ((s * 37) % 22) - 11
    const dist = 0.55 + ((s * 13) % 30) / 100     // 0.55..0.85 of halfWidth
    const size = 10 + ((s * 17) % 14)              // 10..24 px
    const opacity = 0.5 + ((s * 7) % 4) * 0.1     // 0.5..0.8
    rings.push({ angle, dist, size, opacity })
  }
  return rings
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Energetic diagonal stripe animation
    const offset = (t * 60) % 32
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              rgba(255,255,255,0.04) 0px,
              rgba(255,255,255,0.04) 6px,
              transparent 6px,
              transparent 26px
            )`,
            backgroundPosition: `${offset}px 0`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 61 + 19
    const rings = buildRings(seed)
    const halfW = width * 0.5

    // --- Phase calculations ---
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let showSplat = false
    let splatProgress = 0
    let splatOpacity = 0

    if (phase === 'enter') {
      if (enterProgress < 0.5) {
        // Drop in from above — accelerate downward
        const t = enterProgress / 0.5
        const fall = easeInCubic(t)
        translateY = -height * 0.6 * (1 - fall)
        scaleX = 1
        scaleY = 1
        opacity = Math.min(1, t * 2)
      } else {
        // Impact + jelly bounce — stamp hits and squishes
        const t = (enterProgress - 0.5) / 0.5
        // Squash: wide + short on impact, then elastic rebound
        const bounce = easeOutBack(t, 1.4)
        const squashPeak = Math.max(0, 1 - t * 3) // squash decays quickly
        scaleX = 1 + squashPeak * 0.35
        scaleY = 1 - squashPeak * 0.25 + (bounce - 1) * 0.12 * Math.max(0, 1 - t)
        translateY = 0
        opacity = 1
        // Splat rings radiate outward right on impact
        showSplat = true
        splatProgress = Math.min(1, t * 2)
        splatOpacity = Math.max(0, 1 - t * 1.8)
      }
    } else if (phase === 'hold') {
      // Jelly breathing: gentle vertical bob + slight scale pulse
      const bobT = holdProgress * Math.PI * 3
      translateY = Math.sin(bobT) * 5
      scaleX = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.015
      scaleY = 1 - Math.sin(holdProgress * Math.PI * 2) * 0.015
      opacity = 1
    } else {
      // Peel back up with overshoot
      const t = exitProgress
      const peel = easeOutBack(t, 0.8)
      translateY = -height * 0.7 * peel
      scaleX = 1 + t * 0.1
      scaleY = 1 - t * 0.15
      opacity = Math.max(0, 1 - t * 2)
    }

    // Tilt from seed — sticker-like variety
    const tilt = ((seed % 9) - 4) * 1.8

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* Splat rings — radiate from text center on impact */}
        {showSplat && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
            }}
          >
            {rings.map((ring, i) => {
              const rad = (ring.angle * Math.PI) / 180
              const dist = halfW * ring.dist * splatProgress
              const x = Math.cos(rad) * dist
              const y = Math.sin(rad) * dist * 0.6 // flatten to ellipse
              const ringScale = 0.3 + splatProgress * 0.7
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: ring.size,
                    height: ring.size,
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    transform: `translate(-50%, -50%) scale(${ringScale})`,
                    opacity: splatOpacity * ring.opacity,
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Main text block */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${tilt}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity,
          }}
        >
          {/* Sticker-style backing */}
          <div
            style={{
              padding: 'clamp(10px, 2.5vw, 28px) clamp(18px, 5vw, 56px)',
              background: color,
              borderRadius: 12,
              boxShadow: `4px 6px 0 rgba(0,0,0,0.35), inset 0 3px 0 rgba(255,255,255,0.25)`,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(40px, 11vw, 150px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#ffffff',
                WebkitTextStroke: '2px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap',
                letterSpacing: 2,
                userSelect: 'none',
                textShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function JellyStampComponent(props: MotionGraphicProps<JellyStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jelly-stamp',
  title: 'Kinetic Jelly Stamp',
  description:
    'Text drops and stamps onto screen with elastic jelly-squish physics — squashes wide on impact, ink splat rings radiate outward, then a soft breathing bob during hold. Perfect for unboxing and reaction content.',
  tags: ['kinetic', 'typography', 'jelly', 'stamp', 'bounce', 'squish', 'elastic', 'playful', 'fun', 'unboxing', 'reaction', 'cooking'],
  category: 'captions',
  component: JellyStampComponent as any,
  defaultConfig: {
    words: ['WAIT', 'WHAT?!', 'NO WAY', 'OMG'],
    colors: ['#FF3CAC', '#F7971E', '#21D4FD', '#B721FF'],
    bgColor: '#FFF176',
    cycleDuration: 1.2,
    splashColor: '#FF3CAC',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAIT', 'WHAT?!', 'NO WAY', 'OMG'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Stamp Colors',
      type: 'text-array',
      defaultValue: ['#FF3CAC', '#F7971E', '#21D4FD', '#B721FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF176', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'splashColor',
      label: 'Splash Color',
      type: 'color',
      defaultValue: '#FF3CAC',
      group: 'Style',
    },
  ],
})
