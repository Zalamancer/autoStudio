import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let flashOpacity = 0

    if (phase === 'enter') {
      // Strobe flash then word appears with scale bounce
      if (enterProgress < 0.15) {
        flashOpacity = 1 - enterProgress / 0.15
      }
      opacity = enterProgress < 0.15 ? 0 : Math.min(1, (enterProgress - 0.15) * 2)
      const t = Math.max(0, (enterProgress - 0.15) / 0.85)
      // Elastic overshoot
      scale = t < 1 ? 1 + Math.sin(t * Math.PI * 2.5) * (1 - t) * 0.5 : 1
    } else if (phase === 'hold') {
      opacity = 1
      // Pulsing scale synced to beat
      scale = 1 + Math.sin(Date.now() * 0.012) * 0.05
    } else {
      // Zoom out rapidly with trail effect
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.8
    }

    const neonColors = ['#FF00FF', '#00FF00', '#FFFF00', '#00FFFF']
    const shadowColor1 = neonColors[index % neonColors.length]
    const shadowColor2 = neonColors[(index + 1) % neonColors.length]
    const shadowColor3 = neonColors[(index + 2) % neonColors.length]

    return (
      <>
        {/* White strobe flash */}
        {flashOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#FFFFFF',
              opacity: flashOpacity,
            }}
          />
        )}
        {/* Trail layers during exit */}
        {phase === 'exit' && exitProgress < 0.6 && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scale * 1.15})`,
                opacity: opacity * 0.3,
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 13vw, 180px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: shadowColor1,
                whiteSpace: 'nowrap',
              }}
            >
              {word}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scale * 1.3})`,
                opacity: opacity * 0.15,
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 13vw, 180px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: shadowColor2,
                whiteSpace: 'nowrap',
              }}
            >
              {word}
            </div>
          </>
        )}
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 13vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: `0 0 10px ${shadowColor1}, 0 0 30px ${shadowColor2}, 0 0 60px ${shadowColor3}, 0 0 100px ${color}`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RaveComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rave-fluo',
  title: 'Kinetic Rave Fluo',
  description: 'Rave club fluorescent style with strobe flashes, pulsing neon glow, and zoom trail exit',
  tags: ['kinetic', 'typography', 'rave', 'neon', 'club', 'fluorescent'],
  category: 'captions',
  component: RaveComponent as any,
  defaultConfig: {
    words: ['DROP', 'THE', 'BASS', 'NOW'],
    colors: ['#FF00FF', '#00FF00', '#FFFF00', '#00FFFF'],
    bgColor: '#000000',
    cycleDuration: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROP', 'THE', 'BASS', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF00FF', '#00FF00', '#FFFF00', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
