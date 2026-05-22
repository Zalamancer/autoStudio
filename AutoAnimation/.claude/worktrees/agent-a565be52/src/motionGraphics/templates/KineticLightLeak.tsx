import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightLeakConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Light leak sweeps across the frame
    const leakX = ((time * 25) % 160) - 30
    const leakAngle = 15 + Math.sin(time * 0.5) * 10

    // Secondary leak with different timing
    const leak2X = (((time + 2) * 18) % 160) - 30
    const leak2Angle = -10 + Math.cos(time * 0.7) * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film grain base texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(30,25,20,0.3) 0%, rgba(20,15,10,0.1) 100%)',
          }}
        />
        {/* Primary light leak: warm orange */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${leakAngle}deg, transparent ${leakX - 15}%, rgba(255,140,30,0.12) ${leakX}%, rgba(255,180,60,0.18) ${leakX + 8}%, rgba(255,100,20,0.08) ${leakX + 20}%, transparent ${leakX + 35}%)`,
          }}
        />
        {/* Secondary light leak: cool cyan */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${leak2Angle}deg, transparent ${leak2X - 10}%, rgba(0,200,220,0.06) ${leak2X}%, rgba(100,220,240,0.1) ${leak2X + 10}%, rgba(0,180,200,0.04) ${leak2X + 18}%, transparent ${leak2X + 30}%)`,
          }}
        />
        {/* Corner vignette (film camera light leak typical pattern) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 100% 0%, rgba(255,120,30,0.06) 0%, transparent 50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 0% 100%, rgba(255,80,180,0.04) 0%, transparent 45%)',
          }}
        />
        {/* Film border darkening */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let translateX = 0

    // Light leak wash position (affects text tint)
    const leakX = ((time * 25) % 160) - 30
    const leakProximity = Math.max(0, 1 - Math.abs(50 - leakX) / 30)

    if (phase === 'enter') {
      // Text fades in with film-style soft focus
      opacity = Math.pow(enterProgress, 0.7)
      translateX = (1 - enterProgress) * -20
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      opacity = 1 - Math.pow(exitProgress, 0.7)
      translateX = exitProgress * 20
    }

    // When light leak washes over, text gets warm tinted and bright
    const leakWashOpacity = leakProximity * 0.4 * opacity
    const warmOverlay = leakProximity > 0.3

    return (
      <>
        {/* Light leak color wash on the text */}
        {warmOverlay && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${translateX}px), -50%)`,
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 4,
              color: `rgba(255,160,40,${leakWashOpacity})`,
              filter: 'blur(3px)',
              whiteSpace: 'nowrap',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX}px), -50%)`,
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: warmOverlay
              ? `0 0 15px rgba(255,160,40,${leakProximity * 0.3}), 0 2px 4px rgba(0,0,0,0.3)`
              : '0 2px 4px rgba(0,0,0,0.3)',
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Slight chromatic aberration offset on edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${translateX + 2}px), -50%)`,
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'rgba(0,200,220,0.08)',
            opacity,
            whiteSpace: 'nowrap',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function LightLeakComponent(props: MotionGraphicProps<LightLeakConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-light-leak',
  title: 'Kinetic Light Leak',
  description: 'Film light leak with orange/cyan tint washing over text, retro photography warmth with vignette and chromatic aberration',
  tags: ['kinetic', 'typography', 'light-leak', 'film', 'retro', 'photography', 'warm', 'vintage', 'analog'],
  category: 'captions',
  component: LightLeakComponent as any,
  defaultConfig: {
    words: ['MEMORY', 'GOLDEN', 'FADED', 'GLOW'],
    colors: ['#F0E0C8', '#E8D0B0', '#F5E5D0', '#DCC8A8'],
    bgColor: '#1a1610',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEMORY', 'GOLDEN', 'FADED', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E0C8', '#E8D0B0', '#F5E5D0', '#DCC8A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
