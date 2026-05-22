import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BloodDroolConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, #1a0000 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 131 + 47

    let mainOpacity = 0
    let mainScale = 1

    if (phase === 'enter') {
      mainOpacity = Math.min(1, enterProgress * 2)
      mainScale = 0.85 + enterProgress * 0.15
    } else if (phase === 'hold') {
      mainOpacity = 1
    } else {
      mainOpacity = 1 - exitProgress
      mainScale = 1 - exitProgress * 0.1
    }

    // Blood drool drips from each character
    const dripCount = word.length
    const drips = Array.from({ length: dripCount }, (_, i) => {
      const dripSeed = seed + i * 73
      const speed = 0.6 + rand(dripSeed) * 0.8
      const thickness = 2 + rand(dripSeed + 1) * 4
      const xOffset = (i - (dripCount - 1) / 2) * 42 + rand(dripSeed + 2) * 10 - 5
      const delay = rand(dripSeed + 3) * 0.4

      let dripLength = 0
      let dripOpacity = 0

      if (phase === 'enter') {
        const localProgress = Math.max(0, (enterProgress - delay) / (1 - delay))
        dripLength = localProgress * 30 * speed
        dripOpacity = localProgress * 0.8
      } else if (phase === 'hold') {
        // Continuous dripping during hold
        const cycleTime = (holdProgress * 3 + delay) % 1
        dripLength = cycleTime * 80 * speed
        dripOpacity = cycleTime < 0.8 ? 0.7 : 0.7 * (1 - (cycleTime - 0.8) / 0.2)
        // Drip blob at the end
      } else {
        dripLength = 80 * speed * (1 - exitProgress)
        dripOpacity = (1 - exitProgress) * 0.7
      }

      // Drip blob at bottom of drip
      const blobSize = thickness * 1.8
      const wobble = Math.sin(f * 0.1 + i * 2) * 1.5

      return (
        <div key={`drip-${i}`}>
          {/* Drip stream */}
          <div
            style={{
              position: 'absolute',
              left: `calc(50% + ${xOffset + wobble}px)`,
              top: '58%',
              width: thickness,
              height: dripLength,
              background: `linear-gradient(to bottom, #8B0000, #CC0000 40%, rgba(139,0,0,0.3))`,
              borderRadius: '0 0 50% 50%',
              opacity: dripOpacity,
              transform: 'translateX(-50%)',
            }}
          />
          {/* Drip blob */}
          {dripLength > 15 && (
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${xOffset + wobble}px)`,
                top: `calc(58% + ${dripLength}px)`,
                width: blobSize,
                height: blobSize * 1.3,
                background: 'radial-gradient(ellipse, #CC0000, #8B0000)',
                borderRadius: '40% 40% 50% 50%',
                opacity: dripOpacity,
                transform: 'translate(-50%, -30%)',
              }}
            />
          )}
        </div>
      )
    })

    // Additional pooling blood at bottom during hold
    const poolOpacity = phase === 'hold' ? Math.min(1, holdProgress * 2) * 0.4 : phase === 'exit' ? 0.4 * (1 - exitProgress) : 0
    const poolWidth = phase === 'hold' ? 40 + holdProgress * 60 : phase === 'exit' ? 100 * (1 - exitProgress) : 0

    return (
      <>
        {drips}
        {/* Blood pool at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            width: `${poolWidth}%`,
            height: 8,
            background: 'radial-gradient(ellipse, rgba(139,0,0,0.6), transparent)',
            borderRadius: '50%',
            opacity: poolOpacity,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${mainScale})`,
            opacity: mainOpacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: '0 2px 8px rgba(139, 0, 0, 0.8), 0 0 30px rgba(200, 0, 0, 0.3)',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BloodDroolComponent(props: MotionGraphicProps<BloodDroolConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blood-drool',
  title: 'Kinetic Blood Drool',
  description: 'Horror text with blood dripping down from each letter, pooling at the bottom, dark red on black',
  tags: ['kinetic', 'typography', 'horror', 'blood', 'drip', 'creepy', 'dark', 'gore'],
  category: 'captions',
  component: BloodDroolComponent as any,
  defaultConfig: {
    words: ['DROOL', 'BLEED', 'DECAY', 'DREAD'],
    colors: ['#CC0000', '#8B0000', '#B22222', '#DC143C'],
    bgColor: '#050000',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROOL', 'BLEED', 'DECAY', 'DREAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC0000', '#8B0000', '#B22222', '#DC143C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
