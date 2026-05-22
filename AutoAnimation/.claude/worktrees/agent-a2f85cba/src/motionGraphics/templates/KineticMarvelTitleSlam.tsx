import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarvelTitleSlamConfig extends KineticBaseConfig {
  impactScale: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Marvel Studios title card: fast flipping comic panels, particle burst on slam
    const flipFrame = Math.floor(time * 18) // 18fps panel flip

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Comic panel flicker — rapid succession of frames */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: rand(flipFrame * 7) > 0.5
              ? `rgba(255,255,255,${rand(flipFrame * 11) * 0.08})`
              : `rgba(0,0,0,${rand(flipFrame * 13) * 0.05})`,
            pointerEvents: 'none',
          }}
        />
        {/* Panel border lines — comic grid */}
        {[0.33, 0.66].map((x, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: `rgba(255,255,255,${0.06 + rand(flipFrame * 3 + i) * 0.04})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {[0.33, 0.66].map((y, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: `${y * 100}%`,
              left: 0,
              right: 0,
              height: 2,
              background: `rgba(255,255,255,${0.06 + rand(flipFrame * 5 + i) * 0.04})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Impact particles — burst from center on slam */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const dist = 30 + rand(i * 7) * 40
          const decay = Math.max(0, 1 - ((time * 2) % 1))
          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 3,
                height: 3 + rand(i * 11) * 12,
                background: `rgba(255,${200 + i * 6},0,${decay * 0.7})`,
                transform: `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI}deg) translateY(-${dist * decay}px)`,
                borderRadius: 2,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Red Marvel accent bar — top */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 6,
            background: '#ED1D24',
            pointerEvents: 'none',
          }}
        />
        {/* Red Marvel accent bar — bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background: '#ED1D24',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // SLAM: instantaneous appear with massive scale punch-in
      if (enterProgress < 0.15) {
        // Impact frame: overshoot scale
        scale = 1 + (enterProgress / 0.15) * 0.35
        opacity = 1
      } else {
        // Settle: ease back to 1.0 scale
        const settle = (enterProgress - 0.15) / 0.85
        const ease = 1 - Math.pow(1 - settle, 3)
        scale = 1.35 - ease * 0.35
        opacity = 1
      }
    } else if (phase === 'hold') {
      // Slight camera shake — aftermath of impact
      const shake = Math.max(0, 1 - holdProgress * 5)
      translateY = Math.sin(t * 25) * shake * 2
      scale = 1 + Math.sin(t * 1.2 + index) * 0.003
    } else {
      // Hard cut out — Marvel style
      opacity = exitProgress < 0.7 ? 1 : 1 - (exitProgress - 0.7) / 0.3
      scale = 1 + Math.pow(exitProgress, 2) * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(50px, 13.5vw, 180px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: -4,
          textShadow: '3px 3px 0px rgba(0,0,0,0.9), 0 0 30px rgba(255,50,50,0.3)',
        }}
      >
        {word}
      </div>
    )
  },
}

function MarvelTitleSlamComponent(props: MotionGraphicProps<MarvelTitleSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-marvel-title-slam',
  title: 'Kinetic Marvel Title Slam',
  description: 'Marvel Studios title card style — comic panel flicker at 18fps, impact scale punch-in with overshoot settle, particle burst, red accent bars, and aftermath shake',
  tags: ['kinetic', 'typography', 'marvel', 'slam', 'impact', 'comic', 'superhero', 'title design'],
  category: 'captions',
  component: MarvelTitleSlamComponent as any,
  defaultConfig: {
    words: ['AVENGERS', 'MARVEL', 'STUDIOS', 'IMPACT'],
    colors: ['#FFFFFF', '#ED1D24', '#FFFFFF', '#FFD700'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
    impactScale: 135,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AVENGERS', 'MARVEL', 'STUDIOS', 'IMPACT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#ED1D24', '#FFFFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
    { key: 'impactScale', label: 'Impact Scale %', type: 'number', defaultValue: 135, min: 105, max: 180, group: 'Animation' },
  ],
})
