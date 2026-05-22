import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Film Aesthetic: Wes Anderson — perfect symmetry, pastel palette, Futura-style centered title cards
// Mechanic: text slides in on perfectly symmetrical guide lines with deadpan precision snap

interface WesAndersonConfig extends KineticBaseConfig {}

const PASTEL_PINK = '#f2ccc3'
const PASTEL_TAN = '#e8d5b0'
const ACCENT = '#c0392b'
const DARK = '#2c2416'

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Symmetrical Wes Anderson composition frame
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: PASTEL_TAN,
        }}
      >
        {/* Letterbox bars — Wes often shoots Academy 1.37:1 */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '8%', background: DARK, opacity: 0.85 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '8%', background: DARK, opacity: 0.85 }} />

        {/* Perfect center axis line */}
        <div style={{ position: 'absolute', left: '50%', top: '8%', bottom: '8%', width: 1, background: `${ACCENT}22` }} />

        {/* Symmetrical decorative border lines */}
        <div style={{ position: 'absolute', left: '6%', right: '6%', top: '10%', height: 2, background: ACCENT, opacity: 0.4 }} />
        <div style={{ position: 'absolute', left: '6%', right: '6%', bottom: '10%', height: 2, background: ACCENT, opacity: 0.4 }} />

        {/* Symmetric corner ornaments */}
        {[['6%', '10%'], ['6%', 'auto'], ['auto', '10%'], ['auto', 'auto']].map(([l, t], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: l === 'auto' ? undefined : l,
            right: l === 'auto' ? '6%' : undefined,
            top: t === 'auto' ? undefined : t,
            bottom: t === 'auto' ? '10%' : undefined,
            width: 12,
            height: 12,
            border: `2px solid ${ACCENT}`,
            opacity: 0.5,
          }} />
        ))}

        {/* Slow subtle panning — Wes Anderson's static camera vibe */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '20%',
            bottom: '20%',
            background: PASTEL_PINK,
            opacity: 0.3 + Math.sin(time * 0.3) * 0.05,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Wes mechanic: text snaps in from perfect left OR right on alternating words
    // with no easing — just linear snap and hard hold. Very deadpan.
    const linearIn = enterProgress

    let opacity = 0
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Snap in from left — sudden, no ease, Wes Anderson wouldn't use bounce
      opacity = enterProgress > 0.15 ? 1 : 0
      translateX = enterProgress > 0.15 ? 0 : -30
      translateY = 0
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      translateY = 0
      void linearIn
    } else {
      // Snap out to right
      opacity = exitProgress < 0.85 ? 1 : 0
      translateX = exitProgress < 0.85 ? 0 : 30
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
          opacity,
          fontFamily: "'Futura', 'Century Gothic', 'Gill Sans', sans-serif",
          fontSize: 'clamp(24px, 6.5vw, 88px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 12,
          textAlign: 'center',
          color: color || DARK,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function WesAndersonComponent(props: MotionGraphicProps<WesAndersonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wes-anderson',
  title: 'Kinetic Wes Anderson',
  description: 'Wes Anderson symmetry: deadpan snap-cut title cards with Futura uppercase, pastel palette, and perfect decorative borders',
  tags: ['kinetic', 'typography', 'wes anderson', 'symmetry', 'pastel', 'film', 'centered', 'deadpan'],
  category: 'captions',
  component: WesAndersonComponent as any,
  defaultConfig: {
    words: ['THE', 'GRAND', 'HOTEL', 'BUDAPEST'],
    colors: ['#2c2416', '#c0392b', '#2c2416', '#8b4513'],
    bgColor: '#e8d5b0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THE', 'GRAND', 'HOTEL', 'BUDAPEST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2c2416', '#c0392b', '#2c2416', '#8b4513'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8d5b0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
