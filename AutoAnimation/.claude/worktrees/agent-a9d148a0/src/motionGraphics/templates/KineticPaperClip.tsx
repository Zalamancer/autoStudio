import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperClipConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Renders an SVG paper clip icon above the text */
function PaperClipSVG({ clipColor, scale = 1 }: { clipColor: string; scale?: number }) {
  return (
    <svg
      width={36 * scale}
      height={72 * scale}
      viewBox="0 0 36 72"
      fill="none"
      style={{ display: 'block' }}
    >
      {/* Outer loop */}
      <path
        d="M18 2 C8 2 2 9 2 18 L2 54 C2 63 8 70 18 70 C28 70 34 63 34 54 L34 20"
        stroke={clipColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner loop */}
      <path
        d="M18 12 C12 12 9 17 9 22 L9 54 C9 59 12 62 18 62 C24 62 27 59 27 54 L27 20"
        stroke={clipColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Top connecting arc */}
      <path
        d="M18 2 C28 2 34 9 34 18 C34 18 34 19 34 20"
        stroke={clipColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

const clipColors = ['#B0B0B8', '#C0C8D0', '#A8B4BC', '#8090A0', '#C8C0B8']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle horizontal ruled lines — like notebook paper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(100,140,200,0.12) 31px, rgba(100,140,200,0.12) 32px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 41 + 7
    const clipColor = clipColors[index % clipColors.length]
    const tiltAngle = (seed % 5) - 2 // subtle tilt per word

    let translateX = 0
    let translateY = 0
    let opacity = 1
    let clipOffsetY = 0
    let clipOpacity = 1
    let rotation = tiltAngle

    if (phase === 'enter') {
      // Paper slides in from the left, clip swings in from above
      const eased = easeOutBack(enterProgress)
      translateX = (1 - eased) * -300
      opacity = Math.min(1, enterProgress * 2)
      clipOffsetY = (1 - Math.min(1, enterProgress * 1.5)) * -60
      clipOpacity = Math.min(1, enterProgress * 2.5)
      rotation = tiltAngle + (1 - easeOutCubic(enterProgress)) * -8
    } else if (phase === 'hold') {
      // Subtle sway as if hanging
      const sway = Math.sin(holdProgress * Math.PI * 3 + seed) * 1.5
      rotation = tiltAngle + sway
      translateY = Math.sin(holdProgress * Math.PI * 2 + seed) * 2
    } else {
      // Slides back out to the right
      const eased = easeOutCubic(exitProgress)
      translateX = eased * 300
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Paper clip sits at the top-left corner */}
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: 8,
            transform: `translateY(${clipOffsetY}px)`,
            opacity: clipOpacity,
            filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.18))',
          }}
        >
          <PaperClipSVG clipColor={clipColor} scale={0.9} />
        </div>

        {/* Paper/card that holds the text */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.92)',
            padding: 'clamp(14px, 3.5vw, 38px) clamp(24px, 6vw, 64px)',
            boxShadow: '2px 5px 18px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', 'Courier', monospace",
              fontSize: 'clamp(32px, 8vw, 108px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function PaperClipComponent(props: MotionGraphicProps<PaperClipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-clip',
  title: 'Kinetic Paper Clip',
  description: 'Text slides in attached to an animated paper clip — metal clip swings in from above as paper enters from the side',
  tags: ['kinetic', 'typography', 'paperclip', 'office', 'paper', 'attach', 'stationery', 'clip'],
  category: 'captions',
  component: PaperClipComponent as any,
  defaultConfig: {
    words: ['ATTACH', 'CLIP', 'HOLD', 'FILE'],
    colors: ['#2C3E50', '#1A3A5C', '#2E4057', '#34495E'],
    bgColor: '#F5F2EB',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ATTACH', 'CLIP', 'HOLD', 'FILE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#1A3A5C', '#2E4057', '#34495E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F2EB', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
