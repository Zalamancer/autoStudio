import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LensShutterConfig extends KineticBaseConfig {
  bladeCount: number
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

/**
 * Compute the clip-path polygon for a shutter leaf (leaf i of bladeCount).
 * The shutter opens by blades rotating away from center.
 * Each blade is a sector-like shape. The "closed" state has all blades meeting at center.
 * openAmount: 0 = fully closed (blades covering center), 1 = blades swept to outer ring
 */
function shutterBladePolygon(
  bladeIndex: number,
  bladeCount: number,
  openAmount: number,
  cx: number,
  cy: number,
): string {
  const anglePerBlade = (2 * Math.PI) / bladeCount
  const startAngle = bladeIndex * anglePerBlade - Math.PI / 2
  const midAngle = startAngle + anglePerBlade / 2
  const endAngle = startAngle + anglePerBlade

  // Blade tip radius at closed: near center; at open: pushed to outer ring
  const innerR = 0 // always from center hub
  const outerR = 85 // % of min(w,h)/2 — outer rim
  const tipR = innerR + (outerR - innerR) * openAmount

  // Each blade: a curved sector from center to outer rim
  // We approximate with a polygon: center point + arc points
  const points: [number, number][] = []
  points.push([cx, cy]) // hub

  const arcSteps = 6
  for (let s = 0; s <= arcSteps; s++) {
    const a = startAngle + (s / arcSteps) * anglePerBlade
    const r = tipR
    // Blade also rotates slightly as it opens
    const rotOffset = openAmount * anglePerBlade * 0.3
    const actualA = a + rotOffset
    const x = cx + Math.cos(actualA) * r
    const y = cy + Math.sin(actualA) * r
    points.push([x, y])
  }

  return `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__lensShutterConfig ?? { bladeCount: 5 }
    const bladeCount = Math.max(3, Math.min(8, config.bladeCount ?? 5))

    // Shutter snaps open instantly (very fast ease), holds, then snaps closed
    let openAmount = 0
    if (phase === 'enter') {
      // Fast snap — shutter fires quickly
      openAmount = easeOutQuint(Math.min(1, enterProgress * 3))
    } else if (phase === 'hold') {
      openAmount = 1
    } else {
      openAmount = 1 - easeInQuint(Math.min(1, exitProgress * 3))
    }

    // The "opening" is revealed by computing the complement:
    // We draw each blade as an overlay that starts covering the center and sweeps away
    const bladeOpacity = 1 - openAmount

    // Circle clip for the text — the lens barrel
    const barrelR = Math.min(width, height) * 0.46
    const textClipR = barrelR * openAmount
    const textClip = textClipR > 1
      ? `circle(${textClipR.toFixed(1)}px at 50% 50%)`
      : 'circle(0px at 50% 50%)'

    return (
      <>
        {/* Text exposed through open shutter */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            clipPath: textClip,
          }}
        >
          {word}
        </div>
        {/* Shutter blade overlays */}
        {bladeOpacity > 0.005 && Array.from({ length: bladeCount }, (_, i) => {
          const clipPath = shutterBladePolygon(i, bladeCount, openAmount, 50, 50)
          // Blade color: slightly metallic
          const hue = 200 + i * 5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `polygon(${
                  // The closed portion of the blade — we need inverse:
                  // blade covers center when closed, so we use: if open is 0 blade at center
                  // when open = 1 blade has swept to edge (nothing covering center)
                  // strategy: draw the blade that STAYS — the part that blocks center
                  // Closed area = complement of open area = central polygon
                  // Simplest: draw a sector from center at (1-openAmount) radius
                  (() => {
                    const anglePerBlade = (2 * Math.PI) / bladeCount
                    const startAngle = i * anglePerBlade - Math.PI / 2
                    const closedR = (1 - openAmount) * 50 // 50% = half viewport
                    const steps = 8
                    const pts: string[] = ['50% 50%']
                    for (let s = 0; s <= steps; s++) {
                      const a = startAngle + (s / steps) * anglePerBlade
                      // Also slight rotation as blade opens (sweeping motion)
                      const rotOffset = openAmount * anglePerBlade * 0.5
                      const actualA = a - rotOffset
                      const x = 50 + Math.cos(actualA) * closedR
                      const y = 50 + Math.sin(actualA) * closedR
                      pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
                    }
                    return pts.join(', ')
                  })()
                })`,
                background: `linear-gradient(${i * (360 / bladeCount)}deg, hsl(${hue},8%,22%) 0%, hsl(${hue},6%,16%) 100%)`,
                opacity: bladeOpacity * 0.95,
              }}
            />
          )
        })}
        {/* Lens barrel ring */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          <circle
            cx={width / 2}
            cy={height / 2}
            r={barrelR}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.15}
          />
          {/* Center hub */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={3}
            fill={color}
            opacity={0.2}
          />
        </svg>
      </>
    )
  },
}

function LensShutterComponent(props: MotionGraphicProps<LensShutterConfig>) {
  ;(globalThis as any).__lensShutterConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lens-shutter',
  title: 'Kinetic Lens Shutter',
  description: 'Multi-blade camera shutter snaps open from center, blades sweep to outer ring to expose text in the lens',
  tags: ['kinetic', 'typography', 'shutter', 'lens', 'camera', 'blades', 'snap', 'reveal', 'mechanical', 'aperture'],
  category: 'captions',
  component: LensShutterComponent as any,
  defaultConfig: {
    words: ['SNAP', 'CLICK', 'FLASH', 'SHOOT'],
    colors: ['#F8F4EE', '#EEE4D4', '#F8F4EE', '#DDD0B8'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
    bladeCount: 5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'CLICK', 'FLASH', 'SHOOT'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#F8F4EE', '#EEE4D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'bladeCount',
      label: 'Blade Count',
      type: 'number',
      defaultValue: 5,
      min: 3,
      max: 8,
      group: 'Animation',
    },
  ],
})
