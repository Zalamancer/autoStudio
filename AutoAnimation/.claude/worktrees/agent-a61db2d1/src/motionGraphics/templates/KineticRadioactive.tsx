import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RadioactiveConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Contamination spread — expanding rings
    const spreadRadius = ((time * 15) % 80) + 10
    const spreadOpacity = Math.max(0, 1 - spreadRadius / 90) * 0.12
    // Geiger counter particle positions (deterministic per frame)
    const particleCount = 12
    const particles: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < particleCount; i++) {
      const pSeed = Math.floor(time * 6) * particleCount + i
      const r = seededRand(pSeed)
      if (r > 0.35) {
        particles.push({
          x: seededRand(pSeed + 1) * width,
          y: seededRand(pSeed + 2) * height,
          size: 1.5 + seededRand(pSeed + 3) * 3,
          opacity: 0.2 + seededRand(pSeed + 4) * 0.5,
        })
      }
    }
    // Amber alert pulse
    const alertPulse = Math.sin(time * 4) * 0.5 + 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radioactive trefoil (center, subtle) */}
        <svg
          width={Math.min(width, height) * 0.55}
          height={Math.min(width, height) * 0.55}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.06,
          }}
          viewBox="0 0 200 200"
        >
          {/* Three blade trefoil */}
          {[0, 120, 240].map((rot, i) => (
            <g key={i} transform={`rotate(${rot} 100 100)`}>
              <path
                d="M 100 20 A 50 50 0 0 1 140 80 L 115 90 A 20 20 0 0 0 100 60 L 100 20 Z"
                fill="#FFB800"
              />
            </g>
          ))}
          <circle cx="100" cy="100" r="15" fill="none" stroke="#FFB800" strokeWidth="5" />
        </svg>
        {/* Contamination spread rings */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${spreadRadius}%`,
            height: `${spreadRadius}%`,
            borderRadius: '50%',
            border: `1px solid rgba(255,184,0,${spreadOpacity})`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${spreadRadius * 0.6}%`,
            height: `${spreadRadius * 0.6}%`,
            borderRadius: '50%',
            border: `1px solid rgba(255,184,0,${spreadOpacity * 1.5})`,
            pointerEvents: 'none',
          }}
        />
        {/* Geiger counter particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `rgba(255,200,50,${p.opacity})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(255,200,50,${p.opacity * 0.5})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Amber alert border glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 ${30 + alertPulse * 20}px rgba(255,140,0,${0.03 + alertPulse * 0.04})`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 47 + 13
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Geiger click burst entrance — rapid flickers like detection spikes
      const clickBurst = Math.sin(enterProgress * 50 + seed)
      if (enterProgress < 0.3) {
        opacity = clickBurst > 0.2 ? enterProgress * 2 : enterProgress * 0.5
      } else {
        opacity = Math.min(1, (enterProgress - 0.3) * 1.5 + 0.6)
      }
      scale = 0.95 + enterProgress * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      // Radioactive decay shimmer
      const decay = Math.sin(f * 0.5 + seed) * 0.015
      opacity = 1 - Math.abs(decay)
      translateY = Math.sin(f * 0.3 + seed) * 0.6
    } else {
      // Contamination fade — text decays outward
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.06
    }

    return (
      <>
        {/* Radioactive glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(255,180,0,0.25)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            opacity: opacity * 0.5,
            filter: 'blur(10px)',
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
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            opacity,
            textShadow: `0 0 8px rgba(255,180,0,0.5), 0 0 25px rgba(255,140,0,0.2)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RadioactiveComponent(props: MotionGraphicProps<RadioactiveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-radioactive',
  title: 'Kinetic Radioactive',
  description: 'Radioactive decay warning with trefoil symbol, Geiger counter clicking particles, contamination spread rings, and amber alert pulse',
  tags: ['kinetic', 'typography', 'radioactive', 'nuclear', 'geiger', 'decay', 'warning', 'hazard'],
  category: 'captions',
  component: RadioactiveComponent as any,
  defaultConfig: {
    words: ['DECAY', 'RADIATE', 'FISSION', 'MELTDOWN'],
    colors: ['#FFB800', '#FFCC33', '#FFB800', '#FF6600'],
    bgColor: '#0a0a08',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DECAY', 'RADIATE', 'FISSION', 'MELTDOWN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB800', '#FFCC33', '#FFB800', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
