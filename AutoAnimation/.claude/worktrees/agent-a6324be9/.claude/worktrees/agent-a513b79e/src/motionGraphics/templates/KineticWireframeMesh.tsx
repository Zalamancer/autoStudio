import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WireframeMeshConfig extends KineticBaseConfig {
  meshDensity: number
  edgeGlow: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* 3D perspective grid floor */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={`${(i / 11) * 100}%`}
            y1="60%"
            x2="50%"
            y2="100%"
            stroke="#4ECDC4"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={`v${i}`}
            x1="0%"
            y1={`${60 + (i / 7) * 40}%`}
            x2="100%"
            y2={`${60 + (i / 7) * 40}%`}
            stroke="#4ECDC4"
            strokeWidth="0.5"
          />
        ))}
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const meshCols = 10
    const meshRows = 6
    const seed = index * 53

    let buildP = 0
    let dissolveP = 0

    if (phase === 'enter') {
      buildP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      buildP = 1
    } else {
      buildP = 1
      dissolveP = easeInCubic(exitProgress)
    }

    // Build mesh lines progressively
    const hLines = []
    const vLines = []
    const totalH = meshRows + 1
    const totalV = meshCols + 1

    for (let r = 0; r <= meshRows; r++) {
      const rowDelay = (r / meshRows) * 0.5
      const rowP = Math.max(0, Math.min(1, (buildP - rowDelay) / (1 - rowDelay + 0.01)))
      const y = (r / meshRows) * height

      // Horizontal sweep from left
      hLines.push(
        <line
          key={`h${r}`}
          x1={0}
          y1={y}
          x2={rowP * width}
          y2={y}
          stroke={color}
          strokeWidth={r === meshRows / 2 ? 1.5 : 0.7}
          strokeOpacity={(0.15 + rowP * 0.35) * (1 - dissolveP)}
        />,
      )
    }

    for (let c = 0; c <= meshCols; c++) {
      const colDelay = (c / meshCols) * 0.5 + 0.2
      const colP = Math.max(0, Math.min(1, (buildP - colDelay) / (1 - colDelay + 0.01)))
      const x = (c / meshCols) * width

      // Vertical sweep from top, but slightly staggered
      vLines.push(
        <line
          key={`v${c}`}
          x1={x}
          y1={0}
          x2={x}
          y2={colP * height}
          stroke={color}
          strokeWidth={c === meshCols / 2 ? 1.5 : 0.7}
          strokeOpacity={(0.12 + colP * 0.3) * (1 - dissolveP)}
        />,
      )
    }

    // Diagonal accent lines — triangulate the mesh
    const diagLines = []
    for (let r = 0; r < meshRows; r++) {
      for (let c = 0; c < meshCols; c++) {
        const diagDelay = ((r + c) / (meshRows + meshCols)) * 0.6 + 0.3
        const diagP = Math.max(0, Math.min(1, (buildP - diagDelay) / 0.3))
        if (diagP <= 0) continue
        const x1 = (c / meshCols) * width
        const y1 = (r / meshRows) * height
        const x2 = ((c + 1) / meshCols) * width
        const y2 = ((r + 1) / meshRows) * height

        diagLines.push(
          <line
            key={`d${r}-${c}`}
            x1={x1}
            y1={y1}
            x2={x1 + (x2 - x1) * diagP}
            y2={y1 + (y2 - y1) * diagP}
            stroke={color}
            strokeWidth={0.4}
            strokeOpacity={0.1 * diagP * (1 - dissolveP)}
          />,
        )
      }
    }

    // Vertex dots at intersections
    const dots = []
    for (let r = 0; r <= meshRows; r += 2) {
      for (let c = 0; c <= meshCols; c += 2) {
        const dotDelay = ((r + c) / (meshRows + meshCols)) * 0.4
        const dotP = Math.max(0, Math.min(1, (buildP - dotDelay) / 0.2))
        if (dotP <= 0) continue
        dots.push(
          <circle
            key={`dot${r}-${c}`}
            cx={(c / meshCols) * width}
            cy={(r / meshRows) * height}
            r={2.5 * dotP}
            fill={color}
            opacity={0.5 * dotP * (1 - dissolveP)}
          />,
        )
      }
    }

    // Text materializes from the mesh
    const textOpacity = phase === 'enter' ? Math.max(0, (buildP - 0.5) / 0.5) : phase === 'hold' ? 1 : 1 - dissolveP
    const textBlur = phase === 'enter' ? Math.max(0, (1 - buildP) * 8) : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {hLines}
          {vLines}
          {diagLines}
          {dots}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
            filter: `blur(${textBlur}px)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function WireframeMeshComponent(props: MotionGraphicProps<WireframeMeshConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wireframe-mesh',
  title: 'Kinetic Wireframe Mesh',
  description:
    'A 3D wireframe mesh builds out line-by-line — horizontal then vertical sweeps triangulating the grid — before the text materializes from within the mesh structure.',
  tags: ['kinetic', 'typography', 'wireframe', 'mesh', '3d', 'grid', 'construction', 'lines', 'build', 'technical'],
  category: 'captions',
  component: WireframeMeshComponent as any,
  defaultConfig: {
    words: ['MODEL', 'BUILD', 'MESH', 'FORM'],
    colors: ['#4ECDC4', '#00FF88', '#3DE0D0', '#7AFFDB'],
    bgColor: '#050D14',
    cycleDuration: 2.0,
    meshDensity: 10,
    edgeGlow: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MODEL', 'BUILD', 'MESH', 'FORM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4ECDC4', '#00FF88', '#3DE0D0', '#7AFFDB'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050D14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'meshDensity',
      label: 'Mesh Density',
      type: 'number',
      defaultValue: 10,
      min: 4,
      max: 20,
      group: 'Animation',
    },
    { key: 'edgeGlow', label: 'Edge Glow', type: 'number', defaultValue: 1, min: 0, max: 3, group: 'Animation' },
  ],
})
