import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookStoryConfig {
  storyText: string
  cursorColor: string
  textColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneHookStoryComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneHookStoryConfig>) {
  const { storyText, cursorColor, textColor, bgColor } = config

  const enterProgress = progress < 0.6 ? progress / 0.6 : 1
  const holdProgress = progress >= 0.6 && progress < 0.85 ? (progress - 0.6) / 0.25 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Words appear one at a time
  const words = storyText.split(' ')
  const visibleWords = Math.floor(easeOutCubic(enterProgress) * words.length)

  // Cursor blink
  const cursorVisible = Math.sin((frame / fps) * Math.PI * 3) > 0

  // Each word has slight delay and opacity animation
  const wordElements = words.map((word, i) => {
    if (i >= visibleWords) return null
    const wordProgress = visibleWords > 0 ? Math.min(1, (visibleWords - i) / 2) : 0
    return (
      <span key={i} style={{
        display: 'inline',
        opacity: easeOutCubic(wordProgress),
        transform: `translateY(${(1 - wordProgress) * 8}px)`,
        transition: 'none',
      }}>
        {word}{' '}
      </span>
    )
  })

  // Film grain overlay on exit (CSS-based noise)
  const grainOpacity = exitProgress > 0 ? easeInCubic(exitProgress) * 0.4 : 0

  // Overall opacity for exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Cinematic letterbox bars
  const barHeight = enterProgress < 1
    ? easeOutCubic(enterProgress) * 8
    : exitProgress > 0 ? 8 * (1 - easeInCubic(exitProgress)) : 8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Dark cinematic background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(170deg, ${bgColor} 0%, ${bgColor}ee 50%, ${bgColor}dd 100%)`,
      }} />

      {/* Subtle light leak */}
      <div style={{
        position: 'absolute', top: '20%', right: '-10%',
        width: '40%', height: '60%',
        background: `radial-gradient(ellipse, ${cursorColor}08 0%, transparent 70%)`,
        opacity: exitOpacity,
      }} />

      {/* Cinematic letterbox top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${barHeight}%`,
        background: '#000000',
        zIndex: 10,
      }} />

      {/* Cinematic letterbox bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${barHeight}%`,
        background: '#000000',
        zIndex: 10,
      }} />

      {/* Story text with typewriter effect */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: exitOpacity,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: 'clamp(16px, 4.5vw, 36px)',
        fontWeight: 400,
        color: textColor,
        textAlign: 'center',
        width: '78%',
        lineHeight: 1.7,
        letterSpacing: '0.01em',
      }}>
        {wordElements}
        {/* Blinking cursor */}
        {(enterProgress < 1 || (progress >= 0.6 && progress < 0.85)) && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '1.1em',
            background: cursorColor,
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            opacity: cursorVisible ? 1 : 0,
          }} />
        )}
      </div>

      {/* Film grain overlay on exit */}
      {grainOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / ${4 + Math.round(frame % 3)}px ${4 + Math.round(frame % 3)}px`,
          opacity: grainOpacity,
          zIndex: 8,
          mixBlendMode: 'overlay',
        }} />
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-story',
  title: 'Hook: Story',
  description: '"I was broke until..." storytelling hook with word-by-word reveal, blinking cursor, and cinematic bars',
  tags: ['scene', 'hook', 'story', 'typewriter', 'cinematic', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookStoryComponent as any,
  defaultConfig: {
    storyText: 'I was broke... until I discovered this one trick',
    cursorColor: '#e2b84a',
    textColor: '#f0f0f0',
    bgColor: '#0c0c14',
  },
  configSchema: [
    { key: 'storyText', label: 'Story Text', type: 'text', defaultValue: 'I was broke... until I discovered this one trick', group: 'Content' },
    { key: 'cursorColor', label: 'Cursor Color', type: 'color', defaultValue: '#e2b84a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0f0f0', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
  ],
})
