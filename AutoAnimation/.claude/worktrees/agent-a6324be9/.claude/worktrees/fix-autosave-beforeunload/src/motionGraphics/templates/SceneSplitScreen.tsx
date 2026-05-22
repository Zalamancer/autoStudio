import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSplitScreenConfig {
  leftTitle: string
  rightTitle: string
  leftColor: string
  rightColor: string
  dividerColor: string
  layout: 'vertical' | 'diagonal'
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneSplitScreenComponent({ config, progress }: MotionGraphicProps<SceneSplitScreenConfig>) {
  const { leftTitle, rightTitle, leftColor, rightColor, dividerColor, layout } = config

  // Phase calculations: 0-20% enter, 20-80% hold, 80-100% exit
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const isDiagonal = layout === 'diagonal'

  // Left panel slides in from left
  const leftX = enterProgress < 1
    ? -100 + easeOutQuart(enterProgress) * 100
    : exitProgress > 0
      ? -100 * easeInCubic(exitProgress)
      : 0

  // Right panel slides in from right
  const rightX = enterProgress < 1
    ? 100 - easeOutQuart(enterProgress) * 100
    : exitProgress > 0
      ? 100 * easeInCubic(exitProgress)
      : 0

  // Divider appears after panels meet
  const dividerDelay = 0.5
  const dividerEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - dividerDelay) / (1 - dividerDelay))
    : 1
  const dividerOpacity = dividerEnter < 1
    ? easeOutCubic(dividerEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const dividerScaleY = dividerEnter < 1
    ? easeOutCubic(dividerEnter)
    : 1

  // Titles fade in on each side
  const titleDelay = 0.6
  const titleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - titleDelay) / (1 - titleDelay))
    : 1
  const titleOpacity = titleEnter < 1
    ? easeOutCubic(titleEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const titleY = titleEnter < 1
    ? 20 * (1 - easeOutCubic(titleEnter))
    : exitProgress > 0
      ? -20 * easeInCubic(exitProgress)
      : 0

  if (isDiagonal) {
    // Diagonal split
    const diagonalSkew = 8

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Left panel (diagonal) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '55%',
            height: '100%',
            background: leftColor,
            transform: `translateX(${leftX}%) skewX(-${diagonalSkew}deg)`,
            transformOrigin: 'top left',
          }}
        />

        {/* Right panel (diagonal) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '55%',
            height: '100%',
            background: rightColor,
            transform: `translateX(${rightX}%) skewX(-${diagonalSkew}deg)`,
            transformOrigin: 'top right',
          }}
        />

        {/* Divider (diagonal line) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '4px',
            height: '100%',
            background: dividerColor,
            opacity: dividerOpacity,
            transform: `translateX(-50%) skewX(-${diagonalSkew}deg) scaleY(${dividerScaleY})`,
            transformOrigin: 'top center',
            boxShadow: `0 0 12px ${dividerColor}60`,
          }}
        />

        {/* Left title */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '22%',
            transform: `translate(-50%, calc(-50% + ${titleY}px))`,
            opacity: titleOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 4.5vw, 40px)',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            maxWidth: '35%',
          }}
        >
          {leftTitle}
        </div>

        {/* Right title */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '22%',
            transform: `translate(50%, calc(-50% + ${titleY}px))`,
            opacity: titleOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 4.5vw, 40px)',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            maxWidth: '35%',
          }}
        >
          {rightTitle}
        </div>
      </div>
    )
  }

  // Vertical split (default)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Left panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: leftColor,
          transform: `translateX(${leftX}%)`,
        }}
      />

      {/* Right panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: rightColor,
          transform: `translateX(${rightX}%)`,
        }}
      />

      {/* Divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: '4px',
          height: '100%',
          background: dividerColor,
          opacity: dividerOpacity,
          transform: `translateX(-50%) scaleY(${dividerScaleY})`,
          transformOrigin: 'center center',
          boxShadow: `0 0 12px ${dividerColor}60`,
        }}
      />

      {/* Left title */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '25%',
          transform: `translate(-50%, calc(-50% + ${titleY}px))`,
          opacity: titleOpacity,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 4.5vw, 40px)',
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          maxWidth: '40%',
        }}
      >
        {leftTitle}
      </div>

      {/* Right title */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '75%',
          transform: `translate(-50%, calc(-50% + ${titleY}px))`,
          opacity: titleOpacity,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 4.5vw, 40px)',
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          maxWidth: '40%',
        }}
      >
        {rightTitle}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-split-screen',
  title: 'Scene Split Screen',
  description: 'Split screen with two panels sliding in from opposite sides, divider line, and titled sections',
  tags: ['scene', 'split', 'versus', 'comparison', 'layout'],
  category: 'scene-layout',
  component: SceneSplitScreenComponent as any,
  defaultConfig: {
    leftTitle: 'Before',
    rightTitle: 'After',
    leftColor: '#1e3a5f',
    rightColor: '#5f1e3a',
    dividerColor: '#ffffff',
    layout: 'vertical',
  },
  configSchema: [
    { key: 'leftTitle', label: 'Left Title', type: 'text', defaultValue: 'Before', group: 'Content' },
    { key: 'rightTitle', label: 'Right Title', type: 'text', defaultValue: 'After', group: 'Content' },
    { key: 'leftColor', label: 'Left Color', type: 'color', defaultValue: '#1e3a5f', group: 'Style' },
    { key: 'rightColor', label: 'Right Color', type: 'color', defaultValue: '#5f1e3a', group: 'Style' },
    { key: 'dividerColor', label: 'Divider Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'layout', label: 'Layout', type: 'select', defaultValue: 'vertical', options: ['vertical', 'diagonal'], group: 'Layout' },
  ],
})
