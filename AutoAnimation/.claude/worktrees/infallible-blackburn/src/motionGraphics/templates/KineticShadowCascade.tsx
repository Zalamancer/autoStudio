import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShadowCascadeConfig extends KineticBaseConfig {}

// Shadow cascade: multiple colored drop shadows at different angles
// that collapse onto the text on enter, fan out on exit

const SHADOW_COLORS = [
  { r: 255, g: 50,  b: 120 }, // hot pink
  { r: 255, g: 160, b: 0   }, // amber
  { r: 0,   g: 200, b: 255 }, // cyan
  { r: 120, g: 0,   b: 255 }, // violet
]

// Fixed angles (in degrees) for each shadow layer — fanned around the text
const ANGLES = [220, 300, 50, 140]

function shadowOffset(angle: number, dist: number) {
  const rad = (angle * Math.PI) / 180
  return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const driftX = 50 + Math.sin(time * 0.28) * 7
    const driftY = 50 + Math.cos(time * 0.22) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle warm ambient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${driftX}% ${driftY}%, rgba(255,100,50,0.025), transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Edge shadow cascade residue */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(120,0,255,0.03), inset 0 0 120px rgba(255,50,0,0.02)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 61 + 37

    // Compute per-shadow distance multiplier
    let shadowDist = 0
    let mainOpacity = 0

    if (phase === 'enter') {
      // Shadows start far out and snap toward text
      shadowDist = (1 - enterProgress) * 40
      mainOpacity = enterProgress
    } else if (phase === 'hold') {
      // Shadows breathe slightly — small oscillation on hold
      const breathe = Math.sin(f * 0.08 + seed) * 0.5 + Math.sin(f * 0.19 + seed * 0.7) * 0.3
      shadowDist = 3 + breathe * 2.5
      mainOpacity = 1
    } else {
      // Shadows fan out on exit — each in its fixed angle direction
      shadowDist = exitProgress * 45
      mainOpacity = 1 - exitProgress
    }

    const fontStyle = {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(40px, 10vw, 140px)',
      fontWeight: 800 as const,
      whiteSpace: 'nowrap' as const,
      letterSpacing: 3,
      textTransform: 'uppercase' as const,
    }

    return (
      <>
        {/* Four colored shadow layers fanned at different angles */}
        {SHADOW_COLORS.map((c, i) => {
          const { x, y } = shadowOffset(ANGLES[i], shadowDist)
          // Each shadow fades as it gets further from text
          const shadowOpacity = mainOpacity * Math.max(0.15, 0.7 - shadowDist / 55)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                ...fontStyle,
                color: `rgba(${c.r},${c.g},${c.b},0.8)`,
                opacity: shadowOpacity,
                mixBlendMode: 'screen',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Main text — sits cleanly on top of collapsed shadows */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...fontStyle,
            color,
            opacity: mainOpacity,
            textShadow: '0 0 3px rgba(255,255,255,0.15)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ShadowCascadeComponent(props: MotionGraphicProps<ShadowCascadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shadow-cascade',
  title: 'Kinetic Shadow Cascade',
  description: 'Shadow cascade effect: four colored shadows fan out at different angles on enter/exit, collapse to a clean stack on hold with subtle breathing',
  tags: ['kinetic', 'typography', 'shadow', 'cascade', 'colorful', 'fan', 'highlight'],
  category: 'captions',
  component: ShadowCascadeComponent as any,
  defaultConfig: {
    words: ['DROP', 'CAST', 'SHADE', 'BOLD'],
    colors: ['#ffffff', '#fff0e0', '#e8f8ff', '#ffffff'],
    bgColor: '#080808',
    cycleDuration: 0.9,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROP', 'CAST', 'SHADE', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#fff0e0', '#e8f8ff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 5, group: 'Timing' },
  ],
})
