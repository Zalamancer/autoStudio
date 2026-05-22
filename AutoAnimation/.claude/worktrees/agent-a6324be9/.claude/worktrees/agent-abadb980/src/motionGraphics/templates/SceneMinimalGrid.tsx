import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMinimalGridConfig {
  cells: string[]
  bgColor: string
  textColor: string
  borderColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Parse a cell string like "128|Projects" into value and label */
function parseCell(s: string): { value: string; label: string } {
  const parts = s.split('|')
  return {
    value: (parts[0] || '').trim(),
    label: (parts[1] || '').trim(),
  }
}

function SceneMinimalGridComponent({ config, progress }: MotionGraphicProps<SceneMinimalGridConfig>) {
  const { cells, bgColor, textColor, borderColor } = config

  const parsedCells = cells.slice(0, 4).map(parseCell)

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Border line grows in
  const borderScale = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Grid container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12%',
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '1',
            position: 'relative',
          }}
        >
          {/* Vertical divider */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              bottom: '10%',
              left: '50%',
              width: '1px',
              background: borderColor,
              opacity: 0.15,
              transform: `translateX(-50%) scaleY(${borderScale})`,
            }}
          />

          {/* Horizontal divider */}
          <div
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: '50%',
              height: '1px',
              background: borderColor,
              opacity: 0.15,
              transform: `translateY(-50%) scaleX(${borderScale})`,
            }}
          />

          {parsedCells.map((cell, i) => {
            // Stagger: top-left, top-right, bottom-left, bottom-right
            const stagger = i * 0.15
            const cellEnter = enterProgress < 1
              ? Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
              : 1
            const cellOpacity = easeOutCubic(cellEnter)
            const cellY = 15 * (1 - easeOutCubic(cellEnter))

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8%',
                  opacity: cellOpacity,
                  transform: `translateY(${cellY}px)`,
                }}
              >
                {/* Value */}
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(20px, 5vw, 48px)',
                    fontWeight: 200,
                    color: textColor,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {cell.value}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(8px, 1.5vw, 14px)',
                    fontWeight: 400,
                    color: textColor,
                    opacity: 0.45,
                    marginTop: '0.6em',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {cell.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-minimal-grid',
  title: 'Scene Minimal Grid',
  description: '2x2 grid of stats or words, each cell fading in with stagger, clean thin borders, lots of whitespace',
  tags: ['scene', 'grid', 'stats', 'minimal', 'clean', 'whitespace', 'layout'],
  category: 'scene-layout',
  component: SceneMinimalGridComponent as any,
  defaultConfig: {
    cells: ['128|Projects', '12|Awards', '8|Years', '99%|Satisfaction'],
    bgColor: '#FFFFFF',
    textColor: '#000000',
    borderColor: '#000000',
  },
  configSchema: [
    { key: 'cells', label: 'Cells (value|label)', type: 'text-array', defaultValue: ['128|Projects', '12|Awards', '8|Years', '99%|Satisfaction'], group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
})
