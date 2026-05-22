import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrystalGrowConfig extends KineticBaseConfig {
  facetCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate crystalline facet positions around text
function getFacet(index: number, total: number, size: number) {
  const angle = (index / total) * Math.PI * 2
  const radius = size * (0.6 + (index % 3) * 0.15)
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.6,
    size: size * (0.04 + (index % 4) * 0.02),
    angle: angle * (180 / Math.PI),
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Crystal lattice pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const x = (i % 4) * (width / 3) + (width / 6)
          const y = Math.floor(i / 4) * (height / 1.5) + height * 0.25
          const size = 20 + i * 8
          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <polygon
                points={`0,${-size} ${size * 0.866},${size * 0.5} ${-size * 0.866},${size * 0.5}`}
                fill="none"
                stroke="white"
                strokeWidth={0.5}
              />
              <polygon
                points={`0,${size} ${size * 0.866},${-size * 0.5} ${-size * 0.866},${-size * 0.5}`}
                fill="none"
                stroke="white"
                strokeWidth={0.5}
              />
            </g>
          )
        })}
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const facetTotal = 12

    const globalP = easeOutExpo(enterProgress)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / totalChars) * 0.4
          let growProgress = 0
          let opacity = 0
          let scale = 1
          let facetOpacity = 0
          let shimmer = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            growProgress = easeOutExpo(p)
            // Crystal grows from a point — scale from 0 with no fade
            scale = growProgress
            opacity = Math.min(1, p * 3)
            facetOpacity = Math.max(0, growProgress - 0.5) * 2
            shimmer = Math.max(0, growProgress - 0.7) * 3
          } else if (phase === 'hold') {
            growProgress = 1
            scale = 1
            opacity = 1
            facetOpacity = 0.6 + Math.sin(holdProgress * Math.PI * 2) * 0.2
            shimmer = Math.sin(holdProgress * Math.PI * 4 + ci) * 0.15 + 0.1
          } else {
            growProgress = 1 - easeInCubic(exitProgress)
            scale = growProgress
            opacity = 1 - exitProgress * exitProgress
            facetOpacity = growProgress * 0.5
          }

          // Crystal facet decorations per character
          const facets = Array.from({ length: facetTotal }, (_, fi) =>
            getFacet(fi, facetTotal, 40 + ci * 5)
          )

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `scale(${scale})`,
                transformOrigin: 'center bottom',
                opacity,
              }}
            >
              {/* Crystal facets radiating from each letter */}
              <svg
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 120,
                  height: 120,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
                viewBox="-60 -60 120 120"
              >
                {facets.map((f, fi) => {
                  const facetDelay = fi / facetTotal
                  const facetP = Math.max(0, Math.min(1, (growProgress - facetDelay * 0.5) / 0.5))
                  return (
                    <g key={fi} transform={`translate(${f.x * facetP}, ${f.y * facetP}) rotate(${f.angle})`}>
                      <polygon
                        points={`0,${-f.size} ${f.size * 0.6},${f.size * 0.5} ${-f.size * 0.6},${f.size * 0.5}`}
                        fill={color}
                        opacity={facetOpacity * (0.2 + (fi % 3) * 0.15) * facetP}
                        stroke={color}
                        strokeWidth={0.5}
                        strokeOpacity={facetOpacity * facetP}
                      />
                    </g>
                  )
                })}
              </svg>

              {/* The letter itself — crystal-shimmering */}
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  textShadow: `
                    0 0 ${8 + shimmer * 40}px ${color},
                    0 0 ${20 + shimmer * 60}px ${color}70,
                    ${shimmer * 3}px ${-shimmer * 2}px 0 rgba(255,255,255,${shimmer * 0.4}),
                    2px 2px 0 rgba(0,0,0,0.4)
                  `,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function CrystalGrowComponent(props: MotionGraphicProps<CrystalGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crystal-grow',
  title: 'Kinetic Crystal Grow',
  description: 'Letters crystallize from a point upward — triangular facets radiate outward as each character grows like a crystal formation, shimmering with refracted light.',
  tags: ['kinetic', 'typography', 'crystal', 'grow', 'facet', 'formation', 'organic', 'gem', 'shimmer', 'assembly'],
  category: 'captions',
  component: CrystalGrowComponent as any,
  defaultConfig: {
    words: ['FORM', 'GROW', 'SOLID', 'PURE'],
    colors: ['#C8B9F8', '#A0E9FF', '#B8F5D2', '#FFE4F0'],
    bgColor: '#0D0A1A',
    cycleDuration: 1.8,
    facetCount: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORM', 'GROW', 'SOLID', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B9F8', '#A0E9FF', '#B8F5D2', '#FFE4F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0A1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'facetCount', label: 'Facet Count', type: 'number', defaultValue: 12, min: 6, max: 24, group: 'Animation' },
  ],
})
