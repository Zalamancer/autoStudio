import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MehndiConfig extends KineticBaseConfig {}

// Mehndi / Henna text style:
// delicate terracotta/henna brown, intricate paisley/floral vine border,
// lace-like tracery background, text appears to "draw itself" in henna style
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    void frame; void fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Henna parchment texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 40%, rgba(210,140,60,0.06) 0%, transparent 60%)',
          }}
        />
        {/* Mehndi vine border — all four sides */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Top border vine */}
          <path
            d={`M0,4 C10,2 15,8 25,4 C35,0 40,7 50,4 C60,1 65,7 75,4 C85,1 90,7 100,4`}
            fill="none"
            stroke="rgba(160,82,30,0.8)"
            strokeWidth="0.8"
          />
          {/* Bottom border vine */}
          <path
            d={`M0,96 C10,94 15,99 25,96 C35,92 40,98 50,96 C60,93 65,98 75,96 C85,93 90,98 100,96`}
            fill="none"
            stroke="rgba(160,82,30,0.8)"
            strokeWidth="0.8"
          />
          {/* Left border vine */}
          <path
            d={`M4,0 C2,10 8,15 4,25 C0,35 7,40 4,50 C1,60 7,65 4,75 C1,85 7,90 4,100`}
            fill="none"
            stroke="rgba(160,82,30,0.8)"
            strokeWidth="0.8"
          />
          {/* Right border vine */}
          <path
            d={`M96,0 C94,10 99,15 96,25 C92,35 98,40 96,50 C93,60 98,65 96,75 C93,85 98,90 96,100`}
            fill="none"
            stroke="rgba(160,82,30,0.8)"
            strokeWidth="0.8"
          />
          {/* Paisley teardrop shapes at corners */}
          {[
            { cx: 8, cy: 8 },
            { cx: 92, cy: 8 },
            { cx: 8, cy: 92 },
            { cx: 92, cy: 92 },
          ].map((pt, i) => (
            <g key={i}>
              <ellipse cx={pt.cx} cy={pt.cy} rx="4" ry="6" fill="none" stroke="rgba(160,82,30,0.7)" strokeWidth="0.5" />
              <circle cx={pt.cx} cy={pt.cy - 4} r="1.5" fill="rgba(160,82,30,0.5)" />
            </g>
          ))}
          {/* Small dots along borders */}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={12 + i * 11} cy="4" r="0.8" fill="rgba(160,82,30,0.5)" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={12 + i * 11} cy="96" r="0.8" fill="rgba(160,82,30,0.5)" />
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    const seed = index * 43 + 19

    if (phase === 'enter') {
      // Draw-on effect — like henna paste being applied
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      scale = 0.95 + ease * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      // Mehndi shimmer
      opacity = 0.9 + Math.sin(Date.now() * 0.003 + seed) * 0.1
      scale = 1
    } else {
      opacity = 1 - exitProgress * 1.2
      scale = 1
    }

    const hennaGlow = `
      0 0 6px rgba(160,82,30,0.3),
      1px 1px 3px rgba(0,0,0,0.4)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Georgia', serif",
            fontSize: 'clamp(40px, 11vw, 155px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            textShadow: hennaGlow,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MehndiComponent(props: MotionGraphicProps<MehndiConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mehndi',
  title: 'Kinetic Mehndi / Henna',
  description: 'Indian Mehndi/henna text with terracotta henna palette, intricate paisley vine border, corner teardrop ornaments, and draw-on henna paste reveal',
  tags: ['kinetic', 'typography', 'mehndi', 'henna', 'indian', 'paisley', 'wedding', 'ornate', 'terracotta'],
  category: 'captions',
  component: MehndiComponent as any,
  defaultConfig: {
    words: ['SHAADI', 'MEHENDI', 'BARAAT', 'PYAAR'],
    colors: ['#8B3A10', '#A0522D', '#6B2810', '#C4622D'],
    bgColor: '#F9EDD5',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHAADI', 'MEHENDI', 'BARAAT', 'PYAAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B3A10', '#A0522D', '#6B2810', '#C4622D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F9EDD5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
