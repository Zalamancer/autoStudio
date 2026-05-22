import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PersianMiniatureConfig extends KineticBaseConfig {}

// Persian miniature manuscript style (Safavid/Mughal):
// lapis lazuli/gold/vermilion palette, intricate geometric tile border,
// illuminated margin decoration, delicate scale and opulent reveal
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const borderGlow = 0.3 + Math.abs(Math.sin(time * 0.5)) * 0.2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Lapis lazuli wash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(26,50,120,0.15) 0%, transparent 70%)',
          }}
        />
        {/* Intricate Islamic geometric border */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: borderGlow }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer gilt frame */}
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(218,165,32,0.9)" strokeWidth="1.2" />
          <rect x="4" y="4" width="92" height="92" fill="none" stroke="rgba(218,165,32,0.5)" strokeWidth="0.4" />
          {/* Inner margin line */}
          <rect x="7" y="7" width="86" height="86" fill="none" stroke="rgba(200,100,20,0.6)" strokeWidth="0.5" strokeDasharray="2,1.5" />
          {/* Star rosettes at corners */}
          {[
            { cx: 10, cy: 10 },
            { cx: 90, cy: 10 },
            { cx: 10, cy: 90 },
            { cx: 90, cy: 90 },
          ].map((pt, i) => (
            <g key={i}>
              {Array.from({ length: 8 }).map((_, j) => {
                const angle = (j / 8) * Math.PI * 2
                const px = pt.cx + Math.cos(angle) * 4
                const py = pt.cy + Math.sin(angle) * 4
                return <circle key={j} cx={px} cy={py} r="0.8" fill="rgba(218,165,32,0.8)" />
              })}
              <circle cx={pt.cx} cy={pt.cy} r="2" fill="rgba(200,100,20,0.7)" />
            </g>
          ))}
          {/* Center cartouche border */}
          <ellipse cx="50" cy="50" rx="30" ry="20" fill="none" stroke="rgba(218,165,32,0.3)" strokeWidth="0.5" strokeDasharray="3,2" />
        </svg>
        {/* Illuminated margin dots */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: '3%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: i % 2 === 0 ? 'rgba(218,165,32,0.6)' : 'rgba(200,50,20,0.5)',
            }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              right: '3%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: i % 2 === 0 ? 'rgba(218,165,32,0.6)' : 'rgba(200,50,20,0.5)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    const seed = index * 61 + 7

    if (phase === 'enter') {
      // Opulent scale-in from manuscript reveal
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 2.5)
      scale = 0.85 + ease * 0.15
      blur = (1 - enterProgress) * 5
    } else if (phase === 'hold') {
      opacity = 1
      // Gilded shimmer
      opacity = 0.88 + Math.abs(Math.sin(Date.now() * 0.003 + seed)) * 0.12
    } else {
      opacity = 1 - exitProgress * 1.3
      scale = 1 - exitProgress * 0.04
    }

    const persianGlow = `
      0 0 10px rgba(218,165,32,0.5),
      0 0 25px rgba(26,50,120,0.3),
      2px 2px 4px rgba(0,0,0,0.5)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Georgia', serif",
            fontSize: 'clamp(40px, 11vw, 155px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            textShadow: persianGlow,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PersianMiniatureComponent(props: MotionGraphicProps<PersianMiniatureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-persian-miniature',
  title: 'Kinetic Persian Miniature',
  description: 'Persian miniature manuscript style (Safavid/Mughal) with lapis lazuli palette, gilt geometric frame, star rosette corners, illuminated margin dots, and opulent scale reveal',
  tags: ['kinetic', 'typography', 'persian', 'miniature', 'safavid', 'mughal', 'lapis', 'gold', 'manuscript', 'islamic'],
  category: 'captions',
  component: PersianMiniatureComponent as any,
  defaultConfig: {
    words: ['RUMI', 'HAFEZ', 'GULISTAN', 'SHAHNAMA'],
    colors: ['#DAA520', '#1A3278', '#CC3300', '#DAA520'],
    bgColor: '#0a0820',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RUMI', 'HAFEZ', 'GULISTAN', 'SHAHNAMA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DAA520', '#1A3278', '#CC3300', '#DAA520'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0820', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
