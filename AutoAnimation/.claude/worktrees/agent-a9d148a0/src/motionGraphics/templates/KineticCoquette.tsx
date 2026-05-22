import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Trending Aesthetic 2025: Coquette — pink bows, ribbons, hyper-feminine soft glam
// Animation mechanic: text tied with a bow — letters gather from sides and "knot" center

interface CoquetteConfig extends KineticBaseConfig {}

const BOW_PINK = '#f4a7b9'
const DEEP_PINK = '#e8627a'

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Soft pink gradient with floating bow-ribbon accents
    const ribbons = Array.from({ length: 6 }, (_, i) => {
      const x = 10 + i * 16
      const y = 5 + Math.sin(time * 0.8 + i * 0.9) * 4
      const tilt = -15 + i * 5 + Math.sin(time * 0.5 + i) * 3
      return (
        <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, 0) rotate(${tilt}deg)`, opacity: 0.25 }}>
          {/* Left ribbon loop */}
          <div style={{ position: 'absolute', right: '50%', top: 0, width: 20, height: 12, border: `2px solid ${BOW_PINK}`, borderRadius: '50% 0 0 50%', transform: 'skewY(-10deg)' }} />
          {/* Right ribbon loop */}
          <div style={{ position: 'absolute', left: '50%', top: 0, width: 20, height: 12, border: `2px solid ${BOW_PINK}`, borderRadius: '0 50% 50% 0', transform: 'skewY(10deg)' }} />
          {/* Knot center */}
          <div style={{ position: 'absolute', left: '50%', top: 2, width: 6, height: 8, background: DEEP_PINK, borderRadius: '50%', transform: 'translateX(-50%)' }} />
          {/* Ribbon tails */}
          <div style={{ position: 'absolute', top: 12, left: '35%', width: 6, height: 14, background: `linear-gradient(180deg, ${BOW_PINK}, transparent)`, transform: 'skewX(-8deg)' }} />
          <div style={{ position: 'absolute', top: 12, right: '35%', width: 6, height: 14, background: `linear-gradient(180deg, ${BOW_PINK}, transparent)`, transform: 'skewX(8deg)' }} />
        </div>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #fff0f5 0%, #fde0ec 50%, #f9c8d8 100%)',
        }}
      >
        {/* Subtle lace dot pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(232,98,122,0.08) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        {ribbons}
        {/* Bottom bow accent */}
        <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }}>
          <div style={{ width: 50, height: 25, border: `1.5px solid ${DEEP_PINK}`, borderRadius: '50%', position: 'absolute', right: '50%', transform: 'skewY(-5deg)' }} />
          <div style={{ width: 50, height: 25, border: `1.5px solid ${DEEP_PINK}`, borderRadius: '50%', position: 'absolute', left: '50%', transform: 'skewY(5deg)' }} />
          <div style={{ width: 10, height: 12, background: DEEP_PINK, borderRadius: '50%', position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)' }} />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Letters "tied together" with a bow: enter from both sides, meet in middle
    const easeOutElastic = (t: number) => {
      if (t === 0 || t === 1) return t
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1
    }

    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      const e = easeOutElastic(enterProgress)
      opacity = Math.min(enterProgress * 3, 1)
      scaleX = 0.3 + e * 0.7   // squishes from narrow then snaps open like a bow
      scaleY = 1.2 - e * 0.2   // compensating Y squash
      translateY = (1 - enterProgress) * 10
      rotate = (1 - e) * -3
    } else if (phase === 'hold') {
      opacity = 1
      scaleX = 1
      scaleY = 1
      translateY = Math.sin(Date.now() * 0.001) * 2
      rotate = 0
    } else {
      const e = 1 - Math.pow(1 - exitProgress, 2)
      opacity = 1 - e
      scaleX = 1 - e * 0.3
      translateY = e * -8
      rotate = e * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(32px, 9vw, 120px)',
          fontWeight: 400,
          fontStyle: 'italic',
          textTransform: 'lowercase',
          letterSpacing: 6,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 2px 8px rgba(232,98,122,0.2)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function CoquetteComponent(props: MotionGraphicProps<CoquetteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coquette',
  title: 'Kinetic Coquette',
  description: 'Coquette aesthetic: italic serif squishes open like a bow-knot on soft pink background with ribbon decorations',
  tags: ['kinetic', 'typography', 'coquette', 'bow', 'ribbon', 'pink', 'feminine', 'aesthetic', '2025'],
  category: 'captions',
  component: CoquetteComponent as any,
  defaultConfig: {
    words: ['chérie', 'adore', 'pretty', 'sweet'],
    colors: ['#c94070', '#e8627a', '#a83258', '#d4506a'],
    bgColor: '#fff0f5',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['chérie', 'adore', 'pretty', 'sweet'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c94070', '#e8627a', '#a83258', '#d4506a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fff0f5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
