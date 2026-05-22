import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DropCapGrowConfig extends KineticBaseConfig {
  dropCapLines: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Drop Cap Grow — the first letter animates as a typographic drop cap:
 * it grows from body text size to drop-cap size (3× line height) while
 * the remaining letters wrap/adjust to sit beside it. The cap grows with
 * an overshoot and settles into the classic editorial drop cap position.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    if (!word || word.length === 0) return null

    const dropCapLines = 3
    const bodyFontSize = Math.min(width * 0.07, height * 0.09, 60)
    const dropCapFontSize = bodyFontSize * dropCapLines * 1.1 // drop cap = 3 lines tall

    // Body text sits next to the drop cap
    const dropCapWidth = dropCapFontSize * 0.72
    const bodyX = dropCapWidth + width * 0.04
    const bodyWidth = width - bodyX - width * 0.08

    const firstLetter = word[0] ?? ''
    const restLetters = word.slice(1)

    // Phase-based animation values
    let dropCapScale: number
    let dropCapOpacity: number
    let dropCapY: number
    let bodyOpacity: number
    let bodyLetterSpacing: string
    let bodyFontWeight: number
    let dropCapFontWeight: number
    let overallOpacity: number

    if (phase === 'enter') {
      if (enterProgress < 0.15) {
        // Body text appears first at normal size
        const t = enterProgress / 0.15
        dropCapScale = 1.0 // starts at body size
        dropCapOpacity = t * 0.4
        dropCapY = 0
        bodyOpacity = t
        bodyLetterSpacing = '0.04em'
        bodyFontWeight = 400
        dropCapFontWeight = 400
        overallOpacity = 1
      } else {
        // Drop cap grows with springy overshoot
        const t = easeOutBack(Math.min(1, (enterProgress - 0.15) / 0.85))
        // Scale from 1 (body size) to final drop cap size ratio
        const targetRatio = dropCapFontSize / bodyFontSize
        dropCapScale = 1 + (targetRatio - 1) * t
        dropCapOpacity = 1
        // Drop cap sits on top: its top aligns with body top
        // Y adjustment: drop cap bottom = body baseline * 3
        dropCapY = 0
        bodyOpacity = 1
        bodyLetterSpacing = `${(0.04 - t * 0.02).toFixed(3)}em`
        bodyFontWeight = 400 + Math.round(t * 300)
        dropCapFontWeight = Math.round(400 + t * 400)
        overallOpacity = 1
      }
    } else if (phase === 'hold') {
      const targetRatio = dropCapFontSize / bodyFontSize
      dropCapScale = targetRatio
      // Subtle drop cap breathe
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.015
      dropCapScale = targetRatio * (1 + breathe)
      dropCapOpacity = 1
      dropCapY = 0
      bodyOpacity = 1
      bodyLetterSpacing = '0.02em'
      bodyFontWeight = 700
      dropCapFontWeight = 800
      overallOpacity = 1
    } else {
      // Exit: drop cap shrinks back to body size
      const t = easeInOutQuart(exitProgress)
      const targetRatio = dropCapFontSize / bodyFontSize
      dropCapScale = targetRatio * (1 - t) + 1 * t
      dropCapOpacity = 1 - t * t
      dropCapY = 0
      bodyOpacity = 1 - t
      bodyLetterSpacing = '0.02em'
      bodyFontWeight = 700
      dropCapFontWeight = 800
      overallOpacity = 1 - exitProgress
    }

    const targetRatio = dropCapFontSize / bodyFontSize
    const isAtFullSize = dropCapScale >= targetRatio * 0.9

    // When drop cap is large, position it to the left
    const layoutMode = dropCapScale > 1.5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: overallOpacity,
          width: width * 0.84,
        }}
      >
        {/* Drop cap letter */}
        <div
          style={{
            float: layoutMode ? 'left' : 'none',
            display: layoutMode ? 'block' : 'inline-block',
            fontSize: bodyFontSize * dropCapScale,
            fontWeight: dropCapFontWeight,
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            color,
            opacity: dropCapOpacity,
            lineHeight: 0.85,
            marginRight: layoutMode ? '0.06em' : 0,
            marginBottom: layoutMode ? '0.02em' : 0,
            userSelect: 'none',
          }}
        >
          {firstLetter}
        </div>
        {/* Rest of the word */}
        {restLetters.length > 0 && (
          <div
            style={{
              display: layoutMode ? 'block' : 'inline-block',
              fontSize: bodyFontSize,
              fontWeight: bodyFontWeight,
              fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              color,
              opacity: bodyOpacity,
              letterSpacing: bodyLetterSpacing,
              lineHeight: 1.2,
              userSelect: 'none',
              textTransform: 'uppercase',
              marginTop: layoutMode ? bodyFontSize * 0.15 : 0,
              verticalAlign: layoutMode ? 'top' : 'middle',
            }}
          >
            {restLetters}
          </div>
        )}
      </div>
    )
  },
}

function DropCapGrowComponent(props: MotionGraphicProps<DropCapGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drop-cap-grow',
  title: 'Drop Cap Grow',
  description:
    'The first letter grows from body text size into a 3-line editorial drop cap with springy overshoot. Remaining letters wrap beside it in classic book-design composition. The baseline alignment of drop cap and body text is the primary effect.',
  tags: ['kinetic', 'typography', 'drop-cap', 'baseline', 'editorial', 'serif', 'grow', 'layout', 'craft'],
  category: 'captions',
  component: DropCapGrowComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'CRAFT', 'PRINT', 'WORDS'],
    colors: ['#1a0800', '#2a1200', '#1a0800', '#301800'],
    bgColor: '#fdf5e6',
    cycleDuration: 2.6,
    dropCapLines: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESIGN', 'CRAFT', 'PRINT', 'WORDS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a0800', '#2a1200', '#1a0800', '#301800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fdf5e6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 1.5, max: 6, group: 'Timing' },
    { key: 'dropCapLines', label: 'Drop Cap Lines', type: 'number', defaultValue: 3, min: 2, max: 5, group: 'Layout' },
  ],
})
