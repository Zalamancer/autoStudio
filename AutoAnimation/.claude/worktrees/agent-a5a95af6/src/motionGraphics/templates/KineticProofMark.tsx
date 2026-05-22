import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProofMarkConfig extends KineticBaseConfig {}

// Proofreading marks: insert caret (^), delete (strikethrough), stet (dots underneath)
// The word enters with correction marks scattered over it, then the marks animate away to reveal clean text

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Galley proof column guides */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          bottom: '6%',
          left: '10%',
          width: 0.5,
          background: 'rgba(0,150,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6%',
          bottom: '6%',
          right: '10%',
          width: 0.5,
          background: 'rgba(0,150,255,0.08)',
        }}
      />
      {/* Simulated galley text lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${14 + i * 5}%`,
            left: '13%',
            right: '13%',
            height: 2,
            background: 'rgba(0,0,0,0.04)',
          }}
        />
      ))}
      {/* "PROOF" watermark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: 'clamp(60px, 18vw, 200px)',
          fontWeight: 900,
          color: 'rgba(0,0,0,0.02)',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        PROOF
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const markColor = '#D32F2F' // Red proofreading ink

    // Phase determines how much of the correction marks remain
    let markVisibility = 1 // 1 = fully marked up, 0 = clean
    let textOpacity = 1

    if (phase === 'enter') {
      // Start with full marks, they begin fading as text enters
      const enterEase = 1 - Math.pow(1 - enterProgress, 2)
      markVisibility = 1 - enterEase
      textOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      markVisibility = 0
      textOpacity = 1
    } else {
      // Marks reappear as text exits
      markVisibility = exitProgress
      textOpacity = 1 - exitProgress * 0.5
    }

    // Generate pseudo-random mark types per letter based on index
    const getMarkType = (letterIdx: number): 'insert' | 'delete' | 'stet' | 'none' => {
      const seed = (letterIdx * 7 + index * 13) % 5
      if (seed === 0) return 'insert'
      if (seed === 1) return 'delete'
      if (seed === 2) return 'stet'
      return 'none'
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          opacity: textOpacity,
        }}
      >
        {letters.map((letter, i) => {
          const markType = getMarkType(i)
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* The letter itself */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Palatino', serif",
                  fontSize: 'clamp(36px, 9vw, 130px)',
                  fontWeight: 400,
                  color,
                  display: 'inline-block',
                  letterSpacing: '0.03em',
                }}
              >
                {letter}
              </span>

              {/* Delete mark: diagonal strikethrough */}
              {markType === 'delete' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '15%',
                    left: '-5%',
                    right: '-5%',
                    bottom: '15%',
                    opacity: markVisibility * 0.7,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: 2,
                      background: markColor,
                      transform: 'rotate(-15deg)',
                    }}
                  />
                </div>
              )}

              {/* Insert caret mark: ^ below letter */}
              {markType === 'insert' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'serif',
                    fontSize: 'clamp(18px, 4.5vw, 50px)',
                    color: markColor,
                    lineHeight: 0.6,
                    opacity: markVisibility * 0.7,
                    pointerEvents: 'none',
                    fontWeight: 700,
                  }}
                >
                  {'\u2038'}
                </div>
              )}

              {/* Stet mark: dots underneath */}
              {markType === 'stet' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '5%',
                    left: '10%',
                    right: '10%',
                    display: 'flex',
                    justifyContent: 'space-around',
                    opacity: markVisibility * 0.6,
                    pointerEvents: 'none',
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: markColor,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function ProofMarkComponent(props: MotionGraphicProps<ProofMarkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-proof-mark',
  title: 'Proof Mark',
  description: 'Galley proof with red proofreading marks (insert caret, delete strikethrough, stet dots) that animate away to reveal clean typeset text.',
  tags: ['kinetic', 'typography', 'proofread', 'editorial', 'print', 'correction', 'galley', 'marks'],
  category: 'captions',
  component: ProofMarkComponent as any,
  defaultConfig: {
    words: ['REVISE', 'AMEND', 'QUERY', 'FINAL'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FAFAF8',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVISE', 'AMEND', 'QUERY', 'FINAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
