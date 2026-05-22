import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface Super8GrainConfig extends KineticBaseConfig {
  grainDensity: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Super 8 runs at 18fps — visible frame stepping
    const filmFrame = Math.floor(time * 18)
    // Exposure flicker — Super 8 camera aperture bounce
    const exposure = 0.85 + rand(filmFrame * 7) * 0.2
    // Color temperature shift — warm tungsten Ektachrome
    const warmShift = 0.12 + rand(filmFrame * 3) * 0.05

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          filter: `brightness(${exposure}) sepia(${warmShift * 0.6}) saturate(1.2)`,
        }}
      >
        {/* Super 8 frame jitter at 18fps */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${(rand(filmFrame * 11) - 0.5) * 3}px, ${(rand(filmFrame * 13) - 0.5) * 2}px)`,
            background: bgColor,
          }}
        />
        {/* Warm Ektachrome vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(80,40,0,${0.3 + rand(filmFrame * 5) * 0.1}) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Heavy film grain — Super 8 is very grainy */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={`grain-${i}`}
            style={{
              position: 'absolute',
              left: `${rand(filmFrame * 3 + i * 41) * 100}%`,
              top: `${rand(filmFrame * 7 + i * 67) * 100}%`,
              width: 1 + Math.floor(rand(i * 13) * 2),
              height: 1 + Math.floor(rand(i * 17) * 2),
              background: rand(filmFrame * 11 + i) > 0.5
                ? `rgba(255,220,160,${0.08 + rand(i * 23) * 0.12})`
                : `rgba(0,0,0,${0.06 + rand(i * 31) * 0.1})`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Dust and hair — Super 8 loaded in daylight */}
        {rand(filmFrame * 19) > 0.7 && (
          <div
            style={{
              position: 'absolute',
              left: `${rand(filmFrame * 23) * 80 + 10}%`,
              top: `${rand(filmFrame * 29) * 80 + 10}%`,
              width: rand(filmFrame * 37) * 20 + 4,
              height: 1,
              background: 'rgba(0,0,0,0.25)',
              transform: `rotate(${rand(filmFrame * 41) * 180}deg)`,
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Super 8 cartridge frame line — top/bottom crop */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '3%',
            background: 'rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '3%',
            background: 'rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const filmFrame = Math.floor((f / 30) * 18)

    // Super 8 registration jitter at 18fps
    const jitterX = (rand(filmFrame * 11 + index * 7) - 0.5) * 2.5
    const jitterY = (rand(filmFrame * 13 + index * 11) - 0.5) * 1.5

    let opacity = 1
    if (phase === 'enter') {
      // Stepped fade at 18fps
      opacity = Math.floor(enterProgress * 4) / 4
    } else if (phase === 'exit') {
      opacity = Math.floor((1 - exitProgress) * 3) / 3
    }

    // Occasional overexposure flash
    const flashBrightness = rand(filmFrame * 17 + index) > 0.95 ? 1.4 : 1.0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px))`,
          opacity,
          filter: `brightness(${flashBrightness}) sepia(0.15)`,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 11vw, 148px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 3,
          textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        {word}
      </div>
    )
  },
}

function Super8GrainComponent(props: MotionGraphicProps<Super8GrainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-super8-grain',
  title: 'Kinetic Super 8 Grain',
  description: 'Authentic Super 8mm film look — 18fps stepped motion, heavy Ektachrome grain, warm tungsten vignette, dust/hair artifacts, and exposure bounce',
  tags: ['kinetic', 'typography', 'super8', 'film', 'grain', 'analog', 'ektachrome', '8mm', 'vintage'],
  category: 'captions',
  component: Super8GrainComponent as any,
  defaultConfig: {
    words: ['SUMMER', 'MEMORY', 'FAMILY', 'HOME'],
    colors: ['#FFF8DC', '#FFE4B5', '#FFF8DC', '#FAEBD7'],
    bgColor: '#2a1a0a',
    cycleDuration: 1.4,
    grainDensity: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUMMER', 'MEMORY', 'FAMILY', 'HOME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8DC', '#FFE4B5', '#FFF8DC', '#FAEBD7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a1a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'grainDensity', label: 'Grain Density', type: 'number', defaultValue: 30, min: 10, max: 60, group: 'Animation' },
  ],
})
