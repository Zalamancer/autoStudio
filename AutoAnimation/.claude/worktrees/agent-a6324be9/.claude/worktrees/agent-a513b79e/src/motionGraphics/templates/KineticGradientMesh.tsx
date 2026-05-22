import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GradientMeshConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate animated mesh gradient blobs
    const blobs = [
      { cx: 30 + Math.sin(time * 0.7) * 20, cy: 30 + Math.cos(time * 0.5) * 20, color: '#FF6B9D', size: 45 },
      { cx: 70 + Math.cos(time * 0.6) * 25, cy: 25 + Math.sin(time * 0.8) * 15, color: '#C084FC', size: 50 },
      { cx: 20 + Math.sin(time * 0.4 + 1) * 15, cy: 70 + Math.cos(time * 0.9) * 20, color: '#60A5FA', size: 40 },
      { cx: 75 + Math.cos(time * 0.5 + 2) * 20, cy: 75 + Math.sin(time * 0.7 + 1) * 15, color: '#34D399', size: 48 },
      { cx: 50 + Math.sin(time * 0.3) * 10, cy: 50 + Math.cos(time * 0.6) * 10, color: '#FBBF24', size: 35 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0F0B1E',
          overflow: 'hidden',
        }}
      >
        {blobs.map((blob, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${blob.cx}%`,
              top: `${blob.cy}%`,
              width: `${blob.size}%`,
              height: `${blob.size}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${blob.color}90 0%, ${blob.color}40 40%, transparent 70%)`,
              filter: 'blur(40px)',
              mixBlendMode: 'screen',
            }}
          />
        ))}
        {/* Mesh overlay with subtle grid lines */}
        {Array.from({ length: 8 }, (_, i) => {
          const offset = (time * 15 + i * 40) % (height + 100) - 50
          return (
            <div
              key={`h-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: offset,
                height: 1,
                background: 'rgba(255,255,255,0.04)',
              }}
            />
          )
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const offset = (time * 12 + i * 50) % (width + 100) - 50
          return (
            <div
              key={`v-${i}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: offset,
                width: 1,
                background: 'rgba(255,255,255,0.04)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = eased
      scale = 0.6 + eased * 0.4
      blur = (1 - eased) * 12
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(Date.now() * 0.003 + index * 2) * 0.02
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 0.3
      blur = eased * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: `blur(${blur}px)`,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(42px, 12vw, 160px)',
          fontWeight: 900,
          letterSpacing: -2,
          whiteSpace: 'nowrap',
          color: 'transparent',
          backgroundImage: `linear-gradient(135deg, ${color}, #C084FC, #60A5FA, ${color})`,
          backgroundSize: '300% 300%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          filter: `blur(${blur}px) drop-shadow(0 0 20px ${color}50)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function GradientMeshComponent(props: MotionGraphicProps<GradientMeshConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gradient-mesh',
  title: 'Kinetic Gradient Mesh',
  description: 'Text with animated gradient mesh background — floating color blobs with screen blend, subtle mesh grid overlay, gradient text',
  tags: ['kinetic', 'typography', 'gradient', 'mesh', 'colorful', 'modern', 'abstract'],
  category: 'captions',
  component: GradientMeshComponent as any,
  defaultConfig: {
    words: ['MESH', 'GLOW', 'BLEND', 'FLOW'],
    colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'],
    bgColor: '#0F0B1E',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MESH', 'GLOW', 'BLEND', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0B1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
