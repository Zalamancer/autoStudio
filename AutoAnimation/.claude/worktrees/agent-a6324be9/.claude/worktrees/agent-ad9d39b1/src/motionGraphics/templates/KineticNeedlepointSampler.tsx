import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeedlepointSamplerConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Traditional sampler border with floral vine motifs
    const vinePhase = time * 0.3
    const borderInset = Math.min(width, height) * 0.06

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Linen fabric weave */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent 0px, transparent 5px, rgba(160,140,110,0.05) 5px, rgba(160,140,110,0.05) 6px),
              repeating-linear-gradient(90deg, transparent 0px, transparent 5px, rgba(160,140,110,0.05) 5px, rgba(160,140,110,0.05) 6px)
            `,
            mixBlendMode: 'multiply' as const,
          }}
        />
        {/* Sampler decorative border — top and bottom vine/leaf row */}
        {['top', 'bottom'].map((edge) => (
          <div
            key={edge}
            style={{
              position: 'absolute',
              left: borderInset,
              right: borderInset,
              [edge]: borderInset,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              overflow: 'hidden',
            }}
          >
            {/* Repeating leaf/diamond motifs */}
            {Array.from({ length: 16 }, (_, i) => {
              const leafHue = [340, 120, 340, 120][i % 4]
              const drift = Math.sin(vinePhase + i * 0.5) * 1
              return (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    background: `hsla(${leafHue}, 40%, 45%, 0.3)`,
                    transform: `rotate(45deg) translateY(${drift}px)`,
                    borderRadius: i % 2 === 0 ? '2px' : '50%',
                  }}
                />
              )
            })}
          </div>
        ))}
        {/* Side borders — simple stitch lines */}
        {['left', 'right'].map((edge) => (
          <div
            key={edge}
            style={{
              position: 'absolute',
              top: borderInset + 20,
              bottom: borderInset + 20,
              [edge]: borderInset + 4,
              width: 2,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(180,100,80,0.25) 0px, rgba(180,100,80,0.25) 4px, transparent 4px, transparent 8px)',
            }}
          />
        ))}
        {/* ABC alphabet row at top (traditional sampler element) */}
        <div
          style={{
            position: 'absolute',
            top: borderInset + 26,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            letterSpacing: 4,
            color: 'rgba(150,80,60,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          A B C D E F G H I J K L M
        </div>
        {/* Date at bottom (traditional sampler element) */}
        <div
          style={{
            position: 'absolute',
            bottom: borderInset + 26,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            letterSpacing: 3,
            color: 'rgba(150,80,60,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          ANNO DOMINI MMXXVI
        </div>
        {/* Aged fabric vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(120,90,50,0.12)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleVal = 1

      if (phase === 'enter') {
        // Each stitch pops in with a needle-pull-through bounce
        const delay = (ci / (word.length + 1)) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutBack(p)

        charOpacity = p > 0 ? Math.min(1, p * 2.5) : 0
        scaleVal = p > 0 ? 0.3 + ep * 0.7 : 0
        // Slight upward pull as needle pulls thread through
        yOff = (1 - Math.min(1, p * 1.5)) * -12
      } else if (phase === 'hold') {
        // Thread sway on fabric — each letter gently wobbles
        const wt = t * 1.0 + ci * 0.7
        yOff = Math.sin(wt) * 1.2
        scaleVal = 1 + Math.sin(t * 1.8 + ci * 0.5) * 0.015
      } else {
        // Thread pulls out from fabric — shrinks and lifts upward
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep
        scaleVal = 1 - ep * 0.5
        yOff = -ep * 20
      }

      // Stitch texture: cross-hatching on each character
      const threadAngle = 45 + (rand(ci * 23 + index * 11) - 0.5) * 10

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${scaleVal})`,
            color,
            textShadow: `0 1px 0 rgba(0,0,0,0.1), 0 0 2px ${color}30`,
            mixBlendMode: 'multiply' as const,
          }}
        >
          {ch}
          {/* Diagonal thread texture overlay per letter */}
          {charOpacity > 0.4 && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(${threadAngle}deg, transparent 0px, transparent 2px, ${color}12 2px, ${color}12 3px)`,
                mixBlendMode: 'multiply' as const,
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            />
          )}
          {/* Needle hole dots at character bounds */}
          {charOpacity > 0.6 && (
            <>
              <span
                style={{
                  position: 'absolute',
                  top: -1,
                  left: `${30 + rand(ci * 41) * 40}%`,
                  width: 2,
                  height: 2,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.1)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: `${20 + rand(ci * 59) * 50}%`,
                  width: 2,
                  height: 2,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.08)',
                }}
              />
            </>
          )}
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
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function NeedlepointSamplerComponent(props: MotionGraphicProps<NeedlepointSamplerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-needlepoint-sampler',
  title: 'Kinetic Needlepoint Sampler',
  description:
    'Traditional needlework sampler with decorative vine border, ABC alphabet row, linen weave fabric. Text stitched per-character with needle-pull bounce, thread sway hold, and thread-pull-out exit.',
  tags: ['kinetic', 'typography', 'needlepoint', 'sampler', 'embroidery', 'handmade', 'warm', 'craft', 'vintage'],
  category: 'captions',
  component: NeedlepointSamplerComponent as any,
  defaultConfig: {
    words: ['HOME', 'SWEET', 'LOVE', 'HOPE'],
    colors: ['#8B4513', '#6B3A2A', '#A0522D', '#704028'],
    bgColor: '#F3EBD8',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOME', 'SWEET', 'LOVE', 'HOPE'], group: 'Content' },
    { key: 'colors', label: 'Thread Colors', type: 'text-array', defaultValue: ['#8B4513', '#6B3A2A', '#A0522D', '#704028'], group: 'Style' },
    { key: 'bgColor', label: 'Linen Color', type: 'color', defaultValue: '#F3EBD8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
