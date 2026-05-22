import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MemoPadConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Different memo pad paper colors — common pads come in white, canary, blue, pink, green
const padColors = [
  { paper: '#FFFEF5', stripe: '#E8E0C0', lines: 'rgba(100,140,200,0.18)', binding: '#D4C890' },
  { paper: '#FDFFF5', stripe: '#D4E8C0', lines: 'rgba(80,160,100,0.15)', binding: '#A8D890' },
  { paper: '#F5F8FF', stripe: '#C0CCE8', lines: 'rgba(80,110,200,0.15)', binding: '#90A8D8' },
  { paper: '#FFF5F8', stripe: '#E8C0CC', lines: 'rgba(200,80,110,0.13)', binding: '#D890A8' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Desk surface texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(ellipse at 30% 70%, rgba(160,120,60,0.06) 0%, transparent 40%)',
            'radial-gradient(ellipse at 70% 30%, rgba(180,140,80,0.04) 0%, transparent 35%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 29
    const scheme = padColors[index % padColors.length]
    const baseRotation = ((seed % 7) - 3) * 0.5

    // Pad stack depth: show 3 sheets behind the top one
    const stackSheets = 3

    let sheetY = 0
    let sheetOpacity = 1
    let peelRotation = 0
    let peelOriginX = '50%'
    let peelOriginY = '100%'
    let shadowBlur = 10
    let shadowY = 4

    if (phase === 'enter') {
      // Sheet peels off from top of pad and floats down to center
      const eased = easeOutBack(enterProgress)
      sheetY = (1 - eased) * -180
      sheetOpacity = Math.min(1, enterProgress * 2.5)
      peelRotation = (1 - easeOutCubic(enterProgress)) * -8
      shadowBlur = 4 + eased * 16
      shadowY = 2 + eased * 12
    } else if (phase === 'hold') {
      // Subtle micro-float
      sheetY = Math.sin(holdProgress * Math.PI * 2 + seed) * 2.5
      peelRotation = Math.sin(holdProgress * Math.PI * 3 + seed) * 0.8
      shadowBlur = 14 + Math.sin(holdProgress * Math.PI * 4) * 2
      shadowY = 14 + Math.sin(holdProgress * Math.PI * 4) * 1.5
    } else {
      // Peel away — sheet falls down and off screen
      const eased = easeInCubic(exitProgress)
      sheetY = eased * 240
      sheetOpacity = 1 - exitProgress * 0.8
      peelRotation = eased * 12
      if (exitProgress > 0.75) sheetOpacity = (1 - exitProgress) / 0.25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${sheetY}px)) rotate(${baseRotation + peelRotation}deg)`,
        }}
      >
        {/* Stack of sheets behind — the pad body */}
        {Array.from({ length: stackSheets }, (_, i) => {
          const stackOffset = (i + 1) * 3
          const stackScale = 1 - (i + 1) * 0.005
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: stackOffset,
                left: stackOffset * 0.3,
                right: -stackOffset * 0.3,
                bottom: -stackOffset,
                background: scheme.paper,
                opacity: 0.85 - i * 0.2,
                transform: `scale(${stackScale})`,
                transformOrigin: 'top center',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.08)',
                borderRadius: 1,
              }}
            />
          )
        })}

        {/* Top sheet — the active memo */}
        <div
          style={{
            position: 'relative',
            background: scheme.paper,
            boxShadow: `2px ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)`,
            borderRadius: 1,
            opacity: sheetOpacity,
          }}
        >
          {/* Pad binding strip at top */}
          <div
            style={{
              height: 'clamp(14px, 3vw, 28px)',
              background: `linear-gradient(180deg, ${scheme.binding} 0%, ${scheme.stripe} 100%)`,
              borderRadius: '1px 1px 0 0',
              boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.12)',
            }}
          />

          {/* Glue perforation line */}
          <div
            style={{
              height: 2,
              background: `repeating-linear-gradient(90deg, ${scheme.binding}88 0px, ${scheme.binding}88 6px, transparent 6px, transparent 10px)`,
            }}
          />

          {/* Paper body with text */}
          <div
            style={{
              position: 'relative',
              padding: 'clamp(16px, 3.5vw, 40px) clamp(22px, 5.5vw, 60px)',
              minWidth: 'clamp(200px, 40vw, 480px)',
            }}
          >
            {/* Ruled lines on paper */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 29px, ${scheme.lines} 29px, ${scheme.lines} 30px)`,
                backgroundPosition: '0 10px',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                fontFamily: "'Segoe Print', 'Comic Sans MS', 'Patrick Hand', cursive",
                fontSize: 'clamp(32px, 8vw, 105px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function MemoPadComponent(props: MotionGraphicProps<MemoPadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-memo-pad',
  title: 'Kinetic Memo Pad',
  description: 'Text on a memo/notepad sheet that peels off from a stacked pad — binding strip, ruled lines, stack depth effect',
  tags: ['kinetic', 'typography', 'memo', 'notepad', 'pad', 'paper', 'office', 'peel', 'stationery'],
  category: 'captions',
  component: MemoPadComponent as any,
  defaultConfig: {
    words: ['MEMO', 'NOTE', 'CALL', 'TODO'],
    colors: ['#1A2A4A', '#1A3A2A', '#3A1A2A', '#2A2A1A'],
    bgColor: '#C8B89A',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEMO', 'NOTE', 'CALL', 'TODO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A2A4A', '#1A3A2A', '#3A1A2A', '#2A2A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C8B89A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
