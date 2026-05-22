import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TopographicConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const contourCount = 18

    // Generate multiple contour ring groups with organic distortion
    const contourGroups: string[][] = []
    const centers = [
      { x: cx * 0.6, y: cy * 0.7 },
      { x: cx * 1.4, y: cy * 0.5 },
      { x: cx, y: cy * 1.3 },
    ]

    for (const center of centers) {
      const rings: string[] = []
      for (let c = 1; c <= contourCount; c++) {
        const baseRadius = c * Math.min(width, height) * 0.025
        const points: string[] = []
        const segments = 32
        for (let s = 0; s <= segments; s++) {
          const angle = (s / segments) * Math.PI * 2
          const perturb = seededRand(c * 71 + s * 13 + Math.floor(center.x)) * 12 + Math.sin(angle * 4 + c * 0.7) * 6
          const animOffset = Math.sin(frame * 0.008 + c * 0.4 + angle * 1.5) * 1.5
          const r = baseRadius + perturb + animOffset
          const px = center.x + Math.cos(angle) * r * 1.2
          const py = center.y + Math.sin(angle) * r * 0.9
          points.push(`${px},${py}`)
        }
        rings.push(points.join(' '))
      }
      contourGroups.push(rings)
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {contourGroups.map((rings, gi) =>
            rings.map((pts, i) => (
              <polyline key={`g${gi}c${i}`} points={pts}
                fill="none"
                stroke={i % 5 === 0 ? 'rgba(90, 130, 60, 0.14)' : 'rgba(90, 130, 60, 0.06)'}
                strokeWidth={i % 5 === 0 ? 0.9 : 0.4} />
            ))
          )}
          {/* Elevation text labels on index contours */}
          {centers.map((c, ci) => (
            <g key={`label${ci}`}>
              {[5, 10, 15].map((idx) => {
                const r = idx * Math.min(width, height) * 0.025
                return (
                  <text key={`el${ci}-${idx}`}
                    x={c.x + r * 0.8} y={c.y - r * 0.3}
                    fill="rgba(90, 130, 60, 0.18)" fontSize={6}
                    fontFamily="'Courier New', monospace">
                    {200 + idx * 40}m
                  </text>
                )
              })}
              {/* Peak marker */}
              <text x={c.x} y={c.y + 3} textAnchor="middle"
                fill="rgba(90, 130, 60, 0.2)" fontSize={8} fontFamily="'Courier New', monospace">
                +
              </text>
            </g>
          ))}
          {/* Grid lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const x = (width / 7) * (i + 1)
            return (
              <line key={`gv${i}`} x1={x} y1={0} x2={x} y2={height}
                stroke="rgba(90, 130, 60, 0.04)" strokeWidth={0.3} />
            )
          })}
          {Array.from({ length: 4 }, (_, i) => {
            const y = (height / 5) * (i + 1)
            return (
              <line key={`gh${i}`} x1={0} y1={y} x2={width} y2={y}
                stroke="rgba(90, 130, 60, 0.04)" strokeWidth={0.3} />
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.6), 130)
    const layers = 7
    const layerSpacing = 3.5

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Stacked contour layers forming each letter */}
          {Array.from({ length: layers }, (_, l) => {
            const layerProgress = Math.max(0, Math.min(1, (ease * layers - l) * 1.5))
            const yOffset = (l - layers / 2) * layerSpacing * (1 + (1 - ease) * 2)
            const greenShift = 0.3 + (l / layers) * 0.7
            const layerColor = `rgba(${Math.round(70 + greenShift * 60)}, ${Math.round(100 + greenShift * 80)}, ${Math.round(40 + greenShift * 30)}, ${layerProgress * 0.6})`

            return (
              <div key={`l${l}`} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 800,
                color: 'transparent',
                WebkitTextStroke: `1.2px ${layerColor}`,
                textTransform: 'uppercase',
                letterSpacing: 4,
                whiteSpace: 'nowrap',
                opacity: layerProgress,
              }}>
                {word}
              </div>
            )
          })}
          {/* Solid filled top layer */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 800,
            color: ease > 0.7 ? color : 'transparent',
            WebkitTextStroke: `1.5px ${color}`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            opacity: ease,
          }}>
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const breathe = Math.sin(holdProgress * Math.PI * 3) * 1

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Subtle contour outlines behind */}
          {Array.from({ length: 3 }, (_, l) => {
            const yOffset = (l + 1) * (layerSpacing + breathe)
            return (
              <div key={`hl${l}`} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 800,
                color: 'transparent',
                WebkitTextStroke: `1px rgba(90, 130, 60, ${0.15 - l * 0.04})`,
                textTransform: 'uppercase',
                letterSpacing: 4,
                whiteSpace: 'nowrap',
              }}>
                {word}
              </div>
            )
          })}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Elevation label */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.5}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}40`,
            letterSpacing: 2,
          }}>
            ELEV 840m
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {/* Layers spread apart and dissolve */}
          {Array.from({ length: layers }, (_, l) => {
            const yOffset = (l - layers / 2) * layerSpacing * (1 + ease * 4)
            const layerOpacity = (1 - l / layers) * (1 - ease)

            return (
              <div key={`el${l}`} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 800,
                color: 'transparent',
                WebkitTextStroke: `1px ${color}`,
                textTransform: 'uppercase',
                letterSpacing: 4,
                whiteSpace: 'nowrap',
                opacity: layerOpacity * 0.4,
                filter: `blur(${ease * 3}px)`,
              }}>
                {word}
              </div>
            )
          })}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function TopographicComponent(props: MotionGraphicProps<TopographicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-topographic',
  title: 'Topographic Contour',
  description: 'Text formed from stacked contour elevation lines, each letter a terrain feature with brown/green earth tones, peak markers, and organic contour background',
  tags: ['kinetic', 'typography', 'topographic', 'contour', 'terrain', 'elevation', 'earth', 'cartography'],
  category: 'captions',
  component: TopographicComponent as any,
  defaultConfig: {
    words: ['SUMMIT', 'RIDGE', 'BASIN', 'PLATEAU'],
    colors: ['#6B8F3C', '#7EA844', '#6B8F3C', '#8BB84C'],
    bgColor: '#0c1208',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUMMIT', 'RIDGE', 'BASIN', 'PLATEAU'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6B8F3C', '#7EA844', '#6B8F3C', '#8BB84C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
