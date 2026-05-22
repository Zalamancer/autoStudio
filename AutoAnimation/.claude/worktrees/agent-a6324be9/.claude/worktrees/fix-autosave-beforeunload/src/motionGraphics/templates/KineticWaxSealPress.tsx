import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaxSealPressConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const paperW = Math.min(width * 0.65, height * 0.8)
    const paperH = paperW * 1.3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark desk surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(60,40,25,0.2), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Parchment / letter paper */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: paperW,
            height: paperH,
            transform: 'translate(-50%, -50%) rotate(-1deg)',
            background: 'linear-gradient(160deg, #f5f0e2 0%, #ede4d0 50%, #e5dac4 100%)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          {/* Handwritten text lines (faint) */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${12 + i * 8}%`,
                left: '12%',
                width: `${60 + Math.sin(i * 2.3) * 10}%`,
                height: 1,
                background: `rgba(40,30,20,${0.04 + (i % 3) * 0.01})`,
                transform: `translateY(${Math.sin(i * 1.5) * 1}px)`,
              }}
            />
          ))}
          {/* Quill pen mark at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              right: '20%',
              width: '30%',
              height: 1,
              background: 'rgba(40,30,20,0.06)',
              borderRadius: 2,
            }}
          />
        </div>
        {/* Ribbon ends peeking from under the seal area */}
        <div
          style={{
            position: 'absolute',
            top: '68%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
          }}
        >
          {/* Left ribbon tail */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -20,
              width: 12,
              height: 50,
              background: 'linear-gradient(180deg, #8b1a1a, #6b1414)',
              transform: `rotate(${-15 + Math.sin(time * 1.5) * 2}deg)`,
              transformOrigin: 'top center',
              borderRadius: '0 0 6px 6px',
              opacity: 0.7,
            }}
          />
          {/* Right ribbon tail */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: -20,
              width: 12,
              height: 45,
              background: 'linear-gradient(180deg, #8b1a1a, #6b1414)',
              transform: `rotate(${12 + Math.sin(time * 1.5 + 1) * 2}deg)`,
              transformOrigin: 'top center',
              borderRadius: '0 0 6px 6px',
              opacity: 0.7,
            }}
          />
        </div>
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const sealSize = Math.min(width * 0.22, height * 0.22)
    let opacity = 0
    let scale = 1
    let waxSpread = 0
    let pressDepth = 0
    let sealRotation = 0

    if (phase === 'enter') {
      if (enterProgress < 0.25) {
        // Wax dripping phase — blob forming
        const t = enterProgress / 0.25
        opacity = t * 0.8
        waxSpread = t * 0.5
        scale = 0.3 + t * 0.4
        pressDepth = 0
      } else if (enterProgress < 0.5) {
        // Wax pool grows
        const t = (enterProgress - 0.25) / 0.25
        opacity = 0.8 + t * 0.1
        waxSpread = 0.5 + t * 0.3
        scale = 0.7 + t * 0.15
        pressDepth = 0
      } else if (enterProgress < 0.75) {
        // Stamp presses down into wax
        const t = (enterProgress - 0.5) / 0.25
        opacity = 0.9 + t * 0.1
        waxSpread = 0.8 + t * 0.2
        scale = 0.85 + t * 0.2
        pressDepth = t
        sealRotation = (1 - t) * 5
      } else {
        // Stamp lifts — reveal embossed text
        const t = (enterProgress - 0.75) / 0.25
        opacity = 1
        waxSpread = 1
        scale = 1.05 - t * 0.05
        pressDepth = 1
        sealRotation = Math.sin(t * Math.PI) * 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      waxSpread = 1
      scale = 1
      pressDepth = 1
      sealRotation = Math.sin(holdProgress * Math.PI * 2) * 0.5
    } else {
      opacity = 1 - exitProgress * 0.7
      waxSpread = 1
      scale = 1 - exitProgress * 0.1
      pressDepth = 1
      sealRotation = exitProgress * -5
      if (exitProgress > 0.7) opacity = (1 - exitProgress) * 3.3
    }

    // Wax color derived from the word color, tinted red
    const waxBase = color

    return (
      <div
        style={{
          position: 'absolute',
          top: '68%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${sealRotation}deg)`,
          opacity,
        }}
      >
        {/* Wax blob — irregular circle */}
        <div
          style={{
            position: 'relative',
            width: sealSize,
            height: sealSize,
            borderRadius: `${48 + waxSpread * 4}% ${52 + waxSpread * 2}% ${50 + waxSpread * 3}% ${47 + waxSpread * 5}%`,
            background: `radial-gradient(ellipse at 40% 35%, ${waxBase}, ${adjustBrightness(waxBase, -30)})`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.3),
              inset 0 2px 4px rgba(255,255,255,0.1),
              inset 0 -2px 8px rgba(0,0,0,0.2)
            `,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Wax drip edges — small irregular extensions */}
          {waxSpread > 0.3 &&
            [
              { top: '85%', left: '15%', w: 12, h: 8, rot: 20 },
              { top: '10%', right: '5%', w: 10, h: 7, rot: -15 },
              { bottom: '5%', left: '60%', w: 14, h: 6, rot: 5 },
            ].map((drip, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...drip,
                  width: drip.w * waxSpread,
                  height: drip.h * waxSpread,
                  background: waxBase,
                  borderRadius: '50%',
                  opacity: 0.7,
                  transform: `rotate(${drip.rot}deg)`,
                }}
              />
            ))}
          {/* Embossed text / monogram */}
          {pressDepth > 0.3 && (
            <div
              style={{
                fontFamily: "'Georgia', 'Palatino Linotype', serif",
                fontSize: `clamp(12px, ${sealSize * 0.18}px, 40px)`,
                fontWeight: 700,
                color: 'transparent',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                letterSpacing: 2,
                textShadow: `
                  0 1px 1px rgba(255,255,255,${pressDepth * 0.25}),
                  0 -1px 1px rgba(0,0,0,${pressDepth * 0.3})
                `,
                WebkitTextStroke: `0.5px rgba(255,255,255,${pressDepth * 0.15})`,
                opacity: pressDepth,
              }}
            >
              {word}
            </div>
          )}
          {/* Seal rim ring */}
          {pressDepth > 0.5 && (
            <div
              style={{
                position: 'absolute',
                inset: sealSize * 0.08,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${pressDepth * 0.1})`,
                boxShadow: `inset 0 1px 2px rgba(0,0,0,${pressDepth * 0.15})`,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Wax surface sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background:
                'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.12), transparent 50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

/** Darken/lighten a hex color */
function adjustBrightness(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(clean.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(clean.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(clean.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function WaxSealPressComponent(props: MotionGraphicProps<WaxSealPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wax-seal-press',
  title: 'Kinetic Wax Seal Press',
  description:
    'Molten sealing wax drips and pools, then a brass stamp presses down to emboss text as a monogram. Ribbon tails, parchment paper, and formal correspondence feel.',
  tags: ['kinetic', 'typography', 'wax-seal', 'press', 'emboss', 'formal', 'correspondence', 'postal', 'ribbon'],
  category: 'captions',
  component: WaxSealPressComponent as any,
  defaultConfig: {
    words: ['SEALED', 'ROYAL', 'SIGNET', 'CREST'],
    colors: ['#8b1a1a', '#8b1a1a', '#8b1a1a', '#8b1a1a'],
    bgColor: '#2a2018',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEALED', 'ROYAL', 'SIGNET', 'CREST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8b1a1a', '#8b1a1a', '#8b1a1a', '#8b1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
