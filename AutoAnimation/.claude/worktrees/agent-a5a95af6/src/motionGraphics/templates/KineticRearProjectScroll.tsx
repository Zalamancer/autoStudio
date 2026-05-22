import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RearProjectScrollConfig extends KineticBaseConfig {
  screenBrightness: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rear projection screen frame */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '5%',
            right: '5%',
            bottom: '12%',
            border: '12px solid rgba(80,60,40,0.8)',
            borderRadius: 4,
            background: 'rgba(200,195,185,0.04)',
          }}
        />
        {/* Screen surface texture — slightly warm, translucent */}
        <div
          style={{
            position: 'absolute',
            top: '13%',
            left: '6%',
            right: '6%',
            bottom: '13%',
            background: `rgba(220,215,205,${0.06 + Math.sin(time * 0.5) * 0.005})`,
            backgroundImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
        />
        {/* Projector beam — hot spot in center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50%',
            height: '50%',
            background: `radial-gradient(ellipse, rgba(255,250,240,${0.08 + Math.sin(time * 3) * 0.01}) 0%, transparent 70%)`,
          }}
        />
        {/* Film gate vignette */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '5%',
            right: '5%',
            bottom: '12%',
            background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        {/* Dust motes in projector beam */}
        {Array.from({ length: 8 }, (_, i) => {
          const seed = i * 73
          const dx = rand(seed) * 80 + 10
          const dy = rand(seed + 1) * 60 + 20
          const driftX = Math.sin(time * (0.3 + rand(seed + 2) * 0.4) + i) * 3
          const driftY = Math.cos(time * (0.2 + rand(seed + 3) * 0.3) + i * 1.3) * 2
          const moteOpacity = 0.08 + rand(seed + 4) * 0.08
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${dx + driftX}%`,
                top: `${dy + driftY}%`,
                width: 2,
                height: 2,
                borderRadius: '50%',
                background: `rgba(255,250,240,${moteOpacity * (0.5 + Math.sin(time * 2 + i) * 0.4)})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let translateY = 0
    let screenOverlay = 0
    let warmBlend = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.88 + p * 0.12
      // Text scrolls up from bottom of screen into position
      translateY = (1 - p) * 60
      screenOverlay = p
      warmBlend = (1 - p) * 0.3
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle scroll jitter — mechanical projector
      translateY = Math.sin(holdProgress * Math.PI * 8) * 1
      screenOverlay = 1
      warmBlend = 0
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.05
      translateY = -p * 50 // scrolls off top
      screenOverlay = 1 - exitProgress
    }

    // Film grain overlay
    const grainSeed = f % 3
    const grainOffset = grainSeed * 17

    return (
      <>
        {/* Screen hot-spot glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: `calc(50% + ${translateY}px)`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: 120,
            background: `rgba(255,250,235,${screenOverlay * 0.05})`,
            filter: 'blur(15px)',
            opacity,
          }}
        />
        {/* Main projected text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            opacity,
            whiteSpace: 'nowrap',
            // Warm screen tint over the text
            filter: warmBlend > 0 ? `sepia(${warmBlend * 60}%)` : 'none',
          }}
        >
          {word}
        </div>
        {/* Film grain scanlines over text */}
        <div
          style={{
            position: 'absolute',
            top: '13%',
            left: '6%',
            right: '6%',
            bottom: '13%',
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${0.06 * screenOverlay}) 0px, rgba(0,0,0,${0.06 * screenOverlay}) 1px, transparent 1px, transparent 3px)`,
            opacity,
            pointerEvents: 'none',
          }}
        />
        {/* Frame border vignette sharpening on the text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(255,255,255,${opacity * screenOverlay * 0.12})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function RearProjectScrollComponent(props: MotionGraphicProps<RearProjectScrollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rear-project-scroll',
  title: 'Kinetic Rear Projection Scroll',
  description: 'Text scrolls up on a rear-projection screen with film grain scanlines, projector hot-spot glow, and floating dust motes in the projector beam',
  tags: ['kinetic', 'typography', 'rear-projection', 'screen', 'scroll', 'film', 'cinema', 'grain', 'projector'],
  category: 'captions',
  component: RearProjectScrollComponent as any,
  defaultConfig: {
    words: ['REEL', 'PROJECT', 'SCREEN', 'FILM'],
    colors: ['#E8E0D0', '#D4CCC0', '#E0D8C8', '#CCCAB8'],
    bgColor: '#100f0c',
    cycleDuration: 1.5,
    screenBrightness: 70,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REEL', 'PROJECT', 'SCREEN', 'FILM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0D0', '#D4CCC0', '#E0D8C8', '#CCCAB8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100f0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'screenBrightness', label: 'Screen Brightness', type: 'number', defaultValue: 70, min: 20, max: 100, group: 'Animation' },
  ],
})
