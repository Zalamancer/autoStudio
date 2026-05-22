import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhilatelicConfig extends KineticBaseConfig {}

/**
 * Generate perforated edge clip-path for stamp border.
 * Creates semicircular notches along all four edges.
 */
function perfClip(teethX: number, teethY: number): string {
  const points: string[] = []
  const dx = 100 / teethX
  const dy = 100 / teethY
  const r = 1.3

  // Top edge
  for (let i = 0; i <= teethX; i++) {
    points.push(`${i * dx}% ${i % 2 === 0 ? 0 : r}%`)
  }
  // Right edge
  for (let i = 1; i <= teethY; i++) {
    points.push(`${i % 2 === 0 ? 100 : 100 - r}% ${i * dy}%`)
  }
  // Bottom edge
  for (let i = teethX; i >= 0; i--) {
    points.push(`${i * dx}% ${i % 2 === 0 ? 100 : 100 - r}%`)
  }
  // Left edge
  for (let i = teethY - 1; i >= 1; i--) {
    points.push(`${i % 2 === 0 ? 0 : r}% ${i * dy}%`)
  }

  return `polygon(${points.join(', ')})`
}

const stampClip = perfClip(12, 16)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const stampW = Math.min(width * 0.45, height * 0.55)
    const stampH = stampW * 1.35

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Album page — grid / quadrille texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Stamp with perforated edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: stampW,
            height: stampH,
            transform: `translate(-50%, -50%) rotate(${Math.sin(time * 0.3) * 0.4}deg)`,
            clipPath: stampClip,
            background: 'linear-gradient(165deg, #f8f4ee 0%, #f2eadc 40%, #ece0cc 100%)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
          }}
        >
          {/* Inner decorative frame */}
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '5%',
              right: '5%',
              bottom: '5%',
              border: '2px solid rgba(100,50,30,0.15)',
              borderRadius: 2,
            }}
          />
          {/* Second inner frame */}
          <div
            style={{
              position: 'absolute',
              top: '7%',
              left: '7%',
              right: '7%',
              bottom: '7%',
              border: '1px solid rgba(100,50,30,0.08)',
              borderRadius: 1,
            }}
          />
          {/* Country name banner at top */}
          <div
            style={{
              position: 'absolute',
              top: '9%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.045,
              fontWeight: 700,
              color: 'rgba(100,50,30,0.35)',
              letterSpacing: 5,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            United States
          </div>
          {/* Decorative vignette illustration area — hatched oval */}
          <div
            style={{
              position: 'absolute',
              top: '22%',
              left: '50%',
              width: stampW * 0.5,
              height: stampW * 0.35,
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              border: '1px solid rgba(100,50,30,0.08)',
              background: 'radial-gradient(ellipse, rgba(100,50,30,0.02), rgba(100,50,30,0.05))',
            }}
          >
            {/* Engraving-style crosshatch lines */}
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${10 + i * 10}%`,
                  left: '10%',
                  right: '10%',
                  height: 1,
                  background: 'rgba(100,50,30,0.04)',
                  transform: `rotate(${i % 2 === 0 ? 0 : 45}deg)`,
                }}
              />
            ))}
          </div>
          {/* Denomination value */}
          <div
            style={{
              position: 'absolute',
              bottom: '9%',
              right: '10%',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.07,
              fontWeight: 700,
              color: 'rgba(100,50,30,0.35)',
            }}
          >
            $0.63
          </div>
          {/* Year */}
          <div
            style={{
              position: 'absolute',
              bottom: '9%',
              left: '10%',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.04,
              color: 'rgba(100,50,30,0.25)',
            }}
          >
            2026
          </div>
          {/* Commemorative subtitle area */}
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Georgia', serif",
              fontSize: stampW * 0.03,
              color: 'rgba(100,50,30,0.2)',
              letterSpacing: 3,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Commemorative Series
          </div>
        </div>
        {/* Hinge mount at top of stamp */}
        <div
          style={{
            position: 'absolute',
            top: `${50 - (stampH / height) * 50 - 0.5}%`,
            left: '50%',
            width: stampW * 0.12,
            height: stampW * 0.06,
            transform: 'translateX(-50%)',
            background: 'rgba(200,180,140,0.4)',
            borderRadius: '0 0 2px 2px',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const stampW = Math.min(width * 0.45, height * 0.55)
    let opacity = 0
    let scale = 1
    let rotation = 0

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Stamp placed onto album page — drops from tweezers
        const t = enterProgress / 0.3
        const eased = t * t
        opacity = eased
        scale = 0.7 + eased * 0.35
        rotation = (1 - eased) * 6
      } else if (enterProgress < 0.6) {
        // Settles into mount
        const t = (enterProgress - 0.3) / 0.3
        opacity = 1
        scale = 1.05 - t * 0.05
        rotation = Math.sin(t * Math.PI * 2) * 1.5
      } else {
        // Text engraving reveals
        const t = (enterProgress - 0.6) / 0.4
        opacity = 1
        scale = 1
        rotation = Math.sin(t * Math.PI) * 0.3
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotation = Math.sin(holdProgress * Math.PI * 2) * 0.3
    } else {
      // Lifts off page
      opacity = 1 - exitProgress * 0.8
      scale = 1 + exitProgress * 0.1
      rotation = exitProgress * -4
      if (exitProgress > 0.8) opacity = (1 - exitProgress) * 5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -15%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Main stamp text — engraved style */}
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(20px, ${stampW * 0.1}px, 56px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textAlign: 'center',
            textShadow: `0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PhilatelicComponent(props: MotionGraphicProps<PhilatelicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-philatelic',
  title: 'Kinetic Philatelic',
  description:
    'Postage stamp with perforated edges, engraved decorative frame, denomination, country name, and commemorative design. Text placed like a collectible stamp on album page with hinge mount.',
  tags: ['kinetic', 'typography', 'philatelic', 'stamp', 'postage', 'perforated', 'commemorative', 'collection', 'engraved'],
  category: 'captions',
  component: PhilatelicComponent as any,
  defaultConfig: {
    words: ['HONOR', 'VALOR', 'GRACE', 'PRIDE'],
    colors: ['#5a2a1a', '#5a2a1a', '#5a2a1a', '#5a2a1a'],
    bgColor: '#ddd8cc',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HONOR', 'VALOR', 'GRACE', 'PRIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5a2a1a', '#5a2a1a', '#5a2a1a', '#5a2a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ddd8cc', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
