import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RainbowArcConfig extends KineticBaseConfig {}

const RAINBOW_COLORS = ['#FF0000', '#FF8800', '#FFFF00', '#00CC00', '#0066FF', '#4400CC', '#8800AA']

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const centerX = width / 2
    const baseY = height * 0.85

    // Animated rainbow arc bands
    const arcProgress = Math.min(1, time * 0.4)
    const rainbowOpacity = 0.25 + Math.sin(time * 0.6) * 0.08

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #4a90c2 0%, #7ab8e0 40%, #a8d8ea 70%, #e0f0e8 100%)`,
      }}>
        {/* Sun glow */}
        <div style={{
          position: 'absolute',
          right: '10%',
          top: '8%',
          width: '15%',
          height: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,100,0.8) 0%, rgba(255,200,50,0.3) 50%, transparent 70%)',
          boxShadow: '0 0 60px rgba(255,220,80,0.3)',
        }} />

        {/* Rainbow arcs */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {RAINBOW_COLORS.map((color, i) => {
            const radius = height * 0.5 + i * (width * 0.025)
            const dashLen = Math.PI * radius
            const drawn = dashLen * arcProgress

            return (
              <circle
                key={i}
                cx={centerX}
                cy={baseY}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={width * 0.018}
                opacity={rainbowOpacity + (Math.sin(time * 0.8 + i * 0.5) * 0.05)}
                strokeDasharray={`${dashLen}`}
                strokeDashoffset={dashLen - drawn}
                transform={`rotate(180 ${centerX} ${baseY})`}
              />
            )
          })}
        </svg>

        {/* Rain drops fading away */}
        {[...Array(12)].map((_, i) => {
          const dropX = (i * 83 + 17) % 100
          const dropY = ((frame * 0.5 + i * 97) % 110) - 10
          const dropOpacity = Math.max(0, 0.15 - time * 0.02)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${dropX}%`,
                top: `${dropY}%`,
                width: 2,
                height: 8,
                borderRadius: 1,
                background: `rgba(100,140,200,${dropOpacity})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scale = 1
    let blur = 0
    let rotate = 0

    if (phase === 'enter') {
      // Arc up into position
      opacity = Math.min(1, enterProgress * 2)
      translateY = (1 - enterProgress) * 40
      scale = 0.7 + enterProgress * 0.3
      rotate = (1 - enterProgress) * -10
      blur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle rainbow shimmer float
      translateY = Math.sin(holdProgress * Math.PI * 3) * 5
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.02
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 30
      scale = 1 + exitProgress * 0.1
      blur = exitProgress * 6
    }

    // Cycle through rainbow colors for the glow
    const hue = (index * 51 + holdProgress * 360) % 360

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 800,
          fontFamily: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#FFFFFF',
          textShadow: `
            0 0 20px hsla(${hue}, 80%, 60%, 0.6),
            0 0 40px hsla(${hue}, 70%, 50%, 0.3),
            0 3px 6px rgba(0,0,0,0.15)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function RainbowArcComponent(props: MotionGraphicProps<RainbowArcConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rainbow-arc',
  title: 'Kinetic Rainbow Arc',
  description: 'Text follows a rainbow arc path with colorful shimmer against a clearing sky',
  tags: ['kinetic', 'typography', 'rainbow', 'arc', 'weather', 'colorful', 'cheerful'],
  category: 'captions',
  component: RainbowArcComponent as any,
  defaultConfig: {
    words: ['RAINBOW', 'COLORS', 'SHINE', 'BRIGHT'],
    colors: ['#FF4444', '#FF8800', '#FFDD00', '#44CC44'],
    bgColor: '#4a90c2',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAINBOW', 'COLORS', 'SHINE', 'BRIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF8800', '#FFDD00', '#44CC44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#4a90c2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
