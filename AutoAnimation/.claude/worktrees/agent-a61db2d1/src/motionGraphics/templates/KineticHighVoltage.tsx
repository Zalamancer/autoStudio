import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HighVoltageConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Electrical arc flickers
    const arcSeed = Math.floor(time * 12)
    const arcActive = seededRand(arcSeed) > 0.55
    const arcX = seededRand(arcSeed + 1) * width * 0.6 + width * 0.2
    const arcY = seededRand(arcSeed + 2) * height * 0.4 + height * 0.1
    // Buzzing energy field pulse
    const buzzPulse = Math.sin(time * 40) * 0.5 + 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark industrial background with subtle gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(60,50,0,0.15), transparent 70%)',
          }}
        />
        {/* Yellow warning triangle */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Triangle outline */}
          <polygon
            points={`${width * 0.5},${height * 0.12} ${width * 0.2},${height * 0.88} ${width * 0.8},${height * 0.88}`}
            fill="none"
            stroke="#FFD000"
            strokeWidth={3}
            opacity={0.2}
          />
          {/* Lightning bolt zigzag inside triangle */}
          <polyline
            points={`${width * 0.47},${height * 0.3} ${width * 0.42},${height * 0.5} ${width * 0.52},${height * 0.48} ${width * 0.46},${height * 0.7} ${width * 0.58},${height * 0.42} ${width * 0.48},${height * 0.44} ${width * 0.53},${height * 0.3}`}
            fill="none"
            stroke={`rgba(255,220,0,${0.08 + buzzPulse * 0.08})`}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </svg>
        {/* Electrical arc flash */}
        {arcActive && (
          <div
            style={{
              position: 'absolute',
              left: arcX - 30,
              top: arcY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(180,220,255,0.5), rgba(100,180,255,0.2), transparent)`,
              boxShadow: `0 0 20px 8px rgba(150,200,255,0.3)`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Ambient electric haze at edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 ${40 + buzzPulse * 20}px rgba(255,220,0,0.05)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 61 + 17
    let opacity = 0
    let translateY = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      // Electrical discharge entrance — rapid flicker then stabilize
      const flickerRate = Math.sin(enterProgress * 60 + seed)
      if (enterProgress < 0.5) {
        opacity = flickerRate > 0 ? enterProgress * 1.5 : enterProgress * 0.4
        glowIntensity = enterProgress * 2
      } else {
        opacity = 0.7 + enterProgress * 0.3
        glowIntensity = 1.5 - enterProgress * 0.5
      }
      translateY = (1 - enterProgress) * ((seed % 2 === 0) ? -6 : 6)
    } else if (phase === 'hold') {
      opacity = 1
      // Steady buzz with occasional surge
      const buzz = Math.sin(f * 1.2 + seed) * 0.02
      opacity = 1 - Math.abs(buzz)
      glowIntensity = 0.8 + Math.sin(f * 0.3 + seed) * 0.3
      translateY = Math.sin(f * 2 + seed) * 0.8
    } else {
      // Arc discharge exit — sparks out
      opacity = (1 - exitProgress) * (Math.sin(exitProgress * 30 + seed) > -0.3 ? 1 : 0.4)
      glowIntensity = (1 - exitProgress) * 2
      translateY = exitProgress * ((seed % 2 === 0) ? 10 : -10)
    }

    const glowSize = 6 + glowIntensity * 12
    const glowColor = 'rgba(255,220,0,0.6)'

    return (
      <>
        {/* Electric glow layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(255,220,0,0.3)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity: opacity * glowIntensity * 0.5,
            filter: `blur(${glowSize}px)`,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity,
            textShadow: `0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 2}px rgba(255,200,0,0.2)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function HighVoltageComponent(props: MotionGraphicProps<HighVoltageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-high-voltage',
  title: 'Kinetic High Voltage',
  description: 'High voltage warning with electrical arc discharges, yellow triangle sign, bolt zigzag, and buzzing energy flicker effects',
  tags: ['kinetic', 'typography', 'voltage', 'electric', 'warning', 'lightning', 'power', 'industrial'],
  category: 'captions',
  component: HighVoltageComponent as any,
  defaultConfig: {
    words: ['VOLTAGE', 'SHOCK', 'ARC', 'POWER'],
    colors: ['#FFD000', '#FFE44D', '#FFD000', '#FFE44D'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOLTAGE', 'SHOCK', 'ARC', 'POWER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD000', '#FFE44D', '#FFD000', '#FFE44D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
