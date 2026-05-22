import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoboPatternConfig extends KineticBaseConfig {
  patternOpacity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Stage floor — gobo projects from above onto a dark stage
    const beamX = 48 + Math.sin(time * 0.3) * 8
    const beamY = 30 + Math.sin(time * 0.2) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Theatrical spotlight cone from above */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from ${-90 + Math.sin(time * 0.2) * 5}deg at ${beamX}% -5%, rgba(255,230,180,0.08) 0deg, rgba(255,220,160,0.04) 20deg, transparent 22deg)`,
          }}
        />
        {/* Center pool of light */}
        <div
          style={{
            position: 'absolute',
            top: `${beamY}%`,
            left: `${beamX}%`,
            transform: 'translate(-50%, -50%)',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(255,240,200,${0.05 + Math.sin(time * 2) * 0.01}) 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let goboRotate = 0
    let patternOpacity = 0
    let textBrightness = 0
    let translateY = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.85 + p * 0.15
      // Gobo slides in: pattern appears then focuses sharp
      goboRotate = (1 - p) * -15
      patternOpacity = p
      textBrightness = p
      translateY = (1 - p) * 20
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Pattern slowly drifts as the light sways
      goboRotate = Math.sin(holdProgress * Math.PI * 2) * 3
      patternOpacity = 1
      textBrightness = 1
      translateY = Math.sin(time * 0.8) * 4
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.05
      goboRotate = p * 20
      patternOpacity = 1 - exitProgress
      textBrightness = 1 - exitProgress
    }

    // Venetian blind / slat shadow pattern from gobo
    const slats = 9
    const slatGap = 100 / slats

    return (
      <>
        {/* Gobo pattern shadows projected onto the surface (behind text) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) rotate(${goboRotate}deg) scale(${scale})`,
            width: '120%',
            height: '120%',
          }}
        >
          {/* Slat shadows — gobo bars creating light/dark bands */}
          {Array.from({ length: slats }, (_, i) => {
            const yOffset = i * slatGap
            const slatThickness = slatGap * 0.45
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '-10%',
                  right: '-10%',
                  top: `${yOffset}%`,
                  height: `${slatThickness}%`,
                  background: `rgba(0,0,0,${patternOpacity * 0.55})`,
                }}
              />
            )
          })}
        </div>
        {/* Main illuminated text — lit by the spotlight through the gobo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            opacity: opacity * textBrightness,
            whiteSpace: 'nowrap',
            textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,220,150,${textBrightness * 0.15})`,
          }}
        >
          {word}
        </div>
        {/* Pattern applied over text with mix-blend — shadow slats overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) rotate(${goboRotate}deg) scale(${scale * 1.2})`,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            opacity: opacity * patternOpacity * 0.3,
          }}
        >
          {Array.from({ length: slats }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${i * slatGap}%`,
                height: `${slatGap * 0.45}%`,
                background: 'rgba(0,0,0,0.8)',
              }}
            />
          ))}
        </div>
      </>
    )
  },
}

function GoboPatternComponent(props: MotionGraphicProps<GoboPatternConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gobo-pattern',
  title: 'Kinetic Gobo Pattern',
  description: 'A theatrical gobo stencil casts venetian-blind shadow bars across the text — rotating gobo pattern shifts as the spotlight sways for a dramatic stage lighting effect',
  tags: ['kinetic', 'typography', 'gobo', 'shadow', 'pattern', 'theater', 'stage', 'spotlight', 'projection'],
  category: 'captions',
  component: GoboPatternComponent as any,
  defaultConfig: {
    words: ['STAGE', 'GOBO', 'SPOT', 'BARS'],
    colors: ['#F5E8C8', '#E0D0A8', '#F0DEB8', '#D8C898'],
    bgColor: '#080608',
    cycleDuration: 1.5,
    patternOpacity: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STAGE', 'GOBO', 'SPOT', 'BARS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E8C8', '#E0D0A8', '#F0DEB8', '#D8C898'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'patternOpacity', label: 'Pattern Opacity', type: 'number', defaultValue: 60, min: 20, max: 100, group: 'Animation' },
  ],
})
