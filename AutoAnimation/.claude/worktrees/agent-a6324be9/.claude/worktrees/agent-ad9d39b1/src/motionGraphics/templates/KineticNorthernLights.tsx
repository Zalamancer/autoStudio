import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NorthernLightsConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Multiple animated aurora bands
    const band1Y = 20 + Math.sin(time * 0.3) * 15
    const band2Y = 45 + Math.sin(time * 0.4 + 1) * 12
    const band3Y = 65 + Math.sin(time * 0.35 + 2.5) * 10

    const band1Hue = 140 + Math.sin(time * 0.2) * 20
    const band2Hue = 270 + Math.sin(time * 0.25 + 1) * 30
    const band3Hue = 200 + Math.sin(time * 0.3 + 2) * 25

    const band1Opacity = 0.25 + Math.sin(time * 0.5) * 0.1
    const band2Opacity = 0.2 + Math.sin(time * 0.6 + 1) * 0.08
    const band3Opacity = 0.18 + Math.sin(time * 0.45 + 2) * 0.07

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#050a18' }}>
        {/* Band 1 - Green */}
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            top: `${band1Y}%`,
            height: '30%',
            background: `linear-gradient(180deg,
              transparent 0%,
              hsla(${band1Hue}, 80%, 55%, ${band1Opacity}) 30%,
              hsla(${band1Hue}, 90%, 45%, ${band1Opacity * 1.2}) 50%,
              hsla(${band1Hue}, 80%, 55%, ${band1Opacity}) 70%,
              transparent 100%)`,
            transform: `skewY(${Math.sin(time * 0.2) * 3}deg)`,
          }}
        />
        {/* Band 2 - Purple */}
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            top: `${band2Y}%`,
            height: '25%',
            background: `linear-gradient(180deg,
              transparent 0%,
              hsla(${band2Hue}, 70%, 50%, ${band2Opacity}) 35%,
              hsla(${band2Hue}, 85%, 40%, ${band2Opacity * 1.1}) 50%,
              hsla(${band2Hue}, 70%, 50%, ${band2Opacity}) 65%,
              transparent 100%)`,
            transform: `skewY(${Math.sin(time * 0.25 + 1) * -2}deg)`,
          }}
        />
        {/* Band 3 - Blue */}
        <div
          style={{
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            top: `${band3Y}%`,
            height: '22%',
            background: `linear-gradient(180deg,
              transparent 0%,
              hsla(${band3Hue}, 75%, 50%, ${band3Opacity}) 30%,
              hsla(${band3Hue}, 85%, 42%, ${band3Opacity * 1.15}) 50%,
              hsla(${band3Hue}, 75%, 50%, ${band3Opacity}) 70%,
              transparent 100%)`,
            transform: `skewY(${Math.sin(time * 0.3 + 2) * 2.5}deg)`,
          }}
        />
        {/* Star field dots */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 13 + 5) % 95}%`,
              top: `${(i * 17 + 8) % 90}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: '#fff',
              opacity: 0.3 + Math.sin(time * 2 + i) * 0.2,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 20
      blur = (1 - enterProgress) * 6
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle floating wave
      translateY = Math.sin(holdProgress * Math.PI * 4) * 4
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 15
      blur = exitProgress * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 300,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#E0F0FF',
          textShadow: `
            0 0 15px rgba(100, 255, 180, 0.4),
            0 0 40px rgba(100, 200, 255, 0.2),
            0 0 60px rgba(160, 100, 255, 0.15)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function NorthernLightsComponent(props: MotionGraphicProps<NorthernLightsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-northern-lights',
  title: 'Kinetic Northern Lights',
  description: 'Vivid animated aurora gradient bands in green/purple/blue with floating text against a starry sky',
  tags: ['kinetic', 'typography', 'aurora', 'gradient', 'northern-lights', 'sky'],
  category: 'captions',
  component: NorthernLightsComponent as any,
  defaultConfig: {
    words: ['NORTHERN', 'LIGHTS', 'SHIMMER', 'GLOW'],
    colors: ['#64FFB4', '#64C8FF', '#A064FF', '#00E5FF'],
    bgColor: '#050a18',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NORTHERN', 'LIGHTS', 'SHIMMER', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64FFB4', '#64C8FF', '#A064FF', '#00E5FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
