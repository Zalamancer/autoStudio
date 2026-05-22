import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MercuryBlobConfig extends KineticBaseConfig {}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/** Smooth metaball-like gradient for mercury blob shapes */
function mercuryGradient(cx: number, cy: number, size: number, t: number): React.CSSProperties {
  const wobbleX = Math.sin(t * 2.5) * size * 0.1
  const wobbleY = Math.cos(t * 1.8) * size * 0.08
  return {
    position: 'absolute' as const,
    left: cx + wobbleX - size / 2,
    top: cy + wobbleY - size / 2,
    width: size,
    height: size * (0.85 + Math.sin(t * 1.5) * 0.15),
    borderRadius: `${50 + Math.sin(t * 2) * 10}% ${50 - Math.sin(t * 2.3) * 10}% ${50 + Math.cos(t * 1.7) * 10}% ${50 - Math.cos(t * 2.1) * 10}%`,
    background: `radial-gradient(ellipse at ${35 + Math.sin(t) * 10}% ${30 + Math.cos(t * 1.3) * 10}%, rgba(220, 225, 235, 0.7), rgba(160, 170, 190, 0.5) 40%, rgba(100, 110, 130, 0.3) 70%, transparent)`,
    filter: 'blur(2px)',
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Ambient mercury pools drifting on the surface
    const pools = Array.from({ length: 4 }, (_, i) => {
      const baseX = width * (0.2 + 0.6 * ((i * 0.31 + 0.1) % 1))
      const baseY = height * (0.65 + 0.2 * ((i * 0.47) % 1))
      const size = 50 + (i % 3) * 30
      return <div key={i} style={mercuryGradient(baseX, baseY, size, t + i * 1.5)} />
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle metallic reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${170 + Math.sin(t * 0.3) * 10}deg, rgba(80, 85, 95, 0.15) 0%, transparent 50%, rgba(80, 85, 95, 0.1) 100%)`,
          }}
        />
        {pools}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Mercury blob that pools together to form letters
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let scaleX = 1
      let scaleY = 1
      let yOff = 0
      let xOff = 0
      let blur = 0

      if (phase === 'enter') {
        // Characters start as scattered mercury droplets that pool/merge
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeInOutQuart(p)

        // Mercury pools from random scattered positions
        const scatterX = (Math.sin(ci * 3.7 + index) * 80) * (1 - ep)
        const scatterY = (Math.cos(ci * 2.3 + index) * 60) * (1 - ep)
        xOff = scatterX
        yOff = scatterY

        // Blob morphing: start wide/flat like a puddle, then form into letter
        scaleX = 1.6 - ep * 0.6
        scaleY = 0.4 + ep * 0.6
        charOpacity = 0.3 + ep * 0.7
        blur = (1 - ep) * 4
      } else if (phase === 'hold') {
        // Liquid metal surface tension wobble
        const wobblePhase = t * 2 + ci * 0.6
        scaleX = 1 + Math.sin(wobblePhase) * 0.04
        scaleY = 1 - Math.sin(wobblePhase) * 0.03
        yOff = Math.sin(t * 1.5 + ci * 0.4) * 2

        // Specular highlight sweep across text
        charOpacity = 0.9 + Math.sin(t * 3 + ci * 0.5) * 0.1
      } else {
        // Mercury splits apart: letters dissolve into scattered droplets
        const delay = (1 - ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInOutQuart(p)

        xOff = Math.sin(ci * 4.1 + index) * ep * 100
        yOff = Math.cos(ci * 2.7 + index) * ep * 70 + ep * 30
        scaleX = 1 + ep * 0.8
        scaleY = 1 - ep * 0.5
        charOpacity = 1 - ep
        blur = ep * 5
      }

      // Mercury metallic gradient color
      const specular = Math.sin(t * 4 + ci * 0.8) * 0.5 + 0.5
      const metalColor = specular > 0.6
        ? '#E8ECF0'
        : specular > 0.3
          ? color
          : '#A0A8B4'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: metalColor,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 8px rgba(200, 210, 225, 0.6), 0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Mercury puddle shadow beneath text during hold
    let puddleShadow: React.ReactNode = null
    if (phase === 'hold') {
      const puddleWidth = word.length * 40
      puddleShadow = (
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: '50%',
            width: puddleWidth,
            height: 12,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(160,170,190,0.25), transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {puddleShadow}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Trebuchet MS', 'Lucida Sans', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MercuryBlobComponent(props: MotionGraphicProps<MercuryBlobConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mercury-blob',
  title: 'Kinetic Mercury Blob',
  description: 'Mercury/T-1000 liquid metal text that pools together from scattered droplets and reforms between words. Metallic specular highlights shift across letter surfaces.',
  tags: ['kinetic', 'typography', 'liquid', 'mercury', 'metal', 'blob', 'morph', 'T-1000'],
  category: 'captions',
  component: MercuryBlobComponent as any,
  defaultConfig: {
    words: ['MORPH', 'METAL', 'LIQUID', 'FORM'],
    colors: ['#C0C8D4', '#A8B0BC', '#B8C0CC', '#D0D8E4'],
    bgColor: '#12141a',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MORPH', 'METAL', 'LIQUID', 'FORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0C8D4', '#A8B0BC', '#B8C0CC', '#D0D8E4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12141a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
