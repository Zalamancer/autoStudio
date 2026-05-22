import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookListicleConfig {
  number: number
  hookText: string
  numberColor: string
  textColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookListicleComponent({ config, progress }: MotionGraphicProps<SceneHookListicleConfig>) {
  const { number, hookText, numberColor, textColor, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Number drops in with bounce and rotation
  const numberY = enterProgress < 1
    ? -150 + elasticOut(enterProgress) * 150
    : 0
  const numberRotation = enterProgress < 1
    ? -15 + elasticOut(enterProgress) * 15
    : 0
  const numberScale = enterProgress < 1
    ? elasticOut(enterProgress)
    : 1
  const numberOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(enterProgress * 2, 1))
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Text slides from right after number lands
  const textDelay = 0.4
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textX = textEnter < 1
    ? 80 * (1 - easeOutCubic(textEnter))
    : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Arrow pulses up/down during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const arrowY = isHolding
    ? Math.sin(holdProgress * Math.PI * 4) * 8
    : 0
  const arrowOpacity = textEnter < 1
    ? easeOutCubic(Math.max(0, textEnter - 0.5) * 2)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Exit: everything slides to left
  const exitSlide = exitProgress > 0 ? -120 * easeInCubic(exitProgress) : 0

  // Background accent circle behind number
  const circlePulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.05 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Accent circle behind number */}
      <div style={{
        position: 'absolute', top: '32%', left: '50%',
        transform: `translate(-50%, -50%) scale(${circlePulse}) translateX(${exitSlide}px)`,
        width: 'clamp(80px, 22vw, 180px)',
        height: 'clamp(80px, 22vw, 180px)',
        borderRadius: '50%',
        background: `${numberColor}15`,
        border: `2px solid ${numberColor}30`,
        opacity: numberOpacity,
      }} />

      {/* Big number */}
      <div style={{
        position: 'absolute', top: '32%', left: '50%',
        transform: `translate(-50%, calc(-50% + ${numberY}px)) rotate(${numberRotation}deg) scale(${numberScale}) translateX(${exitSlide}px)`,
        opacity: numberOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(56px, 18vw, 150px)',
        fontWeight: 900,
        color: numberColor,
        lineHeight: 1,
        textShadow: `0 4px 20px ${numberColor}30`,
      }}>
        {number}
      </div>

      {/* Hook text */}
      <div style={{
        position: 'absolute', top: '56%', left: '50%',
        transform: `translate(-50%, 0) translateX(${textX + exitSlide}px)`,
        opacity: textOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(14px, 4vw, 34px)',
        fontWeight: 600,
        color: textColor,
        textAlign: 'center',
        width: '80%',
        lineHeight: 1.4,
      }}>
        {hookText}
      </div>

      {/* "Swipe to see" arrow */}
      <div style={{
        position: 'absolute', bottom: '12%', left: '50%',
        transform: `translate(-50%, ${arrowY}px) translateX(${exitSlide}px)`,
        opacity: arrowOpacity * 0.7,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px',
      }}>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(8px, 1.8vw, 12px)',
          fontWeight: 500,
          color: textColor,
          opacity: 0.6,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}>
          Swipe to see
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 4 L12 18 M6 13 L12 19 L18 13" stroke={numberColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-listicle',
  title: 'Hook: Listicle',
  description: '"5 things you..." listicle hook with bouncing number drop, sliding text, and pulsing swipe arrow',
  tags: ['scene', 'hook', 'listicle', 'list', 'number', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookListicleComponent as any,
  defaultConfig: {
    number: 5,
    hookText: "things you're doing wrong",
    numberColor: '#ff8c00',
    textColor: '#e0e0e0',
    bgColor: '#0d0d1a',
  },
  configSchema: [
    { key: 'number', label: 'Number', type: 'number', defaultValue: 5, min: 1, max: 99, group: 'Content' },
    { key: 'hookText', label: 'Hook Text', type: 'text', defaultValue: "things you're doing wrong", group: 'Content' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#ff8c00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
  ],
})
