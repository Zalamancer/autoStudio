import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MolecularBondConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Floating background molecules (ball-and-stick)
    const molecules: React.ReactNode[] = []
    const moleculeCount = 8

    for (let m = 0; m < moleculeCount; m++) {
      const seed = m * 31 + 7
      const baseX = seededRand(seed) * width
      const baseY = seededRand(seed + 1) * height
      const driftX = Math.sin(frame * 0.015 + m * 1.2) * 20
      const driftY = Math.cos(frame * 0.012 + m * 0.9) * 15
      const mx = baseX + driftX
      const my = baseY + driftY
      const rotation = frame * 0.3 + m * 45
      const atomCount = 2 + Math.floor(seededRand(seed + 5) * 3)
      const atomColor = `rgba(100, 180, 255, ${0.08 + seededRand(seed + 10) * 0.06})`
      const bondColor = `rgba(100, 180, 255, ${0.04 + seededRand(seed + 12) * 0.03})`

      const atoms: { x: number; y: number }[] = []
      for (let a = 0; a < atomCount; a++) {
        const angle = (a / atomCount) * Math.PI * 2 + (rotation * Math.PI) / 180
        const dist = 15 + seededRand(seed + a * 3) * 15
        atoms.push({
          x: mx + Math.cos(angle) * dist,
          y: my + Math.sin(angle) * dist,
        })
      }

      // Bonds between adjacent atoms
      for (let a = 0; a < atoms.length - 1; a++) {
        molecules.push(
          <line
            key={`bond${m}-${a}`}
            x1={atoms[a].x} y1={atoms[a].y}
            x2={atoms[a + 1].x} y2={atoms[a + 1].y}
            stroke={bondColor}
            strokeWidth={1.5}
          />
        )
      }
      // Atom spheres
      for (let a = 0; a < atoms.length; a++) {
        const r = 4 + seededRand(seed + a * 7) * 4
        molecules.push(
          <circle
            key={`atom${m}-${a}`}
            cx={atoms[a].x} cy={atoms[a].y}
            r={r}
            fill={atomColor}
          />
        )
      }
    }

    // Orbital cloud hints
    const orbitals: React.ReactNode[] = []
    for (let i = 0; i < 4; i++) {
      const ox = width * (0.2 + seededRand(i * 17) * 0.6)
      const oy = height * (0.2 + seededRand(i * 23) * 0.6)
      const or = 30 + seededRand(i * 11) * 40
      const pulseR = or + Math.sin(frame * 0.03 + i) * 5
      orbitals.push(
        <ellipse
          key={`orb${i}`}
          cx={ox} cy={oy}
          rx={pulseR} ry={pulseR * 0.6}
          fill="none"
          stroke={`rgba(80, 160, 255, 0.04)`}
          strokeWidth={1}
          transform={`rotate(${frame * 0.2 + i * 40} ${ox} ${oy})`}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {orbitals}
          {molecules}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const letters = word.split('')
    const spacing = Math.min(80, width / (letters.length + 2))
    const totalWidth = (letters.length - 1) * spacing
    const startX = (width - totalWidth) / 2
    const centerY = height / 2

    // 3D rotation factor
    const rotY = Math.sin(f * 0.02) * 8

    // Calculate letter positions with slight orbital wobble
    const positions = letters.map((_, i) => {
      const x = startX + i * spacing
      const wobbleY = Math.sin(f * 0.04 + i * 0.8) * 5
      return { x, y: centerY + wobbleY }
    })

    const renderMolecule = (opacity: number, bondOpacity: number) => (
      <div style={{ position: 'absolute', inset: 0, perspective: 800 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateY(${rotY}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            width={width}
            height={height}
            style={{ position: 'absolute', inset: 0, opacity: bondOpacity }}
          >
            {/* Bonds between letters */}
            {positions.map((pos, i) => {
              if (i === 0) return null
              const prev = positions[i - 1]
              // Double bond effect on even indices
              const isDouble = i % 2 === 0
              return (
                <g key={`bond${i}`}>
                  <line
                    x1={prev.x} y1={prev.y}
                    x2={pos.x} y2={pos.y}
                    stroke={`${color}60`}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  {isDouble && (
                    <line
                      x1={prev.x} y1={prev.y - 6}
                      x2={pos.x} y2={pos.y - 6}
                      stroke={`${color}30`}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  )}
                </g>
              )
            })}
            {/* Atom circles behind text */}
            {positions.map((pos, i) => {
              const r = 22 + (i % 3) * 4
              return (
                <circle
                  key={`atom${i}`}
                  cx={pos.x} cy={pos.y}
                  r={r}
                  fill={`${color}10`}
                  stroke={`${color}25`}
                  strokeWidth={1}
                />
              )
            })}
          </svg>

          {/* Letter labels */}
          {positions.map((pos, i) => (
            <div
              key={`ltr${i}`}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(32px, 9vw, 120px)',
                fontWeight: 800,
                color,
                textShadow: `0 0 10px ${color}50, 0 0 25px ${color}20`,
                opacity,
              }}
            >
              {letters[i]}
            </div>
          ))}
        </div>
      </div>
    )

    if (phase === 'enter') {
      return renderMolecule(enterProgress, enterProgress * 0.8)
    } else if (phase === 'hold') {
      const pulse = 0.9 + Math.sin(holdProgress * Math.PI * 4) * 0.1
      return renderMolecule(1, pulse)
    } else {
      return renderMolecule(1 - exitProgress, (1 - exitProgress) * 0.8)
    }
  },
}

function MolecularBondComponent(props: MotionGraphicProps<MolecularBondConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-molecular-bond',
  title: 'Kinetic Molecular Bond',
  description: 'Molecular ball-and-stick model with letters as atoms connected by chemical bonds, orbital clouds, and 3D rotation',
  tags: ['kinetic', 'typography', 'molecular', 'bond', 'chemistry', 'atom', 'science', 'orbital'],
  category: 'captions',
  component: MolecularBondComponent as any,
  defaultConfig: {
    words: ['BOND', 'CHAIN', 'REACT', 'FUSE'],
    colors: ['#55CCFF', '#66EEFF', '#44BBFF', '#88DDFF'],
    bgColor: '#060c18',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOND', 'CHAIN', 'REACT', 'FUSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#55CCFF', '#66EEFF', '#44BBFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060c18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
