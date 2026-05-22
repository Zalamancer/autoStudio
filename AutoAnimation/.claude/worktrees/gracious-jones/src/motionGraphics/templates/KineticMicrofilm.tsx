import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicrofilmConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Film grain dots
    const grainDots: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 40; i++) {
      grainDots.push({
        x: seededRand(i * 71 + frame * 3 + 11) * width,
        y: seededRand(i * 43 + frame * 5 + 29) * height,
        size: 1 + seededRand(i * 97 + frame) * 2,
        opacity: 0.03 + seededRand(i * 53 + frame * 2) * 0.06,
      })
    }

    // Film sprocket holes on sides
    const sprocketCount = 6
    const sprocketOffset = (time * 30) % (height / sprocketCount)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Blue-white backlight glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(180,200,255,0.08) 0%, rgba(100,130,200,0.03) 40%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Film strip edges */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 24,
            background: 'rgba(20,20,30,0.6)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 24,
            background: 'rgba(20,20,30,0.6)',
            pointerEvents: 'none',
          }}
        />
        {/* Sprocket holes left */}
        {Array.from({ length: sprocketCount + 1 }).map((_, i) => (
          <div
            key={`l${i}`}
            style={{
              position: 'absolute',
              left: 7,
              top: i * (height / sprocketCount) + sprocketOffset - height / sprocketCount,
              width: 10,
              height: 14,
              borderRadius: 2,
              background: 'rgba(40,50,70,0.8)',
              border: '1px solid rgba(80,100,140,0.2)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Sprocket holes right */}
        {Array.from({ length: sprocketCount + 1 }).map((_, i) => (
          <div
            key={`r${i}`}
            style={{
              position: 'absolute',
              right: 7,
              top: i * (height / sprocketCount) + sprocketOffset - height / sprocketCount,
              width: 10,
              height: 14,
              borderRadius: 2,
              background: 'rgba(40,50,70,0.8)',
              border: '1px solid rgba(80,100,140,0.2)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Film grain scatter */}
        {grainDots.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
              borderRadius: '50%',
              background: `rgba(200,210,240,${dot.opacity})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Viewer lens vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,10,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Faint crosshair */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 30,
            right: 30,
            height: 1,
            background: 'rgba(120,150,200,0.04)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 10,
            bottom: 10,
            width: 1,
            background: 'rgba(120,150,200,0.04)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Text zooms from impossibly tiny to readable size — magnification increasing
      const scale = 0.05 + Math.pow(enterProgress, 0.7) * 0.95
      const blur = Math.max(0, (1 - enterProgress) * 6 - enterProgress * 2)
      const opacity = Math.min(1, enterProgress * 2)
      // Slight drift as film advances into position
      const driftY = (1 - enterProgress) * 15
      const driftX = (1 - enterProgress) * Math.sin(f * 0.1) * 4

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(${scale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity,
            filter: `blur(${blur}px)`,
            textShadow: `0 0 4px ${color}40`,
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      // In focus, slight film weave/jitter
      const jitterX = Math.sin(f * 0.3) * 0.5
      const jitterY = Math.cos(f * 0.25) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            textShadow: `0 0 6px ${color}30, 0 0 15px rgba(150,180,255,0.1)`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: film scrolls away, text shrinks back down or drifts off
      const scale = 1 - Math.pow(exitProgress, 1.2) * 0.85
      const blur = exitProgress * 5
      const driftY = -exitProgress * 25
      const opacity = 1 - Math.pow(exitProgress, 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${driftY}px)) scale(${scale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity,
            filter: `blur(${blur}px)`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function MicrofilmComponent(props: MotionGraphicProps<MicrofilmConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-microfilm',
  title: 'Kinetic Microfilm',
  description:
    'Microfilm viewer: text zooms from impossibly tiny to readable as magnification increases, film grain, sprocket holes, blue-white backlight glow',
  tags: ['kinetic', 'typography', 'microfilm', 'spy', 'magnify', 'film', 'intelligence', 'viewer'],
  category: 'captions',
  component: MicrofilmComponent as any,
  defaultConfig: {
    words: ['MKULTRA', 'REDACT', 'SIGINT', 'COVERT'],
    colors: ['#C8D8F0', '#C8D8F0', '#C8D8F0', '#C8D8F0'],
    bgColor: '#080A10',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MKULTRA', 'REDACT', 'SIGINT', 'COVERT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8D8F0', '#C8D8F0', '#C8D8F0', '#C8D8F0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080A10', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
