import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKSeparationConfig extends KineticBaseConfig {
  fanSpread: number
}

// CMYK channels with horizontal fan-out directions
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C', fanX: -1.0, fanY: -0.3 },
  { color: '#FF00FF', label: 'M', fanX: -0.33, fanY: 0.2 },
  { color: '#FFFF00', label: 'Y', fanX: 0.33, fanY: -0.15 },
  { color: '#000000', label: 'K', fanX: 1.0, fanY: 0.25 },
]

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeInExpo(t: number): number {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Paper texture grain — subtle noise pattern
    const grainPhase = Math.floor(t * 12) * 0.1
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper texture via repeating dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle 0.5px, rgba(255,255,255,0.04) 100%, transparent 100%)`,
            backgroundSize: '3px 3px',
            backgroundPosition: `${grainPhase}px ${grainPhase}px`,
          }}
        />
        {/* Light table glow center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.03), transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const maxFan = 80 // max pixel spread when fanned out

    let fanAmount = 0 // 0 = stacked (full color), 1 = fully fanned out
    let globalOpacity = 1

    if (phase === 'enter') {
      // Start stacked, fan out
      if (enterProgress < 0.15) {
        fanAmount = 0
        globalOpacity = Math.min(1, enterProgress / 0.15)
      } else {
        fanAmount = easeOutQuart((enterProgress - 0.15) / 0.85)
        globalOpacity = 1
      }
    } else if (phase === 'hold') {
      // Gentle floating separation — channels drift slightly
      fanAmount = 1
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.05
      fanAmount = 1 + breathe
    } else {
      // Snap back together and fade
      const snapP = easeInExpo(exitProgress)
      fanAmount = 1 - snapP
      globalOpacity = exitProgress > 0.8 ? 1 - (exitProgress - 0.8) / 0.2 : 1
    }

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: globalOpacity,
        }}
      >
        {/* Render layers bottom-to-top: K first (back), then Y, M, C (front) */}
        {[...CMYK_CHANNELS].reverse().map((ch, ri) => {
          const idx = CMYK_CHANNELS.length - 1 - ri
          const isKey = ch.label === 'K'

          // Per-channel stagger on enter
          const channelDelay = idx * 0.06
          const staggeredFan = phase === 'enter'
            ? easeOutQuart(Math.max(0, Math.min(1, (fanAmount - channelDelay) / (1 - channelDelay * 4))))
            : fanAmount

          const tx = ch.fanX * maxFan * staggeredFan
          const ty = ch.fanY * maxFan * staggeredFan

          // Subtle per-channel float during hold
          const holdFloat = phase === 'hold'
            ? Math.sin(t * 1.2 + idx * 1.5) * 2
            : 0

          return (
            <div
              key={ch.label}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty + holdFloat}px))`,
                mixBlendMode: isKey ? 'normal' : 'multiply',
                opacity: isKey ? 0.9 : 0.85,
              }}
            >
              <span style={{ ...sharedFont, color: ch.color, display: 'block' }}>
                {word}
              </span>
              {/* Channel label below each separated layer */}
              {fanAmount > 0.3 && (
                <span
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: isKey ? '#666' : ch.color,
                    opacity: Math.min(1, (fanAmount - 0.3) / 0.4) * 0.6,
                    marginTop: 4,
                    fontWeight: 700,
                  }}
                >
                  {ch.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function CMYKSeparationComponent(props: MotionGraphicProps<CMYKSeparationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-separation',
  title: 'Kinetic CMYK Separation',
  description:
    'Prepress color separation proof effect. All 4 CMYK channels start stacked as full-color text, then fan out horizontally like pulling apart transparencies on a light table. Channels float gently while separated, then snap back together on exit.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'separation', 'prepress', 'color', 'multiply', 'proof', 'fan'],
  category: 'captions',
  component: CMYKSeparationComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
    fanSpread: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'fanSpread', label: 'Fan Spread (px)', type: 'number', defaultValue: 80, min: 20, max: 200, group: 'Animation' },
  ],
})
