import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Brand Aesthetic: Streetwear Drop (Supreme / Palace / KITH)
// Box logo energy — high-contrast red/black/white. Words enter as a
// rubber-stamp THUD from large scale down to final, brief dust-burst
// effect via radial gradient flash. Hold dead-still like a box logo.
// Exit: fast fade-out — product drops don't linger.

interface StreetwearDropConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle static noise by shifting background position
    const noiseOffset = Math.floor(time * 24) % 4

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#f5f5f5'
            ? '#f5f5f5'
            : bgColor,
        }}
      >
        {/* Boxy grid overlay — warehouse aesthetic */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent ${48 + noiseOffset}px)`,
              `repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent ${48 + noiseOffset}px)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scale = 1
    let opacity = 0

    if (phase === 'enter') {
      // Rubber stamp: slam from 2.5x down to 1x
      const t = enterProgress
      if (t < 0.4) {
        scale = 2.5 - (t / 0.4) * 1.5
        opacity = t / 0.4
      } else {
        // Slight rebound
        const rebound = Math.sin((t - 0.4) / 0.6 * Math.PI) * 0.08
        scale = 1 + rebound * (1 - t)
        opacity = 1
      }
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
    } else {
      // Snap cut off
      opacity = exitProgress < 0.3 ? 1 - exitProgress / 0.3 : 0
      scale = 1
    }

    // Impact flash ring on entry
    const flashOpacity = phase === 'enter' && enterProgress < 0.25
      ? (0.25 - enterProgress) / 0.25 * 0.4
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
        }}
      >
        {/* Stamp flash */}
        {flashOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '200%',
              height: '200%',
              marginLeft: '-100%',
              marginTop: '-100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
              opacity: flashOpacity,
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(50px, 13vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            color,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            opacity,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function StreetwearDropComponent(props: MotionGraphicProps<StreetwearDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-streetwear-drop',
  title: 'Kinetic Streetwear Drop',
  description: 'Supreme/Palace box-logo energy — rubber-stamp slam entrance, warehouse grid bg, snap-cut exit',
  tags: ['kinetic', 'typography', 'streetwear', 'drop', 'supreme', 'brand', 'bold', 'impact'],
  category: 'captions',
  component: StreetwearDropComponent as any,
  defaultConfig: {
    words: ['DROP', 'SOLD OUT', 'LIMITED', 'RARE'],
    colors: ['#cc0000', '#cc0000', '#cc0000', '#cc0000'],
    bgColor: '#f5f5f5',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROP', 'SOLD OUT', 'LIMITED', 'RARE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#cc0000', '#cc0000', '#cc0000', '#cc0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f5f5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
  ],
})
