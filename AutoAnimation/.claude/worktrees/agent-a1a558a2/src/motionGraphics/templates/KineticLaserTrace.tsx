import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserTraceConfig extends KineticBaseConfig {
  laserColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dark tech surface — like a laser engraving table
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine grid — engraving surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />
        {/* Ambient laser scatter */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,255,180,${0.02 + Math.sin(time * 3) * 0.008}) 0%, transparent 60%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let revealClip = 0
    let dotX = 0
    let dotActive = false
    let burnBrightness = 0
    let trailOpacity = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = 1
      revealClip = enterProgress
      dotX = (enterProgress - 0.5) * 90 // dot scans left to right
      dotActive = true
      burnBrightness = 1
      trailOpacity = p
    } else if (phase === 'hold') {
      opacity = 1
      revealClip = 1
      dotX = 0
      dotActive = false
      // Engraved text glows as if still hot
      burnBrightness = 0.7 + Math.sin(holdProgress * Math.PI * 5) * 0.15
      trailOpacity = 1
    } else {
      opacity = 1 - exitProgress
      revealClip = 1
      burnBrightness = 0.7 * (1 - exitProgress)
      trailOpacity = 1 - exitProgress
    }

    const tipX = revealClip * 100
    // Laser dot jitter — scanning movement
    const jitterX = dotActive ? Math.sin(time * 40) * 1.5 : 0
    const jitterY = dotActive ? Math.sin(time * 37 + 1.2) * 1.5 : 0

    return (
      <>
        {/* Engraved/burned text — revealed stroke by stroke */}
        {/* Outer burn glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `6px ${color}`,
            opacity: trailOpacity * 0.2,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            filter: `blur(6px)`,
          }}
        >
          {word}
        </div>
        {/* Mid glow — heat shimmer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: 'transparent',
            WebkitTextStroke: `3px rgba(255,255,255,0.6)`,
            opacity: trailOpacity * burnBrightness * 0.4,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            filter: 'blur(2px)',
          }}
        >
          {word}
        </div>
        {/* Crisp engraved line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            opacity: trailOpacity * burnBrightness,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            textShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
          }}
        >
          {word}
        </div>
        {/* Laser dot — bright point that leads the trace */}
        {dotActive && revealClip > 0.01 && revealClip < 0.99 && (
          <>
            {/* Dot bloom */}
            <div
              style={{
                position: 'absolute',
                top: `calc(50% + ${jitterY}px)`,
                left: `calc(50% + ${(revealClip - 0.5) * 90}vw + ${jitterX}px)`,
                transform: 'translate(-50%, -50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${color} 30%, transparent 70%)`,
                filter: 'blur(2px)',
              }}
            />
            {/* Scan line trailing back */}
            <div
              style={{
                position: 'absolute',
                top: `calc(50% + ${jitterY}px)`,
                left: `calc(50% + ${(revealClip - 0.5) * 90 - 30}vw)`,
                width: '30vw',
                height: 2,
                transform: 'translateY(-50%)',
                background: `linear-gradient(90deg, transparent, ${color}60, rgba(255,255,255,0.5))`,
                filter: 'blur(1px)',
              }}
            />
          </>
        )}
      </>
    )
  },
}

function LaserTraceComponent(props: MotionGraphicProps<LaserTraceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-trace',
  title: 'Kinetic Laser Trace',
  description: 'A laser dot scans across text, engraving each letter with a bright burning trace — the dot jitters along the scan path leaving a glowing engraved result',
  tags: ['kinetic', 'typography', 'laser', 'trace', 'engrave', 'scan', 'tech', 'light', 'burn'],
  category: 'captions',
  component: LaserTraceComponent as any,
  defaultConfig: {
    words: ['TRACE', 'LASER', 'ENGRAVE', 'CUT'],
    colors: ['#00FF9F', '#00E5FF', '#80FF00', '#FF4040'],
    bgColor: '#060606',
    cycleDuration: 1.8,
    laserColor: '#00FF9F',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRACE', 'LASER', 'ENGRAVE', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF9F', '#00E5FF', '#80FF00', '#FF4040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
    { key: 'laserColor', label: 'Laser Color', type: 'color', defaultValue: '#00FF9F', group: 'Animation' },
  ],
})
