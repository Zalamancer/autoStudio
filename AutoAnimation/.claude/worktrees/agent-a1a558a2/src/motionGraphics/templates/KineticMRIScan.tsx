import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MRIScanConfig extends KineticBaseConfig {}

const SLICE_COUNT = 24 // number of MRI slices

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // MRI pulse sequence indicator — repetitive RF pulse blink
    const rfPhase = (time * 4) % 1
    const rfOn = rfPhase < 0.12

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Faint MRI bore glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,60,120,0.1) 0%, transparent 70%)',
        }} />
        {/* Gradient vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }} />
        {/* Slice position indicator (right side) */}
        <div style={{
          position: 'absolute', right: 14, top: '20%', bottom: '20%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2,
        }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              width: 8, height: 3,
              background: `rgba(0,160,255,${0.2 + (i % 3) * 0.1})`,
              borderRadius: 1,
            }} />
          ))}
        </div>
        {/* RF pulse light */}
        <div style={{
          position: 'absolute', top: 14, left: 18,
          fontFamily: 'monospace', fontSize: 10,
          color: rfOn ? 'rgba(0,200,255,0.9)' : 'rgba(0,200,255,0.25)',
          letterSpacing: 2,
        }}>
          {rfOn ? '● RF PULSE' : '○ RF PULSE'}
        </div>
        {/* Field strength label */}
        <div style={{
          position: 'absolute', bottom: 14, right: 18,
          fontFamily: 'monospace', fontSize: 10,
          color: 'rgba(0,160,255,0.4)',
          letterSpacing: 2,
        }}>
          3.0T · TR 500ms
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // MRI slice-by-slice: SLICE_COUNT horizontal bands appear top-to-bottom sequentially
    // Each slice is a thin strip of the text, revealed in order

    const textStyle: React.CSSProperties = {
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      fontSize: 'clamp(40px, 10.5vw, 150px)',
      fontWeight: 700,
      color,
      whiteSpace: 'nowrap',
      letterSpacing: 6,
    }

    if (phase === 'enter') {
      // Number of slices currently revealed: grows as enterProgress → 1
      const revealedSlices = Math.floor(enterProgress * SLICE_COUNT)

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible' }}>
          {/* Each slice is a clipped copy of the text */}
          {Array.from({ length: SLICE_COUNT }, (_, si) => {
            if (si > revealedSlices) return null
            const sliceTop = (si / SLICE_COUNT) * 100
            const sliceBottom = ((SLICE_COUNT - si - 1) / SLICE_COUNT) * 100
            // Brightness pulses briefly on the freshly-revealed slice
            const isFresh = si === revealedSlices
            const brightness = isFresh ? 1.6 : 1
            return (
              <div key={si} style={{
                position: 'absolute', inset: 0,
                clipPath: `inset(${sliceTop}% 0 ${sliceBottom}% 0)`,
                filter: `brightness(${brightness})`,
              }}>
                <div style={{
                  ...textStyle,
                  textShadow: isFresh
                    ? `0 0 24px ${color}, 0 0 8px rgba(0,200,255,0.6)`
                    : `0 0 8px ${color}40`,
                }}>
                  {word}
                </div>
              </div>
            )
          })}
          {/* Horizontal scan cursor */}
          <div style={{
            position: 'absolute', left: -30, right: -30,
            top: `${enterProgress * 100}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(0,200,255,0.6), ${color}, rgba(0,200,255,0.6), transparent)`,
            boxShadow: `0 0 10px rgba(0,200,255,0.4)`,
          }} />
        </div>
      )
    } else if (phase === 'hold') {
      // Full text glows with MRI cyan
      const glow = 0.5 + Math.sin(holdProgress * Math.PI * 3) * 0.08
      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          ...textStyle,
          textShadow: `0 0 ${Math.round(glow * 24)}px ${color}, 0 0 8px rgba(0,200,255,${glow * 0.6})`,
        }}>
          {word}
        </div>
      )
    } else {
      // Exit: slices disappear bottom-to-top (reverse scan)
      const vanishedSlices = Math.floor(exitProgress * SLICE_COUNT)
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible' }}>
          {Array.from({ length: SLICE_COUNT }, (_, si) => {
            const fromBottom = SLICE_COUNT - 1 - si
            if (fromBottom < vanishedSlices) return null
            const sliceTop = (si / SLICE_COUNT) * 100
            const sliceBottom = ((SLICE_COUNT - si - 1) / SLICE_COUNT) * 100
            return (
              <div key={si} style={{
                position: 'absolute', inset: 0,
                clipPath: `inset(${sliceTop}% 0 ${sliceBottom}% 0)`,
              }}>
                <div style={{ ...textStyle, textShadow: `0 0 8px ${color}40` }}>{word}</div>
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function MRIScanComponent(props: MotionGraphicProps<MRIScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mri-scan',
  title: 'Kinetic MRI Scan',
  description: 'MRI slice-by-slice reveal: horizontal slices of text appear sequentially top-to-bottom like an MRI acquisition, then vanish bottom-to-top',
  tags: ['kinetic', 'typography', 'mri', 'scan', 'medical', 'slice', 'reveal', 'radiology'],
  category: 'captions',
  component: MRIScanComponent as any,
  defaultConfig: {
    words: ['SCAN', 'SLICE', 'BRAIN', 'CLEAR'],
    colors: ['#00CCFF', '#00AAFF', '#00CCFF', '#44DDFF'],
    bgColor: '#030810',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'SLICE', 'BRAIN', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00CCFF', '#00AAFF', '#00CCFF', '#44DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
