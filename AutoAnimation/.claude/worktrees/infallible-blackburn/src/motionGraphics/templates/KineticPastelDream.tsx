import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PastelDreamConfig extends KineticBaseConfig {}

const PASTELS = [
  { h: 340, s: 60, l: 82 }, // pink
  { h: 270, s: 50, l: 80 }, // lavender
  { h: 160, s: 45, l: 78 }, // mint
  { h: 25, s: 65, l: 82 },  // peach
  { h: 200, s: 55, l: 80 }, // baby blue
]

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cycle through pastel backgrounds
    const idx = Math.floor((time * 0.15) % PASTELS.length)
    const nextIdx = (idx + 1) % PASTELS.length
    const blend = (time * 0.15) % 1

    const c1 = PASTELS[idx]
    const c2 = PASTELS[nextIdx]

    const h = c1.h + (c2.h - c1.h) * blend
    const s = c1.s + (c2.s - c1.s) * blend
    const l = c1.l + (c2.l - c1.l) * blend

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `hsl(${h}, ${s}%, ${l}%)`,
        }}
      >
        {/* Soft gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${50 + Math.sin(time * 0.3) * 20}% ${50 + Math.cos(time * 0.4) * 15}%,
              hsla(${(h + 60) % 360}, ${s}%, ${l + 5}%, 0.4) 0%,
              transparent 60%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let blur = 0
    let scale = 1

    if (phase === 'enter') {
      // Dreamy fade-in with blur clearing
      opacity = enterProgress
      blur = (1 - enterProgress) * 8
      scale = 0.95 + enterProgress * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      // Very gentle breathing
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.01
    } else {
      // Soft blur out
      opacity = 1 - exitProgress
      blur = exitProgress * 10
      scale = 1 - exitProgress * 0.03
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 600,
          fontFamily: "'Georgia', 'Palatino', serif",
          letterSpacing: '0.06em',
          color: '#4A3F5C',
          textShadow: '0 2px 15px rgba(200, 170, 220, 0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function PastelDreamComponent(props: MotionGraphicProps<PastelDreamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pastel-dream',
  title: 'Kinetic Pastel Dream',
  description: 'Soft pastel palette with dreamy blur transitions and gently shifting background colors',
  tags: ['kinetic', 'typography', 'pastel', 'dreamy', 'soft', 'gradient'],
  category: 'captions',
  component: PastelDreamComponent as any,
  defaultConfig: {
    words: ['DREAM', 'SOFT', 'PASTEL', 'BLISS'],
    colors: ['#C9A0DC', '#F8B4C8', '#A8D8B9', '#F5C6AA'],
    bgColor: '#F2E0F0',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'SOFT', 'PASTEL', 'BLISS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9A0DC', '#F8B4C8', '#A8D8B9', '#F5C6AA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2E0F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
