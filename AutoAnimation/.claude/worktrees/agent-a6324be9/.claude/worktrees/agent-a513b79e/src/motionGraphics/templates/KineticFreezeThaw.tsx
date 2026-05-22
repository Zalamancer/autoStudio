import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FreezeThawConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Frost effect: cold tones that warm up over time
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
  }: WordRenderProps) => {
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          let translateX = 0
          let translateY = 0
          let rotate = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let blur = 0
          let brightness = 1
          // Frost/ice tint — goes from icy blue to warm
          let hueRotate = 0
          let saturate = 1

          if (phase === 'enter') {
            // Freeze in: text appears rigid and crystalline, snapping into place
            // Like ice forming — letters materialize with stiff, abrupt motion
            const stagger = (i / Math.max(letters.length - 1, 1)) * 0.5
            const localT = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))

            // Snap: non-smooth, crystalline entrance (step-like)
            const steps = 5
            const stepped = Math.floor(localT * steps) / steps
            const eased = easeOutCubic(stepped)

            // Start from above (crystals form top-down)
            translateY = -(1 - eased) * 80
            opacity = localT > 0 ? Math.min(1, localT * 4) : 0
            // Rigid: no organic motion, angular
            scaleX = 1 + (1 - eased) * (seededRandom(seed) * 0.3 - 0.1)
            scaleY = 1 + (1 - eased) * (seededRandom(seed + 1) * 0.2)
            // Icy blue tint and brightness
            hueRotate = (1 - eased) * 180
            brightness = 0.7 + eased * 0.6
            blur = (1 - localT) * 3
          } else if (phase === 'hold') {
            // Thaw begins: rigid frozen state slowly becomes fluid
            // Early hold = frozen (stiff, cold), late hold = thawing (fluid, warm)
            const frozenPhase = Math.max(0, 1 - holdProgress * 2) // 0..1 for first half
            const thawPhase = Math.max(0, holdProgress * 2 - 1) // 0..1 for second half

            if (holdProgress < 0.5) {
              // Frozen: rigid with tiny crystal vibration
              const time = holdProgress * 30 + i * 2.3
              translateX = Math.sin(time * 7 + seededRandom(seed + 5)) * frozenPhase * 1.5 // stiff jitter
              translateY = Math.cos(time * 9 + seededRandom(seed + 6)) * frozenPhase * 1.5
              rotate = Math.sin(time * 5 + seededRandom(seed + 7)) * frozenPhase * 2
              hueRotate = frozenPhase * 160
              brightness = 0.85 + frozenPhase * 0.15
              saturate = 0.3 + frozenPhase * 0.7 // desaturated when frozen
            } else {
              // Thawing: melting, starting to flow freely
              const time = holdProgress * 12 + i * 1.4
              translateX = Math.sin(time * 0.8 + seededRandom(seed + 5) * 6) * thawPhase * 8
              translateY = Math.cos(time * 0.6 + seededRandom(seed + 6) * 6) * thawPhase * 6
              rotate = Math.sin(time * 0.5 + seededRandom(seed + 7) * 4) * thawPhase * 8
              hueRotate = frozenPhase * 160
              brightness = 1 + thawPhase * 0.2
              saturate = 0.3 + thawPhase * 0.9
              blur = thawPhase * 0.5 // slight heat shimmer
            }
          } else {
            // Exit: fully thawed — letters flow away like water
            const t = easeInQuad(exitProgress)
            const time = exitProgress * 8 + i * 1.2

            // Flow downward and outward like water
            translateY = t * 60 * (seededRandom(seed + 10) * 0.5 + 0.5)
            translateX = (seededRandom(seed + 11) - 0.5) * t * 80
            rotate = (seededRandom(seed + 12) - 0.5) * t * 60
            scaleX = 1 + t * 0.5
            scaleY = 1 - t * 0.4
            opacity = 1 - t
            blur = t * 6
            brightness = 1.2 + t * 0.3
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
                opacity,
                filter: [
                  blur > 0 ? `blur(${blur}px)` : '',
                  hueRotate !== 0 ? `hue-rotate(${hueRotate}deg)` : '',
                  brightness !== 1 ? `brightness(${brightness})` : '',
                  saturate !== 1 ? `saturate(${saturate})` : '',
                ].filter(Boolean).join(' ') || 'none',
                whiteSpace: 'pre',
                textShadow: `0 0 30px ${color}60`,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function FreezeThawComponent(props: MotionGraphicProps<FreezeThawConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-freeze-thaw',
  title: 'Freeze Thaw',
  description:
    'Text appears frozen rigid, then thaws into fluid motion. Icy blue crystalline entry with stiff snapping, hold transitions from frozen jitter to warm flowing movement, exits as liquid flowing away.',
  tags: ['kinetic', 'freeze', 'thaw', 'ice', 'melt', 'temperature', 'physics', 'material', 'cold'],
  category: 'captions',
  component: FreezeThawComponent as any,
  defaultConfig: {
    words: ['FROZEN', 'THAW', 'MELT', 'FLOW'],
    colors: ['#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9'],
    bgColor: '#0a1628',
    cycleDuration: 2.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FROZEN', 'THAW', 'MELT', 'FLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1628', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
