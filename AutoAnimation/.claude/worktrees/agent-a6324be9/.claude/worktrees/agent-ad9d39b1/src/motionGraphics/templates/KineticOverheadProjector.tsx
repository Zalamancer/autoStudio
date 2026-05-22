import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OverheadProjectorConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const flicker = 0.95 + Math.sin(time * 18) * 0.015 + Math.sin(time * 11.3) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Projection surface — slightly trapezoidal (keystone effect) */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '8%',
            right: '8%',
            bottom: '6%',
            background: `rgba(255,255,245,${0.04 * flicker})`,
            clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
          }}
        />
        {/* Transparency sheet edges — the acetate film border */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '14%',
            right: '14%',
            bottom: '12%',
            border: `2px solid rgba(200,210,220,${0.12 * flicker})`,
            background: `rgba(255,255,250,${0.02 * flicker})`,
            boxShadow: `inset 0 0 60px rgba(255,255,240,${0.03 * flicker})`,
          }}
        />
        {/* Overhead projector hot spot — bright center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 55%,
              rgba(255,250,230,${0.08 * flicker}) 0%,
              rgba(255,245,220,${0.03 * flicker}) 35%,
              transparent 65%)`,
          }}
        />
        {/* Fresnel lens ring artifacts */}
        {Array.from({ length: 4 }, (_, i) => {
          const radius = 15 + i * 12
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${radius * 2}%`,
                height: `${radius * 2}%`,
                borderRadius: '50%',
                border: `1px solid rgba(255,250,230,${0.02 - i * 0.004})`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Keystone distortion gradient — darker at top (further from lens) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Warm lamp color cast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,240,200,${0.015 * flicker})`,
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0
    let scaleY = 1
    let skewDeg = 0

    if (phase === 'enter') {
      // Transparency sliding onto the glass — enters from bottom
      if (enterProgress < 0.7) {
        const slideT = enterProgress / 0.7
        const eased = 1 - Math.pow(1 - slideT, 2)
        opacity = eased * 0.9
        translateY = (1 - eased) * 80
        // Slight vertical keystone as acetate is placed
        scaleY = 0.9 + eased * 0.1
        skewDeg = (1 - eased) * 2
      } else {
        // Settle into place with slight bounce
        const settleT = (enterProgress - 0.7) / 0.3
        opacity = 0.9 + settleT * 0.1
        translateY = Math.sin(settleT * Math.PI) * -3
        scaleY = 1
        skewDeg = 0
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      // Subtle hand-adjustment wobble
      translateY = Math.sin(holdProgress * Math.PI * 4) * 0.8
    } else {
      // Acetate pulled away
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateY = eased * -60
      scaleY = 1 - eased * 0.08
    }

    // Slight shadow offset simulating projection distance
    const shadowOffX = 2
    const shadowOffY = 3

    return (
      <>
        {/* Shadow / second exposure from projection distance */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shadowOffX}px), calc(-50% + ${translateY + shadowOffY}px)) scaleY(${scaleY}) skewY(${skewDeg}deg)`,
            opacity: opacity * 0.15,
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 900,
            color: '#000',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
        {/* Main projected text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleY(${scaleY}) skewY(${skewDeg}deg)`,
            opacity,
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            textShadow: `0 0 12px rgba(255,250,230,0.2)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function OverheadProjectorComponent(props: MotionGraphicProps<OverheadProjectorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-overhead-projector',
  title: 'Kinetic Overhead Projector',
  description:
    'Overhead projector transparency with Fresnel lens artifacts and keystone distortion. Text slides onto the glass surface from below with warm lamp flicker.',
  tags: ['kinetic', 'typography', 'overhead', 'projector', 'transparency', 'analog', 'classroom', 'acetate'],
  category: 'captions',
  component: OverheadProjectorComponent as any,
  defaultConfig: {
    words: ['CHAPTER 1', 'REVIEW', 'SUMMARY', 'QUESTIONS'],
    colors: ['#1a1a40', '#1a1a40', '#1a1a40', '#1a1a40'],
    bgColor: '#f5f0e0',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHAPTER 1', 'REVIEW', 'SUMMARY', 'QUESTIONS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a40', '#1a1a40', '#1a1a40', '#1a1a40'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
