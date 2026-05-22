import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OverlayWeaveConfig extends KineticBaseConfig {
  stripeWidth: number
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutElastic(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Two sets of diagonal stripes that create moire interference via overlay blend
    const angle1 = 45 + Math.sin(t * 0.3) * 5
    const angle2 = -45 + Math.cos(t * 0.25) * 5
    const offset1 = t * 15
    const offset2 = t * -12

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Stripe layer A — warm diagonal */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            backgroundImage: `repeating-linear-gradient(${angle1}deg, rgba(200,80,60,0.3) 0px, rgba(200,80,60,0.3) 6px, transparent 6px, transparent 18px)`,
            backgroundPosition: `${offset1}px 0`,
            mixBlendMode: 'overlay',
          }}
        />
        {/* Stripe layer B — cool diagonal */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            backgroundImage: `repeating-linear-gradient(${angle2}deg, rgba(60,80,200,0.3) 0px, rgba(60,80,200,0.3) 6px, transparent 6px, transparent 18px)`,
            backgroundPosition: `${offset2}px 0`,
            mixBlendMode: 'overlay',
          }}
        />
        {/* Radial vignette to ground the composition */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    const charElements = chars.map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let rotation = 0
      let clipY = 0

      if (phase === 'enter') {
        // Characters weave in from alternating top/bottom
        const delay = (ci / (chars.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutElastic(p)
        const direction = ci % 2 === 0 ? -1 : 1
        charOpacity = Math.min(1, p * 2)
        yOff = (1 - ep) * 60 * direction
        rotation = (1 - ep) * 15 * direction
        clipY = (1 - Math.min(1, p * 1.5)) * 100
      } else if (phase === 'hold') {
        // Weaving oscillation — chars sway like woven threads
        const sway = Math.sin(t * 2 + ci * 1.2) * 3
        const twist = Math.sin(t * 1.5 + ci * 0.9) * 1.5
        yOff = sway
        rotation = twist
      } else {
        // Chars unravel — spiral outward
        const delay = (ci / (chars.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeOutExpo(p)
        const direction = ci % 2 === 0 ? 1 : -1
        charOpacity = 1 - ep
        yOff = ep * 80 * direction
        rotation = ep * 45 * direction
        clipY = ep * 100
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translateY(${yOff}px) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            clipPath: clipY > 0.5 ? `inset(0 0 ${clipY}% 0)` : 'none',
            color,
          }}
        >
          {/* Overlay stripe pattern on each character */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-block',
              backgroundImage: `repeating-linear-gradient(${45 + ci * 30}deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 6px)`,
              backgroundPosition: `${t * 10}px 0`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          >
            {ch}
          </span>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Futura', 'Century Gothic', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            mixBlendMode: 'overlay',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function OverlayWeaveComponent(props: MotionGraphicProps<OverlayWeaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-overlay-weave',
  title: 'Kinetic Overlay Weave',
  description:
    'Two diagonal stripe layers with overlay blend create shifting moire interference patterns. Characters weave in from alternating directions with elastic bounce, sway during hold, and unravel on exit.',
  tags: ['kinetic', 'typography', 'blend', 'overlay', 'moire', 'stripes', 'weave', 'pattern'],
  category: 'captions',
  component: OverlayWeaveComponent as any,
  defaultConfig: {
    words: ['WEAVE', 'MOIRE', 'CROSS', 'WARP'],
    colors: ['#E8E0F0', '#F0E0E8', '#E0F0E8', '#F0F0E0'],
    bgColor: '#12101A',
    cycleDuration: 1.2,
    stripeWidth: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WEAVE', 'MOIRE', 'CROSS', 'WARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0F0', '#F0E0E8', '#E0F0E8', '#F0F0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12101A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'stripeWidth', label: 'Stripe Width (px)', type: 'number', defaultValue: 6, min: 2, max: 20, group: 'Animation' },
  ],
})
