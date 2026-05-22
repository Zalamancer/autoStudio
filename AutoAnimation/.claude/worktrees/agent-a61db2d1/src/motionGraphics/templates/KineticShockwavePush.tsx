import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShockwavePushConfig extends KineticBaseConfig {
  waveIntensity: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Shockwave ripple ring expanding from center
    const t = (frame / fps) % 2 // 2 second cycle
    const ringProgress = (t / 2) // 0..1 over 2 seconds
    const ringRadius = ringProgress * Math.max(width, height) * 0.8
    const ringOpacity = Math.max(0, 0.4 * (1 - ringProgress))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Expanding shockwave ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            width: ringRadius * 2,
            height: ringRadius * 2,
            borderRadius: '50%',
            border: `3px solid rgba(255,200,100,${ringOpacity})`,
            boxShadow: `0 0 ${20 * (1 - ringProgress)}px rgba(255,200,100,${ringOpacity * 0.5})`,
            pointerEvents: 'none',
          }}
        />
        {/* Inner glow at epicenter */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,200,100,0.1) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

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
          const centerIndex = (totalChars - 1) / 2
          const distFromCenter = ci - centerIndex
          const normalized = totalChars > 1 ? distFromCenter / Math.max(Math.abs(distFromCenter + 0.001), 1) : 0
          // Distance factor: chars far from center get pushed more
          const distFactor = Math.abs(ci - centerIndex) / Math.max(centerIndex, 1)

          let translateX = 0
          let translateY = 0
          let scale = 1
          let opacity = 0
          let scaleX = 1
          let scaleY = 1

          if (phase === 'enter') {
            // Text starts at center, shockwave hits and pushes chars outward
            // then elastic spring pulls them back to resting position
            opacity = Math.min(1, enterProgress * 3)

            if (enterProgress < 0.3) {
              // Impact moment: shockwave arrives, sudden outward push
              const shockT = enterProgress / 0.3
              const push = Math.sin(shockT * Math.PI) // peaks at 0.5 then recedes
              const pushDist = push * (60 + distFactor * 80)
              translateX = (distFromCenter >= 0 ? 1 : -1) * pushDist
              translateY = -push * 30
              scaleX = 1 + push * 0.3
              scaleY = 1 - push * 0.2
              scale = 1 + push * 0.1
            } else {
              // Spring back to rest with elastic overshoot
              const returnT = (enterProgress - 0.3) / 0.7
              const sprung = elasticOut(returnT)
              const peakPushX = (distFromCenter >= 0 ? 1 : -1) * (60 + distFactor * 80)
              translateX = peakPushX * (1 - sprung)
              translateY = -30 * (1 - sprung)
              scaleX = 1 + (1 - sprung) * 0.2
              scaleY = 1 - (1 - sprung) * 0.15
            }
          } else if (phase === 'hold') {
            opacity = 1
            // Residual ripple — chars still vibrate slightly from wave energy
            const rippleDecay = Math.exp(-holdProgress * 5)
            const rippleFreq = 6 + distFactor * 4
            translateX = Math.sin(holdProgress * Math.PI * rippleFreq + ci * 1.1) * rippleDecay * 6
            translateY = Math.cos(holdProgress * Math.PI * rippleFreq * 0.7 + ci * 0.8) * rippleDecay * 4
          } else {
            // Exit: another shockwave pushes all chars outward simultaneously
            const shockT = exitProgress
            const push = easeOutCubic(shockT)
            translateX = (distFromCenter >= 0 ? 1 : -1) * push * (80 + distFactor * 100)
            translateY = -push * 50
            scale = 1 - push * 0.3
            opacity = 1 - push
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
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center center',
                textShadow: `3px 3px 0 rgba(0,0,0,0.4), 0 0 ${10 * (1 - Math.min(enterProgress, 1))}px ${color}40`,
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

function ShockwavePushComponent(props: MotionGraphicProps<ShockwavePushConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shockwave-push',
  title: 'Kinetic Shockwave Push',
  description: 'A shockwave ripple emanates from center and blasts letters outward, then elastic springs pull them back to resting position',
  tags: ['kinetic', 'typography', 'shockwave', 'physics', 'ripple', 'push', 'elastic', 'explosion'],
  category: 'captions',
  component: ShockwavePushComponent as any,
  defaultConfig: {
    words: ['BOOM', 'BLAST', 'SHOCK', 'WAVE'],
    colors: ['#FCD34D', '#F97316', '#EF4444', '#FBBF24'],
    bgColor: '#0C0800',
    cycleDuration: 1.6,
    waveIntensity: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM', 'BLAST', 'SHOCK', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FCD34D', '#F97316', '#EF4444', '#FBBF24'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'waveIntensity', label: 'Wave Intensity', type: 'number', defaultValue: 100, min: 20, max: 200, group: 'Animation' },
  ],
})
