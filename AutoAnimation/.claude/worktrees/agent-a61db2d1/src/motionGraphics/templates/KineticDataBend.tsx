import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Glitch Distort 4: Data Bend ────────────────────────────────────────────────
// Text is "databent" — RGB channel separation, random horizontal segments
// get frame offsets like corrupt image file headers. Strong first-frame chaos.

interface DataBendConfig extends KineticBaseConfig {
  bendIntensity: number
  channelSplit: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 41.1 + 88.3) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const BEND_ROWS = 16
const RGB_LAYERS = 3

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Noise grain hint */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.3,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const rowH = height / BEND_ROWS
    const glitchSeed = Math.floor(holdProgress * 15)

    // Global bend intensity
    let bendStrength = 0
    if (phase === 'enter') bendStrength = Math.max(0, 1 - easeOutCubic(enterProgress) * 1.3)
    else if (phase === 'hold') {
      // Occasional spontaneous bends
      bendStrength = seeded(glitchSeed * 19) > 0.7
        ? seeded(glitchSeed * 7) * 0.5
        : 0.05
    }
    else bendStrength = easeInCubic(exitProgress) * 1.2

    // Channel colors
    const channels = [
      { color: 'rgba(255,0,0,0.7)', offsetMultiplier: 1.5 },
      { color: color, offsetMultiplier: 0 },
      { color: 'rgba(0,100,255,0.6)', offsetMultiplier: -1.2 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {channels.map((ch, layerIdx) => (
          <div key={layerIdx} style={{ position: 'absolute', inset: 0, mixBlendMode: layerIdx === 1 ? 'normal' : 'screen' }}>
            {Array.from({ length: BEND_ROWS }, (_, ri) => {
              // Bend offset for this row
              const rowBendProb = seeded(ri * 3 + glitchSeed * 11)
              const isGlitchRow = rowBendProb > (1 - bendStrength * 0.8)
              const bendOffset = isGlitchRow
                ? (seeded(ri * 7 + glitchSeed * 5) - 0.5) * width * 0.6 * bendStrength
                : 0
              const channelOffset = bendOffset + ch.offsetMultiplier * Math.max(1, Math.abs(bendStrength * 12))

              // Some rows are "dropped" (invisible) in heavy bend
              const rowDropped = bendStrength > 0.7 && seeded(ri * 11 + glitchSeed * 3) > 0.85
              const rowOp = rowDropped ? 0 : (layerIdx === 1 ? 1 : 0.7)

              return (
                <div
                  key={ri}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: ri * rowH,
                    width: '100%',
                    height: rowH + 0.5,
                    overflow: 'hidden',
                    opacity: rowOp,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: -ri * rowH,
                    left: 0,
                    width: '100%',
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateX(${channelOffset}px)`,
                  }}>
                    <span style={{
                      fontFamily: "'Arial Black', 'Helvetica', sans-serif",
                      fontSize: 'clamp(42px, 10vw, 136px)',
                      fontWeight: 900,
                      color: ch.color,
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.02em',
                    }}>
                      {word}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Corrupt header stripe — top 10% heavily bent on enter */}
        {bendStrength > 0.3 && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: `${10 + bendStrength * 8}%`,
            overflow: 'hidden',
            opacity: bendStrength * 0.8,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 10vw, 136px)',
              fontWeight: 900,
              color: `rgba(255,255,0,0.8)`,
              transform: `translateX(${(seeded(glitchSeed * 23) - 0.5) * width * 0.8}px) scaleX(${0.3 + seeded(glitchSeed * 17) * 2})`,
            }}>
              {word}
            </div>
          </div>
        )}
      </div>
    )
  },
}

function DataBendComponent(props: MotionGraphicProps<DataBendConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-data-bend',
  title: 'Kinetic Data Bend',
  description: 'Text corrupted like a databent image file — RGB channel separation, random row offsets, dropped scanlines, corrupt header stripe. Maximum chaos on first frame.',
  tags: ['kinetic', 'typography', 'databend', 'glitch', 'corrupt', 'rgb', 'digital', 'distortion'],
  category: 'captions',
  component: DataBendComponent as any,
  defaultConfig: {
    words: ['CORRUPT', 'BEND', 'ERROR', 'RAW'],
    colors: ['#FFFFFF', '#FF4400', '#FFFFFF', '#00FFCC'],
    bgColor: '#020202',
    cycleDuration: 1.5,
    bendIntensity: 1,
    channelSplit: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CORRUPT', 'BEND', 'ERROR', 'RAW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF4400', '#FFFFFF', '#00FFCC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020202', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'bendIntensity', label: 'Bend Intensity', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
    { key: 'channelSplit', label: 'Channel Split (px)', type: 'number', defaultValue: 12, min: 2, max: 40, group: 'Animation' },
  ],
})
