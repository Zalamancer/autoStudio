import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMinimalSplitConfig {
  title: string
  description: string
  bgColor: string
  textColor: string
  dividerColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneMinimalSplitComponent({ config, progress }: MotionGraphicProps<SceneMinimalSplitConfig>) {
  const { title, description, bgColor, textColor, dividerColor } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const easedEnter = easeOutCubic(enterProgress)
  const easedExit = easeInCubic(exitProgress)

  // Top half slides in from left
  const topX = enterProgress < 1
    ? -80 * (1 - easedEnter)
    : exitProgress > 0
      ? -80 * easedExit
      : 0
  const topOpacity = enterProgress < 1
    ? easedEnter
    : exitProgress > 0
      ? 1 - easedExit
      : 1

  // Bottom half slides in from right
  const bottomX = enterProgress < 1
    ? 80 * (1 - easedEnter)
    : exitProgress > 0
      ? 80 * easedExit
      : 0
  const bottomOpacity = enterProgress < 1
    ? easedEnter
    : exitProgress > 0
      ? 1 - easedExit
      : 1

  // Divider line scales in
  const dividerDelay = 0.3
  const dividerEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - dividerDelay) / (1 - dividerDelay))
    : 1
  const dividerScale = exitProgress > 0
    ? easeOutCubic(dividerEnter) * (1 - easedExit)
    : easeOutCubic(dividerEnter)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Top half — Title */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 12% 6%',
          transform: `translateX(${topX}px)`,
          opacity: topOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(24px, 6vw, 72px)',
            fontWeight: 300,
            color: textColor,
            textAlign: 'center',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>

      {/* Thin divider line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${dividerScale})`,
          width: '60%',
          height: '1px',
          background: dividerColor,
          opacity: 0.3,
        }}
      />

      {/* Bottom half — Description */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '6% 12% 0',
          transform: `translateX(${bottomX}px)`,
          opacity: bottomOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 24px)',
            fontWeight: 300,
            color: textColor,
            textAlign: 'center',
            opacity: 0.6,
            lineHeight: 1.6,
            maxWidth: '70%',
            letterSpacing: '0.01em',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-minimal-split',
  title: 'Scene Minimal Split',
  description: 'Screen splits into top title and bottom description with thin divider line, halves slide in from edges for a clean editorial look',
  tags: ['scene', 'split', 'minimal', 'clean', 'editorial', 'whitespace', 'layout'],
  category: 'scene-layout',
  component: SceneMinimalSplitComponent as any,
  defaultConfig: {
    title: 'Design Principles',
    description: 'Good design is as little design as possible. Focus on the essential aspects.',
    bgColor: '#FFFFFF',
    textColor: '#000000',
    dividerColor: '#000000',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Design Principles', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Good design is as little design as possible. Focus on the essential aspects.', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'dividerColor', label: 'Divider Color', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
})
