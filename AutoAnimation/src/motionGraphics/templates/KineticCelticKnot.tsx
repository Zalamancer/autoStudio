import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CelticKnotConfig extends KineticBaseConfig {}

// Celtic knot / Book of Kells style:
// interlace border patterns, illuminated manuscript green/gold/terracotta,
// spiral motif background, slow unwind reveal like thread being woven
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const spiralRot = time * 4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Parchment texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='parchment'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23parchment)'/%3E%3C/svg%3E")`,
            opacity: 0.05,
            mixBlendMode: 'multiply',
          }}
        />
        {/* Celtic triskele / triskelion spiral in corner */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '50px',
            height: '50px',
            opacity: 0.4,
            transform: `rotate(${spiralRot}deg)`,
          }}
        >
          <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%' }}>
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(184,134,11,0.8)" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(184,134,11,0.5)" strokeWidth="1" />
            <circle cx="20" cy="20" r="6" fill="none" stroke="rgba(184,134,11,0.4)" strokeWidth="0.8" />
            {/* Spiral arms */}
            {[0, 120, 240].map((angle, i) => {
              const rad = angle * Math.PI / 180
              const x1 = 20 + Math.cos(rad) * 6
              const y1 = 20 + Math.sin(rad) * 6
              const x2 = 20 + Math.cos(rad) * 16
              const y2 = 20 + Math.sin(rad) * 16
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(184,134,11,0.7)" strokeWidth="1.2" />
              )
            })}
          </svg>
        </div>
        {/* Interlace border — top and bottom bands */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '18px', opacity: 0.35 }}
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse key={i} cx={i * 11 + 5} cy="3" rx="4" ry="2" fill="none" stroke="rgba(184,134,11,0.9)" strokeWidth="0.5" />
          ))}
        </svg>
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '18px', opacity: 0.35 }}
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse key={i} cx={i * 11 + 5} cy="3" rx="4" ry="2" fill="none" stroke="rgba(184,134,11,0.9)" strokeWidth="0.5" />
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    const seed = index * 59 + 13

    if (phase === 'enter') {
      // Unwind from center — like a knot being revealed thread by thread
      opacity = enterProgress
      const ease = Math.pow(enterProgress, 0.5) // fast start, gentle end
      scaleX = 0.3 + ease * 0.7
      scaleY = 0.3 + ease * 0.7
    } else if (phase === 'hold') {
      opacity = 1
      // Breathing like illuminated manuscript alive on parchment
      const pulse = 1 + Math.sin(Date.now() * 0.002 + seed) * 0.015
      scaleX = pulse
      scaleY = pulse
    } else {
      opacity = 1 - exitProgress
      scaleX = 1 - exitProgress * 0.05
      scaleY = 1 - exitProgress * 0.05
    }

    const knotGlow = `
      0 0 8px rgba(184,134,11,0.5),
      0 0 20px rgba(0,100,0,0.3),
      2px 2px 3px rgba(0,0,0,0.5)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(42px, 12vw, 165px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: knotGlow,
            WebkitTextStroke: '2px rgba(0,80,0,0.5)',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CelticKnotComponent(props: MotionGraphicProps<CelticKnotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-celtic-knot',
  title: 'Kinetic Celtic Knot',
  description: 'Celtic Book of Kells illuminated manuscript style with triskelion spiral, interlace borders, parchment background, and knot-unwind scale reveal',
  tags: ['kinetic', 'typography', 'celtic', 'knot', 'irish', 'gaelic', 'illuminated', 'manuscript', 'medieval', 'spiral'],
  category: 'captions',
  component: CelticKnotComponent as any,
  defaultConfig: {
    words: ['ERIN', 'CALEDONIA', 'FAITH', 'CLANS'],
    colors: ['#B8860B', '#006400', '#8B4513', '#B8860B'],
    bgColor: '#1a1206',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ERIN', 'CALEDONIA', 'FAITH', 'CLANS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8860B', '#006400', '#8B4513', '#B8860B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1206', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
