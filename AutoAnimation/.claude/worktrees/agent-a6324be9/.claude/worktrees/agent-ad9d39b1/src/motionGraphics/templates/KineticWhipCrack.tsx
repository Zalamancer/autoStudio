import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WhipCrackConfig extends KineticBaseConfig {
  whipSpeed: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Speed lines hint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '80px 100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          // Whip: tip arrives first, handle trails behind
          // Last character is the "tip" — arrives fastest
          const tipIndex = totalChars - 1
          const isTip = ci === tipIndex
          // Delay increases toward the handle (index 0)
          const whipDelay = ((tipIndex - ci) / Math.max(totalChars - 1, 1)) * 0.45

          let translateX = 0
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 0
          let skewX = 0
          let brightness = 1

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - whipDelay) / (1 - whipDelay)))

            // 0..0.6: exponential acceleration from far left (whip travel)
            // 0.6..1: elastic snap at endpoint
            if (p < 0.6) {
              const travelT = p / 0.6
              const eased = easeInExpo(travelT)
              const startX = -width * 0.9
              translateX = startX * (1 - eased)
              // Horizontal smear during whip
              scaleX = 1 + (1 - travelT) * 2.5
              scaleY = 1 - (1 - travelT) * 0.4
              skewX = (1 - travelT) * -20
              opacity = Math.min(1, travelT * 3)
              brightness = 1 + (1 - travelT) * 0.5
            } else {
              const snapT = (p - 0.6) / 0.4
              const snap = elasticOut(snapT)
              // Micro-overshoot past zero then settle
              const overshoot = isTip ? 30 : 10
              translateX = overshoot * Math.sin(snapT * Math.PI) * (1 - snapT)
              translateY = isTip
                ? Math.sin(snapT * Math.PI * 3) * (1 - snapT) * 25
                : 0
              scaleX = 1 + (1 - snap) * 0.3
              scaleY = 1
              skewX = (1 - snapT) * -5
              opacity = 1
              brightness = 1 + (1 - snapT) * 0.3
            }
          } else if (phase === 'hold') {
            opacity = 1
            // Crack vibration — tip vibrates more
            const vibAmp = isTip ? 5 : 2
            const decay = Math.exp(-holdProgress * 6)
            translateY = Math.sin(holdProgress * Math.PI * 8 + ci * 0.6) * decay * vibAmp
            scaleX = 1 + Math.sin(holdProgress * Math.PI * 6) * decay * 0.02
          } else {
            // Exit: whip retracts toward right (reverse of entry)
            const p = exitProgress
            const eased = easeInExpo(p)
            translateX = width * 0.9 * eased
            scaleX = 1 + eased * 2
            scaleY = 1 - eased * 0.5
            skewX = eased * 20
            opacity = 1 - Math.pow(p, 1.5)
          }

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                opacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
                transformOrigin: 'center center',
                filter: `brightness(${brightness})`,
                textShadow: '4px 0 0 rgba(0,0,0,0.3)',
                lineHeight: 1,
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function WhipCrackComponent(props: MotionGraphicProps<WhipCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-whip-crack',
  title: 'Kinetic Whip Crack',
  description: 'Text whips in from the left with exponential acceleration — the tip letter arrives first with a snap, the handle trails behind with a smear',
  tags: ['kinetic', 'typography', 'whip', 'crack', 'snap', 'physics', 'fast', 'impact'],
  category: 'captions',
  component: WhipCrackComponent as any,
  defaultConfig: {
    words: ['CRACK', 'WHIP', 'SNAP', 'LASH'],
    colors: ['#F59E0B', '#EF4444', '#FBBF24', '#F97316'],
    bgColor: '#111111',
    cycleDuration: 1.3,
    whipSpeed: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRACK', 'WHIP', 'SNAP', 'LASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F59E0B', '#EF4444', '#FBBF24', '#F97316'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 5, group: 'Timing' },
    { key: 'whipSpeed', label: 'Whip Speed', type: 'number', defaultValue: 8, min: 2, max: 20, group: 'Animation' },
  ],
})
