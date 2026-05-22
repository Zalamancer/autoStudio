import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCallToActionConfig {
  text: string
  buttonText: string
  bgColor: string
  buttonColor: string
  style: 'pill' | 'rounded' | 'sharp'
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCallToActionComponent({ config, progress }: MotionGraphicProps<SceneCallToActionConfig>) {
  const { text, buttonText, bgColor, buttonColor, style } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Background expand from center
  const bgScale = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.3
      : 1
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Text fade in
  const textDelay = 0.3
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const textY = textEnter < 1
    ? 20 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? -20 * easeInCubic(exitProgress)
      : 0

  // Button bounces in with overshoot
  const btnDelay = 0.55
  const btnEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - btnDelay) / (1 - btnDelay))
    : 1
  const btnScale = btnEnter < 1
    ? easeOutBack(btnEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.5
      : 1
  const btnOpacity = btnEnter < 1
    ? easeOutCubic(btnEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Subtle pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const pulseScale = isHolding
    ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.03
    : 1
  const pulseGlow = isHolding
    ? 8 + Math.sin(holdProgress * Math.PI * 6) * 6
    : 8

  // Button border-radius based on style
  const borderRadius = style === 'pill' ? '50px' : style === 'rounded' ? '12px' : '0px'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `scale(${bgScale})`,
          opacity: bgOpacity,
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10%',
          gap: '1.5em',
        }}
      >
        {/* Text */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(18px, 5vw, 48px)',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '80%',
          }}
        >
          {text}
        </div>

        {/* Button */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `scale(${btnScale * pulseScale})`,
            background: buttonColor,
            color: '#ffffff',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 28px)',
            fontWeight: 600,
            padding: '0.6em 2em',
            borderRadius,
            letterSpacing: '0.03em',
            boxShadow: `0 0 ${pulseGlow}px ${buttonColor}80, 0 4px 16px rgba(0,0,0,0.3)`,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {buttonText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-call-to-action',
  title: 'Scene Call to Action',
  description: 'Eye-catching CTA with expanding background, bouncing button with pulse animation',
  tags: ['scene', 'cta', 'button', 'call-to-action', 'layout'],
  category: 'scene-layout',
  component: SceneCallToActionComponent as any,
  defaultConfig: {
    text: 'Ready to Get Started?',
    buttonText: 'Subscribe Now',
    bgColor: '#0a0a1a',
    buttonColor: '#ff4757',
    style: 'pill',
  },
  configSchema: [
    { key: 'text', label: 'Text', type: 'text', defaultValue: 'Ready to Get Started?', group: 'Content' },
    { key: 'buttonText', label: 'Button Text', type: 'text', defaultValue: 'Subscribe Now', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'buttonColor', label: 'Button Color', type: 'color', defaultValue: '#ff4757', group: 'Style' },
    { key: 'style', label: 'Button Style', type: 'select', defaultValue: 'pill', options: ['pill', 'rounded', 'sharp'], group: 'Style' },
  ],
})
