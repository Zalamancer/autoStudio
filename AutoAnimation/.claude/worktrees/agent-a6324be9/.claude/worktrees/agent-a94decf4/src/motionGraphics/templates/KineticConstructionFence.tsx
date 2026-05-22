import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConstructionFenceConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sky / urban background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #6a7a8a 0%, #8a8a8a 60%, #5a5550 100%)',
          }}
        />

        {/* Construction mesh fence pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,100,0,0.06) 3px, rgba(0,100,0,0.06) 4px)',
              'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,100,0,0.06) 3px, rgba(0,100,0,0.06) 4px)',
            ].join(', '),
          }}
        />

        {/* Fence posts */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '5%',
              left: `${i * 25}%`,
              width: 6,
              height: '90%',
              background: 'linear-gradient(180deg, #707070, #505050)',
              boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
            }}
          />
        ))}

        {/* Horizontal fence rail top */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: 0,
            right: 0,
            height: 4,
            background: '#606060',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
        {/* Horizontal fence rail bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: 0,
            right: 0,
            height: 4,
            background: '#606060',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Zip-tie attachments at intersections */}
        {Array.from({ length: 10 }, (_, i) => {
          const col = i % 5
          const row = Math.floor(i / 5)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: col * 25 + 1,
                top: row === 0 ? '7%' : '91%',
                width: 8,
                height: 4,
                background: '#e0e0e0',
                borderRadius: 2,
                opacity: 0.6,
              }}
            />
          )
        })}

        {/* Wind ripple effect — slight mesh distortion via subtle gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${90 + Math.sin(time * 2) * 3}deg, transparent 0%, rgba(255,255,255,0.02) ${40 + Math.sin(time * 1.5) * 10}%, transparent ${60 + Math.sin(time * 1.5) * 10}%, rgba(0,0,0,0.02) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const seed = index * 79 + 53
    const f = frame ?? 0
    const time = f / 30 // approximate fps

    // Banner unfurls — reveals from left
    let unfurlProgress = 0
    let opacity = 1
    let windWobble = 0

    if (phase === 'enter') {
      unfurlProgress = enterProgress
      opacity = 1
      windWobble = enterProgress * 2
    } else if (phase === 'hold') {
      unfurlProgress = 1
      opacity = 1
      windWobble = 2 + Math.sin(time * 3) * 1.5
    } else {
      unfurlProgress = 1
      opacity = 1 - exitProgress
      windWobble = (1 - exitProgress) * 2
    }

    // Weathered vinyl banner texture — slight wrinkles
    const wrinkleCount = 5
    const wrinkles = Array.from({ length: wrinkleCount }, (_, i) => {
      const ws = seed + i * 31 + 300
      const x = 10 + rand(ws) * 80
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: 0,
            width: 1,
            height: '100%',
            background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.06) 50%, transparent 80%)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Weathering damage — faded spots
    const fadedSpots = Array.from({ length: 3 }, (_, i) => {
      const fs = seed + i * 43 + 500
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${20 + rand(fs) * 60}%`,
            top: `${20 + rand(fs + 1) * 60}%`,
            width: 30 + rand(fs + 2) * 40,
            height: 20 + rand(fs + 3) * 30,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Zip-tie attachments on the banner edges
    const zipTies = Array.from({ length: 4 }, (_, i) => {
      const onTop = i < 2
      const side = i % 2 === 0 ? '15%' : '85%'

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: side,
            top: onTop ? -6 : undefined,
            bottom: onTop ? undefined : -6,
            width: 10,
            height: 8,
            background: '#d0d0d0',
            borderRadius: 2,
            opacity: 0.7 * (unfurlProgress > 0.3 ? 1 : 0),
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Banner background — vinyl mesh material */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '5%',
            right: '5%',
            height: '40%',
            background: `linear-gradient(180deg, ${color}18, ${color}12, ${color}18)`,
            border: `2px solid ${color}25`,
            borderRadius: 2,
            clipPath: `inset(0 ${(1 - unfurlProgress) * 100}% 0 0)`,
            // Wind ripple via skew
            transform: `skewY(${Math.sin(time * 2.5) * windWobble * 0.3}deg)`,
          }}
        >
          {wrinkles}
          {fadedSpots}
          {zipTies}
        </div>

        {/* Main banner text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) skewY(${Math.sin(time * 2.5) * windWobble * 0.3}deg)`,
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 150px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${(1 - unfurlProgress) * 100}% 0 0)`,
            // Weathered vinyl print — slightly faded
            textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
            opacity: 0.9,
          }}
        >
          {word}
        </div>

        {/* Torn corner — bottom right */}
        {unfurlProgress > 0.8 && (
          <div
            style={{
              position: 'absolute',
              bottom: '29%',
              right: '5%',
              width: 20,
              height: 15,
              background: `${color}10`,
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              transform: 'rotate(5deg)',
              opacity: 0.5,
            }}
          />
        )}
      </div>
    )
  },
}

function ConstructionFenceComponent(props: MotionGraphicProps<ConstructionFenceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-construction-fence',
  title: 'Kinetic Construction Fence',
  description: 'Construction barrier banner on mesh fence — weathered vinyl text with zip-tie attachments, wind ripple, wrinkles, and urban construction site aesthetic',
  tags: ['kinetic', 'typography', 'construction', 'fence', 'banner', 'urban', 'vinyl', 'weathered', 'site'],
  category: 'captions',
  component: ConstructionFenceComponent as any,
  defaultConfig: {
    words: ['BUILD', 'ZONE', 'HARD', 'SITE'],
    colors: ['#ff8800', '#ffffff', '#ff8800', '#ffffff'],
    bgColor: '#4a5560',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BUILD', 'ZONE', 'HARD', 'SITE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff8800', '#ffffff', '#ff8800', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#4a5560', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
