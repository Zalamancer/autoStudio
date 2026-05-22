import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DollyThroughConfig extends KineticBaseConfig {
  planeCount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Depth grid perspective lines receding to horizon
    const gridLines: React.ReactNode[] = []
    const horizon = height * 0.5
    const numVertLines = 8

    for (let v = 0; v <= numVertLines; v++) {
      const xNorm = v / numVertLines
      const xBottom = xNorm * width
      const xTop = width * 0.5 + (xNorm - 0.5) * width * 0.08
      const alpha = 0.04 + (1 - Math.abs(xNorm - 0.5) * 2) * 0.02

      gridLines.push(
        <div
          key={`v${v}`}
          style={{
            position: 'absolute',
            left: xBottom,
            top: horizon,
            width: 1,
            height: height - horizon,
            transformOrigin: `${(xTop - xBottom)}px 0`,
            transform: `skewX(${((xTop - xBottom) / (height - horizon)) * -45}deg)`,
            background: `rgba(120,150,200,${alpha})`,
          }}
        />,
      )
    }

    // Horizontal depth grid lines
    for (let h = 1; h <= 5; h++) {
      const yNorm = h / 6
      const y = horizon + (height - horizon) * yNorm
      const lineAlpha = 0.03 + (1 - yNorm) * 0.03

      gridLines.push(
        <div
          key={`h${h}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            right: 0,
            height: 1,
            background: `rgba(120,150,200,${lineAlpha})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {gridLines}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__dollyThroughConfig ?? { planeCount: 4 }
    const planeCount = cfg.planeCount ?? 4

    // Camera dollies through a series of translucent text planes
    // The planes are positioned at depth intervals and the camera moves through them all
    // The foreground plane is the final sharp text; background planes are blurry ghost echoes

    let cameraZ = 0  // 0 = at back plane, 1 = past front plane
    let textOpacity = 0
    let textBlur = 0
    let textScale = 1

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      cameraZ = ep
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.4) / 0.6))
      textBlur = (1 - easeOutExpo(Math.max(0, (enterProgress - 0.3) / 0.7))) * 5
      textScale = 0.9 + ep * 0.1
    } else if (phase === 'hold') {
      cameraZ = 1
      textOpacity = 1
      textBlur = 0
      textScale = 1 + Math.sin(t * 0.6) * 0.004  // micro dolly breathing
    } else {
      const ep = easeInQuad(exitProgress)
      cameraZ = 1 + ep * 0.5  // camera continues through, pushing text past viewer
      textOpacity = 1 - ep
      textBlur = ep * 5
      textScale = 1 + ep * 0.15
    }

    // Depth planes: positioned at increasing distances
    const planeElements: React.ReactNode[] = []

    for (let p = 0; p < planeCount; p++) {
      const planeDepth = p / planeCount  // 0 = nearest, 1 = farthest
      const depthFromCamera = planeDepth - cameraZ * (1 + 1 / planeCount)

      // Only render planes that are between the starting position and just behind camera
      if (depthFromCamera > 0.05 || depthFromCamera < -1.2) continue

      // Distance effect: planes ahead of camera are faded + blurred
      const planeDist = Math.abs(depthFromCamera)
      const planeAlpha = Math.max(0, 0.2 - planeDist * 0.18) * (1 - Math.max(0, -depthFromCamera * 0.8))
      if (planeAlpha < 0.005) continue

      const planeBlur = planeDist * 4
      const planeScale = 1 - depthFromCamera * 0.1

      planeElements.push(
        <div
          key={p}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${planeScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: planeAlpha,
            filter: `blur(${planeBlur}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>,
      )
    }

    // Dolly motion blur: horizontal streak during fast entry
    const motionBlurAlpha = phase === 'enter' && enterProgress < 0.5
      ? (0.5 - enterProgress) * 0.3
      : 0

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Motion blur vignette */}
        {motionBlurAlpha > 0.01 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${motionBlurAlpha}) 100%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Background plane echoes */}
        {planeElements}

        {/* Foreground: sharp text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: textBlur > 0.1 ? `blur(${textBlur}px)` : 'none',
            textShadow: `0 0 25px ${color}30`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DollyThroughComponent(props: MotionGraphicProps<DollyThroughConfig>) {
  ;(globalThis as any).__dollyThroughConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dolly-through',
  title: 'Kinetic Dolly Through',
  description: 'Virtual camera dollies through multiple stacked text planes with depth-of-field blur, converging to a sharp foreground word',
  tags: ['kinetic', 'typography', 'dolly', 'camera', '3d', 'dimensional', 'reveal', 'depth', 'perspective', 'planes'],
  category: 'captions',
  component: DollyThroughComponent as any,
  defaultConfig: {
    words: ['PUSH', 'THROUGH', 'DEPTH', 'NEAR'],
    colors: ['#D8E8FF', '#B8D0FF', '#E8F0FF', '#A8C4FF'],
    bgColor: '#060a12',
    cycleDuration: 1.5,
    planeCount: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUSH', 'THROUGH', 'DEPTH', 'NEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D8E8FF', '#B8D0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'planeCount', label: 'Depth Planes', type: 'number', defaultValue: 4, min: 2, max: 8, group: 'Animation' },
  ],
})
