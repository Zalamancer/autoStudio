import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuiltPatchConfig extends KineticBaseConfig {
  patchStyle: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// Fabric patch colors and patterns
const PATCH_FABRICS = [
  { bg: '#E8D5B7', pattern: 'none' },                    // Plain muslin
  { bg: '#CC4444', pattern: 'gingham' },                  // Red gingham
  { bg: '#4488AA', pattern: 'stripe' },                   // Blue stripe
  { bg: '#88AA44', pattern: 'polkadot' },                 // Green polkadot
  { bg: '#CC8844', pattern: 'plaid' },                    // Orange plaid
  { bg: '#AA44AA', pattern: 'floral' },                   // Purple floral
  { bg: '#DDCC88', pattern: 'herringbone' },              // Yellow herringbone
  { bg: '#DD7788', pattern: 'stripe' },                   // Pink stripe
]

function getPatchPattern(pattern: string, color: string): string {
  switch (pattern) {
    case 'gingham':
      return `repeating-linear-gradient(0deg, ${color}22 0px, ${color}22 6px, transparent 6px, transparent 12px),
        repeating-linear-gradient(90deg, ${color}22 0px, ${color}22 6px, transparent 6px, transparent 12px)`
    case 'stripe':
      return `repeating-linear-gradient(45deg, ${color}18 0px, ${color}18 3px, transparent 3px, transparent 8px)`
    case 'polkadot':
      return `radial-gradient(circle 2px at 6px 6px, ${color}30 2px, transparent 2px)`
    case 'plaid':
      return `repeating-linear-gradient(0deg, ${color}15 0px, ${color}15 2px, transparent 2px, transparent 10px),
        repeating-linear-gradient(90deg, ${color}15 0px, ${color}15 2px, transparent 2px, transparent 10px)`
    case 'herringbone':
      return `repeating-linear-gradient(135deg, ${color}12 0px, ${color}12 2px, transparent 2px, transparent 6px),
        repeating-linear-gradient(45deg, ${color}12 0px, ${color}12 2px, transparent 2px, transparent 6px)`
    case 'floral':
      return `radial-gradient(circle 3px at 8px 8px, ${color}25 1.5px, transparent 1.5px),
        radial-gradient(circle 2px at 4px 12px, ${color}15 1px, transparent 1px)`
    default:
      return 'none'
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Quilted background with subtle patchwork grid
    const patchSize = Math.max(40, Math.floor(Math.min(width, height) / 8))
    const cols = Math.ceil(width / patchSize) + 1
    const rows = Math.ceil(height / patchSize) + 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Background quilt patches */}
        {Array.from({ length: Math.min(rows * cols, 80) }, (_, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const fabric = PATCH_FABRICS[Math.floor(rand(i * 7 + 3) * PATCH_FABRICS.length)]
          const pattern = getPatchPattern(fabric.pattern, '#000000')
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: col * patchSize,
                top: row * patchSize,
                width: patchSize,
                height: patchSize,
                background: fabric.bg,
                opacity: 0.12,
                backgroundImage: pattern !== 'none' ? pattern : undefined,
                backgroundSize: pattern !== 'none' ? '12px 12px' : undefined,
              }}
            />
          )
        })}
        {/* Seam lines — quilting stitches */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent ${patchSize - 1}px, rgba(139,119,101,0.15) ${patchSize - 1}px, rgba(139,119,101,0.15) ${patchSize}px),
              repeating-linear-gradient(0deg, transparent ${patchSize - 1}px, rgba(139,119,101,0.15) ${patchSize - 1}px, rgba(139,119,101,0.15) ${patchSize}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Quilt batting puffiness — subtle shadows between patches */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent ${patchSize - 4}px, rgba(0,0,0,0.03) ${patchSize - 2}px, transparent ${patchSize}px),
              repeating-linear-gradient(0deg, transparent 0px, transparent ${patchSize - 4}px, rgba(0,0,0,0.03) ${patchSize - 2}px, transparent ${patchSize}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Cozy warm vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,200,150,0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 8,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.55
          let patchScale = 0
          let opacity = 1
          let sewProgress = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            patchScale = easeOutBounce(Math.min(1, p * 1.2))
            opacity = p > 0 ? Math.min(1, p * 3) : 0
            // Stitching appears after patch lands
            sewProgress = p > 0.5 ? (p - 0.5) / 0.5 : 0
          } else if (phase === 'hold') {
            patchScale = 1
            opacity = 1
            sewProgress = 1
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            patchScale = 1 - p * 0.3
            opacity = 1 - p
            sewProgress = 1 - p
          }

          // Each character gets a unique fabric patch
          const fabricIdx = (ci + index * 3) % PATCH_FABRICS.length
          const fabric = PATCH_FABRICS[fabricIdx]
          const patternBg = getPatchPattern(fabric.pattern, '#000000')

          // Blanket stitch border — dashes around the patch
          const stitchDash = sewProgress > 0 ? `${4 * sewProgress}px ${3}px` : '0 100px'

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `scale(${patchScale})`,
              }}
            >
              {/* Fabric patch background */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-12% -8%',
                  background: fabric.bg,
                  borderRadius: 4,
                  opacity: opacity * 0.85,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.2)',
                  backgroundImage: patternBg !== 'none' ? patternBg : undefined,
                  backgroundSize: patternBg !== 'none' ? '12px 12px' : undefined,
                }}
              />
              {/* Blanket stitch border */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-12% -8%',
                  border: `2px dashed rgba(100,70,40,${sewProgress * 0.5})`,
                  borderRadius: 4,
                  pointerEvents: 'none',
                }}
              />
              {/* Cross-stitch at corners */}
              {sewProgress > 0.3 &&
                [
                  { left: '-10%', top: '-10%' },
                  { right: '-6%', top: '-10%' },
                  { left: '-10%', bottom: '-10%' },
                  { right: '-6%', bottom: '-10%' },
                ].map((pos, si) => (
                  <div
                    key={si}
                    style={{
                      position: 'absolute',
                      ...pos,
                      width: 8,
                      height: 8,
                      opacity: sewProgress * opacity * 0.6,
                      pointerEvents: 'none',
                    }}
                  >
                    {/* X stitch */}
                    <div style={{ position: 'absolute', left: 0, top: '50%', width: '141%', height: 1.5, background: '#8B6914', transformOrigin: 'left center', transform: 'rotate(45deg) translateY(-50%)', borderRadius: 1 }} />
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: '141%', height: 1.5, background: '#8B6914', transformOrigin: 'right center', transform: 'rotate(-45deg) translateY(-50%)', borderRadius: 1 }} />
                  </div>
                ))}
              {/* Main character on patch */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Palatino', serif",
                  fontSize: 'clamp(38px, 9vw, 120px)',
                  fontWeight: 700,
                  color,
                  opacity,
                  display: 'inline-block',
                  letterSpacing: 2,
                  lineHeight: 1,
                  textShadow: `1px 1px 0 rgba(0,0,0,0.1), -1px -1px 0 rgba(255,255,255,0.15)`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {ch}
              </span>
              {/* Running stitch through the letter */}
              {sewProgress > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    right: '10%',
                    top: '55%',
                    height: 1.5,
                    backgroundImage: `repeating-linear-gradient(90deg, #8B6914 0px, #8B6914 4px, transparent 4px, transparent 7px)`,
                    opacity: sewProgress * opacity * 0.4,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function QuiltPatchComponent(props: MotionGraphicProps<QuiltPatchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quilt-patch',
  title: 'Kinetic Quilt Patch',
  description: 'Each letter on a different fabric patch with visible seam stitching, blanket-stitch borders, and cozy patchwork textile feel',
  tags: ['kinetic', 'typography', 'quilt', 'patchwork', 'fabric', 'textile', 'sewing', 'craft', 'cozy', 'stitch'],
  category: 'captions',
  component: QuiltPatchComponent as any,
  defaultConfig: {
    words: ['COZY', 'SEWN', 'WARM', 'QUILT'],
    colors: ['#4A2E16', '#3E2723', '#4E342E', '#5D4037'],
    bgColor: '#F0E6D4',
    cycleDuration: 1.3,
    patchStyle: 'mixed',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COZY', 'SEWN', 'WARM', 'QUILT'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#4A2E16', '#3E2723', '#4E342E', '#5D4037'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0E6D4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'patchStyle', label: 'Patch Style', type: 'text', defaultValue: 'mixed', group: 'Style' },
  ],
})
