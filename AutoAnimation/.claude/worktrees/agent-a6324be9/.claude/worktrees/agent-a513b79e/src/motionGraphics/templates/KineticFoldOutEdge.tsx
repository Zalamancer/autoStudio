import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoldOutEdgeConfig extends KineticBaseConfig {
  foldEdge: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    return <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__foldOutEdgeConfig ?? { foldEdge: 0 }
    const foldEdge = cfg.foldEdge ?? 0

    // foldEdge: 0=left, 1=right, 2=top, 3=bottom
    // Text folds out from the specified edge as if on a hinged panel
    // The hinge is at the edge; the text panel rotates from 90deg (flat against edge) to 0deg (facing viewer)

    // 3D perspective effect using CSS perspective + rotateY/rotateX
    let foldAngle = 0   // degrees of fold (0 = flat facing viewer, 90 = folded against edge)
    let textOpacity = 0
    let shadowIntensity = 0
    let translateBeforeHinge = 0  // offset to position the hinge at the edge

    if (phase === 'enter') {
      const ep = easeOutBack(Math.min(1, enterProgress * 1.1))
      foldAngle = 90 - ep * 92  // slight overshoot for snappiness
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.05) / 0.95))
      shadowIntensity = Math.max(0, 1 - enterProgress * 2)
      translateBeforeHinge = 0
    } else if (phase === 'hold') {
      foldAngle = 0
      textOpacity = 1
      shadowIntensity = 0
      // Gentle breathing micro-movement
      foldAngle = Math.sin(t * 1.2) * 0.5
    } else {
      const ep = easeInQuad(exitProgress)
      foldAngle = ep * 90
      textOpacity = 1 - ep
      shadowIntensity = ep
    }

    const isVertical = foldEdge >= 2  // top or bottom edge
    const isFlipped = foldEdge === 1 || foldEdge === 3  // right or bottom (fold outward vs inward)

    // 3D perspective container
    const perspective = 800

    // The fold panel position
    // For left edge: panel extends from left side, rotateY is applied
    // For top edge: panel extends from top, rotateX is applied
    const panelStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      transformStyle: 'preserve-3d',
      perspective: `${perspective}px`,
      perspectiveOrigin: isVertical
        ? `50% ${isFlipped ? '100%' : '0%'}`
        : `${isFlipped ? '100%' : '0%'} 50%`,
    }

    // The fold angle applied to the text panel
    const rotation = isVertical
      ? `rotateX(${isFlipped ? -foldAngle : foldAngle}deg)`
      : `rotateY(${isFlipped ? foldAngle : -foldAngle}deg)`

    // The shadow overlay (more shadow = more folded)
    const shadowAlpha = shadowIntensity * 0.7

    // Edge line (the hinge crease)
    const hingeLineStyle: React.CSSProperties = isVertical
      ? {
          position: 'absolute',
          left: 0,
          right: 0,
          top: isFlipped ? 'auto' : 0,
          bottom: isFlipped ? 0 : 'auto',
          height: 2,
          background: `rgba(${color.startsWith('#') ? '255,255,255' : '200,200,200'},${shadowIntensity * 0.5 + 0.1})`,
          boxShadow: `0 0 8px rgba(200,210,255,${shadowIntensity * 0.3})`,
        }
      : {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isFlipped ? 'auto' : 0,
          right: isFlipped ? 0 : 'auto',
          width: 2,
          background: `rgba(${color.startsWith('#') ? '255,255,255' : '200,200,200'},${shadowIntensity * 0.5 + 0.1})`,
          boxShadow: `0 0 8px rgba(200,210,255,${shadowIntensity * 0.3})`,
        }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* 3D fold container */}
        <div style={panelStyle}>
          {/* The folding panel with text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: rotation,
              transformOrigin: isVertical
                ? `50% ${isFlipped ? '100%' : '0%'}`
                : `${isFlipped ? '100%' : '0%'} 50%`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Text */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(40px, 12vw, 155px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                opacity: textOpacity,
                textShadow: `0 0 20px ${color}40`,
              }}
            >
              {word}
            </div>

            {/* Shadow overlay as panel folds */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(0,0,0,${shadowAlpha})`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Hinge crease line */}
        <div style={hingeLineStyle} />

        {/* Edge glow when fully open */}
        {shadowIntensity < 0.3 && (
          <div
            style={{
              ...(isVertical
                ? {
                    top: isFlipped ? 'auto' : 0,
                    bottom: isFlipped ? 0 : 'auto',
                    left: 0,
                    right: 0,
                    height: 15,
                  }
                : {
                    left: isFlipped ? 'auto' : 0,
                    right: isFlipped ? 0 : 'auto',
                    top: 0,
                    bottom: 0,
                    width: 15,
                  }),
              position: 'absolute',
              background: `linear-gradient(${isVertical ? (isFlipped ? '0deg' : '180deg') : (isFlipped ? '270deg' : '90deg')}, rgba(200,215,255,${(0.3 - shadowIntensity) * 0.4}), transparent)`,
            }}
          />
        )}
      </div>
    )
  },
}

function FoldOutEdgeComponent(props: MotionGraphicProps<FoldOutEdgeConfig>) {
  ;(globalThis as any).__foldOutEdgeConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fold-out-edge',
  title: 'Kinetic Fold Out Edge',
  description: 'Text panel is hinged at a screen edge and folds out into view with 3D perspective, shadow casting and edge glow',
  tags: ['kinetic', 'typography', 'fold', 'hinge', '3d', 'dimensional', 'reveal', 'panel', 'perspective'],
  category: 'captions',
  component: FoldOutEdgeComponent as any,
  defaultConfig: {
    words: ['UNFOLD', 'OPEN', 'REVEAL', 'SPREAD'],
    colors: ['#E8F0FF', '#D0E0FF', '#F0F4FF', '#C8D8FF'],
    bgColor: '#080c18',
    cycleDuration: 1.5,
    foldEdge: 0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['UNFOLD', 'OPEN', 'REVEAL', 'SPREAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8F0FF', '#D0E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'foldEdge', label: 'Fold Edge (0=L,1=R,2=T,3=B)', type: 'number', defaultValue: 0, min: 0, max: 3, group: 'Animation' },
  ],
})
