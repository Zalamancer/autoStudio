import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OceanWavesConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Wave layers from back to front
    const waveLayers = [
      { baseY: 65, amplitude: 8, frequency: 0.8, speed: 0.4, color: 'rgba(0,60,120,0.5)', zIndex: 1 },
      { baseY: 70, amplitude: 10, frequency: 1.0, speed: 0.6, color: 'rgba(0,80,160,0.5)', zIndex: 2 },
      { baseY: 75, amplitude: 12, frequency: 0.7, speed: 0.8, color: 'rgba(0,100,180,0.5)', zIndex: 3 },
      { baseY: 80, amplitude: 6, frequency: 1.3, speed: 1.0, color: 'rgba(0,120,200,0.6)', zIndex: 4 },
      { baseY: 85, amplitude: 5, frequency: 1.6, speed: 1.2, color: 'rgba(0,140,210,0.6)', zIndex: 5 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #87CEEB 0%, #4682B4 30%, ${bgColor} 60%, #1a3a5c 100%)`,
        }}
      >
        {/* Sun reflection on water */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,200,0.6), rgba(255,220,100,0.2), transparent)',
            boxShadow: '0 0 40px 20px rgba(255,220,100,0.1)',
          }}
        />

        {/* Wave layers */}
        {waveLayers.map((wave, layerIdx) => {
          // Generate wave path using sine
          const segments = 20
          const points: string[] = []
          for (let s = 0; s <= segments; s++) {
            const xPct = (s / segments) * 100
            const xRad = (s / segments) * Math.PI * 2 * wave.frequency
            const yOffset = Math.sin(xRad + time * wave.speed * Math.PI * 2) * wave.amplitude
            const yPct = wave.baseY + yOffset
            points.push(`${xPct}% ${yPct}%`)
          }
          const clipPath = `polygon(${points.join(', ')}, 100% 100%, 0% 100%)`

          return (
            <div
              key={layerIdx}
              style={{
                position: 'absolute',
                inset: 0,
                background: wave.color,
                clipPath,
                zIndex: wave.zIndex,
              }}
            />
          )
        })}

        {/* Foam highlights on top wave */}
        {[0, 1, 2, 3].map(i => {
          const foamX = (25 * i + time * 8) % 100
          const baseWave = waveLayers[waveLayers.length - 1]
          const foamYOffset = Math.sin((foamX / 100) * Math.PI * 2 * baseWave.frequency + time * baseWave.speed * Math.PI * 2) * baseWave.amplitude
          const foamY = baseWave.baseY + foamYOffset - 1

          return (
            <div
              key={`foam-${i}`}
              style={{
                position: 'absolute',
                left: `${foamX}%`,
                top: `${foamY}%`,
                width: 30,
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.4)',
                zIndex: 6,
                opacity: 0.5 + Math.sin(time * 2 + i) * 0.3,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 20
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle floating motion like on water
      translateY = Math.sin(holdProgress * Math.PI * 3) * 5
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 800,
          textTransform: 'uppercase',
          color,
          textShadow: `0 2px 10px rgba(0,0,0,0.4), 0 0 20px ${color}33`,
          whiteSpace: 'nowrap',
          letterSpacing: 5,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function OceanWavesComponent(props: MotionGraphicProps<OceanWavesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ocean-waves-bg',
  title: 'Kinetic Ocean Waves',
  description: 'Layered ocean waves with sine-wave motion, foam highlights, and floating text above',
  tags: ['kinetic', 'typography', 'ocean', 'waves', 'sea', 'water', 'nature', 'blue', 'beach'],
  category: 'captions',
  component: OceanWavesComponent as any,
  defaultConfig: {
    words: ['OCEAN', 'WAVES', 'DEEP', 'FLOW'],
    colors: ['#FFFFFF', '#E0F7FA', '#B2EBF2', '#F0F8FF'],
    bgColor: '#1a4a6e',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OCEAN', 'WAVES', 'DEEP', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0F7FA', '#B2EBF2', '#F0F8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a4a6e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
