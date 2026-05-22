import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThermalFadeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const receiptW = Math.min(width * 0.55, height * 0.45)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Receipt paper — thermal stock */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: receiptW,
            bottom: '8%',
            background: 'linear-gradient(90deg, #f3efe7 0%, #f6f2eb 8%, #f8f5ef 50%, #f6f2eb 92%, #f0ece4 100%)',
            boxShadow: '2px 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          {/* Thermal paper texture — slight yellow cast aging */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(240,230,200,0.08) 0%, rgba(240,230,200,0.02) 40%, rgba(240,230,200,0.12) 100%)',
            }}
          />

          {/* Horizontal fade bands — simulating paper degradation zones */}
          {Array.from({ length: 5 }, (_, i) => {
            const bandY = 15 + i * 20
            const degradeOpacity = 0.02 + Math.sin(time * 0.3 + i) * 0.01
            return (
              <div
                key={`fade-band-${i}`}
                style={{
                  position: 'absolute',
                  top: `${bandY}%`,
                  left: 0,
                  right: 0,
                  height: '8%',
                  background: `rgba(245, 240, 225, ${degradeOpacity})`,
                  filter: 'blur(4px)',
                }}
              />
            )
          })}

          {/* Receipt header */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center' as const,
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: receiptW * 0.045,
                fontWeight: 700,
                color: 'rgba(0,0,0,0.12)',
                letterSpacing: 2,
              }}
            >
              BPA-FREE RECEIPT
            </div>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: receiptW * 0.028,
                color: 'rgba(0,0,0,0.06)',
                marginTop: 4,
              }}
            >
              THERMAL PAPER — WILL FADE
            </div>
            <div style={{ marginTop: 6, borderTop: '1px dashed rgba(0,0,0,0.06)', width: receiptW * 0.7, marginLeft: 'auto', marginRight: 'auto' }} />
          </div>

          {/* Faded ghost lines — old receipt text barely visible */}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`ghost-${i}`}
              style={{
                position: 'absolute',
                top: 80 + i * 20,
                left: '12%',
                right: '12%',
                height: 8,
                background: `rgba(0,0,0,${0.015 - i * 0.002})`,
                borderRadius: 1,
                filter: 'blur(1px)',
              }}
            />
          ))}

          {/* Time indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: receiptW * 0.025,
              color: 'rgba(0,0,0,0.04)',
              letterSpacing: 1,
            }}
          >
            FADING... {Math.floor(time % 10)}s
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
    fps,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    let opacity = 0
    let printHeat = 0
    let fadeAmount = 0

    if (phase === 'enter') {
      // Text prints hot — dark and crisp, with thermal heat glow
      printHeat = enterProgress
      opacity = Math.min(1, enterProgress * 2)
      fadeAmount = 0
    } else if (phase === 'hold') {
      // Gradual thermal fade begins
      printHeat = 1
      opacity = 1
      fadeAmount = holdProgress * 0.4
    } else {
      // Text fades to near blank as paper degrades
      printHeat = 1
      opacity = 1
      fadeAmount = 0.4 + exitProgress * 0.55
    }

    // Color transitions from dark to faded tan as thermal print degrades
    const darkR = 26, darkG = 26, darkB = 26
    const fadeR = 220, fadeG = 215, fadeB = 200
    const r = Math.round(darkR + (fadeR - darkR) * fadeAmount)
    const g = Math.round(darkG + (fadeG - darkG) * fadeAmount)
    const b = Math.round(darkB + (fadeB - darkB) * fadeAmount)
    const textColor = `rgb(${r}, ${g}, ${b})`

    // Heat glow during printing
    const heatGlow = phase === 'enter' && printHeat < 0.8
      ? `0 0 ${8 * (1 - printHeat)}px rgba(180, 80, 20, ${0.3 * (1 - printHeat)})`
      : 'none'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(28px, 7vw, 80px)',
            fontWeight: 700,
            color: textColor,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            textShadow: heatGlow,
            // Slight blur as print fades
            filter: fadeAmount > 0.3 ? `blur(${(fadeAmount - 0.3) * 1.5}px)` : 'none',
            transition: 'color 0.1s',
          }}
        >
          {word}
        </div>

        {/* Fade progress indicator */}
        {fadeAmount > 0.1 && (
          <div
            style={{
              position: 'absolute',
              bottom: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: `rgba(0,0,0,${0.1 - fadeAmount * 0.08})`,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {'░'.repeat(Math.floor(fadeAmount * 10))}{'█'.repeat(10 - Math.floor(fadeAmount * 10))}
          </div>
        )}
      </div>
    )
  },
}

function ThermalFadeComponent(props: MotionGraphicProps<ThermalFadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thermal-fade',
  title: 'Kinetic Thermal Fade',
  description:
    'Thermal receipt text printed hot and crisp, then gradually fading to blank as the paper degrades. Includes heat glow on print, color transition from dark to faded tan, and BPA-free paper aging.',
  tags: ['kinetic', 'typography', 'thermal', 'receipt', 'fade', 'paper', 'degradation', 'analog'],
  category: 'captions',
  component: ThermalFadeComponent as any,
  defaultConfig: {
    words: ['HEAT', 'FADE', 'GONE', 'BLANK'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#2a2824',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAT', 'FADE', 'GONE', 'BLANK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2824', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
