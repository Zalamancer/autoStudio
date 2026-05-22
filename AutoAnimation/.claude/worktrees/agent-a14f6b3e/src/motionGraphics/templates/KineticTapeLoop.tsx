import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Position Rhythm 4/4 — Tape Loop
// Text scrolls in a continuous looping tape reel pattern with wow/flutter wobble

interface TapeLoopConfig extends KineticBaseConfig {
  tapeDrift: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Tape noise grain effect
    const grain = Math.sin(t * 30 + 0.5) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Tape guide lines */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,220,150,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,220,150,0.08)',
          }}
        />
        {/* Reel hole on left and right */}
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: 'absolute',
              top: '50%',
              left: side === -1 ? 30 : undefined,
              right: side === 1 ? 30 : undefined,
              transform: `translateY(-50%) rotate(${t * 60}deg)`,
              width: 36,
              height: 36,
              border: '3px solid rgba(255,220,150,0.15)',
              borderRadius: '50%',
            }}
          />
        ))}
        {/* Tape wear vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,220,150,${Math.abs(grain)})`,
            mixBlendMode: 'overlay' as any,
            opacity: 0.3,
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
    width,
  }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let skewX = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      translateX = (1 - enterProgress) * width * 0.5
    } else if (phase === 'hold') {
      opacity = 1
      // Tape wow: low-frequency pitch wobble → position drift
      const wow = Math.sin(holdProgress * Math.PI * 1.7) * 8
      // Tape flutter: higher-frequency micro-wobble
      const flutter = Math.sin(holdProgress * Math.PI * 11) * 2.5
      // Loop scroll: text drifts left slowly then snaps back
      const scrollPhase = (holdProgress * 2) % 1
      translateX = wow + flutter + (scrollPhase > 0.9 ? (1 - scrollPhase) * 10 * width * -0.02 : scrollPhase * -12)
      translateY = Math.sin(holdProgress * Math.PI * 3) * 4
      skewX = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * -width * 0.4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) skewX(${skewX}deg)`,
          opacity,
          fontSize: 'clamp(46px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Courier New', 'Courier', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          textShadow: `2px 0 8px ${color}40, -1px 0 4px rgba(255,150,50,0.3)`,
          filter: `saturate(${0.7 + Math.sin(holdProgress * Math.PI * 4) * 0.3})`,
        }}
      >
        {word}
      </div>
    )
  },
}

function TapeLoopComponent(props: MotionGraphicProps<TapeLoopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tape-loop',
  title: 'Kinetic Tape Loop',
  description:
    'Text drifts and wobbles in a continuous tape loop pattern with analog wow/flutter pitch wobble and reel guide lines.',
  tags: ['kinetic', 'position', 'tape', 'loop', 'analog', 'wow', 'flutter', 'lofi', 'music'],
  category: 'captions',
  component: TapeLoopComponent as any,
  defaultConfig: {
    words: ['LOOP', 'TAPE', 'REEL'],
    colors: ['#D4A853', '#C8905A', '#B87333'],
    bgColor: '#1A1205',
    cycleDuration: 1.4,
    tapeDrift: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOOP', 'TAPE', 'REEL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A853', '#C8905A', '#B87333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1205', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 6, group: 'Timing' },
    { key: 'tapeDrift', label: 'Tape Drift', type: 'number', defaultValue: 8, min: 2, max: 30, group: 'Animation' },
  ],
})
