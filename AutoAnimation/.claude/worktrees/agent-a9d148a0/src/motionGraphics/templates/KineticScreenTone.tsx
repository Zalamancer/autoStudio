import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScreenToneConfig extends KineticBaseConfig {}

// Manga screentone build-up: dots start sparse then pack dense to form text.
// The text IS the screentone density — at low density you see nothing,
// at high density the dot field darkens into readable letterforms.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const shift = (time * 3) % 10
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Sparse ambient dots — the base tone that fills the whole panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)`,
            backgroundSize: `${16 + shift * 0.3}px ${16 + shift * 0.3}px`,
          }}
        />
        {/* Fine crosshatch under everything — old manga printing paper texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0px, transparent 23px, rgba(0,0,0,0.025) 23px, rgba(0,0,0,0.025) 24px),
              repeating-linear-gradient(0deg,  transparent 0px, transparent 23px, rgba(0,0,0,0.025) 23px, rgba(0,0,0,0.025) 24px)
            `,
          }}
        />
        {/* Manga panel border */}
        <div style={{ position: 'absolute', inset: '3px', border: '3px solid rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame = 0 }: WordRenderProps) => {
    const seed = index * 43 + 7

    // Dot density drives the effect: sparse → dense → sparse
    // enterProgress 0..1 builds up density; exit thins it back
    let dotSpacing = 20  // large spacing = sparse = invisible text
    let dotRadius = 1.0
    let textOpacity = 0
    let containerOpacity = 1

    if (phase === 'enter') {
      // Dots compress from 20px spacing down to 3px — text emerges
      dotSpacing = 20 - enterProgress * 17        // 20 → 3
      dotRadius = 0.8 + enterProgress * 0.9       // 0.8 → 1.7
      textOpacity = Math.max(0, (enterProgress - 0.55) / 0.45)
      containerOpacity = Math.min(1, enterProgress * 1.5)
    } else if (phase === 'hold') {
      // Dense, fully formed — slight breathing pulse
      const pulse = Math.sin((frame / 30) * 2 + seed) * 0.4
      dotSpacing = 3 + pulse
      dotRadius = 1.7
      textOpacity = 1
      containerOpacity = 1
    } else {
      // Dots thin back out — text dissolves into sparse field
      dotSpacing = 3 + exitProgress * 17
      dotRadius = 1.7 - exitProgress * 0.9
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      containerOpacity = Math.max(0, 1 - exitProgress * 1.2)
    }

    const tilt = ((seed % 3) - 1) * 1.2

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
          opacity: Math.max(0, containerOpacity),
        }}
      >
        {/* The text itself — only fully visible when dots are dense */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(52px, 13vw, 175px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '3px #000000',
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: textOpacity,
              userSelect: 'none',
            }}
          >
            {word}
          </div>

          {/* Dense screentone overlay ON the text — the fill IS dots */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.85) ${dotRadius}px, transparent ${dotRadius}px)`,
              backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          />

          {/* Mid-tone dot layer — offset for authentic two-tone screen look */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.45) ${dotRadius * 0.6}px, transparent ${dotRadius * 0.6}px)`,
              backgroundSize: `${dotSpacing * 1.6}px ${dotSpacing * 1.6}px`,
              backgroundPosition: `${dotSpacing * 0.8}px ${dotSpacing * 0.8}px`,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

function ScreenToneComponent(props: MotionGraphicProps<ScreenToneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-screentone',
  title: 'Kinetic ScreenTone',
  description: 'Manga screentone dots build from sparse to dense, forming text through dot-density — the text IS the accumulating halftone pattern, B&W manga printing aesthetic',
  tags: ['kinetic', 'typography', 'comic', 'manga', 'screentone', 'halftone', 'dots', 'density', 'build-up'],
  category: 'captions',
  component: ScreenToneComponent as any,
  defaultConfig: {
    words: ['POWER', 'FIGHT', 'RAGE', 'WIN'],
    colors: ['#222222', '#444444', '#111111', '#333333'],
    bgColor: '#F2EEE8',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POWER', 'FIGHT', 'RAGE', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#222222', '#444444', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2EEE8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
