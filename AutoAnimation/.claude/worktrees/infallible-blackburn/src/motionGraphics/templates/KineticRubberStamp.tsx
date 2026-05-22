import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RubberStampConfig extends KineticBaseConfig {}

// Heavy rubber stamp falling — fast fall, hard impact, slight bounce
function easeInQuart(t: number): number {
  return t * t * t * t
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        // Aged paper texture — faint ruled lines
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(0,0,0,0.028) 39px,
            rgba(0,0,0,0.028) 40px
          )
        `,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Phase breakdown:
    //   enter 0→0.50  — stamp falls from above (easeInQuart drop)
    //   enter 0.50→0.65 — IMPACT: squash + ink bleed
    //   enter 0.65→1.0  — rebound bounce to resting
    //   exit          — lifts straight up, ink fades

    let translateY = 0
    let scaleY = 1
    let scaleX = 1
    let opacity = 1
    let inkSpread = 0
    let borderOpacity = 0
    let rotation = 0

    if (phase === 'enter') {
      if (enterProgress < 0.5) {
        const t = enterProgress / 0.5
        translateY = -(1 - easeInQuart(t)) * 65
        opacity = t > 0.25 ? 1 : t / 0.25
        inkSpread = 0
      } else if (enterProgress < 0.65) {
        // Squash on impact
        const t = (enterProgress - 0.5) / 0.15
        translateY = 0
        scaleY = 1 - t * 0.38
        scaleX = 1 + t * 0.20
        inkSpread = t
        borderOpacity = t * 0.6
      } else {
        // Bounce settle
        const t = (enterProgress - 0.65) / 0.35
        const bounce = easeOutBounce(t)
        translateY = -(1 - bounce) * 10
        scaleY = 0.62 + bounce * 0.38
        scaleX = 1.20 - bounce * 0.20
        inkSpread = 1 - t * 0.25
        borderOpacity = Math.min(0.6, (1 - t * 0.1) * 0.6)
      }
    } else if (phase === 'exit') {
      const t = easeOutCubic(exitProgress)
      translateY = -t * 55
      opacity = 1 - exitProgress * exitProgress
      inkSpread = Math.max(0, 0.75 - exitProgress * 2)
      borderOpacity = Math.max(0, 0.5 - exitProgress * 1.5)
      rotation = t * -2.5
    }

    const inkOpacityHex = Math.round(Math.max(0, inkSpread * 0.22) * 255)
      .toString(16)
      .padStart(2, '0')

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Ink bleed halo radiating from impact point */}
        {inkSpread > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translateY(${translateY}%) scaleX(${1 + inkSpread * 0.3}) scaleY(${0.18 + inkSpread * 0.12})`,
              width: '82%',
              height: '100%',
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${color}${inkOpacityHex} 0%, transparent 68%)`,
              filter: 'blur(10px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Word — stamped with Impact typeface */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}%) scaleY(${scaleY}) scaleX(${scaleX}) rotate(${rotation}deg)`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', Helvetica, sans-serif",
              fontSize: 'clamp(40px, 10vw, 130px)',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              textShadow: `
                1px 0 0 ${color}66,
                -1px 0 0 ${color}66,
                0 1px 0 ${color}33,
                0 -1px 0 ${color}33,
                2px 2px 3px ${color}18
              `,
              filter:
                inkSpread > 0.85 ? 'blur(0.5px)' : 'none',
            }}
          >
            {word}
          </div>

          {/* Rubber die border rectangle */}
          {borderOpacity > 0.02 && (
            <div
              style={{
                position: 'absolute',
                inset: '-8px -14px',
                border: `3px solid ${color}`,
                opacity: borderOpacity,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function RubberStampComponent(props: MotionGraphicProps<RubberStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rubber-stamp',
  title: 'Rubber Stamp',
  description:
    'Text slams down like a rubber stamp — fast freefall, squash-on-impact with ink bleed halo, elastic bounce to settle. Exits by lifting cleanly off the paper.',
  tags: ['kinetic', 'typography', 'stamp', 'postal', 'ink', 'impact', 'bold', 'approved', 'office'],
  category: 'captions',
  component: RubberStampComponent as any,
  defaultConfig: {
    words: ['APPROVED', 'URGENT', 'RECEIVED', 'PAID'],
    colors: ['#C0001A', '#C0001A', '#C0001A', '#C0001A'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['APPROVED', 'URGENT', 'RECEIVED', 'PAID'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#C0001A', '#C0001A', '#C0001A', '#C0001A'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
