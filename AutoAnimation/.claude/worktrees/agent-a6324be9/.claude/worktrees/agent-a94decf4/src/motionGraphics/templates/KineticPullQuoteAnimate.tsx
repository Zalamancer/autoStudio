import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PullQuoteAnimateConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInOutExpo(t: number): number {
  if (t === 0 || t === 1) return t
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Pull Quote Animate — simulates the editorial "pull quote" extraction:
 * the word begins as small body text size, then is "extracted" and enlarged
 * into a prominent pull quote with oversized quotation marks, rule lines,
 * and a dramatic size increase. The extraction is the primary animation.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
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
    const pullQuoteFontSize = Math.min(width * 0.14, height * 0.17, 120)
    const bodyFontSize = pullQuoteFontSize * 0.28
    const quoteMarkSize = pullQuoteFontSize * 0.9

    let wordFontSize: number
    let wordOpacity: number
    let wordY: number
    let quoteOpacity: number
    let ruleOpacity: number
    let ruleScaleX: number
    let wordLetterSpacing: string
    let wordFontWeight: number

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Body text size — the word sits small
        const t = enterProgress / 0.3
        wordFontSize = bodyFontSize + t * (bodyFontSize * 0.5)
        wordOpacity = t
        wordY = height / 2
        quoteOpacity = 0
        ruleOpacity = 0
        ruleScaleX = 0
        wordLetterSpacing = '0.1em'
        wordFontWeight = 300
      } else {
        // Extract to pull quote: scale up dramatically
        const t = easeOutBack(Math.min(1, (enterProgress - 0.3) / 0.7))
        wordFontSize = bodyFontSize + t * (pullQuoteFontSize - bodyFontSize)
        wordOpacity = 1
        wordY = height / 2
        quoteOpacity = easeOutQuint(Math.max(0, (enterProgress - 0.55) / 0.45))
        ruleOpacity = easeOutQuint(Math.max(0, (enterProgress - 0.6) / 0.4))
        ruleScaleX = easeOutQuint(Math.max(0, (enterProgress - 0.6) / 0.4))
        const spacingVal = 0.1 - t * 0.07
        wordLetterSpacing = `${spacingVal.toFixed(3)}em`
        wordFontWeight = Math.round(300 + t * 500)
      }
    } else if (phase === 'hold') {
      wordFontSize = pullQuoteFontSize
      wordOpacity = 1
      wordY = height / 2
      quoteOpacity = 0.35 + Math.sin(holdProgress * Math.PI * 2) * 0.05
      ruleOpacity = 0.4
      ruleScaleX = 1
      wordLetterSpacing = '0.03em'
      wordFontWeight = 800
    } else {
      // Exit: scale back down to body text
      const t = easeInOutExpo(exitProgress)
      wordFontSize = pullQuoteFontSize - t * (pullQuoteFontSize - bodyFontSize)
      wordOpacity = 1 - exitProgress
      wordY = height / 2
      quoteOpacity = (1 - t) * 0.35
      ruleOpacity = (1 - t) * 0.4
      ruleScaleX = 1 - t
      wordLetterSpacing = `${(0.03 + t * 0.07).toFixed(3)}em`
      wordFontWeight = Math.round(800 - t * 500)
    }

    const ruleW = width * 0.6
    const ruleY_top = height / 2 - pullQuoteFontSize * 0.75
    const ruleY_bottom = height / 2 + pullQuoteFontSize * 0.65
    const ruleLeft = (width - ruleW) / 2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Top rule */}
        <div
          style={{
            position: 'absolute',
            left: ruleLeft,
            top: ruleY_top,
            width: ruleW,
            height: 2,
            background: color,
            opacity: ruleOpacity,
            transformOrigin: 'left center',
            transform: `scaleX(${ruleScaleX})`,
          }}
        />
        {/* Bottom rule */}
        <div
          style={{
            position: 'absolute',
            left: ruleLeft,
            top: ruleY_bottom,
            width: ruleW,
            height: 2,
            background: color,
            opacity: ruleOpacity * 0.7,
            transformOrigin: 'right center',
            transform: `scaleX(${ruleScaleX})`,
          }}
        />

        {/* Opening quote mark */}
        <div
          style={{
            position: 'absolute',
            left: ruleLeft,
            top: height / 2,
            transform: 'translate(0, -55%)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: quoteMarkSize,
            fontWeight: 900,
            color,
            opacity: quoteOpacity,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          "
        </div>

        {/* Closing quote mark */}
        <div
          style={{
            position: 'absolute',
            right: ruleLeft,
            top: height / 2,
            transform: 'translate(0, -30%)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: quoteMarkSize * 0.7,
            fontWeight: 900,
            color,
            opacity: quoteOpacity * 0.8,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          "
        </div>

        {/* The word itself */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: wordY,
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: wordFontSize,
            fontWeight: wordFontWeight,
            letterSpacing: wordLetterSpacing,
            textTransform: 'uppercase',
            color,
            opacity: wordOpacity,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PullQuoteAnimateComponent(props: MotionGraphicProps<PullQuoteAnimateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pull-quote-animate',
  title: 'Pull Quote Animate',
  description:
    'Simulates the editorial pull quote extraction: small body text is "pulled" and enlarged into a prominent display quote with oversized quotation marks and rule lines. The dramatic size change is the primary effect.',
  tags: ['kinetic', 'typography', 'pull-quote', 'editorial', 'composition', 'size', 'serif', 'extract', 'craft'],
  category: 'captions',
  component: PullQuoteAnimateComponent as any,
  defaultConfig: {
    words: ['QUOTE', 'EXTRACT', 'FEATURE', 'PULL'],
    colors: ['#2c1810', '#3d2218', '#2c1810', '#4a2a1e'],
    bgColor: '#f9f2e8',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['QUOTE', 'EXTRACT', 'FEATURE', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2c1810', '#3d2218', '#2c1810', '#4a2a1e'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f9f2e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 6, group: 'Timing' },
  ],
})
