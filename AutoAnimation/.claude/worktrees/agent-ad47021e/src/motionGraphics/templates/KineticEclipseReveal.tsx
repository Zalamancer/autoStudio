import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EclipseRevealConfig extends KineticBaseConfig {
  coronaIntensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Eclipse corona radiates from center
    const pulseScale = 1 + Math.sin(time * 2.1) * 0.04
    const coronaOpacity = 0.12 + Math.sin(time * 1.3) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Outer corona glow rings */}
        {[1.8, 2.4, 3.2].map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${r * 40 * pulseScale}px`,
              height: `${r * 40 * pulseScale}px`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, transparent 60%, rgba(255,200,80,${coronaOpacity / (i + 1)}) 70%, transparent 85%)`,
              filter: `blur(${4 + i * 3}px)`,
            }}
          />
        ))}
        {/* Eclipsed disk — dark center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.95)',
            boxShadow: `0 0 40px 20px rgba(255,180,60,${coronaOpacity * 1.5}), 0 0 80px 40px rgba(255,140,40,${coronaOpacity * 0.8})`,
          }}
        />
        {/* Diamond ring flash at totality edge */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 82,
            height: 82,
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${time * 20}deg)`,
            border: '2px solid transparent',
            boxShadow: `0 0 12px 3px rgba(255,230,150,${0.4 + Math.sin(time * 4) * 0.2})`,
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
    let coronaRingWidth = 0
    let silhouetteOpacity = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.7 + p * 0.3
      // Corona ring traces letter edges outward
      coronaRingWidth = (1 - p) * 6 + 1
      silhouetteOpacity = p
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      coronaRingWidth = 1.5 + Math.sin(holdProgress * Math.PI * 4) * 0.5
      silhouetteOpacity = 1
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.15
      coronaRingWidth = 1 + p * 8 // ring flares out on exit
      silhouetteOpacity = 1 - exitProgress
    }

    const coronaPulse = 0.6 + Math.sin(time * 2.2) * 0.2

    return (
      <>
        {/* Corona ring around letterforms */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.04})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `${coronaRingWidth + 2}px rgba(255,180,60,${opacity * coronaPulse * 0.4})`,
            filter: `blur(${coronaRingWidth * 2}px)`,
            opacity: opacity * silhouetteOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Tight corona — bright edge */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `${coronaRingWidth}px rgba(255,230,150,${opacity * coronaPulse * 0.9})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Dark silhouette body — the eclipsed text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'rgba(5,4,3,0.97)',
            opacity: silhouetteOpacity * opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function EclipseRevealComponent(props: MotionGraphicProps<EclipseRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-eclipse-reveal',
  title: 'Kinetic Eclipse Reveal',
  description: 'Solar eclipse corona traces letter edges with a golden ring — text appears as a dark silhouette with radiating corona light pulsing around every letterform',
  tags: ['kinetic', 'typography', 'eclipse', 'corona', 'silhouette', 'light', 'backlit', 'space', 'dramatic'],
  category: 'captions',
  component: EclipseRevealComponent as any,
  defaultConfig: {
    words: ['TOTAL', 'ECLIPSE', 'CORONA', 'DARK'],
    colors: ['#0a0805', '#080605', '#0a0805', '#080605'],
    bgColor: '#050403',
    cycleDuration: 1.6,
    coronaIntensity: 70,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TOTAL', 'ECLIPSE', 'CORONA', 'DARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a0805', '#080605', '#0a0805', '#080605'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050403', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'coronaIntensity', label: 'Corona Intensity', type: 'number', defaultValue: 70, min: 20, max: 100, group: 'Animation' },
  ],
})
