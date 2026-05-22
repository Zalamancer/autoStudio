import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CautionStripeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Amber beacon flash cycle
    const beaconPhase = (time * 2.5) % 1
    const beaconIntensity = beaconPhase < 0.15 ? beaconPhase / 0.15 : beaconPhase < 0.3 ? 1 - (beaconPhase - 0.15) / 0.15 : 0
    // Reflective stripe shimmer offset
    const shimmerX = ((time * 60) % (width + 200)) - 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Orange barricade body */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #E85D04 0%, #D45000 30%, #C74500 70%, #B03A00 100%)',
          }}
        />
        {/* Reflective white stripes */}
        {[0.22, 0.78].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${pos * 100}%`,
              left: 0,
              right: 0,
              height: 18,
              background: 'rgba(255,255,255,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Moving shimmer highlight */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: shimmerX + (i * 40),
                width: 120,
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              }}
            />
          </div>
        ))}
        {/* Amber flashing beacon */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `rgba(255,180,0,${0.3 + beaconIntensity * 0.7})`,
            boxShadow: beaconIntensity > 0.1
              ? `0 0 ${12 + beaconIntensity * 30}px ${6 + beaconIntensity * 15}px rgba(255,180,0,${beaconIntensity * 0.6})`
              : 'none',
          }}
        />
        {/* Surface texture — worn barricade feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent, transparent 80px,
              rgba(0,0,0,0.04) 80px, rgba(0,0,0,0.04) 82px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Dirt/weathering at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '15%',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.25), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0
    let scaleX = 1

    if (phase === 'enter') {
      // Barricade lifts up to reveal text
      opacity = Math.min(1, enterProgress * 1.5)
      translateY = (1 - enterProgress) * 30
      scaleX = 0.85 + enterProgress * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      // Slight rumble from construction site
      translateY = Math.sin(f * 0.6 + index * 3) * 1.2
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * -20
      scaleX = 1 - exitProgress * 0.1
    }

    return (
      <>
        {/* Drop shadow for depth on orange surface */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + 2px), calc(-50% + ${translateY + 4}px)) scaleX(${scaleX})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity: opacity * 0.7,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleX(${scaleX})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity,
            textShadow: `0 0 8px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function CautionStripeComponent(props: MotionGraphicProps<CautionStripeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-caution-stripe',
  title: 'Kinetic Caution Stripe',
  description: 'Orange barricade with reflective stripes and flashing amber beacon light, construction zone aesthetic with bold stencil text',
  tags: ['kinetic', 'typography', 'caution', 'construction', 'barricade', 'safety', 'warning', 'orange'],
  category: 'captions',
  component: CautionStripeComponent as any,
  defaultConfig: {
    words: ['CAUTION', 'DETOUR', 'SLOW', 'MERGE'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#E85D04',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CAUTION', 'DETOUR', 'SLOW', 'MERGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E85D04', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
