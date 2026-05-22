import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DarkroomDevelopConfig extends KineticBaseConfig {
  developSpeed: number
  stopBath: boolean
}

function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Developer tray — amber safelight glow
    const t = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Developer tray bottom border */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '15%',
            background: 'rgba(180,140,60,0.08)',
            borderTop: '2px solid rgba(180,140,60,0.15)',
          }}
        />
        {/* Liquid surface shimmer line */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(180,140,60,${0.1 + Math.sin(t * 2) * 0.05}), transparent)`,
          }}
        />
        {/* Amber safelight vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(180,100,20,0.12) 100%)',
          }}
        />
        {/* Darkroom label */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            opacity: 0.25,
            fontFamily: 'monospace',
            fontSize: 9,
            color: '#C89040',
            letterSpacing: 2,
          }}
        >
          DEVELOPER ◆ STOP ◆ FIX
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    let developP = 0
    let fadeP = 0

    if (phase === 'enter') {
      // 3-step development: silver emerges slowly, then clarity snaps in
      developP = easeOutSine(enterProgress)
    } else if (phase === 'hold') {
      developP = 1
    } else {
      developP = 1
      // "Fix" (hypo) wash clears the image: text bleaches out
      fadeP = easeInCubic(exitProgress)
    }

    // Development stages:
    // 0-40%: ghost image emerges (very low contrast sepia)
    // 40-70%: silver develops (grayscale buildup with noise)
    // 70-100%: image fully exposed (contrast snaps)

    const stage1P = Math.min(1, developP / 0.4)
    const stage2P = Math.min(1, Math.max(0, (developP - 0.4) / 0.3))
    const stage3P = Math.min(1, Math.max(0, (developP - 0.7) / 0.3))

    // Color transition: white -> sepia -> silver -> full color
    const ghostOpacity = stage1P * 0.12
    const silverOpacity = stage2P * 0.6
    const finalOpacity = stage3P * (1 - fadeP)

    // Developer spots — uneven development artifact
    const spots = []
    const spotCount = 12
    const spotSeed = index * 43
    for (let s = 0; s < spotCount; s++) {
      const p0 = pseudo(spotSeed + s * 17)
      const p1 = pseudo(spotSeed + s * 13 + 1)
      const p2 = pseudo(spotSeed + s * 7 + 2)

      const spotX = (p0 - 0.5) * width * 0.8
      const spotY = (p1 - 0.5) * height * 0.6
      const spotSize = 30 + p2 * 60
      const spotDelay = p2 * 0.5
      const spotP = Math.max(0, Math.min(1, (stage2P - spotDelay) / (1 - spotDelay + 0.01)))

      if (spotP <= 0) continue

      spots.push(
        <div
          key={s}
          style={{
            position: 'absolute',
            left: `calc(50% + ${spotX}px)`,
            top: `calc(50% + ${spotY}px)`,
            width: spotSize,
            height: spotSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(200,180,120,${spotP * 0.06}), transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            opacity: 1 - stage3P,
          }}
        />,
      )
    }

    return (
      <>
        {spots}
        {/* Ghost image — barely visible silver halide exposure */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, ghostOpacity - silverOpacity * 0.3),
            whiteSpace: 'nowrap',
            filter: 'blur(3px)',
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color: '#C89040',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>

        {/* Silver grain developing */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, silverOpacity * (1 - stage3P * 0.7) * (1 - fadeP)),
            whiteSpace: 'nowrap',
            filter: `blur(${(1 - silverOpacity) * 2}px) contrast(${0.6 + silverOpacity * 0.6})`,
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color: '#888880',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>

        {/* Final fixed image */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, finalOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function DarkroomDevelopComponent(props: MotionGraphicProps<DarkroomDevelopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-darkroom-develop',
  title: 'Kinetic Darkroom Develop',
  description:
    'Text develops like a darkroom print in a developer tray — ghost image appears in sepia, silver grain builds up, then the fully-fixed image snaps to clarity. Bleaches out on exit.',
  tags: ['kinetic', 'typography', 'darkroom', 'develop', 'photo', 'silver', 'chemistry', 'process', 'analog', 'reveal'],
  category: 'captions',
  component: DarkroomDevelopComponent as any,
  defaultConfig: {
    words: ['DEVELOP', 'FIX', 'EXPOSE', 'PRINT'],
    colors: ['#F5F0E8', '#E8E0D0', '#FFFFFF', '#D4C9B8'],
    bgColor: '#0E0A04',
    cycleDuration: 2.4,
    developSpeed: 1,
    stopBath: true,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEVELOP', 'FIX', 'EXPOSE', 'PRINT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5F0E8', '#E8E0D0', '#FFFFFF', '#D4C9B8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0A04', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.4,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'developSpeed',
      label: 'Develop Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 3,
      group: 'Animation',
    },
    { key: 'stopBath', label: 'Stop Bath Exit', type: 'boolean', defaultValue: true, group: 'Animation' },
  ],
})
