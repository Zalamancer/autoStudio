import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeightSlamConfig extends KineticBaseConfig {}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Industrial steel gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(40,40,50,0.3) 0%, transparent 30%, rgba(20,20,25,0.5) 100%)',
          }}
        />
        {/* Floor line */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />
        {/* Horizontal weight plate stripes */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${25 + i * 18}%`,
              left: 0,
              right: 0,
              height: '1px',
              background: `rgba(255,60,30,${0.04 - i * 0.01})`,
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
    holdProgress,
    exitProgress,
    phase,
    height,
    index,
    frame,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let rotation = 0

    // Impact shake
    let shakeX = 0
    let shakeY = 0

    if (phase === 'enter') {
      // Slam down from above with acceleration
      if (enterProgress < 0.5) {
        // Falling
        const fallT = enterProgress / 0.5
        const eased = easeInQuad(fallT)
        translateY = -height * 0.6 * (1 - eased)
        opacity = Math.min(1, fallT * 2)
        scaleY = 1 + fallT * 0.1
        scaleX = 1 - fallT * 0.05
      } else {
        // Impact and settle
        const impactT = (enterProgress - 0.5) / 0.5
        const bounceEased = easeOutBounce(impactT)
        translateY = 0

        // Squash on impact
        if (impactT < 0.15) {
          const squashT = impactT / 0.15
          scaleX = 1 + squashT * 0.35
          scaleY = 1 - squashT * 0.2
        } else {
          const recoverT = (impactT - 0.15) / 0.85
          scaleX = 1.35 - recoverT * 0.35
          scaleY = 0.8 + recoverT * 0.2
        }

        // Screen shake on impact
        if (impactT < 0.3) {
          const shakeIntensity = (1 - impactT / 0.3) * 8
          shakeX = (rand(frame * 7 + index) - 0.5) * shakeIntensity
          shakeY = (rand(frame * 11 + index) - 0.5) * shakeIntensity
        }
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Heavy breathing / settling
      const breathe = Math.sin(holdProgress * Math.PI * 3) * 0.015
      scaleX = 1 + breathe
      scaleY = 1 - breathe * 0.5
    } else {
      // Exit: crack and fall through floor
      opacity = 1 - exitProgress * exitProgress
      translateY = exitProgress * exitProgress * height * 0.5
      rotation = exitProgress * 3
      scaleY = 1 - exitProgress * 0.2
    }

    // Impact cracks during enter
    const showCracks = phase === 'enter' && enterProgress > 0.5 && enterProgress < 0.8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px)) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
          transformOrigin: 'center bottom',
          opacity,
        }}
      >
        {/* Impact crack lines */}
        {showCracks && (
          <>
            {[0, 1, 2, 3].map((i) => {
              const angle = -60 + i * 40
              const len = 20 + rand(i * 17) * 30
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '50%',
                    width: `${len}px`,
                    height: '2px',
                    background: `linear-gradient(90deg, ${color}60, transparent)`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'left center',
                    opacity: 0.6,
                  }}
                />
              )
            })}
          </>
        )}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(52px, 15vw, 190px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            textShadow: `
              0 6px 20px rgba(0,0,0,0.8),
              0 0 10px ${color}40
            `,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WeightSlamComponent(props: MotionGraphicProps<WeightSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weight-slam',
  title: 'Weight Slam',
  description:
    'Text slams down like heavy weights hitting the floor. Accelerating fall, impact squash, screen shake, and crack effects on landing.',
  tags: ['kinetic', 'weight', 'slam', 'heavy', 'gym', 'fitness', 'impact', 'power'],
  category: 'captions',
  component: WeightSlamComponent as any,
  defaultConfig: {
    words: ['SLAM', 'HEAVY', 'IRON', 'LIFT'],
    colors: ['#FF2200', '#CC1100', '#FF4433', '#DD2211'],
    bgColor: '#080808',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLAM', 'HEAVY', 'IRON', 'LIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF2200', '#CC1100', '#FF4433', '#DD2211'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
