import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LeadingCompressConfig extends KineticBaseConfig {
  lineCount: number
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
    width,
    height,
  }: WordRenderProps) => {
    const lineCount = 7 // multiple stacked copies
    const finalFontSize = Math.min(width * 0.14, height * 0.16, 110)
    const finalLineH = finalFontSize * 1.1
    const centerY = height / 2

    // Wide (open) leading: copies spread across full height
    const openLeading = height / (lineCount - 1)
    // Tight (compressed) leading: all stack on each other
    const tightLeading = finalLineH

    const els: React.ReactNode[] = []

    for (let i = 0; i < lineCount; i++) {
      // Open position: evenly spaced top-to-bottom
      const openY = (i / (lineCount - 1)) * height
      // Compressed position: all at center
      const compressedY = centerY + (i - (lineCount - 1) / 2) * tightLeading

      let y: number
      let opacity: number
      let fontSize: number
      let fontWeight: number | string
      let isCenter = i === Math.floor(lineCount / 2)

      if (phase === 'enter') {
        // First 40%: lines appear at open/wide positions
        // 40–100%: lines compress together
        if (enterProgress < 0.4) {
          const t = enterProgress / 0.4
          y = openY
          opacity = i === 0 || i === lineCount - 1
            ? t * 0.25
            : isCenter ? t * 0.5 : t * 0.3
          fontSize = finalFontSize * (0.6 + i / (lineCount - 1) * 0.4)
          fontWeight = 300
        } else {
          const t = easeInOutExpo((enterProgress - 0.4) / 0.6)
          y = openY + (compressedY - openY) * t
          const baseOpacity = i === 0 || i === lineCount - 1
            ? 0.25 * (1 - t) + (isCenter ? 1 : 0.15) * t
            : isCenter ? 0.5 + t * 0.5 : 0.3 - t * 0.15
          opacity = Math.max(0, baseOpacity)
          fontSize = finalFontSize * (0.6 + (i / (lineCount - 1)) * 0.4)
          fontWeight = isCenter ? 800 : 300
        }
      } else if (phase === 'hold') {
        y = compressedY
        // Only center line fully visible at hold; others trace echo
        if (isCenter) {
          opacity = 1
          fontWeight = 800
        } else {
          const distFromCenter = Math.abs(i - (lineCount - 1) / 2)
          opacity = Math.max(0, 0.08 - distFromCenter * 0.02) * (1 - holdProgress * 0.6)
          fontWeight = 300
        }
        fontSize = finalFontSize
      } else {
        // Exit: lines re-expand outward
        y = compressedY
        const expandT = easeInOutExpo(exitProgress)
        y = compressedY + (openY - compressedY) * expandT
        opacity = isCenter
          ? 1 - exitProgress
          : Math.min(0.3, exitProgress * 0.3) * (1 - exitProgress)
        fontSize = finalFontSize
        fontWeight = isCenter ? 800 : 300
      }

      if (opacity <= 0.01) continue

      // Staggered font weight across the stack for typographic interest
      const stackWeights = [200, 300, 400, 700, 400, 300, 200]

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: y,
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: phase === 'hold' ? (isCenter ? 800 : stackWeights[i] ?? 300) : fontWeight,
            color,
            opacity,
            whiteSpace: 'nowrap',
            letterSpacing: isCenter ? '0.05em' : '0.02em',
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      )
    }

    // Leading value indicator during enter
    if (phase === 'enter' && enterProgress < 0.85) {
      const leadingPx = enterProgress < 0.4
        ? openLeading
        : openLeading + (tightLeading - openLeading) * easeInOutExpo((enterProgress - 0.4) / 0.6)
      const leadingEm = (leadingPx / finalFontSize).toFixed(2)

      els.push(
        <div
          key="leading-label"
          style={{
            position: 'absolute',
            right: '6%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 11,
            color,
            opacity: 0.35,
            letterSpacing: '0.1em',
            textAlign: 'right',
          }}
        >
          {leadingEm}em
        </div>
      )
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function LeadingCompressComponent(props: MotionGraphicProps<LeadingCompressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-leading-compress',
  title: 'Leading Compress',
  description:
    'Seven stacked copies of the word are spread with wide leading across the full height, then compress together like an accordion until only one perfectly-leaded line remains visible.',
  tags: ['kinetic', 'typography', 'leading', 'line-height', 'compress', 'accordion', 'typesetting', 'grid'],
  category: 'captions',
  component: LeadingCompressComponent as any,
  defaultConfig: {
    words: ['LEAD', 'LINE', 'SPACE', 'TIGHT'],
    colors: ['#E2E8F0', '#94A3B8', '#38BDF8', '#F0ABFC'],
    bgColor: '#020617',
    cycleDuration: 2.2,
    lineCount: 7,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LEAD', 'LINE', 'SPACE', 'TIGHT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E2E8F0', '#94A3B8', '#38BDF8', '#F0ABFC'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020617', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 1.0,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'lineCount',
      label: 'Line Copies',
      type: 'number',
      defaultValue: 7,
      min: 3,
      max: 12,
      group: 'Layout',
    },
  ],
})
