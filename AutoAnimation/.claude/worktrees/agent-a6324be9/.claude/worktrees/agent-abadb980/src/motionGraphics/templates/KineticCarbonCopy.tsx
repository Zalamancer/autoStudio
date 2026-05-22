import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CarbonCopyConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top sheet — white bond paper */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '12%',
            right: '12%',
            bottom: '30%',
            background: 'linear-gradient(180deg, #fefefe 0%, #f9f7f4 100%)',
            boxShadow: '2px 3px 10px rgba(0,0,0,0.12)',
            borderRadius: 2,
          }}
        >
          {/* Typewriter guide lines */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',
                top: 30 + i * 28,
                left: '8%',
                right: '8%',
                height: 1,
                background: 'rgba(200,200,210,0.15)',
              }}
            />
          ))}
          {/* Paper header area */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '8%',
              right: '8%',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(0,0,0,0.12)',
              letterSpacing: 1,
            }}
          >
            <span>FORM-001</span>
            <span>ORIGINAL</span>
          </div>
        </div>

        {/* Carbon sheet visible underneath — blue-black */}
        <div
          style={{
            position: 'absolute',
            top: '14%',
            left: '14%',
            right: '10%',
            bottom: '24%',
            background: 'linear-gradient(180deg, #1a1f3a 0%, #0f142a 100%)',
            borderRadius: 1,
            opacity: 0.25,
          }}
        />

        {/* Second copy sheet underneath */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '15%',
            right: '9%',
            bottom: '20%',
            background: 'linear-gradient(180deg, #f0ece4 0%, #e8e4dc 100%)',
            boxShadow: '2px 3px 8px rgba(0,0,0,0.08)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '8%',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(0,0,0,0.08)',
              letterSpacing: 1,
            }}
          >
            COPY 1
          </div>
        </div>

        {/* Third copy — faintest */}
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '16%',
            right: '8%',
            bottom: '16%',
            background: 'linear-gradient(180deg, #ebe7df 0%, #e2ded6 100%)',
            boxShadow: '1px 2px 6px rgba(0,0,0,0.05)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '8%',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(0,0,0,0.06)',
              letterSpacing: 1,
            }}
          >
            COPY 2
          </div>
        </div>
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 0
    let charReveal = 0
    let strikeIntensity = 0

    if (phase === 'enter') {
      charReveal = Math.floor(enterProgress * (word.length + 1))
      opacity = Math.min(1, enterProgress * 2)
      strikeIntensity = enterProgress
    } else if (phase === 'hold') {
      charReveal = word.length
      opacity = 1
      strikeIntensity = 1
    } else {
      charReveal = word.length
      opacity = 1 - exitProgress * 0.8
      strikeIntensity = 1 - exitProgress * 0.5
    }

    const displayText = word.substring(0, Math.min(charReveal, word.length))

    // Copies with diminishing intensity and offset
    const copies = [
      { offset: 0, opacity: strikeIntensity, color: color, blur: 0, label: 'original' },
      { offset: 6, opacity: strikeIntensity * 0.45, color: '#1a3a7a', blur: 0.5, label: 'copy1' },
      { offset: 12, opacity: strikeIntensity * 0.2, color: '#2a4a8a', blur: 1, label: 'copy2' },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {copies.map((copy) => (
          <div
            key={copy.label}
            style={{
              position: copy.offset === 0 ? 'relative' : 'absolute',
              top: copy.offset === 0 ? 0 : copy.offset,
              left: copy.offset === 0 ? 0 : copy.offset * 0.5,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(28px, 7vw, 80px)',
              fontWeight: 700,
              color: copy.color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: copy.opacity,
              filter: copy.blur > 0 ? `blur(${copy.blur}px)` : 'none',
              zIndex: copy.offset === 0 ? 10 : 5,
            }}
          >
            {displayText}
          </div>
        ))}

        {/* Typewriter cursor */}
        {phase === 'enter' && charReveal < word.length && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: -8,
              display: 'inline-block',
              width: 3,
              height: '1em',
              background: 'rgba(0,0,0,0.5)',
              animation: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function CarbonCopyComponent(props: MotionGraphicProps<CarbonCopyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-carbon-copy',
  title: 'Kinetic Carbon Copy',
  description:
    'Carbon copy paper with text typed on the top sheet and faint blue carbon duplicates appearing below with slight offset and diminishing intensity across multiple copies.',
  tags: ['kinetic', 'typography', 'carbon', 'copy', 'paper', 'typewriter', 'office', 'document'],
  category: 'captions',
  component: CarbonCopyComponent as any,
  defaultConfig: {
    words: ['MEMO', 'FILED', 'COPY', 'RECORD'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#d8d4cc',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEMO', 'FILED', 'COPY', 'RECORD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#d8d4cc', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
