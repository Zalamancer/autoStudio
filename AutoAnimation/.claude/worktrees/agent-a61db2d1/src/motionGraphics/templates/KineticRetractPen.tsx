import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetractPenConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Pen barrel */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '5%',
          transform: 'translateX(-50%)',
          width: 32,
          height: '90%',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.3)',
        }}
      />
      {/* Click button at top */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '3%',
          transform: 'translateX(-50%)',
          width: 28,
          height: 24,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '8px 8px 4px 4px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      />
      {/* Clip on side */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% + 16px)',
          top: '6%',
          width: 8,
          height: '45%',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
  }: WordRenderProps) => {
    // Text clicks OUT from pen tip (bottom), then clicks back in on exit
    // The mechanism: text emerges from center, expanding/translating outward
    let clipHeight = 0        // how much of the text is revealed (0..height)
    let translateY = 0        // text offset
    let opacity = 1
    let scaleX = 1
    let jitterY = 0
    let clickFlash = 0

    const textFullY = 0 // final resting Y

    if (phase === 'enter') {
      // Click sound moment at enterProgress ~0 (immediate mechanical click)
      if (enterProgress < 0.08) {
        // Click frame — quick compression then release
        jitterY = Math.sin(enterProgress * Math.PI * 20) * 4
        clickFlash = Math.sin(enterProgress * Math.PI / 0.08) * 0.4
      }
      // Text slides out from behind/through pen tip
      const slideT = Math.max(0, (enterProgress - 0.05) / 0.95)
      const slid = easeOutBack(Math.min(1, slideT))
      clipHeight = slid
      translateY = (1 - slid) * 60
      scaleX = 0.8 + 0.2 * slid
      opacity = Math.min(1, slideT * 3)
    } else if (phase === 'hold') {
      clipHeight = 1
      // Tiny wobble from vibration
      jitterY = Math.sin(holdProgress * Math.PI * 20) * Math.exp(-holdProgress * 8) * 2
      translateY = textFullY
      opacity = 1
    } else {
      // Click back in — fast retraction
      const retractT = easeInCubic(exitProgress)
      clipHeight = 1 - retractT
      translateY = retractT * 60
      scaleX = 1 - retractT * 0.2
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
      if (exitProgress < 0.1) {
        clickFlash = Math.sin(exitProgress * Math.PI / 0.1) * 0.3
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Click flash overlay */}
        {clickFlash > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${clickFlash * 0.15})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Text with clip mask — slides out from center */}
        <div
          style={{
            transform: `translateY(${translateY + jitterY}px) scaleX(${scaleX})`,
            opacity,
            // clipPath clips from bottom, revealing upward as text clicks out
            clipPath: `inset(0 0 ${(1 - clipHeight) * 100}% 0)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Ink dot / tip indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
              opacity: clipHeight > 0.1 ? 1 : 0,
            }}
          />
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 138px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Courier New', 'Courier', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: `1px 2px 0 rgba(0,0,0,0.5), 0 0 30px ${color}55`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function RetractPenComponent(props: MotionGraphicProps<RetractPenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-retract-pen',
  title: 'Retractable Pen',
  description:
    'Click mechanism fires — text clicks out from pen tip with clip-path reveal and mechanical jitter, clicks back in on exit.',
  tags: ['kinetic', 'typography', 'pen', 'click', 'retract', 'mechanical', 'spring', 'office'],
  category: 'captions',
  component: RetractPenComponent as any,
  defaultConfig: {
    words: ['CLICK', 'WRITE', 'INK', 'SIGN'],
    colors: ['#4FC3F7', '#81C784', '#FFB74D', '#F48FB1'],
    bgColor: '#111827',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CLICK', 'WRITE', 'INK', 'SIGN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4FC3F7', '#81C784', '#FFB74D', '#F48FB1'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
