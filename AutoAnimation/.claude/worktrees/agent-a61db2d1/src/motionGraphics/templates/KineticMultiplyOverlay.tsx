import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MultiplyOverlayConfig extends KineticBaseConfig {
  layerCount: number
  colorShift: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Risograph / screen-printing color pairs
const RISO_COLORS = [
  { hue: 355, name: 'Red' },
  { hue: 210, name: 'Blue' },
  { hue: 45, name: 'Yellow' },
  { hue: 120, name: 'Green' },
  { hue: 280, name: 'Purple' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Halftone dot grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const layerCount = 3
    const seed = index

    let compP = 0
    let stripP = 0

    if (phase === 'enter') {
      compP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      compP = 1
    } else {
      compP = 1
      stripP = easeInCubic(exitProgress)
    }

    const layers = []
    for (let l = 0; l < layerCount; l++) {
      const riso = RISO_COLORS[(seed + l) % RISO_COLORS.length]

      // Each layer enters from a different direction
      const directions = [
        { dx: -1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 1 },
      ]
      const dir = directions[l % directions.length]

      const layerDelay = (l / layerCount) * 0.4
      const layerP = Math.max(0, Math.min(1, (compP - layerDelay) / (1 - layerDelay + 0.01)))

      // Travel in from off-screen
      const maxOffset = 60 + l * 20
      const curX = dir.dx * maxOffset * (1 - layerP) + dir.dx * maxOffset * stripP
      const curY = dir.dy * maxOffset * (1 - layerP) + dir.dy * maxOffset * stripP

      const layerOpacity = Math.min(0.8, layerP * 0.8) * (1 - stripP * (l < layerCount - 1 ? 1 : 0))

      layers.push(
        <div
          key={l}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px))`,
            mixBlendMode: l === layerCount - 1 ? 'multiply' : l === 0 ? 'screen' : 'overlay',
            opacity: Math.max(0, layerOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color: `hsl(${riso.hue}, 85%, 55%)`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>,
      )
    }

    // Final combined layer (normal blend, full opacity)
    const finalP = Math.max(0, (compP - 0.7) / 0.3)
    layers.push(
      <div
        key="final"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: Math.max(0, finalP * (1 - stripP)),
          whiteSpace: 'nowrap',
          mixBlendMode: 'normal',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(52px, 13vw, 168px)',
            fontWeight: 900,
            color,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </span>
      </div>,
    )

    return <>{layers}</>
  },
}

function MultiplyOverlayComponent(props: MotionGraphicProps<MultiplyOverlayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-multiply-overlay',
  title: 'Kinetic Multiply Overlay',
  description:
    'Risograph-style color layers slide in from different directions — screen, overlay, and multiply blend modes creating rich color mixing where they intersect before merging into the final text.',
  tags: ['kinetic', 'typography', 'multiply', 'overlay', 'blend', 'risograph', 'layer', 'color', 'composite', 'build'],
  category: 'captions',
  component: MultiplyOverlayComponent as any,
  defaultConfig: {
    words: ['BLEND', 'MIX', 'LAYER', 'FUSE'],
    colors: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.8,
    layerCount: 3,
    colorShift: 120,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BLEND', 'MIX', 'LAYER', 'FUSE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'layerCount', label: 'Layer Count', type: 'number', defaultValue: 3, min: 2, max: 5, group: 'Animation' },
    {
      key: 'colorShift',
      label: 'Color Shift (deg)',
      type: 'number',
      defaultValue: 120,
      min: 0,
      max: 360,
      group: 'Animation',
    },
  ],
})
