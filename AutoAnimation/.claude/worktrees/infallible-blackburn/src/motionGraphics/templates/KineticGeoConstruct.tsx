import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GeoConstructConfig extends KineticBaseConfig {
  complexity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Compass arc decorations */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}
        viewBox={`0 0 ${width} ${height}`}
      >
        <circle cx={width * 0.5} cy={height * 0.5} r={Math.min(width, height) * 0.45} fill="none" stroke="currentColor" strokeWidth={1} />
        <circle cx={width * 0.5} cy={height * 0.5} r={Math.min(width, height) * 0.35} fill="none" stroke="currentColor" strokeWidth={0.5} strokeDasharray="4 6" />
        <line x1={width * 0.1} y1={height * 0.5} x2={width * 0.9} y2={height * 0.5} stroke="currentColor" strokeWidth={0.5} />
        <line x1={width * 0.5} y1={height * 0.05} x2={width * 0.5} y2={height * 0.95} stroke="currentColor" strokeWidth={0.5} />
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const eP = easeOutExpo(enterProgress)
    const xP = easeInOutCubic(exitProgress)

    // Geometric construction: cross-hairs → bounding box → letter fills in
    const boxW = Math.min(width * 0.85, 600)
    const boxH = Math.min(height * 0.55, 180)

    let crosshairOpacity = 0
    let boxProgress = 0
    let textOpacity = 0
    let textClip = 0
    let shimmerOpacity = 0

    if (phase === 'enter') {
      // First 30%: crosshairs snap in
      crosshairOpacity = easeOutExpo(Math.min(1, enterProgress * 3.3))
      // 20-80%: box draws
      boxProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
      // 60-100%: text fills
      textClip = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))
      textOpacity = Math.min(1, textClip * 1.5)
    } else if (phase === 'hold') {
      crosshairOpacity = 0.15 + Math.sin(holdProgress * Math.PI * 2) * 0.05
      boxProgress = 1
      textOpacity = 1
      textClip = 1
      shimmerOpacity = Math.sin(holdProgress * Math.PI * 4) * 0.08
    } else {
      crosshairOpacity = 1 - xP
      boxProgress = 1 - xP
      textOpacity = 1 - xP * xP
      textClip = 1
    }

    const cx = '50%'
    const cy = '50%'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: boxW,
          height: boxH,
        }}
      >
        {/* SVG geometric construction layer */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          viewBox={`0 0 ${boxW} ${boxH}`}
        >
          {/* Crosshairs — snap in first */}
          <g opacity={crosshairOpacity} stroke={color} strokeWidth={1.5} strokeDasharray="5 4">
            <line x1={boxW * 0.5} y1={-20} x2={boxW * 0.5} y2={boxH + 20} />
            <line x1={-20} y1={boxH * 0.5} x2={boxW + 20} y2={boxH * 0.5} />
          </g>

          {/* Corner marks — draw as box progress increases */}
          <g stroke={color} strokeWidth={2} fill="none" opacity={boxProgress}>
            {/* Top-left */}
            <polyline
              points={`${20},${boxH * 0.15 * (1 - boxProgress) + 8} ${8},${8} ${boxW * 0.15 * boxProgress + 8},${8}`}
              strokeDasharray={`${boxProgress * 100} 200`}
            />
            {/* Top-right */}
            <polyline
              points={`${boxW - 20},${8} ${boxW - 8},${8} ${boxW - 8},${boxH * 0.15 * boxProgress + 8}`}
              strokeDasharray={`${boxProgress * 100} 200`}
            />
            {/* Bottom-left */}
            <polyline
              points={`${8},${boxH - boxH * 0.15 * boxProgress - 8} ${8},${boxH - 8} ${20},${boxH - 8}`}
              strokeDasharray={`${boxProgress * 100} 200`}
            />
            {/* Bottom-right */}
            <polyline
              points={`${boxW - 8},${boxH - boxH * 0.15 * boxProgress - 8} ${boxW - 8},${boxH - 8} ${boxW - 20},${boxH - 8}`}
              strokeDasharray={`${boxProgress * 100} 200`}
            />
          </g>

          {/* Registration crosshairs at corners */}
          {[
            [8, 8], [boxW - 8, 8], [8, boxH - 8], [boxW - 8, boxH - 8],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={boxProgress * 0.6}
            />
          ))}
        </svg>

        {/* The text fills in through clip */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 148px)',
              fontWeight: 900,
              color,
              opacity: textOpacity,
              display: 'block',
              clipPath: `inset(0 ${Math.round((1 - textClip) * 100)}% 0 0)`,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              textShadow: `0 0 40px ${color}${Math.round(shimmerOpacity * 255).toString(16).padStart(2, '0')}`,
              letterSpacing: 3,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function GeoConstructComponent(props: MotionGraphicProps<GeoConstructConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-geo-construct',
  title: 'Kinetic Geo Construct',
  description: 'Geometric construction: crosshairs snap in first, corner bracket marks draw the bounding box, then the text fills in — like a CAD drawing coming alive.',
  tags: ['kinetic', 'typography', 'geometric', 'construction', 'crosshair', 'bracket', 'cad', 'build', 'assembly'],
  category: 'captions',
  component: GeoConstructComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'BUILD', 'RENDER', 'LAUNCH'],
    colors: ['#00FF88', '#FF3366', '#FFDD00', '#00AAFF'],
    bgColor: '#0D1117',
    cycleDuration: 1.6,
    complexity: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESIGN', 'BUILD', 'RENDER', 'LAUNCH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#FF3366', '#FFDD00', '#00AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'complexity', label: 'Complexity', type: 'number', defaultValue: 5, min: 1, max: 10, group: 'Animation' },
  ],
})
