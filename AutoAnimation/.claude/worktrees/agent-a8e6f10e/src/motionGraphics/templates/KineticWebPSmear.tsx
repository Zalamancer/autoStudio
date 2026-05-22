import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WebPSmearConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// WebP/AVIF lossless-near-boundary smearing:
// Colors bleed horizontally from high-contrast edges
// Produces a distinctive smeared/dragged look at compressed edges

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Artifact bands — horizontal smear lines in background
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: 8 }, (_, i) => {
          const y = 5 + i * 13
          const smearLen = 20 + rand(i * 17 + Math.floor(time * 2)) * 40
          const x = rand(i * 23 + Math.floor(time * 1.5)) * 80
          const hue = Math.floor(rand(i * 31) * 360)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${smearLen}%`,
                height: 2,
                background: `linear-gradient(to right, hsl(${hue},70%,50%), transparent)`,
                opacity: 0.05 + rand(i * 11) * 0.04,
              }}
            />
          )
        })}
        {/* Format readout */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100,200,100,0.2)',
            letterSpacing: 1,
          }}
        >
          FORMAT: WebP QUALITY: {Math.floor(20 + Math.abs(Math.sin(time * 0.6)) * 30)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 18,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100,200,100,0.12)',
          }}
        >
          CHROMA SUBSAMPLING: 4:2:0
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 167 + 71
    const chars = word.split('')

    // WebP smear: characters have color "bleeding" right from their edges
    // More pronounced during enter/exit

    const getSmearExtent = (progress: number) => (1 - progress) * 40

    if (phase === 'enter') {
      const smear = getSmearExtent(enterProgress)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const charSmear = smear * (1 + rand(seed + ci * 17) * 0.5)
            const smearOpacity = (1 - enterProgress) * 0.6
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color,
                  opacity: 0.2 + enterProgress * 0.8,
                  position: 'relative',
                }}
              >
                {ch}
                {/* Smear ghost */}
                {charSmear > 2 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: 0,
                      width: charSmear,
                      height: '100%',
                      background: `linear-gradient(to right, ${color}${Math.floor(smearOpacity * 255)
                        .toString(16)
                        .padStart(2, '0')}, transparent)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Gentle chroma smear on hold — occasional color channel bleed
      const chromaBleed = holdProgress > 0.35 && holdProgress < 0.42
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            // Chroma bleed: slight green channel smear to the right
            textShadow: chromaBleed
              ? `8px 0 rgba(0,255,0,0.4), -4px 0 rgba(255,0,100,0.3), 0 0 8px ${color}50`
              : `0 0 8px ${color}40`,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: smear increases as if being re-compressed
    const smear = getSmearExtent(1 - exitProgress)
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          display: 'flex',
          opacity: 1 - exitProgress * 0.9,
        }}
      >
        {chars.map((ch, ci) => {
          const charSmear = smear * (1 + rand(seed + ci * 17) * 0.5)
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color,
                position: 'relative',
              }}
            >
              {ch}
              {charSmear > 2 && (
                <span
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: 0,
                    width: charSmear,
                    height: '100%',
                    background: `linear-gradient(to right, ${color}99, transparent)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </span>
          )
        })}
      </div>
    )
  },
}

function WebPSmearComponent(props: MotionGraphicProps<WebPSmearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-webp-smear',
  title: 'Kinetic WebP Smear',
  description:
    'WebP/AVIF codec chroma smearing — color bleeds horizontally from character edges with quality readout and 4:2:0 chroma subsampling artifacts',
  tags: ['kinetic', 'typography', 'glitch', 'codec', 'compression', 'webp', 'chroma', 'digital', 'artifact'],
  category: 'captions',
  component: WebPSmearComponent as any,
  defaultConfig: {
    words: ['COMPRESS', 'CHROMA', 'SMEAR', 'BLEED'],
    colors: ['#44FF88', '#33EE77', '#55FF99', '#44FF88'],
    bgColor: '#010a04',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['COMPRESS', 'CHROMA', 'SMEAR', 'BLEED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#44FF88', '#33EE77', '#55FF99', '#44FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#010a04', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
