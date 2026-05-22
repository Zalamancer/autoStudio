import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContreJourConfig extends KineticBaseConfig {
  haloIntensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Blown-out sky background — contre-jour (shooting into the light)
    const sunPulse = 0.85 + Math.sin(time * 1.8) * 0.05

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Blown-out sky gradient — extreme overexposure at top */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(255,250,235,${0.55 * sunPulse}) 0%, rgba(255,230,180,0.25) 30%, rgba(255,200,120,0.12) 60%, transparent 90%)`,
          }}
        />
        {/* Sun disk — blown-out center */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,255,255,${0.9 * sunPulse}) 0%, rgba(255,240,200,0.6) 30%, rgba(255,210,140,0.2) 60%, transparent 80%)`,
            filter: 'blur(8px)',
          }}
        />
        {/* Lens haze from shooting into the light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,248,235,${0.1 + Math.sin(time * 2.5) * 0.02}) 0%, transparent 50%)`,
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
    let haloRadius = 0
    let haloOpacity = 0
    let translateY = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.85 + p * 0.15
      haloRadius = 15 + (1 - p) * 40 // halo starts expanded, tightens to edge
      haloOpacity = p * 0.8
      translateY = (1 - p) * 20
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Halo breathes as if sun intensity fluctuates
      haloRadius = 15 + Math.sin(holdProgress * Math.PI * 3) * 4
      haloOpacity = 0.75 + Math.sin(holdProgress * Math.PI * 2) * 0.1
      translateY = Math.sin(time * 1.2) * 2
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.08
      haloRadius = 15 + p * 50 // halo expands and dissolves
      haloOpacity = 0.75 * (1 - exitProgress)
      translateY = -p * 15
    }

    const hazeAlpha = 0.06 + Math.sin(time * 2.2) * 0.02

    return (
      <>
        {/* Wide halo bloom — atmospheric overexposure */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale * 1.1})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(255,240,200,0.5)',
            filter: `blur(${haloRadius * 1.5}px)`,
            opacity: haloOpacity * opacity * 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Mid halo — tighter glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale * 1.03})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(255,230,170,0.7)',
            filter: `blur(${haloRadius * 0.5}px)`,
            opacity: haloOpacity * opacity * 0.65,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Dark silhouette — the subject, contre-jour style */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'rgba(15,12,8,0.96)',
            opacity,
            whiteSpace: 'nowrap',
            textShadow: `0 0 ${haloRadius * 0.3}px rgba(255,220,150,${hazeAlpha * haloOpacity})`,
          }}
        >
          {word}
        </div>
        {/* Barely-visible detail — wrap light on letter faces */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(255,210,140,${opacity * haloOpacity * 0.3})`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ContreJourComponent(props: MotionGraphicProps<ContreJourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-contre-jour',
  title: 'Kinetic Contre-Jour',
  description: 'Shooting-into-the-light (contre-jour) effect — text appears as pure dark silhouette against a blown-out overexposed sky halo',
  tags: ['kinetic', 'typography', 'contre-jour', 'backlit', 'silhouette', 'overexpose', 'sun', 'cinematic', 'halo'],
  category: 'captions',
  component: ContreJourComponent as any,
  defaultConfig: {
    words: ['SUN', 'SHOT', 'INTO', 'LIGHT'],
    colors: ['#0e0c09', '#0c0a07', '#0e0c09', '#0c0a07'],
    bgColor: '#d0b87a',
    cycleDuration: 1.5,
    haloIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUN', 'SHOT', 'INTO', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0e0c09', '#0c0a07', '#0e0c09', '#0c0a07'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#d0b87a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'haloIntensity', label: 'Halo Intensity', type: 'number', defaultValue: 80, min: 20, max: 100, group: 'Animation' },
  ],
})
