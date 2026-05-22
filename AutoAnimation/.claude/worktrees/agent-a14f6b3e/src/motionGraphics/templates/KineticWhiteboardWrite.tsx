import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WhiteboardWriteConfig extends KineticBaseConfig {
  markerColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Simulate marker writing with clip-path left-to-right reveal per letter
const markerColors = ['#1A55CC', '#CC2020', '#1AAA44', '#CC7700', '#7722CC']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Whiteboard grid — very faint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.03) 39px, rgba(0,0,0,0.03) 40px)',
            'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.025) 39px, rgba(0,0,0,0.025) 40px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
      {/* Whiteboard sheen — top-left highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.6) 0%, transparent 45%)',
          pointerEvents: 'none',
        }}
      />
      {/* Metal tray at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'clamp(8px, 1.5vw, 16px)',
          background: 'linear-gradient(180deg, #C0BDB8 0%, #A8A5A0 100%)',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 47 + 31
    const markerColor = markerColors[index % markerColors.length]
    const chars = word.split('')

    let overallOpacity = 1
    let eraseProgress = 0

    // Exit: erasing effect — text fades with a smear from left
    if (phase === 'exit') {
      eraseProgress = exitProgress
      overallOpacity = 1 - exitProgress * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: overallOpacity,
        }}
      >
        {/* Underlying eraser smear during exit */}
        {phase === 'exit' && (
          <div
            style={{
              position: 'absolute',
              top: '-5%',
              bottom: '-5%',
              left: '-2%',
              right: `${100 - eraseProgress * 104}%`,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 2,
              pointerEvents: 'none',
              // Slightly uneven smear edge
              clipPath: eraseProgress > 0.1
                ? `polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%)`
                : undefined,
            }}
          />
        )}

        <div
          style={{
            display: 'flex',
            gap: 0,
            alignItems: 'baseline',
          }}
        >
          {chars.map((ch, ci) => {
            // Each character writes in sequentially, left to right
            const charFraction = 1 / chars.length
            const charStart = ci * charFraction
            const charEnd = charStart + charFraction

            let charOpacity = 0
            let charClipX = 0 // 0 = fully clipped, 100 = fully revealed

            if (phase === 'enter') {
              const charProgress = Math.max(0, Math.min(1, (enterProgress - charStart) / charFraction))
              const eased = easeOutCubic(charProgress)
              charOpacity = eased
              charClipX = eased * 100
            } else if (phase === 'hold') {
              charOpacity = 1
              charClipX = 100
            } else {
              charOpacity = 1
              charClipX = 100
            }

            // Marker thickness variation — slightly different per char for organic feel
            const thicknessFactor = 0.95 + ((ci * seed) % 7) * 0.01

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  opacity: charOpacity,
                  clipPath: charClipX < 100
                    ? `inset(0 ${100 - charClipX}% 0 0)`
                    : undefined,
                }}
              >
                {/* Marker stroke — slight bleed around text */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '-1px',
                    fontFamily: "'Patrick Hand', 'Segoe Print', 'Comic Sans MS', cursive",
                    fontSize: `clamp(${36 * thicknessFactor}px, ${9 * thicknessFactor}vw, ${118 * thicknessFactor}px)`,
                    fontWeight: 700,
                    color: `${markerColor}22`,
                    lineHeight: 1.1,
                    userSelect: 'none',
                  }}
                >
                  {ch}
                </div>
                <div
                  style={{
                    fontFamily: "'Patrick Hand', 'Segoe Print', 'Comic Sans MS', cursive",
                    fontSize: 'clamp(36px, 9vw, 118px)',
                    fontWeight: 700,
                    color: markerColor,
                    whiteSpace: 'pre',
                    lineHeight: 1.1,
                    // Dry-erase marker slight texture
                    textShadow: [
                      `1px 1px 0 ${markerColor}55`,
                      `-0.5px 0 0 ${markerColor}33`,
                    ].join(', '),
                  }}
                >
                  {ch}
                </div>
              </div>
            )
          })}
        </div>

        {/* Marker cap — writing implement hint at the end of the last char during enter */}
        {phase === 'enter' && enterProgress > 0.05 && enterProgress < 0.98 && (
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: `${enterProgress * 102 - 2}%`,
              width: 'clamp(8px, 1.5vw, 14px)',
              height: 'clamp(6px, 1vw, 10px)',
              background: markerColor,
              borderRadius: '0 2px 2px 0',
              transform: 'translateY(60%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function WhiteboardWriteComponent(props: MotionGraphicProps<WhiteboardWriteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-whiteboard-write',
  title: 'Kinetic Whiteboard Write',
  description: 'Text written character by character with a whiteboard marker — thick strokes, dry-erase bleed, eraser wipe on exit',
  tags: ['kinetic', 'typography', 'whiteboard', 'marker', 'write', 'classroom', 'office', 'draw', 'stationery'],
  category: 'captions',
  component: WhiteboardWriteComponent as any,
  defaultConfig: {
    words: ['WRITE', 'DRAW', 'EXPLAIN', 'TEACH'],
    colors: ['#1A55CC', '#CC2020', '#1AAA44', '#CC7700'],
    bgColor: '#F4F6F4',
    cycleDuration: 1.8,
    markerColor: '#1A55CC',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WRITE', 'DRAW', 'EXPLAIN', 'TEACH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A55CC', '#CC2020', '#1AAA44', '#CC7700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F6F4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
    { key: 'markerColor', label: 'Marker Color', type: 'color', defaultValue: '#1A55CC', group: 'Style' },
  ],
})
