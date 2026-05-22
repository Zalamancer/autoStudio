import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ActionPanelConfig extends KineticBaseConfig {}

// Comic action panel: thick border slams in like a panel transition,
// radial speed lines burst from center, text appears inside with impact
const SPEED_LINES = Array.from({ length: 16 }, (_, i) => i)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow rotation on speed lines
    const rot = (time * 8) % 360
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial speed lines from center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            backgroundImage: `repeating-conic-gradient(
              from 0deg,
              transparent 0deg,
              transparent 10deg,
              rgba(0,0,0,0.06) 10deg,
              rgba(0,0,0,0.06) 11.2deg
            )`,
          }}
        />
        {/* Ben-Day halftone dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1.5px, transparent 1.5px)',
            backgroundSize: '9px 9px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 29 + 5

    let borderScale = 0
    let textOpacity = 0
    let textScale = 1
    let panelOpacity = 1

    if (phase === 'enter') {
      // Panel border slams in: scale from 1.4 -> 1.0
      const borderT = Math.min(1, enterProgress / 0.4)
      borderScale = 0.4 + borderT * 0.6 + Math.sin(borderT * Math.PI) * 0.08
      panelOpacity = Math.min(1, enterProgress * 3)
      // Text appears after border
      const textT = Math.max(0, (enterProgress - 0.35) / 0.65)
      textOpacity = Math.min(1, textT * 3)
      textScale = 1.4 - textT * 0.4
    } else if (phase === 'hold') {
      borderScale = 1
      textOpacity = 1
      textScale = 1
      panelOpacity = 1
    } else {
      // Slam out: panel shrinks and text stays briefly
      borderScale = 1 - exitProgress * 0.6
      panelOpacity = 1 - exitProgress
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      textScale = 1 + exitProgress * 0.3
    }

    // Each panel gets a slight tilt for comic-book dynamism
    const tilt = ((seed % 5) - 2) * 2

    const panelW = Math.min(width * 0.85, 560)
    const panelH = Math.min(height * 0.55, 200)
    const borderThickness = 5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${borderScale}) rotate(${tilt}deg)`,
          opacity: panelOpacity,
          transformOrigin: 'center center',
        }}
      >
        {/* Panel border with drop shadow for 3D slam */}
        <div
          style={{
            width: `${panelW}px`,
            height: `${panelH}px`,
            background: '#FFFFFF',
            border: `${borderThickness}px solid #000000`,
            boxShadow: `8px 8px 0 #000000, -2px -2px 0 #000000`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Inner halftone shading on panel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
              backgroundSize: '6px 6px',
              pointerEvents: 'none',
            }}
          />
          {/* Speed lines inside panel */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '200%',
              height: '200%',
              transform: 'translate(-50%, -50%)',
              backgroundImage: `repeating-conic-gradient(
                from 0deg,
                transparent 0deg,
                transparent 14deg,
                rgba(0,0,0,0.035) 14deg,
                rgba(0,0,0,0.035) 15deg
              )`,
              pointerEvents: 'none',
            }}
          />
          {/* Text */}
          <div
            style={{
              position: 'relative',
              transform: `scale(${textScale})`,
              opacity: textOpacity,
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(28px, 7vw, 120px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '2.5px #000000',
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ActionPanelComponent(props: MotionGraphicProps<ActionPanelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-action-panel',
  title: 'Kinetic Action Panel',
  description: 'Comic panel border slams in with speed lines radiating from center, text appears inside with bold impact — classic comic book panel transition',
  tags: ['kinetic', 'typography', 'comic', 'panel', 'action', 'speed-lines', 'slam', 'border'],
  category: 'captions',
  component: ActionPanelComponent as any,
  defaultConfig: {
    words: ['FIGHT!', 'RUN!', 'JUMP!', 'WIN!'],
    colors: ['#FF0000', '#0000EE', '#FF6600', '#009900'],
    bgColor: '#FFD700',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIGHT!', 'RUN!', 'JUMP!', 'WIN!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000EE', '#FF6600', '#009900'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
