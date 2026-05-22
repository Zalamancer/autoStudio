import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FieldCurvatureConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Field curvature: flat image plane doesn't match the curved focal plane
// Center is sharp, edges are progressively out-of-focus (Petzval field curvature)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Curved field indicator — vignette that pulses
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${0.4 + Math.sin(time * 0.8) * 0.1}) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Field curvature strength
    const curvatureStrength =
      phase === 'enter' ? 1 - eased : phase === 'hold' ? 0.05 + Math.sin(time * 1.3) * 0.03 : exitProgress

    // Letter-by-letter blur — center letters sharp, edge letters blurred
    const chars = word.split('')
    const totalChars = chars.length
    const overallOpacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? 1 - exitProgress : 1

    // Hold: subtle scanning — focus plane moves across, blurring edges
    const focusCenter = phase === 'hold' ? 0.5 + Math.sin(time * 0.9) * 0.08 : 0.5

    const rendered = chars.map((ch, ci) => {
      // Distance from center (0=center, 1=edge)
      const distFromCenter = Math.abs((ci + 0.5) / totalChars - focusCenter) * 2
      const edgeBlur = distFromCenter * curvatureStrength * 6
      const edgeOpacity = 1 - distFromCenter * curvatureStrength * 0.4

      // Slight vertical bow — curved field bends extremities up/down
      const vertBow = Math.pow(distFromCenter, 2) * curvatureStrength * 20 * (ci < totalChars / 2 ? -1 : 1)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            filter: edgeBlur > 0.2 ? `blur(${edgeBlur}px)` : undefined,
            opacity: edgeOpacity,
            transform: `translateY(${vertBow}px)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Exit: field curvature reverses — center blurs last, edges first (like tilting lens plane)
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          display: 'flex',
          opacity: overallOpacity,
        }}
      >
        {rendered}
      </div>
    )
  },
}

function FieldCurvatureComponent(props: MotionGraphicProps<FieldCurvatureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-field-curvature',
  title: 'Kinetic Field Curvature',
  description:
    'Petzval field curvature — edge characters are progressively blurred while the center stays sharp, and the field curves the letterline into a bow',
  tags: ['kinetic', 'typography', 'field-curvature', 'aberration', 'petzval', 'optical', 'blur', 'lens'],
  category: 'captions',
  component: FieldCurvatureComponent as any,
  defaultConfig: {
    words: ['PETZVAL', 'FIELD', 'CURVED', 'FOCAL'],
    colors: ['#FFE8A0', '#FFD060', '#FFF0C0', '#FFCC50'],
    bgColor: '#0A0800',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PETZVAL', 'FIELD', 'CURVED', 'FOCAL'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE8A0', '#FFD060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0800', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
