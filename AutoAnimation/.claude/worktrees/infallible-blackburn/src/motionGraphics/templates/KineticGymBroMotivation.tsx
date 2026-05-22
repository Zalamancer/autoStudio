import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Subculture: Gym Bro Motivation — ultra bold, pulsing on beat, veins, sweat, preworkout energy
// Mechanic: text pounds in like a weight hitting the floor — seismic impact with aftershock ring

interface GymBroMotivationConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Industrial dark gym with sweat-drop texture and pulsing ring
    const pulseRing = (time * 4) % 1   // one ring every 0.25s — preworkout BPM
    const ringScale = 1 + pulseRing * 0.8
    const ringOpacity = Math.max(0, 0.2 - pulseRing * 0.2)

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #050505 100%)',
        }}
      >
        {/* Pulsing ring — heartbeat / preworkout energy */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 200,
            height: 200,
            border: '2px solid rgba(255,60,0,0.8)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 300,
            height: 300,
            border: '1px solid rgba(255,100,0,0.4)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${0.7 + pulseRing * 0.9})`,
            opacity: Math.max(0, 0.15 - pulseRing * 0.15),
          }}
        />

        {/* Gritty horizontal scan lines — gym security cam feel */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)' }} />

        {/* Bottom heat glow */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '25%', background: 'linear-gradient(0deg, rgba(255,50,0,0.06) 0%, transparent 100%)' }} />

        {/* Corner barbell accents */}
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: 30, height: 4, background: 'rgba(255,60,0,0.3)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '5%', right: '5%', width: 30, height: 4, background: 'rgba(255,60,0,0.3)', borderRadius: 2 }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    // Weight drop: slam down fast, floor shake, slight rebound
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

    let opacity = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let shake = 0

    if (phase === 'enter') {
      const e = easeOutQuint(enterProgress)
      opacity = Math.min(enterProgress * 8, 1)
      translateY = (1 - e) * -60   // slams from above
      // Impact squash: compress Y, expand X at landing
      if (enterProgress > 0.7) {
        const impact = (enterProgress - 0.7) / 0.3
        const squash = Math.sin(impact * Math.PI)
        scaleY = 1 - squash * 0.12
        scaleX = 1 + squash * 0.08
      }
      // Aftershock shake
      if (enterProgress > 0.8) {
        const post = (enterProgress - 0.8) / 0.2
        shake = Math.sin(post * Math.PI * 6) * (1 - post) * 5
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Veins-pumping micro pulse
      const pump = Math.abs(Math.sin(time * 5)) * 0.01
      scaleX = 1 + pump
      scaleY = 1 + pump * 0.5
    } else {
      opacity = Math.max(0, 1 - exitProgress * 2)
      scaleX = 1 + exitProgress * 0.1
      scaleY = 1 - exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${shake}px), -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(48px, 14vw, 190px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color,
          whiteSpace: 'nowrap',
          textShadow: `
            0 4px 0 rgba(0,0,0,0.8),
            0 8px 20px rgba(255,60,0,0.3),
            0 0 60px rgba(255,60,0,0.1)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function GymBroMotivationComponent(props: MotionGraphicProps<GymBroMotivationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gym-bro-motivation',
  title: 'Kinetic Gym Bro Motivation',
  description: 'Gym bro motivation: Impact text slams down like a weight drop with squash impact, aftershock shake, and pulsing rings',
  tags: ['kinetic', 'typography', 'gym', 'motivation', 'bold', 'fitness', 'subculture', 'impact', 'slam'],
  category: 'captions',
  component: GymBroMotivationComponent as any,
  defaultConfig: {
    words: ['GRIND', 'PUSH', 'LIFT', 'WIN'],
    colors: ['#ff3c00', '#ffffff', '#ff6622', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRIND', 'PUSH', 'LIFT', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff3c00', '#ffffff', '#ff6622', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
  ],
})
