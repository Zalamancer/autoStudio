import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StrobePulseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Strobe flash on background -- brief white flash at regular intervals
    const strobeRate = 6 // flashes per second
    const strobePhase = (time * strobeRate) % 1
    const isFlash = strobePhase < 0.08
    const flashIntensity = isFlash ? 0.15 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Disco floor grid */}
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => {
            const tilePhase = ((row * 7 + col * 13 + Math.floor(time * 3)) % 4) / 4
            const tileOpacity = tilePhase < 0.25 ? 0.06 : 0.01
            const tileColor = (row + col) % 3 === 0 ? '255,50,200' : (row + col) % 3 === 1 ? '50,150,255' : '255,220,50'
            return (
              <div
                key={`stb-${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: `${col * 16.67}%`,
                  top: `${row * 16.67}%`,
                  width: '16.67%',
                  height: '16.67%',
                  background: `rgba(${tileColor},${tileOpacity})`,
                  border: '1px solid rgba(255,255,255,0.02)',
                }}
              />
            )
          }),
        )}
        {/* Strobe flash overlay */}
        {flashIntensity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${flashIntensity})`,
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const strobeRate = 6
    const strobePhase = (time * strobeRate) % 1
    const isFlash = strobePhase < 0.08

    let opacity = 0
    let scale = 1
    let textColor = color

    if (phase === 'enter') {
      // Text appears via increasingly frequent strobe reveals
      const revealRate = enterProgress * strobeRate * 2
      const revealPhase = (time * revealRate) % 1
      const shouldShow = revealPhase < 0.15 || enterProgress > 0.8
      opacity = shouldShow ? Math.min(1, enterProgress * 2) : 0
      scale = 1 + (1 - enterProgress) * 0.1
    } else if (phase === 'hold') {
      // Text only fully visible during strobe flashes, dim between
      if (isFlash) {
        opacity = 1
        scale = 1.02
        textColor = '#ffffff'
      } else {
        // Afterimage between flashes
        const timeSinceFlash = strobePhase
        opacity = Math.max(0.08, 0.5 * Math.exp(-timeSinceFlash * 8))
        scale = 1
      }
    } else {
      // Exit: strobes become less frequent, text fades
      const fadeRate = (1 - exitProgress) * strobeRate
      const fadePhase = (time * fadeRate) % 1
      const shouldShow = fadePhase < 0.1
      opacity = shouldShow ? 1 - exitProgress : Math.max(0, 0.1 * (1 - exitProgress))
      scale = 1 - exitProgress * 0.1
    }

    // Freeze-frame position offset during flash
    const freezeX = isFlash && phase === 'hold' ? Math.sin(f * 0.3 + index) * 2 : 0
    const freezeY = isFlash && phase === 'hold' ? Math.cos(f * 0.4 + index) * 1 : 0

    return (
      <>
        {/* Color afterimage ghost (slightly offset) */}
        {phase === 'hold' && !isFlash && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + 3px), calc(-50% + 2px))`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: color,
              opacity: 0.15,
              filter: 'blur(2px)',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${freezeX}px), calc(-50% + ${freezeY}px)) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: textColor,
            textShadow: isFlash
              ? `0 0 20px ${color}, 0 0 40px ${color}, 0 0 80px rgba(255,255,255,0.3)`
              : `0 0 5px ${color}40`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function StrobePulseComponent(props: MotionGraphicProps<StrobePulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-strobe-pulse',
  title: 'Kinetic Strobe Pulse',
  description:
    'Text visible only in strobe flashes with freeze-frame disco effect, afterimage persistence between pulses',
  tags: ['kinetic', 'typography', 'strobe', 'flash', 'disco', 'freeze', 'pulse', 'club', 'light'],
  category: 'captions',
  component: StrobePulseComponent as any,
  defaultConfig: {
    words: ['FLASH', 'PULSE', 'DROP', 'BEAT'],
    colors: ['#FF1493', '#00BFFF', '#FFD700', '#FF4500'],
    bgColor: '#050505',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLASH', 'PULSE', 'DROP', 'BEAT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF1493', '#00BFFF', '#FFD700', '#FF4500'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
