import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AfricanTextileConfig extends KineticBaseConfig {}

// African textile pattern (Kente/Ankara/Adinkra) style:
// bold geometric repeating stripe/zigzag patterns, vibrant earth + jewel tones,
// Adinkra symbol-inspired border, stamp reveal
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const stripeShift = (time * 20) % 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Kente-inspired vertical stripes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              to right,
              rgba(255,200,0,0.15) 0px,
              rgba(255,200,0,0.15) 8px,
              rgba(0,120,50,0.12) 8px,
              rgba(0,120,50,0.12) 16px,
              rgba(180,20,20,0.12) 16px,
              rgba(180,20,20,0.12) 24px,
              rgba(0,0,0,0.06) 24px,
              rgba(0,0,0,0.06) 32px
            )`,
            backgroundPositionX: `${stripeShift}px`,
          }}
        />
        {/* Zigzag Ankara-style horizontal band (top and bottom) */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '24px', opacity: 0.6 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,4 5,0 10,4 15,0 20,4 25,0 30,4 35,0 40,4 45,0 50,4 55,0 60,4 65,0 70,4 75,0 80,4 85,0 90,4 95,0 100,4"
            fill="none"
            stroke="rgba(255,200,0,0.7)"
            strokeWidth="1.5"
          />
        </svg>
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px', opacity: 0.6 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,4 5,8 10,4 15,8 20,4 25,8 30,4 35,8 40,4 45,8 50,4 55,8 60,4 65,8 70,4 75,8 80,4 85,8 90,4 95,8 100,4"
            fill="none"
            stroke="rgba(255,200,0,0.7)"
            strokeWidth="1.5"
          />
        </svg>
        {/* Diamond/lozenge Adinkra-inspired border corners */}
        {[
          { top: '8px', left: '8px' },
          { top: '8px', right: '8px' },
          { bottom: '8px', left: '8px' },
          { bottom: '8px', right: '8px' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              background: 'rgba(255,200,0,0.5)',
              transform: 'rotate(45deg)',
              ...pos,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    const seed = index * 71 + 29

    if (phase === 'enter') {
      // Stamp-down from above — bold, decisive, like a wood-block Adinkra stamp
      opacity = Math.min(1, enterProgress * 3)
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      translateY = -(1 - ease) * 25
      scale = 1.2 - ease * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle rhythmic pulse like drumbeat
      const pulse = 1 + Math.sin(Date.now() * 0.006 + seed) * 0.03
      scale = pulse
    } else {
      opacity = 1 - exitProgress * 1.5
      scale = 1 + exitProgress * 0.15
      translateY = exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: `
              3px 3px 0 rgba(0,0,0,0.5),
              -1px -1px 0 rgba(0,0,0,0.3),
              0 0 20px rgba(255,200,0,0.2)
            `,
            WebkitTextStroke: '2px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function AfricanTextileComponent(props: MotionGraphicProps<AfricanTextileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-african-textile',
  title: 'Kinetic African Textile',
  description: 'African Kente/Ankara/Adinkra textile pattern typography with bold geometric stripes, zigzag bands, diamond corners, and stamp-down reveal',
  tags: ['kinetic', 'typography', 'african', 'kente', 'ankara', 'adinkra', 'textile', 'geometric', 'bold'],
  category: 'captions',
  component: AfricanTextileComponent as any,
  defaultConfig: {
    words: ['UBUNTU', 'ASANTE', 'SANKOFA', 'IMARA'],
    colors: ['#FFD700', '#CC0000', '#008000', '#FF8C00'],
    bgColor: '#1a0d00',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['UBUNTU', 'ASANTE', 'SANKOFA', 'IMARA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#CC0000', '#008000', '#FF8C00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0d00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
