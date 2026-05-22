import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CubeRotateConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const CUBE_SIZE = 200

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    let rotateX = 0
    let opacity = 1

    if (phase === 'enter') {
      // Cube rotates from top face to front face
      const eased = easeOutCubic(enterProgress)
      rotateX = -90 + 90 * eased
      opacity = enterProgress > 0.15 ? 1 : enterProgress / 0.15
    } else if (phase === 'hold') {
      // Subtle rotation during hold
      rotateX = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      // Rotates to bottom face
      const eased = easeInCubic(exitProgress)
      rotateX = 90 * eased
      opacity = exitProgress < 0.85 ? 1 : (1 - exitProgress) / 0.15
    }

    const halfSize = CUBE_SIZE / 2
    const fontSize = Math.min(width * 0.08, 140)

    const faceStyle: React.CSSProperties = {
      position: 'absolute',
      width: CUBE_SIZE * 2,
      height: CUBE_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden',
      fontSize: `clamp(40px, 10vw, ${fontSize}px)`,
      fontWeight: 800,
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      whiteSpace: 'nowrap',
      letterSpacing: '0.04em',
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: 1000,
          opacity,
        }}
      >
        <div
          style={{
            width: CUBE_SIZE * 2,
            height: CUBE_SIZE,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg)`,
          }}
        >
          {/* Front face */}
          <div
            style={{
              ...faceStyle,
              color,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${color}33`,
              transform: `translateZ(${halfSize}px)`,
              textShadow: `0 0 30px ${color}88`,
            }}
          >
            {word}
          </div>
          {/* Top face */}
          <div
            style={{
              ...faceStyle,
              color: `${color}88`,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${color}22`,
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            }}
          >
            {word}
          </div>
          {/* Bottom face */}
          <div
            style={{
              ...faceStyle,
              color: `${color}88`,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${color}22`,
              transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
            }}
          >
            {word}
          </div>
          {/* Back face */}
          <div
            style={{
              ...faceStyle,
              color: `${color}44`,
              background: 'rgba(0,0,0,0.3)',
              transform: `rotateX(180deg) translateZ(${halfSize}px)`,
            }}
          >
            {word}
          </div>
          {/* Left face */}
          <div
            style={{
              ...faceStyle,
              width: CUBE_SIZE,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${color}11`,
              transform: `rotateY(-90deg) translateZ(${CUBE_SIZE}px)`,
            }}
          />
          {/* Right face */}
          <div
            style={{
              ...faceStyle,
              width: CUBE_SIZE,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${color}11`,
              transform: `rotateY(90deg) translateZ(${CUBE_SIZE}px)`,
            }}
          />
        </div>
      </div>
    )
  },
}

function CubeRotateComponent(props: MotionGraphicProps<CubeRotateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cube-rotate',
  title: 'Kinetic Cube Rotate',
  description: '3D cube rotation showing text on each face with preserve-3d transforms',
  tags: ['kinetic', 'typography', '3d', 'cube', 'rotate', 'perspective'],
  category: 'captions',
  component: CubeRotateComponent as any,
  defaultConfig: {
    words: ['THINK', 'OUTSIDE', 'THE', 'BOX'],
    colors: ['#F97316', '#EAB308', '#22C55E', '#3B82F6'],
    bgColor: '#0a0a0f',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['THINK', 'OUTSIDE', 'THE', 'BOX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F97316', '#EAB308', '#22C55E', '#3B82F6'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
