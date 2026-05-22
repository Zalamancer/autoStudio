import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMinimalEndCardConfig {
  heading: string
  handle: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneMinimalEndCardComponent({ config, progress }: MotionGraphicProps<SceneMinimalEndCardConfig>) {
  const { heading, handle, bgColor, textColor } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const easedEnter = easeOutCubic(enterProgress)
  const easedExit = easeInCubic(exitProgress)

  // Heading fades in
  const headingOpacity = exitProgress > 0
    ? easedEnter * (1 - easedExit)
    : easedEnter
  const headingY = enterProgress < 1
    ? 20 * (1 - easedEnter)
    : exitProgress > 0
      ? -15 * easedExit
      : 0

  // Thin line scales in with delay
  const lineDelay = 0.3
  const lineEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - lineDelay) / (1 - lineDelay))
    : 1
  const lineScale = exitProgress > 0
    ? easeOutCubic(lineEnter) * (1 - easedExit)
    : easeOutCubic(lineEnter)

  // Handle fades in with more delay
  const handleDelay = 0.5
  const handleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - handleDelay) / (1 - handleDelay))
    : 1
  const handleOpacity = exitProgress > 0
    ? easeOutCubic(handleEnter) * (1 - easedExit)
    : easeOutCubic(handleEnter)
  const handleY = handleEnter < 1
    ? 10 * (1 - easeOutCubic(handleEnter))
    : 0

  // Social icon placeholders fade in last
  const iconsDelay = 0.65
  const iconsEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - iconsDelay) / (1 - iconsDelay))
    : 1
  const iconsOpacity = exitProgress > 0
    ? easeOutCubic(iconsEnter) * (1 - easedExit)
    : easeOutCubic(iconsEnter)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Centered content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0',
        }}
      >
        {/* Heading */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(18px, 4.5vw, 48px)',
            fontWeight: 300,
            color: textColor,
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          {heading}
        </div>

        {/* Thin divider */}
        <div
          style={{
            width: '50px',
            height: '1px',
            background: textColor,
            opacity: lineScale * 0.25,
            transform: `scaleX(${lineScale})`,
            margin: '1.8em 0',
          }}
        />

        {/* Social handle */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(11px, 2vw, 20px)',
            fontWeight: 400,
            color: textColor,
            opacity: handleOpacity * 0.55,
            transform: `translateY(${handleY}px)`,
            letterSpacing: '0.08em',
          }}
        >
          {handle}
        </div>

        {/* Social icon placeholders */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 28px)',
            marginTop: '1.8em',
            opacity: iconsOpacity * 0.35,
          }}
        >
          {/* Simple circle placeholders for social icons */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 'clamp(20px, 3vw, 32px)',
                height: 'clamp(20px, 3vw, 32px)',
                borderRadius: '50%',
                border: `1px solid ${textColor}`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-minimal-end-card',
  title: 'Scene Minimal End Card',
  description: 'Clean end card with subtle heading fade, social handle, and minimal icon placeholders on a spacious white background',
  tags: ['scene', 'end-card', 'minimal', 'clean', 'whitespace', 'outro', 'social'],
  category: 'scene-layout',
  component: SceneMinimalEndCardComponent as any,
  defaultConfig: {
    heading: 'Thanks for watching',
    handle: '@yourusername',
    bgColor: '#FFFFFF',
    textColor: '#333333',
  },
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Thanks for watching', group: 'Content' },
    { key: 'handle', label: 'Social Handle', type: 'text', defaultValue: '@yourusername', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#333333', group: 'Style' },
  ],
})
