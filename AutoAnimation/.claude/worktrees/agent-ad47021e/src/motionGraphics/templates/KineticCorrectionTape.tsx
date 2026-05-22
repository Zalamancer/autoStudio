import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CorrectionTapeConfig extends KineticBaseConfig {
  wrongWord: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Wrong words cycling in parallel with the word list (deterministic)
const wrongWords = ['MISTAKE', 'WRONG', 'OOPS', 'ERROR', 'TYPO', 'BAD', 'NO']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Notebook paper horizontal rules */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(100,140,200,0.12) 30px, rgba(100,140,200,0.12) 31px)',
          backgroundPosition: '0 8px',
          pointerEvents: 'none',
        }}
      />
      {/* Pink left margin line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '9%',
          width: 1,
          background: 'rgba(220,80,100,0.3)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 7
    const wrongWord = wrongWords[index % wrongWords.length]

    // Animation phases:
    // enter 0..0.35 — wrong word visible, typed-in look
    // enter 0.35..0.75 — correction tape rolls over wrong word left-to-right
    // enter 0.75..1.0 — correct word writes in on top of white tape
    // hold — correct word sits on white tape stripe
    // exit — whole thing fades + slides down

    let wrongOpacity = 0
    let tapeWidth = 0 // 0..100%
    let correctOpacity = 0
    let correctClip = 0 // 0..100 reveal
    let containerY = 0
    let containerOpacity = 1

    if (phase === 'enter') {
      if (enterProgress < 0.35) {
        // Wrong word types in
        const p = enterProgress / 0.35
        wrongOpacity = easeOutCubic(p)
        tapeWidth = 0
        correctOpacity = 0
      } else if (enterProgress < 0.75) {
        // Tape rolls over wrong word
        const p = (enterProgress - 0.35) / 0.4
        wrongOpacity = 1
        tapeWidth = easeOutCubic(p) * 108 // slightly wider than word
        correctOpacity = 0
      } else {
        // Correct word writes in
        const p = (enterProgress - 0.75) / 0.25
        wrongOpacity = 1
        tapeWidth = 108
        correctClip = easeOutCubic(p) * 100
        correctOpacity = easeOutCubic(p)
      }
    } else if (phase === 'hold') {
      wrongOpacity = 1
      tapeWidth = 108
      correctOpacity = 1
      correctClip = 100
      // Subtle sway
      containerY = Math.sin(holdProgress * Math.PI * 2 + seed) * 1.5
    } else {
      wrongOpacity = 1
      tapeWidth = 108
      correctOpacity = 1
      correctClip = 100
      const eased = easeInCubic(exitProgress)
      containerY = eased * 60
      containerOpacity = 1 - exitProgress * 0.9
      if (exitProgress > 0.8) containerOpacity = (1 - exitProgress) / 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${containerY}px))`,
          opacity: containerOpacity,
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Wrong word underneath */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Courier', monospace",
              fontSize: 'clamp(34px, 8.5vw, 110px)',
              fontWeight: 700,
              color: '#444444',
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              opacity: wrongOpacity,
            }}
          >
            {wrongWord}
          </div>

          {/* Correction tape stripe rolling over wrong word */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              bottom: '8%',
              left: '-2%',
              width: `${tapeWidth}%`,
              background: 'linear-gradient(180deg, #F8F7F5 0%, #EEECE8 40%, #F5F4F1 70%, #F0EEE9 100%)',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.8)',
              // Tape texture
              backgroundImage: [
                'linear-gradient(180deg, #F8F7F5 0%, #EEECE8 40%, #F5F4F1 70%, #F0EEE9 100%)',
                'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.012) 6px, rgba(0,0,0,0.012) 7px)',
              ].join(', '),
              overflow: 'hidden',
              // Leading edge — the tape applicator head
              borderRight: tapeWidth > 0 && tapeWidth < 105 ? '2px solid rgba(180,170,160,0.5)' : undefined,
              pointerEvents: 'none',
            }}
          >
            {/* Tape roll applicator body at leading edge */}
            {tapeWidth > 2 && tapeWidth < 105 && (
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 8,
                  height: '120%',
                  background: 'linear-gradient(90deg, #B0A898, #C8BFB4)',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            )}
          </div>

          {/* Correct word on top of tape */}
          {correctOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                fontFamily: "'Courier New', 'Courier', monospace",
                fontSize: 'clamp(34px, 8.5vw, 110px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                opacity: correctOpacity,
                clipPath: `inset(0 ${100 - correctClip}% 0 0)`,
              }}
            >
              {word}
            </div>
          )}
        </div>
      </div>
    )
  },
}

function CorrectionTapeComponent(props: MotionGraphicProps<CorrectionTapeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-correction-tape',
  title: 'Kinetic Correction Tape',
  description: 'Wrong text appears, white correction tape rolls over it, then the correct word writes on top — classic Wite-Out tape mechanic',
  tags: ['kinetic', 'typography', 'correction', 'tape', 'witeout', 'whiteTape', 'fix', 'office', 'stationery', 'mistake'],
  category: 'captions',
  component: CorrectionTapeComponent as any,
  defaultConfig: {
    words: ['CORRECT', 'RIGHT', 'FIXED', 'DONE'],
    colors: ['#1A3A5C', '#1A5C2A', '#5C1A1A', '#1A3A5C'],
    bgColor: '#F7F4EE',
    cycleDuration: 2.0,
    wrongWord: 'MISTAKE',
  },
  configSchema: [
    { key: 'words', label: 'Correct Words', type: 'text-array', defaultValue: ['CORRECT', 'RIGHT', 'FIXED', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A3A5C', '#1A5C2A', '#5C1A1A', '#1A3A5C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F7F4EE', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
    { key: 'wrongWord', label: 'Wrong Word Override', type: 'text', defaultValue: 'MISTAKE', group: 'Content' },
  ],
})
