import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookContrarianConfig {
  hookWord: string
  restOfText: string
  hookColor: string
  textColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookContrarianComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneHookContrarianConfig>) {
  const { hookWord, restOfText, hookColor, textColor, bgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "STOP" slams in with screen shake
  const hookScale = enterProgress < 1 ? elasticOut(enterProgress) : 1
  const hookOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(enterProgress * 3, 1))
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Screen shake on impact (first 30% of enter)
  const shakeIntensity = enterProgress < 0.3 ? (1 - enterProgress / 0.3) * 8 : 0
  const shakeX = shakeIntensity * Math.sin(frame * 2.5)
  const shakeY = shakeIntensity * Math.cos(frame * 3.1)

  // Rest of text types in letter by letter after hook lands
  const typeDelay = 0.5
  const typeProgress = enterProgress < 1
    ? Math.max(0, (enterProgress - typeDelay) / (1 - typeDelay))
    : 1
  const visibleChars = Math.floor(typeProgress * restOfText.length)
  const typedText = restOfText.slice(0, visibleChars)
  const typeOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : typeProgress > 0 ? 1 : 0

  // Hold: breathing scale on hook word
  const isHolding = progress >= 0.25 && progress < 0.8
  const breathe = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 2.5) * 0.03 : 1

  // Exit: everything slides down
  const exitY = exitProgress > 0 ? 120 * easeInCubic(exitProgress) : 0

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      transform: `translate(${shakeX}px, ${shakeY}px)`,
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Hook word */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: `translate(-50%, calc(-50% + ${exitY}px)) scale(${hookScale * breathe})`,
        opacity: hookOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(48px, 16vw, 140px)',
        fontWeight: 900,
        color: hookColor,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        textShadow: `0 0 40px ${hookColor}40`,
        lineHeight: 1,
      }}>
        {hookWord}
      </div>

      {/* Red underline accent */}
      <div style={{
        position: 'absolute', top: '46%', left: '50%',
        transform: `translate(-50%, ${exitY}px)`,
        width: `${easeOutCubic(enterProgress) * 60}%`,
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${hookColor}, transparent)`,
        opacity: hookOpacity,
      }} />

      {/* Typed text */}
      <div style={{
        position: 'absolute', top: '54%', left: '50%',
        transform: `translate(-50%, ${exitY}px)`,
        opacity: typeOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(16px, 5vw, 40px)',
        fontWeight: 500,
        color: textColor,
        textAlign: 'center',
        width: '80%',
        lineHeight: 1.4,
      }}>
        {typedText}
        {typeProgress > 0 && typeProgress < 1 && (
          <span style={{
            opacity: Math.sin((frame / fps) * Math.PI * 6) > 0 ? 1 : 0,
            color: hookColor,
          }}>|</span>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-contrarian',
  title: 'Hook: Contrarian',
  description: '"Stop doing X" contrarian hook with screen shake impact, typing text, and breathing scale',
  tags: ['scene', 'hook', 'contrarian', 'stop', 'attention', 'opener', 'bold'],
  category: 'scene-hook',
  component: SceneHookContrarianComponent as any,
  defaultConfig: {
    hookWord: 'STOP',
    restOfText: 'doing this in 2024',
    hookColor: '#ff2d2d',
    textColor: '#e0e0e0',
    bgColor: '#0a0a0a',
  },
  configSchema: [
    { key: 'hookWord', label: 'Hook Word', type: 'text', defaultValue: 'STOP', group: 'Content' },
    { key: 'restOfText', label: 'Rest of Text', type: 'text', defaultValue: 'doing this in 2024', group: 'Content' },
    { key: 'hookColor', label: 'Hook Color', type: 'color', defaultValue: '#ff2d2d', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
  ],
})
