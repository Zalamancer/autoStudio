import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookControversialConfig {
  label: string
  opinionText: string
  labelColor: string
  textColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneHookControversialComponent({ config, progress, frame }: MotionGraphicProps<SceneHookControversialConfig>) {
  const { label, opinionText, labelColor, textColor, bgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Glitch effect on label: random translateX offsets
  const glitchActive = enterProgress < 0.7 || (progress >= 0.25 && progress < 0.8)
  const glitchIntensity = enterProgress < 0.7
    ? (1 - enterProgress / 0.7) * 20
    : 0

  // Intermittent micro-glitches during hold
  const holdGlitch = progress >= 0.25 && progress < 0.8
    ? (Math.sin(holdProgress * Math.PI * 30) > 0.92 ? (Math.sin(frame * 7.3) * 4) : 0)
    : 0

  const labelGlitchX = enterProgress < 0.7
    ? Math.sin(frame * 4.7) * glitchIntensity
    : holdGlitch

  const labelOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(enterProgress * 2, 1))
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Glitch color shift layers
  const showGlitchLayers = glitchIntensity > 2 || Math.abs(holdGlitch) > 1

  // Opinion text fades in clean below
  const opinionDelay = 0.5
  const opinionEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - opinionDelay) / (1 - opinionDelay))
    : 1
  const opinionOpacity = opinionEnter < 1
    ? easeOutCubic(opinionEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const opinionY = opinionEnter < 1
    ? 20 * (1 - easeOutCubic(opinionEnter))
    : 0

  // Exit: pixelation effect (simulated with scale)
  const exitScale = exitProgress > 0 ? 1 + easeInCubic(exitProgress) * 0.3 : 1
  const exitBlur = exitProgress > 0 ? easeInCubic(exitProgress) * 10 : 0

  // Scanline effect
  const scanlineY = enterProgress < 1
    ? (enterProgress * 200) % 100
    : (holdProgress * 100) % 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: `${scanlineY}%`,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${labelColor}15, transparent)`,
        opacity: glitchActive ? 0.6 : 0,
        zIndex: 5,
      }} />

      {/* Glitch red/blue shift layers for label */}
      {showGlitchLayers && (
        <>
          <div style={{
            position: 'absolute', top: '32%', left: '50%',
            transform: `translate(calc(-50% + ${labelGlitchX + 3}px), -50%)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(20px, 6vw, 50px)',
            fontWeight: 900,
            color: '#ff000060',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
          <div style={{
            position: 'absolute', top: '32%', left: '50%',
            transform: `translate(calc(-50% + ${labelGlitchX - 3}px), -50%)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(20px, 6vw, 50px)',
            fontWeight: 900,
            color: '#0000ff60',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
        </>
      )}

      {/* Main label text */}
      <div style={{
        position: 'absolute', top: '32%', left: '50%',
        transform: `translate(calc(-50% + ${labelGlitchX}px), -50%) scale(${exitScale})`,
        filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        opacity: labelOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(20px, 6vw, 50px)',
        fontWeight: 900,
        color: labelColor,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        whiteSpace: 'nowrap',
        textShadow: `0 0 20px ${labelColor}40`,
        zIndex: 2,
      }}>
        {label}
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: '42%', left: '50%',
        transform: `translate(-50%, 0) scale(${exitScale})`,
        width: `${easeOutCubic(Math.max(0, enterProgress * 2 - 0.5)) * 50}%`,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${labelColor}60, transparent)`,
        opacity: labelOpacity,
      }} />

      {/* Opinion text (clean, no glitch) */}
      <div style={{
        position: 'absolute', top: '52%', left: '50%',
        transform: `translate(-50%, ${opinionY}px) scale(${exitScale})`,
        filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
        opacity: opinionOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(14px, 4vw, 34px)',
        fontWeight: 500,
        color: textColor,
        textAlign: 'center',
        width: '78%',
        lineHeight: 1.5,
      }}>
        {opinionText}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-controversial',
  title: 'Hook: Controversial',
  description: '"Unpopular opinion:" hook with glitch/distortion label, clean opinion reveal, and pixelation exit',
  tags: ['scene', 'hook', 'controversial', 'opinion', 'glitch', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookControversialComponent as any,
  defaultConfig: {
    label: 'UNPOPULAR OPINION',
    opinionText: 'Morning routines are completely overrated',
    labelColor: '#ffd700',
    textColor: '#e0e0e0',
    bgColor: '#1a1a1a',
  },
  configSchema: [
    { key: 'label', label: 'Label Text', type: 'text', defaultValue: 'UNPOPULAR OPINION', group: 'Content' },
    { key: 'opinionText', label: 'Opinion Text', type: 'text', defaultValue: 'Morning routines are completely overrated', group: 'Content' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#ffd700', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
  ],
})
