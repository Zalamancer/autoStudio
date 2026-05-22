import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLowerThirdConfig {
  name: string
  title: string
  bgColor: string
  accentColor: string
  style: 'modern' | 'minimal' | 'broadcast'
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneLowerThirdComponent({ config, progress }: MotionGraphicProps<SceneLowerThirdConfig>) {
  const { name, title, bgColor, accentColor, style } = config

  // Phase calculations
  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Bar slide-in from left
  const barX = enterProgress < 1
    ? -100 + easeOutQuart(enterProgress) * 100
    : exitProgress > 0
      ? -easeInCubic(exitProgress) * 100
      : 0

  // Name appears with slight delay
  const nameDelay = 0.25
  const nameEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - nameDelay) / (1 - nameDelay))
    : 1
  const nameOpacity = nameEnter < 1
    ? easeOutCubic(nameEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress * 1.5)
      : 1

  // Title fades in below with more delay
  const titleDelay = 0.45
  const titleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - titleDelay) / (1 - titleDelay))
    : 1
  const titleOpacity = titleEnter < 1
    ? easeOutCubic(titleEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress * 2)
      : 1
  const titleY = titleEnter < 1
    ? 10 * (1 - easeOutCubic(titleEnter))
    : 0

  // Accent line width
  const accentWidth = enterProgress < 1
    ? easeOutQuart(Math.max(0, (enterProgress - 0.1) / 0.9)) * 100
    : exitProgress > 0
      ? 100 * (1 - easeInCubic(exitProgress))
      : 100

  // Style-specific rendering
  const isModern = style === 'modern'
  const isMinimal = style === 'minimal'
  const isBroadcast = style === 'broadcast'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Lower third container - positioned at bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          transform: `translateX(${barX}%)`,
          maxWidth: '60%',
        }}
      >
        {/* Background bar */}
        <div
          style={{
            background: isBroadcast
              ? `linear-gradient(90deg, ${bgColor}, ${bgColor}dd)`
              : isModern
                ? `${bgColor}ee`
                : 'transparent',
            backdropFilter: isModern ? 'blur(10px)' : undefined,
            borderRadius: isMinimal ? '0' : isModern ? '8px' : '2px',
            padding: isMinimal ? '8px 0' : isBroadcast ? '12px 24px 12px 16px' : '14px 24px',
            borderLeft: isMinimal ? `3px solid ${accentColor}` : isBroadcast ? `4px solid ${accentColor}` : 'none',
            boxShadow: isModern ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {/* Accent line on top for modern style */}
          {isModern && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${accentWidth}%`,
                height: '3px',
                background: accentColor,
                borderRadius: '8px 8px 0 0',
              }}
            />
          )}

          {/* Name */}
          <div
            style={{
              opacity: nameOpacity,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 28px)',
              fontWeight: 700,
              color: isMinimal ? bgColor : '#ffffff',
              letterSpacing: isBroadcast ? '0.05em' : '0',
              textTransform: isBroadcast ? 'uppercase' : 'none',
              paddingLeft: isMinimal ? '12px' : '0',
            }}
          >
            {name}
          </div>

          {/* Title */}
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(11px, 2vw, 18px)',
              fontWeight: 400,
              color: isMinimal ? `${bgColor}bb` : '#ffffffbb',
              marginTop: '2px',
              letterSpacing: isBroadcast ? '0.08em' : '0.01em',
              textTransform: isBroadcast ? 'uppercase' : 'none',
              paddingLeft: isMinimal ? '12px' : '0',
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom accent line for broadcast */}
        {isBroadcast && (
          <div
            style={{
              width: `${accentWidth}%`,
              height: '2px',
              background: accentColor,
              marginTop: '2px',
            }}
          />
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lower-third',
  title: 'Scene Lower Third',
  description: 'Professional lower third with name and title, featuring modern, minimal, or broadcast styles',
  tags: ['scene', 'lower-third', 'name', 'title', 'broadcast', 'layout'],
  category: 'scene-layout',
  component: SceneLowerThirdComponent as any,
  defaultConfig: {
    name: 'John Doe',
    title: 'Creative Director',
    bgColor: '#0f0f23',
    accentColor: '#00d4ff',
    style: 'modern',
  },
  configSchema: [
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'John Doe', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Creative Director', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0f0f23', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00d4ff', group: 'Style' },
    { key: 'style', label: 'Style', type: 'select', defaultValue: 'modern', options: ['modern', 'minimal', 'broadcast'], group: 'Style' },
  ],
})
