import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChromeLiftConfig extends KineticBaseConfig {
  sheenColor: string
}

/* ── Easing ───────────────────────────────────────────────────────────── */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Subtle ambient vignette that breathes
    const time = frame / fps
    const vignetteIntensity = 0.55 + Math.sin(time * 0.7) * 0.04
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${vignetteIntensity.toFixed(3)}) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
  }: WordRenderProps) => {
    /* ── Per-phase transforms ── */
    let translateY = 0
    let scaleY = 1
    let opacity = 1
    let sheenX = -120 // percent position of sheen stripe (off-screen left)
    let blurPx = 0

    if (phase === 'enter') {
      const eased = easeOutBack(easeOutQuart(enterProgress))
      translateY = (1 - enterProgress) * 48  // lifts from below
      scaleY = 0.82 + eased * 0.18            // slight vertical scale-up
      opacity = Math.min(1, enterProgress * 2.5)
      blurPx = (1 - enterProgress) * 6
      sheenX = -120
    } else if (phase === 'hold') {
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1.2  // micro float
      scaleY = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.003
      opacity = 1
      // Sheen sweeps left-to-right once per hold cycle
      sheenX = -30 + holdProgress * 170
      blurPx = 0
    } else {
      const eased = easeInQuart(exitProgress)
      translateY = eased * 42        // drops back down
      scaleY = 1 - eased * 0.12
      opacity = 1 - eased
      sheenX = 120
      blurPx = eased * 4
    }

    const filterStr = blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : 'none'

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `translateY(${translateY.toFixed(2)}px) scaleY(${scaleY.toFixed(4)})`,
            opacity,
            filter: filterStr,
            willChange: 'transform, opacity, filter',
          }}
        >
          {/* Main text */}
          <span
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(38px, 8.5vw, 120px)',
              fontWeight: 200,
              letterSpacing: '0.12em',
              color,
              textTransform: 'uppercase',
              display: 'block',
              whiteSpace: 'nowrap',
              // Chrome gradient overlay on the text itself
              backgroundImage: `linear-gradient(
                160deg,
                ${color}cc 0%,
                ${color}ff 35%,
                ${color}ff 65%,
                ${color}99 100%
              )`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {word}
          </span>

          {/* Sheen highlight stripe that sweeps across */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              borderRadius: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                bottom: '-20%',
                width: '28%',
                left: `${sheenX}%`,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.18) 60%, transparent 100%)',
                transform: 'skewX(-12deg)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Thin baseline rule */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '8%',
              right: '8%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
            }}
          />
        </div>
      </div>
    )
  },
}

function ChromeLiftComponent(props: MotionGraphicProps<ChromeLiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chrome-lift',
  title: 'Chrome Lift',
  description:
    'Text lifts up from below with a metallic gradient and a slow sheen sweep across the hold. Premium feel for product names, luxury brands, and announcement intros.',
  tags: ['kinetic', 'typography', 'minimal', 'chrome', 'luxury', 'lift', 'intro', 'brand', 'sheen', 'premium'],
  category: 'captions',
  component: ChromeLiftComponent as any,
  defaultConfig: {
    words: ['LAUNCH', 'PRODUCT', 'REVEAL', 'NOW'],
    colors: ['#e8e0d4', '#d4cfc8', '#e8e0d4', '#ffffff'],
    bgColor: '#0c0c0c',
    cycleDuration: 1.6,
    sheenColor: '#ffffff',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LAUNCH', 'PRODUCT', 'REVEAL', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8e0d4', '#d4cfc8', '#e8e0d4', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.8, max: 6, group: 'Timing' },
    { key: 'sheenColor', label: 'Sheen Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
