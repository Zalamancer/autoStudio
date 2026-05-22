import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StarNavigateConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate fixed star field
    const starCount = 80
    const stars: { x: number; y: number; size: number; brightness: number }[] = []
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: seededRand(i * 7 + 1) * width,
        y: seededRand(i * 13 + 3) * height,
        size: seededRand(i * 19 + 7) * 2 + 0.5,
        brightness: seededRand(i * 23 + 11) * 0.5 + 0.2,
      })
    }

    // Constellation lines connecting some stars
    const constellationPairs = [
      [0, 3], [3, 7], [7, 12], [12, 15],
      [20, 24], [24, 28], [28, 31],
      [40, 44], [44, 48], [48, 42],
      [55, 59], [59, 63], [63, 67], [67, 55],
    ]

    // Astrolabe overlay (concentric rings)
    const astrolabeCx = width * 0.78
    const astrolabeCy = height * 0.3
    const astrolabeR = Math.min(width, height) * 0.18
    const rotation = time * 3 // slow rotation

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep navy gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 40%, #0c1535 0%, #060d20 50%, #030812 100%)',
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Stars */}
          {stars.map((s, i) => {
            const twinkle = Math.sin(time * 2 + i * 1.7) * 0.15
            return (
              <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.size}
                fill={`rgba(255, 230, 170, ${s.brightness + twinkle})`} />
            )
          })}
          {/* Constellation lines */}
          {constellationPairs.map(([a, b], i) => {
            if (a >= stars.length || b >= stars.length) return null
            return (
              <line key={`cl${i}`}
                x1={stars[a].x} y1={stars[a].y}
                x2={stars[b].x} y2={stars[b].y}
                stroke="rgba(180, 200, 255, 0.08)" strokeWidth={0.5} />
            )
          })}
          {/* Astrolabe overlay */}
          <g transform={`translate(${astrolabeCx}, ${astrolabeCy}) rotate(${rotation})`} opacity={0.12}>
            <circle cx={0} cy={0} r={astrolabeR} fill="none" stroke="rgba(200, 180, 100, 0.5)" strokeWidth={0.8} />
            <circle cx={0} cy={0} r={astrolabeR * 0.7} fill="none" stroke="rgba(200, 180, 100, 0.4)" strokeWidth={0.5} />
            <circle cx={0} cy={0} r={astrolabeR * 0.4} fill="none" stroke="rgba(200, 180, 100, 0.3)" strokeWidth={0.5} />
            {/* Degree tick marks */}
            {Array.from({ length: 36 }, (_, i) => {
              const angle = (i / 36) * Math.PI * 2
              const r1 = astrolabeR * 0.92
              const r2 = astrolabeR
              return (
                <line key={`tick${i}`}
                  x1={Math.cos(angle) * r1} y1={Math.sin(angle) * r1}
                  x2={Math.cos(angle) * r2} y2={Math.sin(angle) * r2}
                  stroke="rgba(200, 180, 100, 0.4)" strokeWidth={i % 9 === 0 ? 1 : 0.3} />
              )
            })}
            {/* Ecliptic arc */}
            <path d={`M${-astrolabeR * 0.6},${-astrolabeR * 0.3} Q0,${astrolabeR * 0.4} ${astrolabeR * 0.6},${-astrolabeR * 0.3}`}
              fill="none" stroke="rgba(200, 180, 100, 0.3)" strokeWidth={0.5} strokeDasharray="3,3" />
          </g>
          {/* Celestial equator line */}
          <line x1={0} y1={height * 0.55} x2={width} y2={height * 0.45}
            stroke="rgba(100, 120, 200, 0.05)" strokeWidth={0.5} strokeDasharray="8,6" />
          {/* Horizon line */}
          <line x1={0} y1={height * 0.85} x2={width} y2={height * 0.85}
            stroke="rgba(100, 120, 200, 0.04)" strokeWidth={0.5} />
          <text x={width - 10} y={height * 0.85 - 4} textAnchor="end"
            fill="rgba(100, 120, 200, 0.08)" fontSize={6} fontFamily="serif">
            HORIZON
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 120)

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)

      // Stars appear at letter positions, then constellation lines connect them, then letters reveal
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Star points at each letter position */}
          {word.split('').map((_, i) => {
            const starProgress = Math.max(0, Math.min(1, (ease * 2 - (i / word.length) * 0.5)))
            const lx = (i - word.length / 2 + 0.5) * fontSize * 0.58
            return (
              <div key={`star${i}`} style={{
                position: 'absolute',
                top: `calc(50% - ${fontSize * 0.15}px)`,
                left: `calc(50% + ${lx}px)`,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: `rgba(255, 215, 100, ${starProgress * 0.8})`,
                boxShadow: `0 0 ${8 * starProgress}px rgba(255, 215, 100, ${starProgress * 0.5})`,
                transform: `translate(-50%, -50%) scale(${starProgress})`,
              }} />
            )
          })}
          {/* Constellation connecting lines */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {word.split('').map((_, i) => {
              if (i === 0) return null
              const lineProgress = Math.max(0, Math.min(1, (ease * 2 - 0.3 - (i / word.length) * 0.3)))
              const x1 = width / 2 + (i - 1 - word.length / 2 + 0.5) * fontSize * 0.58
              const x2 = width / 2 + (i - word.length / 2 + 0.5) * fontSize * 0.58
              const y = height / 2 - fontSize * 0.15
              return (
                <line key={`cline${i}`} x1={x1} y1={y} x2={x1 + (x2 - x1) * lineProgress} y2={y}
                  stroke={`rgba(255, 215, 100, ${lineProgress * 0.25})`} strokeWidth={0.8} />
              )
            })}
          </svg>
          {/* Text fading in */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 300,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: Math.max(0, ease * 2 - 0.8),
            textShadow: `0 0 20px rgba(255, 215, 100, ${ease * 0.3})`,
          }}>
            {word}
          </div>
          {/* Star magnitude label */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 8,
            fontStyle: 'italic',
            color: 'rgba(180, 200, 255, 0.25)',
            opacity: ease,
          }}>
            mag 2.1 &bull; RA 14h 15m &bull; Dec +19&deg;
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const twinkle = Math.sin(holdProgress * Math.PI * 6) * 0.1
      const glow = 15 + Math.sin(holdProgress * Math.PI * 4) * 5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Constellation lines */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {word.split('').map((_, i) => {
              if (i === 0) return null
              const x1 = width / 2 + (i - 1 - word.length / 2 + 0.5) * fontSize * 0.58
              const x2 = width / 2 + (i - word.length / 2 + 0.5) * fontSize * 0.58
              const y = height / 2 - fontSize * 0.15
              return (
                <line key={`hcl${i}`} x1={x1} y1={y} x2={x2} y2={y}
                  stroke="rgba(255, 215, 100, 0.15)" strokeWidth={0.8} />
              )
            })}
          </svg>
          {/* Star points */}
          {word.split('').map((_, i) => {
            const lx = (i - word.length / 2 + 0.5) * fontSize * 0.58
            const t = Math.sin(holdProgress * Math.PI * 5 + i * 1.3) * 0.2
            return (
              <div key={`hstar${i}`} style={{
                position: 'absolute',
                top: `calc(50% - ${fontSize * 0.15}px)`,
                left: `calc(50% + ${lx}px)`,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: `rgba(255, 215, 100, ${0.6 + t})`,
                boxShadow: `0 0 6px rgba(255, 215, 100, ${0.3 + t})`,
                transform: 'translate(-50%, -50%)',
              }} />
            )
          })}
          {/* Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 300,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: `0 0 ${glow}px rgba(255, 215, 100, 0.25)`,
            opacity: 1 + twinkle,
          }}>
            {word}
          </div>
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 8,
            fontStyle: 'italic',
            color: 'rgba(180, 200, 255, 0.2)',
          }}>
            mag 2.1 &bull; RA 14h 15m &bull; Dec +19&deg;
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      // Stars fade out, constellation lines break
      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {/* Star points fading */}
          {word.split('').map((_, i) => {
            const lx = (i - word.length / 2 + 0.5) * fontSize * 0.58
            const drift = ease * 15 * (seededRand(i * 7) - 0.5)
            return (
              <div key={`estar${i}`} style={{
                position: 'absolute',
                top: `calc(50% - ${fontSize * 0.15}px)`,
                left: `calc(50% + ${lx + drift}px)`,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: `rgba(255, 215, 100, ${(1 - ease) * 0.6})`,
                boxShadow: `0 0 ${(1 - ease) * 6}px rgba(255, 215, 100, 0.3)`,
                transform: `translate(-50%, -50%) scale(${1 - ease * 0.5})`,
              }} />
            )
          })}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + ease * 0.1})`,
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 300,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: `blur(${ease * 3}px)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function StarNavigateComponent(props: MotionGraphicProps<StarNavigateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-star-navigate',
  title: 'Celestial Navigation',
  description: 'Text as star positions connected by constellation lines with astrolabe overlay, twinkling star field, celestial coordinates, deep navy sky and golden stars',
  tags: ['kinetic', 'typography', 'celestial', 'navigation', 'stars', 'constellation', 'astrolabe', 'night'],
  category: 'captions',
  component: StarNavigateComponent as any,
  defaultConfig: {
    words: ['POLARIS', 'VEGA', 'SIRIUS', 'ORION'],
    colors: ['#E8D5A0', '#F0E0B0', '#E8D5A0', '#FFE8A0'],
    bgColor: '#060d20',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POLARIS', 'VEGA', 'SIRIUS', 'ORION'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D5A0', '#F0E0B0', '#E8D5A0', '#FFE8A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060d20', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
