import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlicedRevealConfig extends KineticBaseConfig {
  sliceCount: number
}

/* ── Easing ───────────────────────────────────────────────────────────── */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const SLICE_COUNT_DEFAULT = 7

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const sliceCount = SLICE_COUNT_DEFAULT
    const sliceH = 100 / sliceCount // percent height per slice

    // Thin accent line that draws across under the text during hold
    const lineWidth = phase === 'hold'
      ? `${easeOutExpo(Math.min(holdProgress * 2, 1)) * 60}%`
      : phase === 'exit'
      ? `${(1 - easeInCubic(exitProgress)) * 60}%`
      : '0%'

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Sliced text container — each slice clips a horizontal band */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          {Array.from({ length: sliceCount }, (_, si) => {
            // Stagger: each slice has a slight delay, with alternating direction
            const staggerFraction = 0.12 // fraction of total progress used for stagger
            const sliceDelay = (si / (sliceCount - 1)) * staggerFraction
            const direction = si % 2 === 0 ? 1 : -1 // alternate left/right

            let translateX = 0
            let opacity = 1

            if (phase === 'enter') {
              const t = Math.max(0, Math.min(1, (enterProgress - sliceDelay) / (1 - staggerFraction)))
              const eased = easeOutExpo(t)
              translateX = direction * (1 - eased) * 55
              opacity = Math.min(1, t * 3)
            } else if (phase === 'hold') {
              // Micro drift — each slice drifts a tiny amount, alternating
              translateX = direction * Math.sin(holdProgress * Math.PI * 2 + si * 0.9) * 0.8
              opacity = 1
            } else {
              // Exit: slices fly out in opposite direction from entry
              const t = Math.max(0, Math.min(1, exitProgress))
              const eased = easeInCubic(t)
              translateX = direction * eased * -45
              opacity = 1 - eased * 0.9
            }

            return (
              <div
                key={si}
                style={{
                  position: si === 0 ? 'relative' : 'absolute',
                  top: si === 0 ? undefined : `${si * sliceH}%`,
                  left: 0,
                  right: 0,
                  height: si === 0 ? undefined : `${sliceH + 0.2}%`, // +0.2% prevents hairline gaps
                  overflow: 'hidden',
                  // First slice is position:relative so it sizes the container;
                  // all others are absolute and clip over it
                }}
              >
                <div
                  style={{
                    // Each slice renders the full text but its parent clips it to 1/N height
                    transform: `translateX(${translateX.toFixed(3)}px)`,
                    opacity,
                    // The clip region is achieved by negative margin-top to offset into the right band
                    marginTop: si === 0 ? undefined : `${-si * sliceH}%`,
                    whiteSpace: 'nowrap',
                    willChange: 'transform, opacity',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      fontSize: 'clamp(40px, 9vw, 128px)',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color,
                      textTransform: 'uppercase',
                      display: 'block',
                      lineHeight: 1.1,
                    }}
                  >
                    {word}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Accent underline that draws in during hold */}
        <div
          style={{
            position: 'absolute',
            bottom: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            height: '2px',
            width: lineWidth,
            background: color,
            opacity: 0.55,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    )
  },
}

function SlicedRevealComponent(props: MotionGraphicProps<SlicedRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sliced-reveal',
  title: 'Sliced Reveal',
  description:
    'Text is cut into horizontal bands that slide in from alternating directions and snap together — like a venetian blind closing. Clean cinematic intro for brand names and titles.',
  tags: ['kinetic', 'typography', 'minimal', 'reveal', 'slice', 'intro', 'title', 'brand', 'cinematic'],
  category: 'captions',
  component: SlicedRevealComponent as any,
  defaultConfig: {
    words: ['BRAND', 'NAME', 'REVEAL', 'TITLE'],
    colors: ['#ffffff', '#e8e8e8', '#ffffff', '#f0f0f0'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
    sliceCount: 7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BRAND', 'NAME', 'REVEAL', 'TITLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#e8e8e8', '#ffffff', '#f0f0f0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.8, max: 5, group: 'Timing' },
    { key: 'sliceCount', label: 'Slice Count', type: 'number', defaultValue: 7, min: 3, max: 14, group: 'Animation' },
  ],
})
