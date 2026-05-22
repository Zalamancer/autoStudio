import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SilentIntertitleConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c = 1.7
  return 1 + (t - 1) * (t - 1) * ((c + 1) * (t - 1) + c)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // 18fps judder simulation — brightness flickers at old projector rate
    const projectorFrame = Math.floor(frame * 18 / fps)
    const flicker = 0.82 + rand(projectorFrame * 7) * 0.18
    // Film gate weave — whole frame shifts slightly
    const gateX = Math.sin(projectorFrame * 0.9) * 1.5
    const gateY = Math.cos(projectorFrame * 0.7) * 1.0

    // Iris wipe progress for enter/exit (circular reveal)
    const irisBreath = 58 + Math.sin(time * 0.8) * 4

    // Film scratches — vertical lines that appear briefly
    const scratches = Array.from({ length: 3 }, (_, i) => {
      const show = rand(projectorFrame * 3 + i * 97) < 0.12
      const xPos = rand(projectorFrame * 11 + i * 43) * 100
      return show ? (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: `${xPos}%`,
            top: 0,
            width: rand(projectorFrame + i * 7) > 0.5 ? 1 : 2,
            height: '100%',
            background: `rgba(255,250,230,${0.08 + rand(projectorFrame + i * 13) * 0.1})`,
            pointerEvents: 'none',
          }}
        />
      ) : null
    })

    // Hair/dust particles caught in projector gate
    const dustParticles = Array.from({ length: 4 }, (_, i) => {
      const show = rand(Math.floor(frame * 0.5) + i * 31) < 0.2
      if (!show) return null
      const dx = rand(projectorFrame * 5 + i * 67) * width
      const dy = rand(projectorFrame * 9 + i * 23) * height
      const isHair = rand(i * 41) > 0.6
      return (
        <div
          key={`d${i}`}
          style={{
            position: 'absolute',
            left: dx,
            top: dy,
            width: isHair ? 20 + rand(i * 19) * 30 : 3,
            height: isHair ? 1 : 3,
            borderRadius: isHair ? 0 : '50%',
            background: 'rgba(0,0,0,0.25)',
            transform: `rotate(${rand(i * 53) * 180}deg)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a0806',
          overflow: 'hidden',
          filter: `brightness(${flicker}) sepia(0.7) contrast(1.15)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${gateX}px, ${gateY}px)`,
          }}
        >
          {/* Intertitle card background — warm aged stock */}
          <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

          {/* Art Nouveau ornamental top border */}
          <svg
            style={{ position: 'absolute', top: '6%', left: '10%', width: '80%', height: 30, opacity: 0.35 }}
            viewBox="0 0 400 30"
            preserveAspectRatio="none"
          >
            <path
              d="M0,15 C50,0 100,30 150,15 C200,0 250,30 300,15 C350,0 400,30 400,15"
              stroke="#C8A860"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0,18 C50,3 100,33 150,18 C200,3 250,33 300,18 C350,3 400,33 400,18"
              stroke="#C8A860"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
          </svg>

          {/* Art Nouveau ornamental bottom border (mirrored) */}
          <svg
            style={{ position: 'absolute', bottom: '6%', left: '10%', width: '80%', height: 30, opacity: 0.35, transform: 'scaleY(-1)' }}
            viewBox="0 0 400 30"
            preserveAspectRatio="none"
          >
            <path
              d="M0,15 C50,0 100,30 150,15 C200,0 250,30 300,15 C350,0 400,30 400,15"
              stroke="#C8A860"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* Circular iris vignette */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle ${irisBreath}% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.92) 100%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Film grain noise overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
              opacity: 0.06,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />

          {scratches}
          {dustParticles}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const projectorFrame = Math.floor(f * 18 / 30)

    // Per-character piano-key stutter animation
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let yOff = 0
      let rotateZ = 0

      if (phase === 'enter') {
        // Piano-key stutter: each letter drops in sequentially with a bounce
        const delay = (ci / (word.length + 1)) * 0.6
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.4))
        const ep = easeOutBack(p)

        charOpacity = Math.min(1, p * 2)
        yOff = (1 - ep) * -40
        // Each key "strikes" with a slight rotation
        rotateZ = (1 - ep) * ((ci % 2 === 0) ? -8 : 8)
      } else if (phase === 'hold') {
        charOpacity = 1
        // Subtle projector jitter — each character wobbles independently like piano keys vibrating
        const jitter = Math.sin(projectorFrame * 0.6 + ci * 1.7) * 0.8
        yOff = jitter
        rotateZ = Math.sin(projectorFrame * 0.4 + ci * 2.1) * 0.4
      } else {
        // Iris wipe out — characters fade from edges to center
        const distFromCenter = Math.abs(ci - (word.length - 1) / 2) / ((word.length - 1) / 2 || 1)
        const delay = (1 - distFromCenter) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))

        charOpacity = 1 - p * p
        yOff = p * 30
        rotateZ = p * (ci % 2 === 0 ? -15 : 15)
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity: charOpacity,
            transform: `translateY(${yOff}px) rotate(${rotateZ}deg)`,
            transformOrigin: 'center bottom',
            color,
            textShadow: `1px 1px 0 rgba(0,0,0,0.3)`,
            filter: `sepia(0.4) contrast(1.1)`,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })

    // Gate weave on the text layer
    const weaveX = Math.sin(projectorFrame * 0.5 + index * 3) * 1
    const weaveY = Math.cos(projectorFrame * 0.3 + index * 5) * 0.6

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px))`,
            fontFamily: "'Georgia', 'Playfair Display', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            mixBlendMode: 'luminosity',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function SilentIntertitleComponent(props: MotionGraphicProps<SilentIntertitleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-silent-intertitle',
  title: 'Kinetic Silent Intertitle',
  description:
    'Silent film intertitle card with per-character piano-key stutter animation, Art Nouveau ornamental borders, iris wipe, projector gate weave, film grain, dust particles, and 18fps judder flicker',
  tags: ['kinetic', 'typography', 'silent', 'film', 'intertitle', '1920s', 'piano', 'iris', 'art-nouveau'],
  category: 'captions',
  component: SilentIntertitleComponent as any,
  defaultConfig: {
    words: ['ALAS', 'BEWARE', 'ONWARD', 'FATE'],
    colors: ['#D4C494', '#C8B478', '#DEC896', '#BEA86E'],
    bgColor: '#1C1710',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ALAS', 'BEWARE', 'ONWARD', 'FATE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4C494', '#C8B478', '#DEC896', '#BEA86E'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1710', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
