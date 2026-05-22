import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WhiteboardDrawConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Whiteboard sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%)',
        }}
      />
      {/* Subtle smudge marks from previous erasing */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '40%',
          height: '15%',
          background: 'rgba(150,150,150,0.03)',
          borderRadius: '50%',
          transform: 'rotate(-5deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '15%',
          width: '25%',
          height: '10%',
          background: 'rgba(100,100,100,0.02)',
          borderRadius: '50%',
          transform: 'rotate(3deg)',
        }}
      />
      {/* Whiteboard frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '3px solid #C0C0C0',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, holdProgress }: WordRenderProps) => {
    const seed = index * 29 + 7
    const totalChars = word.length

    // Marker-style text with uneven opacity
    const renderMarkerText = (opacity: number, clipPercent?: number) => (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          clipPath: clipPercent !== undefined ? `inset(0 ${100 - clipPercent}% 0 0)` : undefined,
          opacity,
        }}
      >
        {word.split('').map((char, ci) => {
          // Simulate marker stroke variation
          const strokeOpacity = 0.8 + Math.sin((seed + ci) * 2.3) * 0.15
          const yShift = Math.sin((seed + ci) * 1.7) * 1.5
          const scaleX = 0.95 + Math.sin((seed + ci) * 3.1) * 0.05

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Segoe Print', 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif",
                fontSize: 'clamp(40px, 10vw, 130px)',
                fontWeight: 700,
                color,
                opacity: strokeOpacity,
                transform: `translateY(${yShift}px) scaleX(${scaleX})`,
                textShadow: `0 0 1px ${color}`,
              }}
            >
              {char}
            </span>
          )
        })}
      </div>
    )

    if (phase === 'enter') {
      // Stroke reveals left-to-right like drawing with marker
      const revealPercent = enterProgress * 100
      return renderMarkerText(1, revealPercent)
    }

    if (phase === 'hold') {
      // Subtle breathing effect
      const breathe = 1 + Math.sin(holdProgress * Math.PI * 2 + seed) * 0.008
      return (
        <div style={{ transform: `scale(${breathe})`, position: 'absolute', inset: 0 }}>
          {renderMarkerText(1)}
        </div>
      )
    }

    // Exit: fade with blur like eraser smudge
    const opacity = 1 - exitProgress
    const blur = exitProgress * 8

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          opacity,
        }}
      >
        {renderMarkerText(1)}
      </div>
    )
  },
}

function WhiteboardDrawComponent(props: MotionGraphicProps<WhiteboardDrawConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-whiteboard-draw',
  title: 'Kinetic Whiteboard Draw',
  description: 'Whiteboard marker aesthetic with left-to-right stroke reveal and uneven marker texture',
  tags: ['kinetic', 'typography', 'whiteboard', 'marker', 'handdrawn', 'organic', 'education'],
  category: 'captions',
  component: WhiteboardDrawComponent as any,
  defaultConfig: {
    words: ['PLAN', 'BUILD', 'SHIP', 'GROW'],
    colors: ['#1A1A2E', '#E74C3C', '#2980B9', '#27AE60'],
    bgColor: '#F8F9FA',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLAN', 'BUILD', 'SHIP', 'GROW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A2E', '#E74C3C', '#2980B9', '#27AE60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8F9FA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
