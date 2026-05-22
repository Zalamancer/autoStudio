import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Trending Aesthetic 2025: Corporate Memphis (Ironic)
// The irony IS the animation: overly cheerful geometric shapes + deadpan corporate font
// Shapes bounce in with friendly easing while text is cold and bureaucratic

interface CorporateMemphisConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Floating geometric shapes — the corporate Memphis signature
    const shapes = [
      { x: 10, y: 15, size: 40, type: 'circle', color: '#FFD166', delay: 0 },
      { x: 80, y: 20, size: 28, type: 'rect', color: '#06D6A0', delay: 0.3 },
      { x: 15, y: 75, size: 22, type: 'circle', color: '#EF476F', delay: 0.6 },
      { x: 85, y: 70, size: 35, type: 'triangle', color: '#118AB2', delay: 0.9 },
      { x: 50, y: 10, size: 18, type: 'rect', color: '#FFD166', delay: 1.2 },
      { x: 5, y: 45, size: 14, type: 'circle', color: '#06D6A0', delay: 1.5 },
      { x: 90, y: 45, size: 20, type: 'rect', color: '#EF476F', delay: 0.4 },
      { x: 65, y: 85, size: 16, type: 'circle', color: '#073B4C', delay: 0.8 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#FFFCF2' }}>
        {shapes.map((s, i) => {
          const bob = Math.sin(time * 1.2 + s.delay * Math.PI) * 6
          const rotate = time * 20 * (i % 2 === 0 ? 1 : -1) + s.delay * 45
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `calc(${s.y}% + ${bob}px)`,
                width: s.size,
                height: s.size,
                borderRadius: s.type === 'circle' ? '50%' : s.type === 'rect' ? '3px' : '0',
                background: s.type === 'triangle' ? 'transparent' : s.color,
                borderLeft: s.type === 'triangle' ? `${s.size / 2}px solid transparent` : undefined,
                borderRight: s.type === 'triangle' ? `${s.size / 2}px solid transparent` : undefined,
                borderBottom: s.type === 'triangle' ? `${s.size}px solid ${s.color}` : undefined,
                transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                opacity: 0.7,
              }}
            />
          )
        })}
        {/* Subtle dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Ironic mechanic: shapes bounce happily, text slides in with dead-flat corporate energy
    const easeOutBounce = (t: number): number => {
      const n1 = 7.5625
      const d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75 }
      if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375 }
      t -= 2.625 / d1
      return n1 * t * t + 0.984375
    }

    let opacity = 0
    let translateX = 0
    let scale = 1

    if (phase === 'enter') {
      // Text slides in from left: flat, mechanical
      const e = easeOutBounce(enterProgress)
      opacity = Math.min(enterProgress * 4, 1)
      translateX = (1 - e) * -50
      scale = 0.95 + e * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      scale = 1
    } else {
      opacity = 1 - exitProgress * 2
      translateX = exitProgress * 30
      scale = 1 - exitProgress * 0.02
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity: Math.max(0, opacity),
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          fontSize: 'clamp(32px, 9vw, 120px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          whiteSpace: 'nowrap',
          // The ironic touch: cheerful background + completely flat text styling
        }}
      >
        {word}
      </div>
    )
  },
}

function CorporateMemphisComponent(props: MotionGraphicProps<CorporateMemphisConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-corporate-memphis',
  title: 'Kinetic Corporate Memphis',
  description: 'Ironic corporate Memphis aesthetic: cheerfully bouncing geometric shapes with deadpan sans-serif text',
  tags: ['kinetic', 'typography', 'corporate memphis', 'ironic', 'geometric', 'aesthetic', '2025', 'startup'],
  category: 'captions',
  component: CorporateMemphisComponent as any,
  defaultConfig: {
    words: ['SYNERGY', 'PIVOT', 'DISRUPT', 'SCALE'],
    colors: ['#073B4C', '#118AB2', '#073B4C', '#EF476F'],
    bgColor: '#FFFCF2',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYNERGY', 'PIVOT', 'DISRUPT', 'SCALE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#073B4C', '#118AB2', '#073B4C', '#EF476F'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFCF2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
