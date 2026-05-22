import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AboriginalDotConfig extends KineticBaseConfig {}

// Australian Aboriginal dot painting style:
// ochre/terracotta/ochre yellow/red earth tones + white dots,
// concentric circle dot patterns (representing sacred sites/waterholes),
// dots appear one by one building the word (dot-by-dot reveal)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dot density oscillation
    const dotPulse = 0.6 + Math.abs(Math.sin(time * 0.8)) * 0.4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Concentric circle dot clusters — represents sacred sites/waterholes */}
        {[
          { cx: '15%', cy: '20%', r: 30 },
          { cx: '85%', cy: '25%', r: 25 },
          { cx: '10%', cy: '75%', r: 28 },
          { cx: '88%', cy: '80%', r: 22 },
          { cx: '50%', cy: '8%', r: 18 },
          { cx: '50%', cy: '92%', r: 20 },
        ].map((cluster, ci) => (
          <div
            key={ci}
            style={{ position: 'absolute', left: cluster.cx, top: cluster.cy }}
          >
            {[1, 2, 3].map((ring) => (
              <div
                key={ring}
                style={{
                  position: 'absolute',
                  width: `${ring * 14}px`,
                  height: `${ring * 14}px`,
                  transform: `translate(-${ring * 7}px, -${ring * 7}px)`,
                  borderRadius: '50%',
                  border: `2px dotted rgba(255,255,255,${0.15 * dotPulse})`,
                }}
              />
            ))}
            {/* Center dot */}
            <div
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: `rgba(255,200,50,${0.6 * dotPulse})`,
                transform: 'translate(-3px, -3px)',
              }}
            />
          </div>
        ))}
        {/* Scattered background dots mimicking Aboriginal dot art */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(255,200,50,0.25) 1.5px, transparent 1.5px)`,
            backgroundSize: '18px 16px',
            backgroundPosition: '0 0, 9px 8px',
            opacity: dotPulse * 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(200,80,20,0.2) 1px, transparent 1px)`,
            backgroundSize: '22px 20px',
            backgroundPosition: '11px 10px',
            opacity: dotPulse * 0.4,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    const seed = index * 83 + 41

    if (phase === 'enter') {
      // Dot-by-dot build: scale and opacity staggered
      opacity = enterProgress
      // Dots "building" feel — quantized steps
      const dotStep = Math.floor(enterProgress * 8) / 8
      scale = 0.8 + dotStep * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle dot-pulse breathing
      scale = 1 + Math.sin(Date.now() * 0.003 + seed) * 0.02
    } else {
      opacity = 1 - exitProgress * 1.3
      scale = 1 - exitProgress * 0.05
    }

    // Earth tone dot-art style text with dot pattern inside letters
    const earthGlow = `
      0 0 8px rgba(200,100,20,0.4),
      2px 2px 4px rgba(0,0,0,0.6)
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
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: earthGlow,
            WebkitTextStroke: '2px rgba(0,0,0,0.5)',
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

function AboriginalDotComponent(props: MotionGraphicProps<AboriginalDotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-aboriginal-dot',
  title: 'Kinetic Aboriginal Dot Painting',
  description: 'Australian Aboriginal dot painting style with earth ochre/terracotta tones, concentric circle sacred site patterns, scattered dot fields, and dot-step build-in reveal',
  tags: ['kinetic', 'typography', 'aboriginal', 'dot-painting', 'australian', 'indigenous', 'ochre', 'earth', 'dreamtime'],
  category: 'captions',
  component: AboriginalDotComponent as any,
  defaultConfig: {
    words: ['COUNTRY', 'DREAMING', 'MOB', 'LORE'],
    colors: ['#FFB347', '#FF6B35', '#F5DEB3', '#CC6633'],
    bgColor: '#2d1406',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COUNTRY', 'DREAMING', 'MOB', 'LORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB347', '#FF6B35', '#F5DEB3', '#CC6633'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2d1406', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
