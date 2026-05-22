import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Titration color change: background washes from acid yellow → indicator purple
// as the word "drips" in from a burette above, then fades clean on exit.

interface TitrationDropConfig extends KineticBaseConfig {
  acidColor: string
  equivalenceColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    // slow oscillation so background gently pulses in the hold phase
    const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 0.4)
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          opacity: 0.85 + pulse * 0.15,
        }}
      />
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    holdProgress,
    phase,
    width,
    height,
    frame = 0,
  }: WordRenderProps) => {
    // eased enter: text "drips" down from above
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easedEnter = easeOut(enterProgress)

    // vertical drop: starts 60px above center, lands at center
    const dropY = phase === 'enter' ? (1 - easedEnter) * -60 : 0
    const opacity =
      phase === 'enter'
        ? easedEnter
        : phase === 'exit'
          ? 1 - exitProgress
          : 1

    // color wash: interpolate from a pale yellow tint toward the word color
    // simulating the pH indicator changing at equivalence point
    const washProgress =
      phase === 'enter' ? easedEnter : phase === 'hold' ? 1 : 1 - exitProgress
    const r1 = 255; const g1 = 243; const b1 = 100   // acid yellow
    const r2 = 180; const g2 = 0;   const b2 = 220   // indicator purple
    const rM = Math.round(r1 + (r2 - r1) * washProgress)
    const gM = Math.round(g1 + (g2 - g1) * washProgress)
    const bM = Math.round(b1 + (b2 - b1) * washProgress)
    const washColor = `rgb(${rM},${gM},${bM})`

    // drop ripple ring during hold
    const rippleScale = phase === 'hold' ? 1 + holdProgress * 0.6 : 1
    const rippleOpacity = phase === 'hold' ? (1 - holdProgress) * 0.5 : 0

    // subtle drip indicator: a small circle above the text during enter
    const dripVisible = phase === 'enter'
    const dripY = (1 - easedEnter) * -80

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* drip dot */}
        {dripVisible && (
          <div
            style={{
              position: 'absolute',
              top: dripY - 14,
              width: 10,
              height: 14,
              borderRadius: '50% 50% 60% 60%',
              background: washColor,
              opacity: easedEnter * 0.9,
            }}
          />
        )}

        {/* ripple ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 120,
            height: 40,
            borderRadius: '50%',
            border: `2px solid ${washColor}`,
            transform: `translate(-50%, -50%) scale(${rippleScale})`,
            opacity: rippleOpacity,
            pointerEvents: 'none',
          }}
        />

        {/* main word */}
        <div
          style={{
            transform: `translateY(${dropY}px)`,
            opacity,
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 110px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color,
            textShadow: `0 0 ${12 * washProgress}px ${washColor}`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function TitrationDropComponent(props: MotionGraphicProps<TitrationDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-titration-drop',
  title: 'Titration Drop',
  description:
    'Text drips in like a burette drop with a pH indicator color wash — acid yellow to indicator purple — mimicking a titration at equivalence point.',
  tags: ['kinetic', 'typography', 'chemistry', 'lab', 'titration', 'color', 'science'],
  category: 'captions',
  component: TitrationDropComponent as any,
  defaultConfig: {
    words: ['REACT', 'CHANGE', 'SHIFT', 'EQUAL'],
    colors: ['#cc00ee', '#9900cc', '#7700aa', '#cc00ee'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.6,
    acidColor: '#fff364',
    equivalenceColor: '#cc00ee',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REACT', 'CHANGE', 'SHIFT', 'EQUAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#cc00ee', '#9900cc', '#7700aa', '#cc00ee'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'acidColor', label: 'Acid Color', type: 'color', defaultValue: '#fff364', group: 'Style' },
    { key: 'equivalenceColor', label: 'Equivalence Color', type: 'color', defaultValue: '#cc00ee', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.8, max: 5, group: 'Timing' },
  ],
})
