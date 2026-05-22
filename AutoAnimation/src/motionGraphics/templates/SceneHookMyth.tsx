import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookMythConfig {
  mythText: string
  factText: string
  mythColor: string
  factColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookMythComponent({ config, progress }: MotionGraphicProps<SceneHookMythConfig>) {
  const { mythText, factText, mythColor, factColor, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Panels slide in from edges
  const leftSlide = enterProgress < 1 ? -100 + easeOutQuart(enterProgress) * 100 : 0
  const rightSlide = enterProgress < 1 ? 100 - easeOutQuart(enterProgress) * 100 : 0

  const panelOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // VS badge pops in center
  const vsDelay = 0.5
  const vsEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - vsDelay) / (1 - vsDelay))
    : 1
  const vsScale = vsEnter < 1 ? elasticOut(vsEnter) : 1
  const vsOpacity = vsEnter < 1
    ? easeOutCubic(vsEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Hold: subtle opposing float
  const isHolding = progress >= 0.2 && progress < 0.8
  const leftFloat = isHolding ? Math.sin(holdProgress * Math.PI * 3) * 4 : 0
  const rightFloat = isHolding ? -Math.sin(holdProgress * Math.PI * 3) * 4 : 0

  // Labels and text fade in with delay
  const textDelay = 0.4
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Exit: fact side expands to fill
  const factExpand = exitProgress > 0 ? easeInCubic(exitProgress) * 50 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Myth (left) panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: `${50 - factExpand}%`, height: '100%',
        background: `${mythColor}30`,
        borderRight: `2px solid ${mythColor}50`,
        transform: `translateX(${leftSlide}%) translateY(${leftFloat}px)`,
        opacity: panelOpacity,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
      }}>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(18px, 5vw, 42px)',
          fontWeight: 900,
          color: mythColor,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.6em',
          opacity: textOpacity,
        }}>
          MYTH
        </div>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(11px, 2.8vw, 22px)',
          fontWeight: 500,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: textOpacity,
        }}>
          {mythText}
        </div>
      </div>

      {/* Fact (right) panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: `${50 + factExpand}%`, height: '100%',
        background: `${factColor}30`,
        borderLeft: `2px solid ${factColor}50`,
        transform: `translateX(${rightSlide}%) translateY(${rightFloat}px)`,
        opacity: panelOpacity,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
      }}>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(18px, 5vw, 42px)',
          fontWeight: 900,
          color: factColor,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.6em',
          opacity: textOpacity,
        }}>
          FACT
        </div>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(11px, 2.8vw, 22px)',
          fontWeight: 500,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: textOpacity,
        }}>
          {factText}
        </div>
      </div>

      {/* VS badge */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) scale(${vsScale})`,
        opacity: vsOpacity,
        width: 'clamp(48px, 10vw, 80px)',
        height: 'clamp(48px, 10vw, 80px)',
        borderRadius: '50%',
        background: bgColor,
        border: '3px solid #ffffff40',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(14px, 3vw, 26px)',
        fontWeight: 900,
        color: '#ffffff',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>
        VS
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-myth',
  title: 'Hook: Myth vs Fact',
  description: '"Myth vs Fact" comparison hook with split panels, VS badge pop-in, and opposing float animation',
  tags: ['scene', 'hook', 'myth', 'fact', 'versus', 'comparison', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookMythComponent as any,
  defaultConfig: {
    mythText: 'You need 8 glasses of water a day',
    factText: 'Your needs depend on body weight and activity',
    mythColor: '#ff4444',
    factColor: '#44cc44',
    bgColor: '#0f0f1a',
    textColor: '#e0e0e0',
  },
  configSchema: [
    { key: 'mythText', label: 'Myth Text', type: 'text', defaultValue: 'You need 8 glasses of water a day', group: 'Content' },
    { key: 'factText', label: 'Fact Text', type: 'text', defaultValue: 'Your needs depend on body weight and activity', group: 'Content' },
    { key: 'mythColor', label: 'Myth Color', type: 'color', defaultValue: '#ff4444', group: 'Style' },
    { key: 'factColor', label: 'Fact Color', type: 'color', defaultValue: '#44cc44', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
  ],
})
