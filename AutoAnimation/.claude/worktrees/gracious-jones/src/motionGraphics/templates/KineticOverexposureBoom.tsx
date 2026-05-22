import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OverexposureBoomConfig extends KineticBaseConfig {
  bloomIntensity: number
}

// Overexposure bloom — text enters as a pure white blown-out flash (overexposed),
// the exposure "recovers" to reveal sharp clean text at hold, then another bloom burst on exit.
// CSS filter: brightness + blur simulates the optical bloom of an overexposed film frame.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle warm centre glow — like a film gate catching light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,248,230,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Deep vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const easeIn = (t: number) => Math.pow(t, 3)
    // Sharp ease: fast bloom, slow recovery
    const easeOutSharp = (t: number) => 1 - Math.pow(1 - t, 4)

    let bloom: number // 0 = normal exposure, 1 = fully blown out
    let opacity: number
    let brightness: number
    let blurPx: number

    if (phase === 'enter') {
      // Start fully blown out, recover to clean
      const ep = easeOutSharp(enterProgress)
      bloom = 1 - ep
      opacity = 0.1 + ep * 0.9
      brightness = 1 + bloom * 8 // 9× brightness at peak = white wash
      blurPx = bloom * 14
    } else if (phase === 'hold') {
      bloom = 0
      opacity = 1
      brightness = 1
      blurPx = 0
    } else {
      // Exit: another bloom burst — fast onset, fades
      const ep = easeIn(exitProgress)
      bloom = ep
      opacity = 1 - ep * 0.85
      brightness = 1 + bloom * 6
      blurPx = bloom * 10
    }

    // Halo layer — a second blurred copy at high brightness gives the bloom glow spread
    const haloOpacity = bloom * 0.55
    const haloBlur = bloom * 28

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Bloom halo — blurred large-spread copy */}
        {bloom > 0.04 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 300,
              color: '#FFFFFF',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              filter: `blur(${haloBlur}px) brightness(${brightness * 0.6})`,
              opacity: haloOpacity,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text — filtered for exposure */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 300,
            color: bloom > 0.05 ? '#FFFFFF' : color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity,
            filter: blurPx > 0.2 ? `brightness(${brightness}) blur(${blurPx}px)` : 'none',
            textShadow: bloom < 0.04 ? '0 2px 20px rgba(255,255,255,0.12)' : 'none',
            transition: 'color 0.05s',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function OverexposureBoomComponent(props: MotionGraphicProps<OverexposureBoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-overexposure-boom',
  title: 'Kinetic Overexposure Bloom',
  description:
    'Overexposure bloom: text enters as a blown-out white flash as if caught in direct sunlight, the exposure recovers to reveal razor-sharp text, then flashes out again on exit',
  tags: ['kinetic', 'typography', 'film', 'overexposure', 'bloom', 'flash', 'optical', 'cinematic', 'brand', 'product'],
  category: 'captions',
  component: OverexposureBoomComponent as any,
  defaultConfig: {
    words: ['RADIANT', 'EXPOSED', 'VIVID', 'PURE'],
    colors: ['#FFFFFF', '#FFF8F0', '#FFF0E0', '#FFFAF5'],
    bgColor: '#070507',
    cycleDuration: 1.2,
    bloomIntensity: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RADIANT', 'EXPOSED', 'VIVID', 'PURE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFF8F0', '#FFF0E0', '#FFFAF5'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070507', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'bloomIntensity',
      label: 'Bloom Intensity',
      type: 'number',
      defaultValue: 8,
      min: 2,
      max: 15,
      group: 'Animation',
    },
  ],
})
