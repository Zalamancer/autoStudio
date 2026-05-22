import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TapeLabelConfig extends KineticBaseConfig {
  tapeSpeed: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Label maker body */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '15%',
            background: 'linear-gradient(180deg, #444 0%, #333 80%, #222 100%)',
            borderBottom: '2px solid #555',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '30%',
              right: '30%',
              height: 12,
              background: '#1a1a1a',
              borderRadius: '0 0 4px 4px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30%',
              right: '15%',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #666 0%, #444 100%)',
              border: '1px solid #777',
              transform: `rotate(${time * 120}deg)`,
            }}
          >
            <div
              style={{ position: 'absolute', top: '45%', left: '20%', right: '20%', height: 2, background: '#888' }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)',
            pointerEvents: 'none',
          }}
        />
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
    index,
    width,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let tapeX = 0
    let opacity = 0
    let embossProgress = 0
    let tapeWidth = 0

    // Each character gets stamped sequentially
    const totalChars = word.length
    const charWidth = Math.min(width * 0.06, 50)
    const fullTapeWidth = (totalChars + 2) * charWidth

    if (phase === 'enter') {
      // Tape advances from left, characters emboss one by one
      const eased = easeOutCubic(enterProgress)
      tapeX = -fullTapeWidth * 0.3 + eased * fullTapeWidth * 0.3
      opacity = Math.min(1, enterProgress * 3)
      embossProgress = enterProgress
      tapeWidth = fullTapeWidth * Math.min(1, enterProgress * 1.3)
    } else if (phase === 'hold') {
      opacity = 1
      embossProgress = 1
      tapeWidth = fullTapeWidth
      // Subtle idle vibration from label maker motor
      tapeX = Math.sin(holdProgress * Math.PI * 8) * 0.5
    } else {
      // Tape advances off screen
      const eased = easeOutCubic(exitProgress)
      opacity = 1 - exitProgress * 0.8
      embossProgress = 1
      tapeWidth = fullTapeWidth
      tapeX = eased * width * 0.4
      if (exitProgress > 0.7) opacity = (1 - exitProgress) / 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${tapeX}px), -50%)`,
          opacity,
        }}
      >
        {/* Tape strip — black background with white embossed text */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#111111',
            height: 'clamp(48px, 14vw, 120px)',
            width: tapeWidth,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Tape surface texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(255,255,255,0.02) 2px,
                rgba(255,255,255,0.02) 3px
              )`,
              pointerEvents: 'none',
            }}
          />
          {/* Embossed characters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 ' + charWidth + 'px',
              gap: 1,
            }}
          >
            {word.split('').map((ch, ci) => {
              const charRevealPoint = ci / totalChars
              const revealed = embossProgress > charRevealPoint
              const charP = revealed ? Math.min(1, (embossProgress - charRevealPoint) * totalChars) : 0

              // Emboss punch effect — character presses in then settles
              const punchScale = charP < 0.3 ? 1.15 - charP * 0.5 : 1
              const embossDepth = charP * 1.5

              return (
                <div
                  key={ci}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: charWidth,
                    height: '80%',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Arial Black', 'Helvetica', sans-serif",
                      fontSize: `clamp(24px, 7vw, 72px)`,
                      fontWeight: 900,
                      color: revealed ? '#FFFFFF' : 'transparent',
                      textTransform: 'uppercase',
                      transform: `scale(${punchScale})`,
                      // Embossed raised effect
                      textShadow: revealed
                        ? `0 ${embossDepth}px 0 rgba(200,200,200,0.3), 0 -${embossDepth * 0.5}px 0 rgba(0,0,0,0.5)`
                        : 'none',
                      letterSpacing: 1,
                      lineHeight: 1,
                    }}
                  >
                    {ch}
                  </span>
                  {/* Emboss indent mark */}
                  {revealed && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '10% 5%',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 1,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {/* Tape edge cuts — serrated edges */}
          <div
            style={{
              position: 'absolute',
              left: -2,
              top: 0,
              bottom: 0,
              width: 4,
              background: `repeating-linear-gradient(
                180deg,
                transparent 0px,
                transparent 4px,
                rgba(0,0,0,0.8) 4px,
                rgba(0,0,0,0.8) 5px
              )`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -2,
              top: 0,
              bottom: 0,
              width: 4,
              background: `repeating-linear-gradient(
                180deg,
                transparent 0px,
                transparent 4px,
                rgba(0,0,0,0.8) 4px,
                rgba(0,0,0,0.8) 5px
              )`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

function TapeLabelComponent(props: MotionGraphicProps<TapeLabelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tape-label',
  title: 'Kinetic Tape Label',
  description:
    'Dymo label maker tape with embossed white-on-black text, tape advancing through embossing mechanism with punched characters',
  tags: ['kinetic', 'typography', 'tape', 'label', 'dymo', 'emboss', 'craft', 'retro'],
  category: 'captions',
  component: TapeLabelComponent as any,
  defaultConfig: {
    words: ['LABEL', 'PRINT', 'MARK', 'TAPE'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#2A2A35',
    cycleDuration: 1.4,
    tapeSpeed: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LABEL', 'PRINT', 'MARK', 'TAPE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A2A35', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'tapeSpeed', label: 'Tape Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
