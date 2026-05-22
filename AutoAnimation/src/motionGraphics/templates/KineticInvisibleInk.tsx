import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InvisibleInkConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Heat/UV shimmer across the paper
    const heatX = 50 + Math.sin(time * 0.8) * 20
    const heatY = 50 + Math.cos(time * 0.6) * 15
    const heatIntensity = 0.06 + Math.sin(time * 2) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper fiber texture lines */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i * 7.2 + 2) % 100}%`,
              height: 1,
              background: `rgba(160,140,100,${0.04 + seededRand(i * 37) * 0.03})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Heat/UV light glow moving across paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${heatX}% ${heatY}%, rgba(180,120,40,${heatIntensity}) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Warm paper edge darkening (old paper burn) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(120,80,30,0.15)',
            pointerEvents: 'none',
          }}
        />
        {/* Slight brown water stain */}
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '70%',
            width: 80,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(140,110,60,0.06)',
            filter: 'blur(15px)',
            pointerEvents: 'none',
          }}
        />
        {/* Corner aging */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 0% 0%, rgba(120,90,40,0.08) 0%, transparent 30%), radial-gradient(ellipse at 100% 100%, rgba(120,90,40,0.08) 0%, transparent 30%)',
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
    index,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 181 + 67

    if (phase === 'enter') {
      // Text gradually appears as if heat is revealing lemon juice ink
      // Characters appear from center outward with organic uneven reveal
      const chars = word.split('').map((ch, ci) => {
        const centerDist = Math.abs(ci - (word.length - 1) / 2) / (word.length / 2)
        const charDelay = centerDist * 0.3 + seededRand(seed + ci * 41) * 0.15
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.55))

        // Brownish-yellow color progression: starts very faint, gets darker
        const r = Math.floor(140 + charProgress * 40)
        const g = Math.floor(100 + charProgress * 30)
        const b = Math.floor(20 + charProgress * 10)
        const opacity = Math.pow(charProgress, 1.8)
        const blur = (1 - charProgress) * 3

        return (
          <span
            key={ci}
            style={{
              color: `rgb(${r},${g},${b})`,
              opacity,
              filter: `blur(${blur}px)`,
              display: 'inline-block',
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Fully revealed, slight warmth shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 3) * 0.06
      const wobble = Math.sin(f * 0.05) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${wobble}px))`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `0 0 ${8 + shimmer * 30}px rgba(180,130,40,0.3)`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: text fades back as if paper cools — ink becomes invisible again
      const chars = word.split('').map((ch, ci) => {
        const edgeDist = Math.min(ci, word.length - 1 - ci) / (word.length / 2)
        const charDelay = (1 - edgeDist) * 0.2
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.8))

        const opacity = 1 - Math.pow(charProgress, 1.5)
        const blur = charProgress * 4

        return (
          <span
            key={ci}
            style={{
              color,
              opacity,
              filter: `blur(${blur}px)`,
              display: 'inline-block',
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function InvisibleInkComponent(props: MotionGraphicProps<InvisibleInkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-invisible-ink',
  title: 'Kinetic Invisible Ink',
  description:
    'Invisible ink reveal: blank aged paper is heated/UV-lit, text gradually appears in brownish-yellow lemon juice ink tones with organic uneven warmth spread',
  tags: ['kinetic', 'typography', 'invisible-ink', 'spy', 'secret', 'reveal', 'paper', 'lemon-juice'],
  category: 'captions',
  component: InvisibleInkComponent as any,
  defaultConfig: {
    words: ['TRUST', 'NOONE', 'WATCH', 'SOUTH'],
    colors: ['#B08830', '#B08830', '#B08830', '#B08830'],
    bgColor: '#E8DCC8',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TRUST', 'NOONE', 'WATCH', 'SOUTH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#B08830', '#B08830', '#B08830', '#B08830'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8DCC8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
