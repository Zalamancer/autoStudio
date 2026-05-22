import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OnionskinConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Multiple onionskin sheets stacked
    const sheets = [
      { top: '22%', left: '17%', right: '7%', bottom: '10%', opacity: 0.3, label: 'COPY 3' },
      { top: '18%', left: '14%', right: '8%', bottom: '12%', opacity: 0.4, label: 'COPY 2' },
      { top: '14%', left: '11%', right: '9%', bottom: '14%', opacity: 0.55, label: 'COPY 1' },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Carbon paper visible between sheets */}
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '12%',
            right: '9%',
            bottom: '12%',
            background: 'linear-gradient(180deg, #0a0f2a 0%, #080c22 100%)',
            opacity: 0.12,
            borderRadius: 1,
          }}
        />

        {/* Underlying copies — back to front */}
        {sheets.map((sheet, i) => (
          <div
            key={`sheet-${i}`}
            style={{
              position: 'absolute',
              top: sheet.top,
              left: sheet.left,
              right: sheet.right,
              bottom: sheet.bottom,
              background: `rgba(248, 244, 236, ${sheet.opacity})`,
              borderRadius: 1,
              boxShadow: `1px 1px ${4 + i}px rgba(0,0,0,${0.03 + i * 0.02})`,
            }}
          >
            {/* Translucent tissue paper fiber texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'repeating-linear-gradient(30deg, transparent, transparent 3px, rgba(180,170,150,0.03) 3px, rgba(180,170,150,0.03) 4px)',
                borderRadius: 1,
              }}
            />
            {/* Sheet label */}
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 10,
                fontFamily: "'Courier New', monospace",
                fontSize: 6,
                color: `rgba(0,0,0,${sheet.opacity * 0.15})`,
                letterSpacing: 1,
              }}
            >
              {sheet.label}
            </div>
          </div>
        ))}

        {/* Top onionskin sheet — the original */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '8%',
            right: '10%',
            bottom: '16%',
            background: 'rgba(252, 250, 244, 0.78)',
            borderRadius: 2,
            boxShadow: '2px 3px 10px rgba(0,0,0,0.08)',
          }}
        >
          {/* Ultra-thin paper translucency */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(60deg, transparent, transparent 5px, rgba(230,225,210,0.06) 5px, rgba(230,225,210,0.06) 6px)',
              borderRadius: 2,
            }}
          />

          {/* Typewriter header */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '8%',
              right: '8%',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(0,0,0,0.12)',
              letterSpacing: 1,
            }}
          >
            <span>ORIGINAL — ONIONSKIN</span>
            <span>ARCHIVAL COPY</span>
          </div>

          {/* Typewriter line guide */}
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`guide-${i}`}
              style={{
                position: 'absolute',
                top: 34 + i * 22,
                left: '8%',
                right: '8%',
                height: 1,
                background: 'rgba(0,0,0,0.02)',
              }}
            />
          ))}

          {/* Corner curl — tissue paper is delicate */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              background: 'linear-gradient(135deg, transparent 50%, rgba(200,195,185,0.2) 50%)',
              borderRadius: '0 0 2px 0',
            }}
          />
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
    let strikethrough = 0

    if (phase === 'enter') {
      // Typewriter keystroke — chars appear with impact
      charReveal = Math.floor(enterProgress * (word.length + 1))
      opacity = Math.min(1, enterProgress * 2)
      strikethrough = enterProgress
    } else if (phase === 'hold') {
      charReveal = word.length
      opacity = 1
      strikethrough = 1
    } else {
      charReveal = word.length
      opacity = 1 - exitProgress * 0.7
      strikethrough = 1 - exitProgress * 0.3
    }

    const displayText = word.substring(0, Math.min(charReveal, word.length))

    // Multiple carbon copies underneath — each progressively fainter and offset
    const copies = [
      { offsetX: 0, offsetY: 0, opacity: strikethrough * 0.9, color: color, blur: 0 },
      { offsetX: 3, offsetY: 8, opacity: strikethrough * 0.35, color: '#1a2a6a', blur: 0.3 },
      { offsetX: 5, offsetY: 16, opacity: strikethrough * 0.18, color: '#2a3a7a', blur: 0.6 },
      { offsetX: 7, offsetY: 24, opacity: strikethrough * 0.08, color: '#3a4a8a', blur: 1 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 10,
        }}
      >
        {copies.map((copy, i) => (
          <div
            key={`copy-${i}`}
            style={{
              position: i === 0 ? 'relative' : 'absolute',
              top: i === 0 ? 0 : copy.offsetY,
              left: i === 0 ? 0 : copy.offsetX,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(26px, 6.5vw, 74px)',
              fontWeight: 600,
              color: copy.color,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: copy.opacity,
              filter: copy.blur > 0 ? `blur(${copy.blur}px)` : 'none',
              zIndex: 10 - i,
              // Typewriter impression — slightly uneven
              textShadow: i === 0 ? '0.3px 0.3px 0 rgba(0,0,0,0.1)' : 'none',
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
              top: -2,
              right: -6,
              display: 'inline-block',
              width: 'clamp(2px, 0.5vw, 4px)',
              height: '1.1em',
              background: 'rgba(0,0,0,0.4)',
            }}
          />
        )}
      </div>
    )
  },
}

function OnionskinComponent(props: MotionGraphicProps<OnionskinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-onionskin',
  title: 'Kinetic Onionskin',
  description:
    'Ultra-thin onionskin tissue paper with typewriter text and multiple carbon copies visible beneath, each progressively fainter and offset for an archival document effect.',
  tags: ['kinetic', 'typography', 'onionskin', 'tissue', 'typewriter', 'carbon', 'archival', 'paper'],
  category: 'captions',
  component: OnionskinComponent as any,
  defaultConfig: {
    words: ['TYPE', 'FILE', 'ARCH', 'KEEP'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#b8b2a6',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TYPE', 'FILE', 'ARCH', 'KEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#b8b2a6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
