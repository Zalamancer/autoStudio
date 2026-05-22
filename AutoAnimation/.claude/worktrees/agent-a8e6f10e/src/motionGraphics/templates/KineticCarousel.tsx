import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CarouselConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const TOTAL_ITEMS = 8
const RADIUS = 400

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 60%, ${bgColor}dd, ${bgColor})`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Calculate carousel rotation angle
    let rotationOffset = 0

    if (phase === 'enter') {
      // Rotate from previous position to front
      const eased = easeInOutCubic(enterProgress)
      rotationOffset = (360 / TOTAL_ITEMS) * (1 - eased)
    } else if (phase === 'hold') {
      // Very subtle drift
      rotationOffset = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      // Rotate to next position
      const eased = easeInOutCubic(exitProgress)
      rotationOffset = -(360 / TOTAL_ITEMS) * eased
    }

    const items = []
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const angle = (i * 360) / TOTAL_ITEMS + rotationOffset
      const radians = (angle * Math.PI) / 180
      const z = Math.cos(radians) * RADIUS
      const x = Math.sin(radians) * RADIUS
      const isFront = i === 0
      const depthOpacity = (z + RADIUS) / (2 * RADIUS)
      const itemScale = 0.6 + 0.4 * depthOpacity

      items.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            transform: `translateX(${x}px) translateZ(${z}px) scale(${itemScale})`,
            opacity: isFront ? 1 : 0.15 + depthOpacity * 0.35,
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 800,
            color: isFront ? color : `${color}88`,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textShadow: isFront ? `0 0 30px ${color}66, 0 4px 20px rgba(0,0,0,0.4)` : 'none',
            transition: 'none',
            zIndex: Math.round(depthOpacity * 100),
          }}
        >
          {isFront ? word : ''}
        </div>,
      )
    }

    // Ghost items to show carousel structure
    const ghostWords = ['', '', '', '', '', '', '']
    for (let i = 1; i < TOTAL_ITEMS; i++) {
      const angle = (i * 360) / TOTAL_ITEMS + rotationOffset
      const radians = (angle * Math.PI) / 180
      const z = Math.cos(radians) * RADIUS
      const x = Math.sin(radians) * RADIUS
      const depthOpacity = (z + RADIUS) / (2 * RADIUS)
      const itemScale = 0.5 + 0.3 * depthOpacity

      items.push(
        <div
          key={`ghost-${i}`}
          style={{
            position: 'absolute',
            transform: `translateX(${x}px) translateZ(${z}px) scale(${itemScale})`,
            opacity: 0.05 + depthOpacity * 0.12,
            width: 120 + depthOpacity * 60,
            height: 16,
            borderRadius: 8,
            background: `${color}44`,
            zIndex: Math.round(depthOpacity * 100),
          }}
        />,
      )
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
          perspectiveOrigin: '50% 45%',
        }}
      >
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: 0,
            height: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {items}
        </div>
      </div>
    )
  },
}

function CarouselComponent(props: MotionGraphicProps<CarouselConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-carousel',
  title: 'Kinetic Carousel',
  description: '3D carousel ring with words arranged in circular space using translateZ and rotateY',
  tags: ['kinetic', 'typography', '3d', 'carousel', 'ring', 'circular', 'perspective'],
  category: 'captions',
  component: CarouselComponent as any,
  defaultConfig: {
    words: ['SPIN', 'THE', 'WHEEL', 'GO'],
    colors: ['#F472B6', '#A78BFA', '#34D399', '#FBBF24'],
    bgColor: '#0a0a14',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPIN', 'THE', 'WHEEL', 'GO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F472B6', '#A78BFA', '#34D399', '#FBBF24'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
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
