import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Bounce Patterns 3/4 — 4-on-the-Floor Stomp
// Hard, equally-spaced 4/4 kick pattern: no swing, pure mechanical stomp

interface FourOnFloorConfig extends KineticBaseConfig {
  stompHeight: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const beatFreq = 4.0 // 4 hits per second reference
    const beatPhase = (t * beatFreq) % 1
    // Flash on beat 1
    const flashIntensity = beatPhase < 0.08 ? (1 - beatPhase / 0.08) * 0.18 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Stomp flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${flashIntensity})`,
          }}
        />
        {/* Beat dots row */}
        {[0, 1, 2, 3].map((i) => {
          const dotPhase = ((t * beatFreq) - i) % 4
          const hit = dotPhase >= 0 && dotPhase < 0.15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 28,
                left: `${15 + i * 23}%`,
                width: hit ? 18 : 12,
                height: hit ? 18 : 12,
                borderRadius: '50%',
                background: hit ? '#ffffff' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.04s',
              }}
            />
          )
        })}
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
    height,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleY = 1
    let scaleX = 1

    if (phase === 'enter') {
      opacity = easeOutExpo(enterProgress)
      // Slam down from top
      translateY = (1 - easeOutExpo(enterProgress)) * -height * 0.45
      if (enterProgress > 0.85) {
        const impact = (enterProgress - 0.85) / 0.15
        scaleX = 1 + impact * 0.12
        scaleY = 1 - impact * 0.1
      }
    } else if (phase === 'hold') {
      opacity = 1
      // 4-on-floor: exactly 4 equal stomps per hold
      const t = holdProgress * Math.PI * 8 // 4 cycles
      const stomp = Math.max(0, -Math.sin(t))
      // Each stomp: sharp attack downward, quick recovery
      const stompDown = stomp * 10
      translateY = stompDown
      scaleX = 1 + stomp * 0.08
      scaleY = 1 - stomp * 0.06
    } else {
      opacity = 1 - exitProgress * exitProgress
      translateY = exitProgress * height * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontSize: 'clamp(52px, 14vw, 180px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textShadow: `0 8px 0 rgba(0,0,0,0.4), 0 0 40px ${color}30`,
        }}
      >
        {word}
      </div>
    )
  },
}

function FourOnFloorComponent(props: MotionGraphicProps<FourOnFloorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-four-on-floor',
  title: 'Kinetic Four on Floor',
  description:
    '4-on-the-floor stomp pattern: four equally-spaced, mechanical beat hits per hold cycle. EDM/house kick drum energy with impact squash.',
  tags: ['kinetic', 'bounce', '4/4', 'stomp', 'edm', 'house', 'kick', 'drum', 'beat', 'music'],
  category: 'captions',
  component: FourOnFloorComponent as any,
  defaultConfig: {
    words: ['FOUR', 'ON', 'THE', 'FLOOR'],
    colors: ['#00F5FF', '#FF006E', '#FFFFFF', '#00F5FF'],
    bgColor: '#050014',
    cycleDuration: 0.9,
    stompHeight: 10,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOUR', 'ON', 'THE', 'FLOOR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00F5FF', '#FF006E', '#FFFFFF', '#00F5FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050014', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 3, group: 'Timing' },
    { key: 'stompHeight', label: 'Stomp Height', type: 'number', defaultValue: 10, min: 2, max: 40, group: 'Animation' },
  ],
})
