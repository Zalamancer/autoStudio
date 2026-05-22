import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CyberpunkNeonConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Rain-like vertical lines
    const rainDrops = Array.from({ length: 30 }, (_, i) => {
      const seed = i * 67 + 11
      const x = ((seed * 13) % 100)
      const speed = 15 + (seed % 20)
      const y = ((time * speed + i * 40) % 140) - 20
      const lineHeight = 15 + (seed % 25)
      const lineOpacity = 0.04 + (seed % 5) * 0.01

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 1,
            height: lineHeight,
            background: `linear-gradient(180deg, rgba(100,180,255,${lineOpacity}), transparent)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#0a0e27'
            ? 'linear-gradient(180deg, #0a0e27 0%, #0d1230 50%, #151a3d 100%)'
            : bgColor,
        }}
      >
        {rainDrops}
        {/* City horizon glow at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '25%',
            background: 'linear-gradient(0deg, rgba(255,0,100,0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal neon line accent */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: '75%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,0,128,0.2), rgba(0,200,255,0.2), transparent)',
            boxShadow: '0 0 8px rgba(255,0,128,0.1)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0

    if (phase === 'enter') {
      // Neon sign flicker-on effect
      if (enterProgress < 0.15) {
        opacity = 0
      } else if (enterProgress < 0.25) {
        opacity = 0.8
      } else if (enterProgress < 0.3) {
        opacity = 0.1
      } else if (enterProgress < 0.4) {
        opacity = 0.9
      } else if (enterProgress < 0.45) {
        opacity = 0.2
      } else if (enterProgress < 0.55) {
        opacity = 1
      } else if (enterProgress < 0.6) {
        opacity = 0.4
      } else {
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Steady glow with very subtle pulse
      opacity = 0.92 + Math.sin(f * 0.1 + index * 2) * 0.08
    } else {
      // Neon flicker off
      if (exitProgress < 0.4) {
        opacity = 1
      } else if (exitProgress < 0.5) {
        opacity = 0.3
      } else if (exitProgress < 0.6) {
        opacity = 0.8
      } else if (exitProgress < 0.7) {
        opacity = 0.1
      } else if (exitProgress < 0.8) {
        opacity = 0.5
      } else {
        opacity = Math.max(0, 1 - (exitProgress - 0.8) / 0.2)
      }
    }

    // Multi-layered neon glow
    const glowIntensity = opacity
    const glowLayers = [
      `0 0 7px ${color}`,
      `0 0 15px ${color}`,
      `0 0 30px ${color}`,
      `0 0 50px ${color}`,
      `0 0 80px ${color}`,
    ].join(', ')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: glowLayers,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
        {/* Neon reflection below */}
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'inherit',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
            opacity: 0.15,
            transform: 'scaleY(-0.3)',
            transformOrigin: 'top center',
            filter: 'blur(2px)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CyberpunkNeonComponent(props: MotionGraphicProps<CyberpunkNeonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cyberpunk-neon',
  title: 'Kinetic Cyberpunk Neon',
  description: 'Cyberpunk neon sign with intense multi-layer glow, flicker-on effect, rain lines, and dark city background',
  tags: ['kinetic', 'typography', 'cyberpunk', 'neon', 'glow', 'rain', 'night', 'aesthetic'],
  category: 'captions',
  component: CyberpunkNeonComponent as any,
  defaultConfig: {
    words: ['NIGHT', 'CITY', 'GLOW', 'EDGE'],
    colors: ['#FF1493', '#FF1493', '#00BFFF', '#FF1493'],
    bgColor: '#0a0e27',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NIGHT', 'CITY', 'GLOW', 'EDGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF1493', '#FF1493', '#00BFFF', '#FF1493'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e27', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
