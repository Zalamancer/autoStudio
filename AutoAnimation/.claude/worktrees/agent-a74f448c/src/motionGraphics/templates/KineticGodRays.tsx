import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GodRaysConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Volumetric light rays streaming from top center
    const rays = Array.from({ length: 14 }, (_, i) => {
      const baseAngle = (i / 14) * 60 - 30 // spread from -30 to +30 degrees
      const sway = Math.sin(time * 0.5 + i * 0.7) * 3
      const angle = baseAngle + sway
      const rayWidth = 3 + (i % 3) * 2
      const rayOpacity = 0.03 + Math.sin(time * 1.2 + i * 1.3) * 0.015

      // Each ray is a tall thin triangle from top to bottom
      const topX = 50 + Math.tan(angle * Math.PI / 180) * 5
      const bottomLeftX = 50 + Math.tan((angle - rayWidth / 2) * Math.PI / 180) * 120
      const bottomRightX = 50 + Math.tan((angle + rayWidth / 2) * Math.PI / 180) * 120

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${topX}% 0%, ${bottomLeftX}% 100%, ${bottomRightX}% 100%)`,
            background: `linear-gradient(180deg, rgba(255,240,200,${rayOpacity * 2}) 0%, rgba(255,220,150,${rayOpacity}) 40%, rgba(255,200,100,${rayOpacity * 0.3}) 80%, transparent 100%)`,
          }}
        />
      )
    })

    // Atmospheric haze / mist particles
    const haze = Array.from({ length: 8 }, (_, i) => {
      const seed = i * 97 + 41
      const x = 10 + (seed % 80)
      const y = 30 + (seed * 3 % 40)
      const baseSize = 100 + (seed % 150)
      const driftX = Math.sin(time * 0.2 + i) * 15
      const hazeOpacity = 0.015 + Math.sin(time * 0.3 + i * 2) * 0.008

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x + driftX}%`,
            top: `${y}%`,
            width: baseSize,
            height: baseSize * 0.5,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,240,200,${hazeOpacity}) 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Depth gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(40,35,25,0.3) 0%, rgba(15,12,8,0.5) 100%)',
          }}
        />
        {/* God rays */}
        {rays}
        {/* Atmospheric haze */}
        {haze}
        {/* Light source bloom at top */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,240,200,${0.15 + Math.sin(time * 1.5) * 0.05}) 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Text silhouette materializes as rays intensify
      opacity = Math.pow(enterProgress, 0.6)
      scale = 0.9 + enterProgress * 0.1
      translateY = (1 - enterProgress) * 15
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle floating
      translateY = Math.sin(time * 1.5) * 3
    } else {
      // Text dissolves into rays
      opacity = 1 - Math.pow(exitProgress, 0.5)
      scale = 1 + exitProgress * 0.15
      translateY = -exitProgress * 20
    }

    // Rays streaming through the text cutout
    const rayAngle = 0 + Math.sin(time * 0.3) * 5
    const rayCount = 6
    const rayElements = Array.from({ length: rayCount }, (_, i) => {
      const raySpread = (i / (rayCount - 1)) * 40 - 20
      const rayOpacity = (0.1 + Math.sin(time * 1.2 + i * 1.5) * 0.05) * opacity
      const rayX = 50 + raySpread

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-10%',
            left: `${rayX - 2}%`,
            width: '4%',
            height: '120%',
            background: `linear-gradient(180deg, rgba(255,240,180,${rayOpacity * 1.5}) 0%, rgba(255,220,130,${rayOpacity}) 30%, rgba(255,200,100,${rayOpacity * 0.4}) 70%, transparent 100%)`,
            transform: `rotate(${rayAngle + raySpread * 0.3}deg)`,
            transformOrigin: 'top center',
            filter: 'blur(8px)',
          }}
        />
      )
    })

    return (
      <>
        {/* Rays that appear to stream through the text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: opacity * 0.7,
          }}
        >
          {rayElements}
        </div>
        {/* Text silhouette -- dark cutout that rays stream through */}
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
            color: 'rgba(10,8,5,0.85)',
            textShadow: `0 0 30px rgba(255,220,130,${opacity * 0.25}), 0 0 60px rgba(255,200,100,${opacity * 0.1})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Bright edge rim light (light wrapping around the text edges) */}
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
            color: 'transparent',
            WebkitTextStroke: `2px rgba(255,230,150,${opacity * 0.5})`,
            textShadow: `0 0 8px rgba(255,230,150,${opacity * 0.4})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Light spilling from the bottom of letters */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY + 5}px)) scale(${scale * 1.02})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: `rgba(255,220,130,${opacity * 0.15})`,
            filter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GodRaysComponent(props: MotionGraphicProps<GodRaysConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-god-rays',
  title: 'Kinetic God Rays',
  description: 'Volumetric god rays / light shafts streaming through text cutout silhouette, atmospheric haze with rim-light edges',
  tags: ['kinetic', 'typography', 'god-rays', 'volumetric', 'light', 'dramatic', 'cinematic', 'shadow', 'epic'],
  category: 'captions',
  component: GodRaysComponent as any,
  defaultConfig: {
    words: ['DIVINE', 'LIGHT', 'GLORY', 'RISE'],
    colors: ['#F5E6C8', '#E8D5B0', '#F0DCC0', '#E0CCA0'],
    bgColor: '#0a0908',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DIVINE', 'LIGHT', 'GLORY', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#E8D5B0', '#F0DCC0', '#E0CCA0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0908', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
