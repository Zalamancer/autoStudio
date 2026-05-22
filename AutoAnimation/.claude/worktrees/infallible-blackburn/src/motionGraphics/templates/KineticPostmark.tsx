import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PostmarkConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Faint moving wavy cancellation lines sweeping across — the franking machine effect
    const lineCount = 6
    const sweepX = (time * 0.08 * width) % (width * 1.2) - width * 0.1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Wavy horizontal cancel lines running across the whole background — slow drift */}
        {Array.from({ length: lineCount }, (_, i) => {
          const yBase = (height * (i + 0.5)) / lineCount
          const amplitude = 6
          const wavelength = width / 3
          return (
            <div
              key={`cancel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: yBase - 1,
                height: 2,
                opacity: 0.04,
                background: `repeating-linear-gradient(
                  90deg,
                  rgba(0,0,0,0.5) 0px,
                  rgba(0,0,0,0.5) 18px,
                  transparent 18px,
                  transparent 24px
                )`,
                // Simulate wave shape via clip-path polygon
                clipPath: (() => {
                  const pts: string[] = []
                  const steps = 40
                  for (let s = 0; s <= steps; s++) {
                    const x = (s / steps) * 100
                    const y = 50 + (Math.sin((s / steps) * Math.PI * 2 * 3 + i) * amplitude / height) * 100
                    pts.push(`${x}% ${y}%`)
                  }
                  for (let s = steps; s >= 0; s--) {
                    const x = (s / steps) * 100
                    const y = 50 + (Math.sin((s / steps) * Math.PI * 2 * 3 + i) * amplitude / height) * 100 + 3
                    pts.push(`${x}% ${y}%`)
                  }
                  return `polygon(${pts.join(', ')})`
                })(),
              }}
            />
          )
        })}

        {/* Envelope corner marks — very faint */}
        {[
          { top: 8, left: 8 }, { top: 8, right: 8 },
          { bottom: 8, left: 8 }, { bottom: 8, right: 8 },
        ].map((pos, i) => (
          <div
            key={`corner-${i}`}
            style={{
              position: 'absolute',
              ...pos,
              width: 12,
              height: 12,
              borderTop: i < 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              borderBottom: i >= 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              borderLeft: i % 2 === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              borderRight: i % 2 === 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    // Postmark mechanic:
    // Enter — circular border "rolls in" from left as a rolling stamp wheel,
    //         wavy cancel lines sweep L→R across text, text fades in underneath
    // Exit  — everything wipes right then fades

    let textOpacity = 1
    let textBlur = 0
    let ringScale = 1
    let ringOpacity = 0
    let cancelProgress = 0  // 0→1 how far the cancel lines have swept across text
    let cancelOpacity = 0
    let translateX = 0

    if (phase === 'enter') {
      const t = easeOutQuint(enterProgress)
      textOpacity = easeInOutSine(Math.min(1, enterProgress * 1.8))
      textBlur = (1 - t) * 3
      ringScale = 0.4 + t * 0.6
      ringOpacity = Math.min(1, enterProgress * 3)
      cancelProgress = easeOutCubic(Math.min(1, enterProgress * 1.5))
      cancelOpacity = Math.min(0.55, enterProgress * 2) * (1 - Math.max(0, enterProgress - 0.7) / 0.3)
    } else if (phase === 'exit') {
      const t = easeOutCubic(exitProgress)
      textOpacity = 1 - t
      translateX = t * 30
      ringOpacity = Math.max(0, 1 - exitProgress * 2.5)
      cancelOpacity = Math.max(0, 0.55 - exitProgress * 2)
      cancelProgress = 1
    }

    const cancelWaveLines = 5

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateX(${translateX}px)`,
            opacity: textOpacity,
            filter: textBlur > 0.1 ? `blur(${textBlur.toFixed(2)}px)` : 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Courier', monospace",
              fontSize: 'clamp(36px, 9vw, 118px)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>

        {/* Wavy cancellation lines sweeping L→R over the text */}
        {cancelOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '85%',
              height: '55%',
              overflow: 'hidden',
              pointerEvents: 'none',
              opacity: cancelOpacity,
              // Clip to only show swept portion
              clipPath: `inset(0 ${(1 - cancelProgress) * 100}% 0 0)`,
            }}
          >
            {Array.from({ length: cancelWaveLines }, (_, i) => {
              const yPct = 10 + (i / (cancelWaveLines - 1)) * 80
              return (
                <div
                  key={`wave-${i}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${yPct}%`,
                    height: 2,
                    background: color,
                    opacity: 0.7,
                    // Wavy via border-radius trick + slight skew
                    borderRadius: '0 50% 50% 0 / 0 4px 4px 0',
                    transform: `skewY(${Math.sin(i * 1.3) * 1.5}deg)`,
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Postmark circle ring — rolls in from scale */}
        {ringOpacity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${ringScale})`,
              opacity: ringOpacity * 0.45,
              width: 'min(85%, 300px)',
              aspectRatio: '1',
              border: `4px solid ${color}`,
              borderRadius: '50%',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Inner ring — double circle postmark style */}
        {ringOpacity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${ringScale})`,
              opacity: ringOpacity * 0.25,
              width: 'min(72%, 258px)',
              aspectRatio: '1',
              border: `2px solid ${color}`,
              borderRadius: '50%',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function PostmarkComponent(props: MotionGraphicProps<PostmarkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-postmark',
  title: 'Postmark',
  description:
    'Cancellation wavy lines sweep left-to-right over text as a double-ring postmark circle scales in — mimicking the mechanical franking stamp on postal mail.',
  tags: ['kinetic', 'typography', 'postmark', 'postal', 'stamp', 'cancel', 'mail', 'vintage'],
  category: 'captions',
  component: PostmarkComponent as any,
  defaultConfig: {
    words: ['POSTED', 'MAILED', 'SENT', 'DELIVERED'],
    colors: ['#1A3A6B', '#1A3A6B', '#1A3A6B', '#1A3A6B'],
    bgColor: '#EDE8DC',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POSTED', 'MAILED', 'SENT', 'DELIVERED'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#1A3A6B', '#1A3A6B', '#1A3A6B', '#1A3A6B'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#EDE8DC', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
