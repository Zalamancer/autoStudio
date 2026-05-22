import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PencilSketchConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Sketch paper lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 22px, rgba(0,0,0,0.04) 22px, rgba(0,0,0,0.04) 23px)',
          pointerEvents: 'none',
        }}
      />
      {/* Paper grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 7
    const totalChars = word.length

    if (phase === 'enter') {
      // Draw stroke by stroke — characters appear one by one with slight pressure variation
      const visibleChars = Math.floor(enterProgress * (totalChars + 0.5))
      const displayText = word.substring(0, visibleChars)
      const opacity = Math.min(1, enterProgress * 2)

      // Sketch hand micro-jitter
      const jitterX = Math.sin(enterProgress * Math.PI * totalChars * 3 + seed) * 1.5
      const jitterY = Math.cos(enterProgress * Math.PI * totalChars * 2 + seed) * 1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px))`,
            opacity,
            fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 4,
            color,
            // Multi-shadow mimics hatching / graphite grain
            textShadow: [
              `1px 1px 0 ${color}88`,
              `-0.5px 0.5px 0 ${color}44`,
              `0.5px -0.5px 0 ${color}33`,
            ].join(', '),
            whiteSpace: 'nowrap',
          }}
        >
          {displayText}
        </div>
      )
    }

    if (phase === 'hold') {
      // Slight wobble as if held by a hand
      const wobbleX = Math.sin(holdProgress * Math.PI * 4 + seed) * 1.2
      const wobbleY = Math.cos(holdProgress * Math.PI * 3 + seed) * 0.8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${wobbleX}px), calc(-50% + ${wobbleY}px))`,
            opacity: 1,
            fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 4,
            color,
            textShadow: [
              `1px 1px 0 ${color}88`,
              `-0.5px 0.5px 0 ${color}44`,
              `0.5px -0.5px 0 ${color}33`,
            ].join(', '),
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: erased — characters disappear from right to left
    const remainingChars = Math.ceil((1 - exitProgress) * totalChars)
    const displayText = word.substring(0, remainingChars)
    const opacity = 1 - exitProgress * exitProgress
    const eraseBlur = exitProgress * 3

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: eraseBlur > 0 ? `blur(${eraseBlur}px)` : undefined,
          fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 700,
          letterSpacing: 4,
          color,
          textShadow: [
            `1px 1px 0 ${color}88`,
            `-0.5px 0.5px 0 ${color}44`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {displayText}
      </div>
    )
  },
}

function PencilSketchComponent(props: MotionGraphicProps<PencilSketchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pencil-sketch',
  title: 'Kinetic Pencil Sketch',
  description: 'Letters are hand-drawn character by character with graphite texture, then erased from right to left',
  tags: ['kinetic', 'typography', 'pencil', 'sketch', 'handwritten', 'draw', 'paper', 'organic'],
  category: 'captions',
  component: PencilSketchComponent as any,
  defaultConfig: {
    words: ['SKETCH', 'DRAW', 'CREATE', 'ERASE'],
    colors: ['#2C2C2C', '#3D3D3D', '#1A1A1A', '#4A4A4A'],
    bgColor: '#F4F0E8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SKETCH', 'DRAW', 'CREATE', 'ERASE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C2C2C', '#3D3D3D', '#1A1A1A', '#4A4A4A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
