import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArabicCalligraphyConfig extends KineticBaseConfig {}

// Arabic calligraphy animation: flowing right-to-left reveal, ink-brush stroke
// style, geometric tilework background (Moroccan/Islamic zellige pattern),
// graceful scale with golden illuminated manuscript aesthetic
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Islamic geometric star pattern (8-point) */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
          viewBox="0 0 80 80"
        >
          <defs>
            <pattern id="islamic-geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* 8-pointed star */}
              <polygon
                points="20,4 23.5,16.5 36,20 23.5,23.5 20,36 16.5,23.5 4,20 16.5,16.5"
                fill="none"
                stroke="rgba(255,215,0,0.9)"
                strokeWidth="0.5"
              />
              <rect x="14" y="14" width="12" height="12" fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="0.3" transform="rotate(45,20,20)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-geo)" />
        </svg>
        {/* Gilded border */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            border: '2px solid rgba(255,215,0,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            border: '1px solid rgba(255,215,0,0.12)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    let translateX = 0
    const seed = index * 43 + 17

    if (phase === 'enter') {
      // Reveal from right (Arabic RTL direction) — ink flowing onto page
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      // Clip-like reveal: start narrow, expand to full
      scaleX = ease
      translateX = (1 - ease) * 30 // drift from right
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle breathing like a living illuminated manuscript
      const breath = 1 + Math.sin(Date.now() * 0.003 + seed) * 0.01
      scaleX = breath
      scaleY = breath
    } else {
      // Dissolve upward like smoke/incense
      opacity = 1 - exitProgress
      scaleY = 1 - exitProgress * 0.1
      translateX = exitProgress * -20
    }

    const calligraphyGlow = `
      0 0 8px rgba(255,215,0,0.4),
      0 0 20px rgba(255,160,0,0.2),
      2px 2px 4px rgba(0,0,0,0.5)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            textShadow: calligraphyGlow,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            direction: 'ltr', // words provided in Latin but style mimics calligraphic flow
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ArabicCalligraphyComponent(props: MotionGraphicProps<ArabicCalligraphyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-arabic-calligraphy',
  title: 'Kinetic Arabic Calligraphy',
  description: 'Arabic calligraphy animation with Islamic geometric zellige tilework background, gilded borders, RTL ink-reveal flow, and illuminated manuscript glow',
  tags: ['kinetic', 'typography', 'arabic', 'calligraphy', 'islamic', 'geometric', 'gold', 'manuscript', 'middle-east'],
  category: 'captions',
  component: ArabicCalligraphyComponent as any,
  defaultConfig: {
    words: ['SALAM', 'BARAKA', 'NOUR', 'HIKMA'],
    colors: ['#FFD700', '#C0A000', '#FFB347', '#FFD700'],
    bgColor: '#0d0a05',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SALAM', 'BARAKA', 'NOUR', 'HIKMA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#C0A000', '#FFB347', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0a05', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
