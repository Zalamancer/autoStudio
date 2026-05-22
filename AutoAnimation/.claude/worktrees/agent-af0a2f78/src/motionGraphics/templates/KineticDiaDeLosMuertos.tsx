import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiaDeLosMuertosConfig extends KineticBaseConfig {}

// Mexican Day of the Dead (Dia de los Muertos) text:
// marigold orange/purple/hot-pink palette, sugar skull floral patterns,
// papel picado (perforated paper) background, festive skeleton letter style
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Papel picado diamond cutout pattern */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
          viewBox="0 0 60 60"
        >
          <defs>
            <pattern id="papel-picado" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="4" fill="rgba(255,165,0,0.8)" />
              <circle cx="10" cy="10" r="2" fill="rgba(255,20,147,0.5)" />
              <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="none" stroke="rgba(255,165,0,0.4)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#papel-picado)" />
        </svg>
        {/* Marigold petal scatter */}
        {[
          { top: '5%', left: '3%', rot: 15 },
          { top: '8%', right: '5%', rot: -20 },
          { bottom: '6%', left: '6%', rot: 30 },
          { bottom: '5%', right: '3%', rot: -10 },
          { top: '40%', left: '2%', rot: 5 },
          { top: '40%', right: '2%', rot: -5 },
        ].map((flower, i) => {
          const sway = Math.sin(time * 2 + i * 1.2) * 5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '28px',
                height: '28px',
                ...{ top: flower.top, left: (flower as any).left, right: (flower as any).right, bottom: flower.bottom },
                transform: `rotate(${flower.rot + sway}deg)`,
                opacity: 0.5,
              }}
            >
              <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
                {/* Simple 6-petal flower */}
                {Array.from({ length: 6 }).map((_, p) => {
                  const angle = (p / 6) * Math.PI * 2
                  const px = 10 + Math.cos(angle) * 6
                  const py = 10 + Math.sin(angle) * 6
                  return <circle key={p} cx={px} cy={py} r="2.5" fill={p % 2 === 0 ? '#FF8C00' : '#FF1493'} />
                })}
                <circle cx="10" cy="10" r="2.5" fill="#FFD700" />
              </svg>
            </div>
          )
        })}
        {/* Festive bottom fringe (papel picado banner effect) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12px',
            backgroundImage: `repeating-linear-gradient(
              to right,
              #FF8C00 0px, #FF8C00 8px,
              #FF1493 8px, #FF1493 16px,
              #9B59B6 16px, #9B59B6 24px,
              #FFD700 24px, #FFD700 32px
            )`,
            opacity: 0.7,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    const seed = index * 53 + 37

    if (phase === 'enter') {
      // Festive bounce-in from below with slight sway (like dancing)
      opacity = Math.min(1, enterProgress * 2.5)
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      scale = 0.7 + ease * 0.3
      const sway = (1 - enterProgress) * ((seed % 2 === 0) ? 12 : -12)
      rotation = sway
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle marigold sway
      rotation = Math.sin(Date.now() * 0.003 + seed) * 3
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
      rotation = exitProgress * ((seed % 2 === 0) ? 15 : -15)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 12vw, 165px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: `
              3px 3px 0 #000,
              -2px -2px 0 #000,
              2px -2px 0 #000,
              -2px 2px 0 #000,
              0 0 30px rgba(255,140,0,0.6),
              0 0 60px rgba(255,20,147,0.3)
            `,
            WebkitTextStroke: '2px #000000',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DiaDeLosMuertosComponent(props: MotionGraphicProps<DiaDeLosMuertosConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dia-de-los-muertos',
  title: 'Kinetic Dia de los Muertos',
  description: 'Mexican Day of the Dead text with marigold/hot-pink/purple palette, papel picado cutouts, sugar skull floral patterns, and festive dancing sway entrance',
  tags: ['kinetic', 'typography', 'mexican', 'dia-de-los-muertos', 'marigold', 'papel-picado', 'skull', 'festive', 'latin'],
  category: 'captions',
  component: DiaDeLosMuertosComponent as any,
  defaultConfig: {
    words: ['VIDA', 'MUERTE', 'FIESTA', 'ALMA'],
    colors: ['#FF8C00', '#FF1493', '#9B59B6', '#FFD700'],
    bgColor: '#1a0a1a',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VIDA', 'MUERTE', 'FIESTA', 'ALMA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF8C00', '#FF1493', '#9B59B6', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
