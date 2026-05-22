import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ManholeCoverConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const coverSize = Math.min(width * 0.85, height * 0.85, 500)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Asphalt road surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle 0.5px, rgba(0,0,0,0.15) 0%, transparent 100%)',
            backgroundSize: '4px 4px',
          }}
        />

        {/* Manhole cover — circular cast iron */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: coverSize,
            height: coverSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5a5550, #4a4540, #3a3530, #4a4540)',
            boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.08), inset 0 -2px 8px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          {/* Diamond grip pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 20,
              borderRadius: '50%',
              backgroundImage: [
                'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.08) 8px, rgba(0,0,0,0.08) 9px)',
                'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.08) 8px, rgba(0,0,0,0.08) 9px)',
              ].join(', '),
            }}
          />

          {/* Outer rim */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '6px solid #3a3530',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.05), inset 0 0 0 8px #454038',
            }}
          />

          {/* Inner ring detail */}
          <div
            style={{
              position: 'absolute',
              inset: '15%',
              borderRadius: '50%',
              border: '2px solid rgba(0,0,0,0.15)',
            }}
          />

          {/* City utility text around rim — "WATER DEPT • CITY WORKS" */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.12)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            CITY WORKS
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.12)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            WATER DEPT
          </div>

          {/* Bolt holes at cardinal points */}
          {[0, 90, 180, 270].map((angle) => {
            const r = coverSize * 0.42
            const cx = coverSize / 2 + Math.cos((angle * Math.PI) / 180) * r
            const cy = coverSize / 2 + Math.sin((angle * Math.PI) / 180) * r
            return (
              <div
                key={angle}
                style={{
                  position: 'absolute',
                  left: cx - 5,
                  top: cy - 5,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#2a2520',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 71 + 23

    let opacity = 0
    let scale = 1
    let embossDepth = 1

    if (phase === 'enter') {
      // Text stamps into view like cast iron mold
      const t = enterProgress
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      opacity = Math.min(1, t * 2.5)
      scale = 1 + (1 - eased) * 0.15
      embossDepth = eased
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      embossDepth = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.05
      embossDepth = 1 - exitProgress * 0.5
    }

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Raised cast iron text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            whiteSpace: 'nowrap',
            // Cast iron raised lettering effect
            textShadow: [
              `0 ${1 * embossDepth}px 0 rgba(255,255,255,0.15)`,
              `0 ${-1 * embossDepth}px 0 rgba(0,0,0,0.4)`,
              `${1 * embossDepth}px 0 0 rgba(255,255,255,0.08)`,
              `${-1 * embossDepth}px 0 0 rgba(0,0,0,0.2)`,
              `0 0 4px rgba(0,0,0,0.3)`,
            ].join(', '),
          }}
        >
          {word}
        </div>

        {/* Subtle wear marks across text */}
        {Array.from({ length: 3 }, (_, i) => {
          const ws = seed + i * 19 + 400
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${30 + rand(ws) * 40}%`,
                top: `${42 + rand(ws + 1) * 16}%`,
                width: 20 + rand(ws + 2) * 40,
                height: 1,
                background: 'rgba(255,255,255,0.06)',
                transform: `rotate(${-5 + rand(ws + 3) * 10}deg)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },
}

function ManholeCoverComponent(props: MotionGraphicProps<ManholeCoverConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-manhole-cover',
  title: 'Kinetic Manhole Cover',
  description: 'Cast iron manhole cover with raised text lettering — diamond grip pattern, bolt holes, city utility markings, and embossed metallic texture',
  tags: ['kinetic', 'typography', 'manhole', 'cast-iron', 'urban', 'industrial', 'utility', 'metal', 'city'],
  category: 'captions',
  component: ManholeCoverComponent as any,
  defaultConfig: {
    words: ['DRAIN', 'STEEL', 'IRON', 'CITY'],
    colors: ['#6a6560', '#757068', '#6a6560', '#757068'],
    bgColor: '#2a2825',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAIN', 'STEEL', 'IRON', 'CITY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6a6560', '#757068', '#6a6560', '#757068'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2825', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
