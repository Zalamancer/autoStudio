import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElectroplateConfig extends KineticBaseConfig {
  platingSpeed: number
  metalSheen: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Electrolytic bath — bubbles and current
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Electrical current lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
          {Array.from({ length: 6 }, (_, i) => {
            const y = (i / 5) * 100
            const wave = Math.sin(t * 2 + i * 0.8) * 3
            return (
              <path
                key={i}
                d={`M 0 ${y + wave}% Q 25 ${y - wave}% 50 ${y + wave}% T 100 ${y - wave}%`}
                stroke="#88AAFF"
                strokeWidth="0.5"
                fill="none"
              />
            )
          })}
        </svg>
        {/* Electrode indicators */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '40%',
            background: 'rgba(200,200,200,0.2)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '40%',
            background: 'rgba(200,200,200,0.15)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 16,
            opacity: 0.2,
            fontFamily: 'monospace',
            fontSize: 8,
            color: '#88AAFF',
          }}
        >
          + ANODE
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 16,
            opacity: 0.2,
            fontFamily: 'monospace',
            fontSize: 8,
            color: '#FF8888',
          }}
        >
          CATHODE −
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    let plateP = 0
    let dissolveP = 0

    if (phase === 'enter') {
      plateP = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      plateP = 1
    } else {
      plateP = 1
      dissolveP = easeInCubic(exitProgress)
    }

    // Plating stages:
    // 0-30%: substrate outline appears (matte base coat)
    // 30-70%: chrome builds up from left (deposition front)
    // 70-100%: full chrome with sheen

    const outlineP = Math.min(1, plateP / 0.3)
    const chromeP = Math.min(1, Math.max(0, (plateP - 0.3) / 0.4))
    const sheenP = Math.min(1, Math.max(0, (plateP - 0.7) / 0.3))

    // Deposition front — a vertical sweep line moving left to right
    const depositionX = chromeP * width

    // Bubble particles during deposition (electrolytic reaction)
    const bubbles = []
    if (chromeP > 0 && chromeP < 0.95) {
      const bubbleCount = 20
      const bubbleSeed = index * 31
      for (let b = 0; b < bubbleCount; b++) {
        const p0 = pseudo(bubbleSeed + b * 19)
        const p1 = pseudo(bubbleSeed + b * 13 + 1)
        const p2 = pseudo(bubbleSeed + b * 7 + 2)

        // Only generate bubbles near the deposition front
        const bubbleX = depositionX + (p0 - 0.5) * 60
        const bubbleY = (p1 - 0.5) * height * 0.8
        const bubbleSize = 3 + p2 * 8
        const bubbleOpacity = (1 - Math.abs(bubbleX - depositionX) / 60) * 0.5

        if (bubbleOpacity <= 0 || bubbleX < 0 || bubbleX > width) continue

        bubbles.push(
          <div
            key={b}
            style={{
              position: 'absolute',
              left: bubbleX,
              top: `calc(50% + ${bubbleY}px)`,
              width: bubbleSize,
              height: bubbleSize,
              borderRadius: '50%',
              border: '1px solid rgba(180,200,255,0.4)',
              transform: 'translate(-50%, -50%)',
              opacity: bubbleOpacity,
            }}
          />,
        )
      }
    }

    return (
      <>
        {bubbles}
        {/* Matte substrate outline */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, outlineP * 0.4 * (1 - chromeP * 0.8) * (1 - dissolveP)),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color: '#555566',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              WebkitTextStroke: '1px rgba(150,150,180,0.5)',
            }}
          >
            {word}
          </span>
        </div>

        {/* Chrome-plated text revealed by deposition front (clip-path) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, chromeP * (1 - dissolveP)),
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - chromeP * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: `linear-gradient(135deg,
                #888899 0%,
                #CCCCDD 20%,
                #FFFFFF 35%,
                #AAAACC 50%,
                #CCCCEE 65%,
                #FFFFEE 80%,
                #AABBCC 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: sheenP > 0 ? 'transparent' : color,
              backgroundClip: 'text',
              textShadow: sheenP > 0 ? 'none' : undefined,
            }}
          >
            {word}
          </span>
        </div>

        {/* Chrome sheen flash */}
        {sheenP > 0 && sheenP < 0.4 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              opacity: sheenP < 0.2 ? sheenP * 5 : (0.4 - sheenP) * 5,
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    )
  },
}

function ElectroplateComponent(props: MotionGraphicProps<ElectroplateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-electroplate',
  title: 'Kinetic Electroplate',
  description:
    'Chrome electroplating deposits metal left-to-right — a matte substrate outline appears, then the deposition front sweeps across as chrome builds up with bubbles, ending in a full metallic sheen flash.',
  tags: [
    'kinetic',
    'typography',
    'electroplate',
    'chrome',
    'metal',
    'plating',
    'chemistry',
    'process',
    'industrial',
    'build',
  ],
  category: 'captions',
  component: ElectroplateComponent as any,
  defaultConfig: {
    words: ['CHROME', 'PLATE', 'METAL', 'COAT'],
    colors: ['#CCDDEE', '#AABBCC', '#DDEEFF', '#BBCCDD'],
    bgColor: '#0A0E1A',
    cycleDuration: 2.2,
    platingSpeed: 1,
    metalSheen: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHROME', 'PLATE', 'METAL', 'COAT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#CCDDEE', '#AABBCC', '#DDEEFF', '#BBCCDD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E1A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'platingSpeed',
      label: 'Plating Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 3,
      group: 'Animation',
    },
    { key: 'metalSheen', label: 'Metal Sheen', type: 'number', defaultValue: 1, min: 0, max: 2, group: 'Animation' },
  ],
})
