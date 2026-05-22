import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiamondRevealConfig extends KineticBaseConfig {
  diamondColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let diamondScale = 0
    let diamondRotation = 45
    let textOpacity = 0
    let borderOpacity = 0.8

    if (phase === 'enter') {
      const ease = easeOutCubic(enterProgress)
      diamondScale = ease * 1.0
      diamondRotation = 45 - ease * 0 // stays at 45 (diamond orientation)
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
      borderOpacity = 0.3 + ease * 0.5
    } else if (phase === 'hold') {
      diamondScale = 1
      diamondRotation = 45 + Math.sin(holdProgress * Math.PI * 2) * 3
      textOpacity = 1
      borderOpacity = 0.8
    } else {
      const ease = easeInCubic(exitProgress)
      diamondScale = 1 - ease * 0.9
      diamondRotation = 45 + 3 + ease * 10
      textOpacity = 1 - ease
      borderOpacity = 0.8 - ease * 0.7
    }

    // Diamond clip-path: polygon with top, right, bottom, left points
    const diamondSize = 65 // percentage of container

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Diamond shape */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${diamondSize}%`,
            height: `${diamondSize}%`,
            transform: `translate(-50%, -50%) rotate(${diamondRotation}deg) scale(${diamondScale})`,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            background: 'rgba(255,255,255,0.03)',
            border: 'none',
          }}
        >
          {/* Inner border via box-shadow since clip-path clips borders */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'transparent',
            }}
          />
        </div>

        {/* Diamond border using SVG for clean edges */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <polygon
            points="50,10 90,50 50,90 10,50"
            fill="none"
            stroke="rgba(255,200,50,0.8)"
            strokeWidth="0.8"
            opacity={borderOpacity}
            style={{
              transform: `rotate(${diamondRotation - 45}deg) scale(${diamondScale})`,
              transformOrigin: '50px 50px',
            }}
          />
          {/* Inner diamond border */}
          <polygon
            points="50,18 82,50 50,82 18,50"
            fill="none"
            stroke="rgba(255,200,50,0.4)"
            strokeWidth="0.4"
            opacity={borderOpacity * 0.6}
            style={{
              transform: `rotate(${diamondRotation - 45}deg) scale(${diamondScale})`,
              transformOrigin: '50px 50px',
            }}
          />
        </svg>

        {/* Text (not rotated) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${Math.max(0.01, diamondScale)})`,
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 0 20px rgba(255,200,50,0.3), 0 2px 6px rgba(0,0,0,0.5)',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DiamondRevealComponent(props: MotionGraphicProps<DiamondRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-diamond-reveal',
  title: 'Kinetic Diamond Reveal',
  description: 'A diamond/rhombus shape scales up from center to frame the text. Subtle rotation during hold. Diamond shrinks on exit.',
  tags: ['kinetic', 'typography', 'diamond', 'rhombus', 'geometric', 'reveal', 'clip-path'],
  category: 'captions',
  component: DiamondRevealComponent as any,
  defaultConfig: {
    words: ['DIAMOND', 'SHARP', 'PRISM', 'EDGE'],
    colors: ['#FFFFFF', '#FFE680', '#FFFFFF', '#FFE680'],
    bgColor: '#0c0c16',
    cycleDuration: 1.5,
    diamondColor: '#FFC832',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DIAMOND', 'SHARP', 'PRISM', 'EDGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE680', '#FFFFFF', '#FFE680'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c16', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'diamondColor', label: 'Diamond Color', type: 'color', defaultValue: '#FFC832', group: 'Animation' },
  ],
})
