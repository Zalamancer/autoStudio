import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ROICounterConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle upward-moving grid lines suggesting growth
    const gridLines = Array.from({ length: 8 }, (_, i) => {
      const baseY = 100 - ((time * 8 + i * 14) % 120)
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${baseY}%`,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.06) 30%, rgba(16,185,129,0.06) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {gridLines}
        {/* Bottom accent glow */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: 0,
            height: '15%',
            background: 'linear-gradient(0deg, rgba(16,185,129,0.08), transparent)',
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
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 0
    let displayText = word
    let scale = 1

    // Parse numeric value from word (e.g., "347%" or "+$12K")
    const numMatch = word.match(/[\d.]+/)
    const targetNum = numMatch ? parseFloat(numMatch[0]) : 0
    const prefix = word.replace(/[\d.]+.*/, '')
    const suffix = word.replace(/.*[\d.]/, (m) => word.substring(word.indexOf(m) + m.length))

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      // Counter rolls up from 0 to target
      const countProgress = Math.pow(enterProgress, 0.6) // Ease out
      const currentNum = targetNum * countProgress
      const decimals = word.includes('.') ? 1 : 0
      displayText = `${prefix}${currentNum.toFixed(decimals)}${suffix}`
      scale = 0.8 + enterProgress * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      displayText = word
      // Subtle pulse on the number
      scale = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02
    } else {
      opacity = 1 - Math.pow(exitProgress, 2)
      scale = 1 - exitProgress * 0.15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            color,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textShadow: `0 0 40px ${color}30, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {displayText}
        </div>
        {/* Underline accent */}
        <div
          style={{
            marginTop: 'clamp(8px, 2vw, 16px)',
            height: 3,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: phase === 'enter' ? enterProgress : phase === 'exit' ? 1 - exitProgress : 1,
            transform: `scaleX(${phase === 'enter' ? enterProgress : phase === 'exit' ? 1 - exitProgress : 1})`,
          }}
        />
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 2.5vw, 18px)',
            fontWeight: 600,
            color: `${color}90`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginTop: 'clamp(4px, 1vw, 10px)',
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.5) * 2) : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        >
          RETURN ON INVESTMENT
        </div>
      </div>
    )
  },
}

function KineticROICounterComponent(props: MotionGraphicProps<ROICounterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-roi-counter',
  title: 'ROI Counter',
  description: 'Animated ROI counting effect with numbers rolling up from zero. Professional green accent grid background with growth-suggesting motion.',
  tags: ['kinetic', 'roi', 'counter', 'marketing', 'business', 'analytics', 'growth', 'finance'],
  category: 'captions',
  component: KineticROICounterComponent as any,
  defaultConfig: {
    words: ['347%', '+$12K', '89%', '2.4x'],
    colors: ['#10B981', '#34D399', '#6EE7B7', '#10B981'],
    bgColor: '#0a1628',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Values', type: 'text-array', defaultValue: ['347%', '+$12K', '89%', '2.4x'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#10B981', '#34D399', '#6EE7B7', '#10B981'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
