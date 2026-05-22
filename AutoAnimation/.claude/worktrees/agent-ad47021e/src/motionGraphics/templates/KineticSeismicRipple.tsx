import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Wave Distortion 4: Seismic Ripple ────────────────────────────────────────
// Text is struck by a seismic shockwave — rings expand from impact point,
// per-character vertical displacement ripples outward from center.

interface SeismicRippleConfig extends KineticBaseConfig {
  magnitude: number
  rippleDecay: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ground cracks graphic */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: `linear-gradient(to top, rgba(120,80,0,0.12) 0%, transparent 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(ellipse at 50% 100%, rgba(180,100,0,0.08) 0%, transparent 50%)`,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Seismic wave clock — fast oscillation that decays
    const decay = Math.exp(-holdProgress * 3.5)
    const seismicAmp = 22 * decay

    // Ripple rings from center
    const RING_COUNT = 3
    const rings = (phase === 'enter' || phase === 'hold')
      ? Array.from({ length: RING_COUNT }, (_, ri) => {
          const ringDelay = ri * 0.15
          let ringProgress = 0
          if (phase === 'enter') ringProgress = Math.max(0, (enterProgress - ringDelay) / (1 - ringDelay))
          else ringProgress = Math.min(1, holdProgress * 2 + ri * 0.1)

          const ringScale = ringProgress * 4
          const ringOp = Math.max(0, (1 - ringProgress) * (phase === 'enter' ? 0.8 : 0.3))

          return (
            <div key={ri} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 60, height: 20,
              marginLeft: -30, marginTop: -10,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              transform: `scale(${ringScale})`,
              opacity: ringOp,
              pointerEvents: 'none',
            }} />
          )
        })
      : []

    // Ground shake lines
    const groundLines = Array.from({ length: 4 }, (_, i) => {
      const amplitude = seismicAmp * (1 - i * 0.2)
      const shakeX = Math.sin((holdProgress * 20) + i * 1.5) * amplitude * 0.5
      return (
        <div key={i} style={{
          position: 'absolute',
          bottom: `${5 + i * 7}%`,
          left: 0, right: 0, height: 1,
          background: `rgba(200,150,0,${0.15 - i * 0.03})`,
          transform: `translateX(${shakeX}px)`,
        }} />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {groundLines}
        {rings}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {chars.map((ch, ci) => {
            // Distance from center char
            const centerIdx = (totalChars - 1) / 2
            const distFromCenter = Math.abs(ci - centerIdx) / Math.max(1, centerIdx)

            // Ripple: wave propagates outward from center
            const ripplePhase = distFromCenter * Math.PI * 1.5
            const rippleY = Math.sin(holdProgress * Math.PI * 8 - ripplePhase) * seismicAmp * (1 - distFromCenter * 0.3)
            const rippleRot = Math.cos(holdProgress * Math.PI * 6 - ripplePhase) * 4 * decay

            let tx = 0, ty = rippleY, rot = rippleRot, op = 0, scY = 1, blur = 0

            if (phase === 'enter') {
              // Slam down from above, bounce on impact
              const delay = distFromCenter * 0.1
              const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay * 0.5)))
              const e = easeOutCubic(p)
              ty = (1 - e) * -height * 0.8 + rippleY * enterProgress
              op = Math.min(1, p * 3)
              scY = 0.2 + e * 0.8
              // Impact squash at the bottom
              if (p > 0.7) {
                const impact = (p - 0.7) / 0.3
                scY = 1 - Math.sin(impact * Math.PI) * 0.25
              }
              blur = (1 - e) * 5
            } else if (phase === 'hold') {
              op = 1
              ty = rippleY
              rot = rippleRot
            } else {
              const p = easeInCubic(exitProgress)
              op = 1 - p
              ty = rippleY + p * height * 0.6
              blur = p * 10
              scY = 1 - p * 0.5
            }

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(46px, 11vw, 146px)',
                  fontWeight: 900,
                  color,
                  opacity: op,
                  filter: `blur(${blur}px)`,
                  transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scaleY(${scY})`,
                  transformOrigin: 'center bottom',
                  textShadow: `0 4px 12px rgba(0,0,0,0.6), 0 0 20px ${color}40`,
                  lineHeight: 1,
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}

function SeismicRippleComponent(props: MotionGraphicProps<SeismicRippleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-seismic-ripple',
  title: 'Kinetic Seismic Ripple',
  description: 'Text slams down and sends a seismic shockwave — ripple rings expand, per-character wave propagates outward from center, decays over hold.',
  tags: ['kinetic', 'typography', 'seismic', 'ripple', 'wave', 'shockwave', 'impact', 'distortion'],
  category: 'captions',
  component: SeismicRippleComponent as any,
  defaultConfig: {
    words: ['QUAKE', 'SLAM', 'SHOCK', 'HIT'],
    colors: ['#FFFFFF', '#FF9900', '#FFFFFF', '#FFD700'],
    bgColor: '#0a0600',
    cycleDuration: 1.8,
    magnitude: 22,
    rippleDecay: 3.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['QUAKE', 'SLAM', 'SHOCK', 'HIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF9900', '#FFFFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0600', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.8, max: 5, group: 'Timing' },
    { key: 'magnitude', label: 'Magnitude (px)', type: 'number', defaultValue: 22, min: 5, max: 60, group: 'Animation' },
    { key: 'rippleDecay', label: 'Ripple Decay', type: 'number', defaultValue: 3.5, min: 1, max: 8, group: 'Animation' },
  ],
})
