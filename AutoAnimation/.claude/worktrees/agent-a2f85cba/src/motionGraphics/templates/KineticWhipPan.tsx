import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WhipPanConfig extends KineticBaseConfig {
  blurStrength: number
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Horizontal speed lines streaking past during whip
    const lineCount = 12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: lineCount }, (_, i) => {
          const yPct = 5 + (i / lineCount) * 90
          const speed = 0.8 + (i % 4) * 0.3
          const xOffset = ((time * speed * 200 + i * 73) % 120) - 10
          const opacity = 0.03 + (i % 3) * 0.02
          const width = 30 + (i % 5) * 15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${yPct}%`,
                left: `${xOffset}%`,
                width: `${width}%`,
                height: 1,
                background: `rgba(255,255,255,${opacity})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    // Whip pan: text flies in from off-screen-left at high speed (motion blur via multiple ghost layers)
    // then whips out to the right on exit
    let translateX = 0
    let opacity = 1
    let blurAmount = 0

    if (phase === 'enter') {
      // Decelerate from far-left: easeOutCubic
      const rawX = (1 - easeOutCubic(enterProgress)) * -width * 1.4
      translateX = rawX
      // Motion blur intensity peaks at start of whip-in
      blurAmount = (1 - enterProgress) * 16
      opacity = enterProgress < 0.15 ? enterProgress / 0.15 : 1
    } else if (phase === 'hold') {
      translateX = 0
      blurAmount = 0
      opacity = 1
    } else {
      // Whip out to the right — accelerate: easeInCubic
      translateX = easeInCubic(exitProgress) * width * 1.4
      blurAmount = exitProgress * 16
      opacity = exitProgress > 0.85 ? 1 - (exitProgress - 0.85) / 0.15 : 1
    }

    // Ghost layers simulate motion blur — offset copies at reduced opacity
    const ghostCount = 4
    const ghostSpacing = blurAmount * 0.35

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Motion blur ghost layers */}
        {blurAmount > 1 && Array.from({ length: ghostCount }, (_, gi) => {
          const ghostOffset = (gi + 1) * -ghostSpacing * (phase === 'exit' ? -1 : 1)
          const ghostOpacity = (1 - (gi + 1) / (ghostCount + 1)) * 0.25
          return (
            <div
              key={gi}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${translateX + ghostOffset}px), -50%)`,
                opacity: ghostOpacity,
                fontFamily: "'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(40px, 12vw, 156px)',
                fontWeight: 900,
                color,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                letterSpacing: 4,
                filter: `blur(${blurAmount * 0.5}px)`,
                pointerEvents: 'none',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Primary text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            opacity,
            fontFamily: "'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 156px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            filter: blurAmount > 1 ? `blur(${blurAmount * 0.15}px)` : 'none',
            textShadow: blurAmount < 2 ? `0 2px 12px rgba(0,0,0,0.5)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WhipPanComponent(props: MotionGraphicProps<WhipPanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-whip-pan',
  title: 'Kinetic Whip Pan',
  description: 'Text flies in and out with fast horizontal motion blur replicating the whip-pan camera transition from film editing',
  tags: ['kinetic', 'typography', 'whip-pan', 'motion-blur', 'film', 'speed', 'cinematic'],
  category: 'captions',
  component: WhipPanComponent as any,
  defaultConfig: {
    words: ['FAST', 'BLUR', 'SPEED', 'PAN'],
    colors: ['#FFFFFF', '#00CFFF', '#FFFFFF', '#FFD700'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.3,
    blurStrength: 16,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FAST', 'BLUR', 'SPEED', 'PAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00CFFF', '#FFFFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'blurStrength', label: 'Blur Strength', type: 'number', defaultValue: 16, min: 4, max: 40, group: 'Animation' },
  ],
})
