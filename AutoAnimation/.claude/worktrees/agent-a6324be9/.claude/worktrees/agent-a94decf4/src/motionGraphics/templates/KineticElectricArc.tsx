import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElectricArcConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, #12121e 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      const flash = enterProgress < 0.15 ? 1 : 0
      opacity = enterProgress < 0.15 ? 1 : Math.min(1, (enterProgress - 0.15) * 2)
      scale = enterProgress < 0.15 ? 1.3 : 1

      return (
        <>
          {flash > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.3)',
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 4,
              color,
              textShadow: `0 0 10px #FFFFFF, 0 0 20px ${color}, 0 0 40px rgba(135,206,250,0.5)`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </>
      )
    } else if (phase === 'hold') {
      opacity = 1
      const seed = index * 97 + Math.floor(holdProgress * 50)
      const flicker = ((seed * 73 + 31) % 100) / 100
      const intensity = flicker < 0.1 ? 2.5 : 0.8 + Math.sin(holdProgress * Math.PI * 10) * 0.4

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: `0 0 ${5 * intensity}px #FFFFFF, 0 0 ${12 * intensity}px ${color}, 0 0 ${25 * intensity}px rgba(135,206,250,0.6)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      const flash = exitProgress > 0.85
      opacity = flash ? 0 : 1 - exitProgress

      return (
        <>
          {exitProgress > 0.8 && exitProgress < 0.9 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.15)',
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 4,
              color,
              textShadow: `0 0 10px #FFFFFF, 0 0 20px ${color}`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </>
      )
    }
  },
}

function ElectricArcComponent(props: MotionGraphicProps<ElectricArcConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-electric-arc',
  title: 'Kinetic Electric Arc',
  description: 'Lightning strike electric arc effect with flash entrance and crackling glow',
  tags: ['kinetic', 'typography', 'electric', 'lightning', 'storm'],
  category: 'captions',
  component: ElectricArcComponent as any,
  defaultConfig: {
    words: ['STRIKE', 'BOLT', 'SHOCK', 'ZAP'],
    colors: ['#FFFFFF', '#87CEFA', '#4169E1', '#E0E0FF'],
    bgColor: '#0a0a14',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STRIKE', 'BOLT', 'SHOCK', 'ZAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#87CEFA', '#4169E1', '#E0E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
