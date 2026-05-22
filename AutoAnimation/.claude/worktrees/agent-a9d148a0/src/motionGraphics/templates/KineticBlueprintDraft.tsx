import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlueprintDraftConfig extends KineticBaseConfig {
  draftSpeed: number
  showDimensions: boolean
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
      {/* Blueprint grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(100,160,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,160,255,0.12) 1px, transparent 1px),
            linear-gradient(rgba(100,160,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,160,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
        }}
      />
      {/* Title block */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          border: '1px solid rgba(100,160,255,0.2)',
          padding: '4px 8px',
          opacity: 0.4,
          fontFamily: 'monospace',
          fontSize: 8,
          color: '#7AAEFF',
          lineHeight: 1.4,
        }}
      >
        DWG NO: AUTO-001
        <br />
        REV: A
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let drawP = 0
    let eraseP = 0

    if (phase === 'enter') {
      drawP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      drawP = 1
    } else {
      drawP = 1
      eraseP = easeInCubic(exitProgress)
    }

    const cx = width / 2
    const cy = height / 2
    const boxW = width * 0.75
    const boxH = height * 0.55

    // Component 1: Outer bounding box (draws around clockwise)
    // Split into 4 sides, each appears in sequence
    const boxP = Math.min(1, drawP * 1.5)

    // Side draw percentages (clockwise: top, right, bottom, left)
    const topP = Math.min(1, boxP * 4)
    const rightP = Math.min(1, Math.max(0, boxP * 4 - 1))
    const bottomP = Math.min(1, Math.max(0, boxP * 4 - 2))
    const leftP = Math.min(1, Math.max(0, boxP * 4 - 3))

    const x0 = cx - boxW / 2
    const y0 = cy - boxH / 2
    const x1 = cx + boxW / 2
    const y1 = cy + boxH / 2

    const boxOpacity = (1 - eraseP) * 0.5
    const dimOpacity = (1 - eraseP) * 0.35

    // Dimension lines
    const dimArrowLen = 12
    const dimOffsetY = boxH / 2 + 22
    const dimOffsetX = boxW / 2 + 22
    const dimLineP = Math.max(0, (drawP - 0.7) / 0.3)

    // Text drawn last — like lettering a blueprint
    const textOpacity = phase === 'enter' ? Math.max(0, (drawP - 0.55) / 0.45) : phase === 'hold' ? 1 : 1 - eraseP

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Bounding box — top */}
          <line
            x1={x0}
            y1={y0}
            x2={x0 + (x1 - x0) * topP}
            y2={y0}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={boxOpacity}
            strokeDasharray="4 3"
          />
          {/* Right */}
          <line
            x1={x1}
            y1={y0}
            x2={x1}
            y2={y0 + (y1 - y0) * rightP}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={boxOpacity}
            strokeDasharray="4 3"
          />
          {/* Bottom */}
          <line
            x1={x1}
            y1={y1}
            x2={x1 - (x1 - x0) * bottomP}
            y2={y1}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={boxOpacity}
            strokeDasharray="4 3"
          />
          {/* Left */}
          <line
            x1={x0}
            y1={y1}
            x2={x0}
            y2={y1 - (y1 - y0) * leftP}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={boxOpacity}
            strokeDasharray="4 3"
          />

          {/* Center cross */}
          {drawP > 0.4 && (
            <>
              <line
                x1={cx - 10}
                y1={cy}
                x2={cx + 10}
                y2={cy}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={boxOpacity * 0.6}
              />
              <line
                x1={cx}
                y1={cy - 10}
                x2={cx}
                y2={cy + 10}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={boxOpacity * 0.6}
              />
            </>
          )}

          {/* Dimension line — horizontal */}
          {dimLineP > 0 && (
            <>
              <line
                x1={x0}
                y1={cy + dimOffsetY}
                x2={x0 + (x1 - x0) * dimLineP}
                y2={cy + dimOffsetY}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={dimOpacity}
              />
              <line
                x1={x0}
                y1={cy + dimOffsetY - dimArrowLen / 2}
                x2={x0}
                y2={cy + dimOffsetY + dimArrowLen / 2}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={dimOpacity}
              />
              {dimLineP > 0.9 && (
                <>
                  <line
                    x1={x1}
                    y1={cy + dimOffsetY - dimArrowLen / 2}
                    x2={x1}
                    y2={cy + dimOffsetY + dimArrowLen / 2}
                    stroke={color}
                    strokeWidth={0.8}
                    strokeOpacity={dimOpacity}
                  />
                  <text
                    x={cx}
                    y={cy + dimOffsetY + 14}
                    textAnchor="middle"
                    fill={color}
                    fontSize={9}
                    fontFamily="monospace"
                    opacity={dimOpacity}
                  >
                    {Math.round(boxW)}px
                  </text>
                </>
              )}
            </>
          )}

          {/* Dimension line — vertical */}
          {dimLineP > 0.5 && (
            <>
              <line
                x1={cx + dimOffsetX}
                y1={y0}
                x2={cx + dimOffsetX}
                y2={y0 + (y1 - y0) * Math.min(1, (dimLineP - 0.5) / 0.5)}
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={dimOpacity}
              />
              {dimLineP > 0.9 && (
                <text
                  x={cx + dimOffsetX + 12}
                  y={cy + 4}
                  textAnchor="start"
                  fill={color}
                  fontSize={9}
                  fontFamily="monospace"
                  opacity={dimOpacity}
                >
                  {Math.round(boxH)}px
                </text>
              )}
            </>
          )}
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 400,
              color,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textShadow: `0 0 30px ${color}40`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function BlueprintDraftComponent(props: MotionGraphicProps<BlueprintDraftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blueprint-draft',
  title: 'Kinetic Blueprint Draft',
  description:
    "Architectural drafting lines draw in sequence — bounding box, center marks, dimension lines — before the lettered text appears like an engineer's final annotation.",
  tags: [
    'kinetic',
    'typography',
    'blueprint',
    'architectural',
    'draft',
    'technical',
    'lines',
    'dimension',
    'engineering',
    'build',
  ],
  category: 'captions',
  component: BlueprintDraftComponent as any,
  defaultConfig: {
    words: ['DRAFT', 'PLAN', 'DESIGN', 'BUILD'],
    colors: ['#7AAEFF', '#8DBBFF', '#6699EE', '#AACCFF'],
    bgColor: '#0A1628',
    cycleDuration: 2.2,
    draftSpeed: 1,
    showDimensions: true,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DRAFT', 'PLAN', 'DESIGN', 'BUILD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#7AAEFF', '#8DBBFF', '#6699EE', '#AACCFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'draftSpeed', label: 'Draft Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
    { key: 'showDimensions', label: 'Show Dimensions', type: 'boolean', defaultValue: true, group: 'Animation' },
  ],
})
