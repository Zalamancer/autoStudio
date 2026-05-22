import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SandwritingConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Wave motion
    const waveY = height * 0.82
    const wavePoints: string[] = []
    for (let x = 0; x <= width; x += 4) {
      const y = waveY
        + Math.sin((x / width) * Math.PI * 3 + time * 2) * 8
        + Math.sin((x / width) * Math.PI * 5 + time * 1.3) * 4
      wavePoints.push(`${x},${y}`)
    }
    wavePoints.push(`${width},${height}`)
    wavePoints.push(`0,${height}`)

    // Second wave (foam)
    const foamY = waveY - 6
    const foamPoints: string[] = []
    for (let x = 0; x <= width; x += 4) {
      const y = foamY
        + Math.sin((x / width) * Math.PI * 4 + time * 2.5) * 6
        + Math.cos((x / width) * Math.PI * 2 + time * 1.8) * 3
      foamPoints.push(`${x},${y}`)
    }
    foamPoints.push(`${width},${height}`)
    foamPoints.push(`0,${height}`)

    // Sand grain dots
    const grains = Array.from({ length: 30 }, (_, i) => {
      const x = seededRandom(i * 73 + 11) * width
      const y = height * 0.4 + seededRandom(i * 47 + 23) * (height * 0.35)
      const size = 1 + seededRandom(i * 31 + 17) * 2
      const alpha = 0.08 + seededRandom(i * 59 + 41) * 0.08
      return { x, y, size, alpha }
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        {/* Sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #87CEEB 0%, #B8E0F0 30%, #F4E9D8 70%, #E8D5B0 100%)',
          }}
        />
        {/* Sand base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '35%',
            bottom: 0,
            background: 'linear-gradient(180deg, #E8D5B0 0%, #D4BA8A 40%, #C8A87A 100%)',
          }}
        />
        {/* Sand grain texture */}
        {grains.map((g, i) => (
          <div
            key={`g-${i}`}
            style={{
              position: 'absolute',
              left: g.x,
              top: g.y,
              width: g.size,
              height: g.size,
              borderRadius: '50%',
              background: `rgba(180,150,100,${g.alpha})`,
            }}
          />
        ))}
        {/* Water foam */}
        <svg
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <polygon
            points={foamPoints.join(' ')}
            fill="rgba(255,255,255,0.35)"
          />
        </svg>
        {/* Water wave */}
        <svg
          style={{ position: 'absolute', inset: 0 }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <polygon
            points={wavePoints.join(' ')}
            fill="rgba(70,140,180,0.5)"
          />
        </svg>
        {/* Wet sand reflection near waves */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '75%',
            height: '10%',
            background: 'linear-gradient(180deg, rgba(160,130,90,0.3), transparent)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    const chars = word.split('')

    if (phase === 'enter') {
      // Characters drawn one by one like finger writing in sand
      return (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / chars.length * 0.7
            const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.3))
            const eased = 1 - Math.pow(1 - charProgress, 2)
            return (
              <span
                key={ci}
                style={{
                  fontFamily: "'Georgia', 'Palatino', serif",
                  fontSize: 'clamp(38px, 11vw, 130px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: charProgress > 0 ? color : 'transparent',
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * 8}px)`,
                  display: 'inline-block',
                  textShadow: charProgress > 0.5
                    ? `1px 2px 0 rgba(160,120,60,0.5), 0 0 4px rgba(0,0,0,0.1)`
                    : 'none',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(38px, 11vw, 130px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            textShadow: '1px 2px 0 rgba(160,120,60,0.5), 0 0 4px rgba(0,0,0,0.1)',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: wave washes over and text fades
    const waveWash = Math.min(1, exitProgress * 1.5)
    return (
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(38px, 11vw, 130px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            opacity: 1 - exitProgress,
            textShadow: '1px 2px 0 rgba(160,120,60,0.5)',
          }}
        >
          {word}
        </div>
        {/* Wave wash overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(70,140,180,0.4), rgba(200,220,230,0.3), transparent)',
            transform: `translateX(${-100 + waveWash * 200}%)`,
          }}
        />
      </div>
    )
  },
}

function SandwritingComponent(props: MotionGraphicProps<SandwritingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sandwriting',
  title: 'Kinetic Sand Writing',
  description: 'Text written in sand with character-by-character reveal, beach scene with animated ocean waves, and wave-wash exit effect',
  tags: ['kinetic', 'typography', 'sand', 'beach', 'ocean', 'wave', 'summer', 'nature'],
  category: 'captions',
  component: SandwritingComponent as any,
  defaultConfig: {
    words: ['WAVES', 'SAND', 'DRIFT', 'SHORE'],
    colors: ['#8B6914', '#7A5C12', '#6B4E10', '#8B6914'],
    bgColor: '#E8D5B0',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVES', 'SAND', 'DRIFT', 'SHORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B6914', '#7A5C12', '#6B4E10', '#8B6914'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8D5B0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
