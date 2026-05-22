import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EerieHorrorConfig extends KineticBaseConfig {
  distortAmount: number
}

// Eerie / horror mood: text glitches into existence, darkness creeps inward,
// letters distort unnervingly — like a horror movie title sequence.
// Corrupted letter positioning, chromatic split, flickering darkness,
// and a disintegrating warp exit.

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Creeping darkness tendrils from edges
    const tendrils = Array.from({ length: 8 }, (_, i) => {
      const isHorizontal = i < 4
      const side = i % 2 === 0
      const offset = rand(i * 37 + 5) * 80 + 10
      const breathe = Math.sin(t * 0.3 + i * 0.9) * 15
      const size = 15 + rand(i * 23) * 25 + breathe

      if (isHorizontal) {
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              [side ? 'left' : 'right']: 0,
              top: `${offset}%`,
              width: `${size}%`,
              height: 40 + rand(i * 19) * 60,
              background: `linear-gradient(${side ? '90deg' : '270deg'}, rgba(0,0,0,0.7), transparent)`,
              filter: 'blur(20px)',
            }}
          />
        )
      }
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${offset}%`,
            [side ? 'top' : 'bottom']: 0,
            width: 40 + rand(i * 31) * 60,
            height: `${size}%`,
            background: `linear-gradient(${side ? '180deg' : '0deg'}, rgba(0,0,0,0.6), transparent)`,
            filter: 'blur(20px)',
          }}
        />
      )
    })

    // Intermittent flicker — darkness pulses
    const flickerT = t * 7.3
    const flicker = Math.sin(flickerT) > 0.85 ? 0.15 : (Math.sin(flickerT * 3.1) > 0.95 ? 0.08 : 0)

    // Scan line interference
    const scanY = ((t * 40) % 110) - 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {tendrils}
        {/* Flicker overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000000',
            opacity: flicker,
          }}
        />
        {/* Horizontal scan line glitch */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 2,
            background: 'rgba(255,255,255,0.04)',
            boxShadow: '0 0 30px 10px rgba(255,255,255,0.02)',
          }}
        />
        {/* Blood-red vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(40,0,0,0.5) 80%, rgba(10,0,0,0.8) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const total = word.length || 1
      let charOpacity = 1
      let xOff = 0
      let yOff = 0
      let scaleY = 1
      let skewX = 0

      if (phase === 'enter') {
        // Corrupted glitch-in: letters appear at wrong positions, then snap into place
        const delay = rand(ci * 41 + index * 7) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.55))

        // Glitch flicker: letters flash on/off rapidly before stabilizing
        const flickerThreshold = 0.6
        if (p < flickerThreshold) {
          const flickerRate = p * 20 + ci * 3
          charOpacity = Math.sin(flickerRate) > 0.2 ? 0.8 : 0
        } else {
          charOpacity = 1
        }

        // Letters start at corrupted positions
        xOff = (1 - Math.min(1, p / 0.8)) * (rand(ci * 53 + 3) - 0.5) * 60
        yOff = (1 - Math.min(1, p / 0.8)) * (rand(ci * 67 + 11) - 0.5) * 40
        scaleY = 1 + (1 - p) * (rand(ci * 31) > 0.5 ? 0.5 : -0.3)
        skewX = (1 - p) * (rand(ci * 43) - 0.5) * 20
      } else if (phase === 'hold') {
        // Unnerving micro-distortions: letters shift erratically
        const distortT = holdProgress * 30 + ci * 5.7 + index * 11
        // Occasional violent twitch
        const twitch = Math.sin(distortT * 1.7) > 0.93
        xOff = twitch ? (rand(Math.floor(distortT) * 13 + ci) - 0.5) * 12 : Math.sin(distortT * 0.4) * 1
        yOff = twitch ? (rand(Math.floor(distortT) * 17 + ci) - 0.5) * 8 : 0
        scaleY = twitch ? 1 + (rand(Math.floor(distortT) * 7) - 0.5) * 0.3 : 1
        // Rare opacity dropout
        charOpacity = Math.sin(distortT * 2.3 + ci) > 0.97 ? 0.2 : 1
      } else {
        // Disintegrating warp: letters stretch and scatter into void
        const delay = rand(ci * 29 + index * 3) * 0.2
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep
        // Each letter warps in a unique direction
        const angle = rand(ci * 47 + 7) * Math.PI * 2
        xOff = Math.cos(angle) * ep * 80
        yOff = Math.sin(angle) * ep * 60
        scaleY = 1 + ep * (rand(ci * 61) > 0.5 ? 2 : -0.7)
        skewX = ep * (rand(ci * 37) - 0.5) * 40
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleY(${scaleY}) skewX(${skewX}deg)`,
            textShadow: `0 0 8px rgba(180,0,0,0.4), 0 0 2px rgba(255,255,255,0.1)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Chromatic aberration: red/cyan split layers
    const splitAmount = phase === 'enter'
      ? (1 - enterProgress) * 6
      : phase === 'hold'
        ? Math.sin(holdProgress * 20 + index) > 0.9 ? 4 : 1
        : exitProgress * 8

    const globalOpacity = phase === 'enter'
      ? Math.min(1, enterProgress * 2)
      : phase === 'hold' ? 1
        : 1 - easeInQuad(exitProgress)

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Red channel offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${splitAmount}px), calc(-50% - ${splitAmount * 0.5}px))`,
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(255,0,0,0.35)',
            opacity: globalOpacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Cyan channel offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${splitAmount}px), calc(-50% + ${splitAmount * 0.5}px))`,
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(0,200,255,0.25)',
            opacity: globalOpacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text with per-char distortion */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function EerieHorrorComponent(props: MotionGraphicProps<EerieHorrorConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-eerie-horror',
  title: 'Kinetic Eerie Horror',
  description: 'Horror movie title card with glitch-flicker letter reveals, chromatic aberration split, creeping darkness tendrils, unnerving micro-distortions, and disintegrating warp exit.',
  tags: ['kinetic', 'typography', 'eerie', 'horror', 'glitch', 'dark', 'creepy', 'chromatic', 'mood', 'atmosphere'],
  category: 'captions',
  component: EerieHorrorComponent as any,
  defaultConfig: {
    words: ['DREAD', 'CRAWL', 'VOID', 'LURK'],
    colors: ['#C8C8C8', '#8B0000', '#A0A0A0', '#660000'],
    bgColor: '#050505',
    cycleDuration: 1.2,
    distortAmount: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAD', 'CRAWL', 'VOID', 'LURK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8C8C8', '#8B0000', '#A0A0A0', '#660000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'distortAmount', label: 'Distort Amount', type: 'number', defaultValue: 60, min: 10, max: 100, group: 'Animation' },
  ],
})
