import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BoldFlashConfig extends KineticBaseConfig {
  flashCount: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/**
 * Bold Flash — the word slams in at maximum weight (900 Black) with a white
 * flash, then the weight collapses to hairline (100 Thin), then flashes bold
 * again in quick strobe bursts. The weight contrast IS the drama: the same
 * letterforms at maximum and minimum weight are almost unrecognizable as kin.
 * Each flash hits at 900 then decays to resting weight. Enter: weight 900 slam.
 * Hold: rhythmic bold flashes. Exit: collapses to hairline and fades.
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
    width,
    height,
    index,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.14, height * 0.18, 130)
    const flashCount = 3

    let fontWeight: number
    let opacity: number
    let scale: number = 1
    let flashOpacity: number = 0 // white flash overlay

    if (phase === 'enter') {
      // Slam in: weight 900, white flash on impact
      const t = easeOutQuart(enterProgress)
      fontWeight = 900
      opacity = Math.min(1, enterProgress * 5)
      scale = enterProgress < 0.15
        ? 1.3 - enterProgress / 0.15 * 0.3 // overscale on slam
        : 1
      // Flash peaks at moment of impact (enterProgress ~0.15)
      flashOpacity = enterProgress < 0.25
        ? Math.max(0, 1 - enterProgress / 0.25) * 0.6
        : 0
    } else if (phase === 'hold') {
      // Resting weight: thin (200), flashing to 900 periodically
      const beatT = (holdProgress * flashCount) % 1
      // Each beat: instant 900 at start, then decay to 200 over beat duration
      const decayT = beatT < 0.08
        ? 1 // full bold hit
        : 1 - easeOutQuart((beatT - 0.08) / 0.92)
      fontWeight = Math.round(200 + decayT * 700)
      flashOpacity = beatT < 0.08 ? (1 - beatT / 0.08) * 0.35 : 0
      opacity = 1
      scale = 1 + decayT * 0.03
    } else {
      // Exit: collapse to hairline
      const t = easeInExpo(exitProgress)
      fontWeight = Math.round(900 - t * 800) // 900 → 100
      opacity = 1 - exitProgress * exitProgress
      scale = 1 - t * 0.05
    }

    const clampedWeight = Math.max(100, Math.min(900, fontWeight))

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        {/* Flash overlay */}
        {flashOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '-12px -20px',
              background: color,
              opacity: flashOpacity,
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: clampedWeight,
            fontVariationSettings: `"wght" ${clampedWeight}`,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
        {/* Weight annotation */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: -fontSize * 0.38,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: 0.18,
            letterSpacing: '0.1em',
          }}
        >
          {clampedWeight}
        </div>
      </div>
    )
  },
}

function BoldFlashComponent(props: MotionGraphicProps<BoldFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bold-flash',
  title: 'Bold Flash',
  description:
    'Word slams in at Black (900) weight with a white flash on impact, then decays to Thin (200) as resting state. Rhythmic bold flashes fire during hold — each hit is instant 900 then decays. Weight contrast is the entire effect.',
  tags: ['kinetic', 'typography', 'font-weight', 'bold', 'flash', 'strobe', 'impact', 'craft', 'variable-font'],
  category: 'captions',
  component: BoldFlashComponent as any,
  defaultConfig: {
    words: ['BOLD', 'SLAM', 'HIT', 'FLASH'],
    colors: ['#ffffff', '#ff2244', '#ffffff', '#ff2244'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
    flashCount: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'SLAM', 'HIT', 'FLASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff2244', '#ffffff', '#ff2244'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.8, max: 4, group: 'Timing' },
    { key: 'flashCount', label: 'Bold Flashes', type: 'number', defaultValue: 3, min: 1, max: 6, group: 'Animation' },
  ],
})
