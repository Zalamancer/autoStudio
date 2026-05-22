import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const rotationAngle = time * 15
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial speed lines */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
            backgroundImage: `repeating-conic-gradient(
              from 0deg,
              transparent 0deg,
              transparent 8deg,
              rgba(0,0,0,0.08) 8deg,
              rgba(0,0,0,0.08) 10deg
            )`,
          }}
        />
        {/* Halftone dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0

    const seed = index * 53 + 17

    if (phase === 'enter') {
      // POW! slam in from scale 3 to 1 with rotation and elastic overshoot
      opacity = Math.min(1, enterProgress * 3)
      const t = enterProgress
      // Elastic overshoot
      scale = t < 1 ? 3 - 2 * t + Math.sin(t * Math.PI * 3) * (1 - t) * 0.6 : 1
      rotation = (1 - enterProgress) * ((seed % 2 === 0) ? 20 : -20)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight vibrate/shake
      const shakeX = Math.sin(Date.now() * 0.03 + seed) * 2
      const shakeY = Math.cos(Date.now() * 0.025 + seed * 2) * 2
      rotation = shakeX * 0.5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px)) rotate(${rotation}deg)`,
            opacity: 1,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 14vw, 190px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            WebkitTextStroke: '3px #000000',
            textShadow: '4px 4px 0 #000000, -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      // Shrink away with spin
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.9
      rotation = exitProgress * 360
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 'clamp(48px, 14vw, 190px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color,
          WebkitTextStroke: '3px #000000',
          textShadow: '4px 4px 0 #000000, -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ComicBoomComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-comic-boom',
  title: 'Kinetic Comic Boom',
  description: 'Comic book action word style with POW slam-in, speed lines, bold outlines, and spin exit',
  tags: ['kinetic', 'typography', 'comic', 'action', 'boom', 'pop-art'],
  category: 'captions',
  component: ComicBoomComponent as any,
  defaultConfig: {
    words: ['POW', 'BAM', 'BOOM', 'ZAP'],
    colors: ['#FF0000', '#0000FF', '#FF6600', '#00CC00'],
    bgColor: '#FFD700',
    cycleDuration: 0.9,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POW', 'BAM', 'BOOM', 'ZAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#FF6600', '#00CC00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.9, min: 0.3, max: 5, group: 'Timing' },
  ],
})
