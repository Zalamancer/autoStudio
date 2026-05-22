import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpringPopConfig extends KineticBaseConfig {}

// Text springs UP from below with elastic wobble + confetti/sparkle burst on arrival.

const CONFETTI_COUNT = 24
const CONFETTI_COLORS = ['#FF2200', '#FFD700', '#00CC55', '#00AAFF', '#FF44CC', '#FF8800']

type ConfettiShape = { angle: number; dist: number; size: number; rotation: number; color: string; type: 'rect' | 'circle' | 'star'; speed: number }

function buildConfetti(seed: number): ConfettiShape[] {
  const shapes: ConfettiShape[] = []
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const s = seed + i * 53 + 19
    shapes.push({
      angle: (i / CONFETTI_COUNT) * 360 + ((s * 17) % 20) - 10,
      dist: 0.35 + (s % 40) / 100,
      size: 8 + (s % 10),
      rotation: (s * 31) % 360,
      color: CONFETTI_COLORS[s % CONFETTI_COLORS.length],
      type: (['rect', 'circle', 'star'] as const)[s % 3],
      speed: 0.7 + (s % 30) / 100,
    })
  }
  return shapes
}

function StarShape({ size, color }: { size: number; color: string }) {
  return <div style={{ width: size, height: size, background: color, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const bounce = 0.5 + Math.sin((frame / fps) * 5) * 0.08
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 65% at 50% 55%, rgba(255,255,255,${bounce * 0.18}) 0%, transparent 68%)` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 2px, transparent 2px)', backgroundSize: '22px 22px' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 97 + 41
    const confetti = buildConfetti(seed)
    const maxRadius = Math.max(width, height) * 0.65
    const tilt = ((seed % 9) - 4) * 1.8

    let translateY = 0, textScale = 1, textOpacity = 0
    let confettiProgress = 0, confettiOpacity = 0, containerOpacity = 1

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.5) {
        const riseT = t / 0.5
        const eased = 1 - Math.pow(1 - riseT, 2.5)
        translateY = height * 1.5 * (1 - eased) + (-height * 0.12) * eased
        textScale = 0.6 + eased * 0.7
        textOpacity = Math.min(1, riseT * 2.5)
        confettiProgress = eased * 0.6
        confettiOpacity = eased
      } else {
        const settleT = (t - 0.5) / 0.5
        translateY = -height * 0.12 * Math.cos(settleT * Math.PI * 2.2) * (1 - settleT)
        textScale = 1 + Math.sin(settleT * Math.PI * 2.5) * (1 - settleT) * 0.12
        textOpacity = 1
        confettiProgress = 0.6 + settleT * 0.4
        confettiOpacity = 1
      }
      containerOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      textScale = 1 + Math.sin((frame / 30) * 2.2 + seed) * 0.022
      textOpacity = 1; confettiProgress = 1; confettiOpacity = 0
    } else {
      const eased = exitProgress * exitProgress
      translateY = height * 1.2 * eased
      textScale = 1 - exitProgress * 0.3
      textOpacity = Math.max(0, 1 - exitProgress * 2.5)
      confettiOpacity = 0
      containerOpacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315]

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: Math.max(0, containerOpacity) }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
          {confetti.map((piece, i) => {
            const ap = Math.max(0, Math.min(1, confettiProgress / piece.speed))
            const eased = 1 - Math.pow(1 - ap, 2.2)
            const rad = (piece.angle * Math.PI) / 180
            const x = Math.cos(rad) * maxRadius * piece.dist * eased
            const y = Math.sin(rad) * maxRadius * piece.dist * eased
            const spin = piece.rotation + ap * 280
            const op = phase === 'hold' ? 0 : Math.max(0, confettiOpacity * (1 - ap * 0.6))
            return (
              <div key={i} style={{ position: 'absolute', transform: `translate(calc(${x}px - 50%), calc(${y + eased * eased * 15}px - 50%)) rotate(${spin}deg)`, opacity: op, pointerEvents: 'none' }}>
                {piece.type === 'circle' && <div style={{ width: piece.size, height: piece.size, borderRadius: '50%', background: piece.color }} />}
                {piece.type === 'rect' && <div style={{ width: piece.size * 0.7, height: piece.size * 1.3, background: piece.color }} />}
                {piece.type === 'star' && <StarShape size={piece.size} color={piece.color} />}
              </div>
            )
          })}
          {SPARKS.map((angle, i) => {
            const sp = Math.max(0, Math.min(1, confettiProgress * 1.6 - 0.2))
            const rad = (angle * Math.PI) / 180
            const d = maxRadius * 0.18 * sp
            const op = phase === 'hold' ? 0 : Math.max(0, confettiOpacity * (1 - sp * 0.8) * 0.9)
            return <div key={`sp${i}`} style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#fff', transform: `translate(calc(${Math.cos(rad) * d}px - 50%), calc(${Math.sin(rad) * d}px - 50%))`, opacity: op, boxShadow: `0 0 6px 3px ${color}` }} />
          })}
        </div>
        <div style={{ position: 'relative', transform: `translateY(${translateY}px) rotate(${tilt}deg) scale(${textScale})`, transformOrigin: 'center bottom', opacity: Math.max(0, textOpacity) }}>
          <div style={{ fontFamily: "Impact, 'Arial Black', sans-serif", fontSize: 'clamp(56px, 15vw, 200px)', fontWeight: 900, textTransform: 'uppercase', color, WebkitTextStroke: '4px #000', textShadow: '5px 5px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 5px 0 #000', whiteSpace: 'nowrap', letterSpacing: 4, userSelect: 'none' }}>
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SpringPopComponent(props: MotionGraphicProps<SpringPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spring-pop',
  title: 'Kinetic Spring Pop',
  description: 'Text springs up from below with elastic wobble and overshoots, while 24 confetti pieces and sparkles burst outward on arrival — celebratory and playful for reaction content',
  tags: ['kinetic', 'typography', 'spring', 'pop', 'confetti', 'sparkle', 'elastic', 'bounce', 'celebration', 'playful'],
  category: 'captions',
  component: SpringPopComponent as any,
  defaultConfig: {
    words: ['OMG!', 'YES!!', 'NO WAY', 'WILD!'],
    colors: ['#FF2200', '#FF44CC', '#FFD700', '#00CC55'],
    bgColor: '#FF6600',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OMG!', 'YES!!', 'NO WAY', 'WILD!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF2200', '#FF44CC', '#FFD700', '#00CC55'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FF6600', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
