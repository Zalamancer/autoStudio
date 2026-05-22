import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Glitch Distort 2: Interlace Tear ─────────────────────────────────────────
// Text rendered in two interlaced fields that slip out of sync — odd/even
// scanlines displaced opposite directions, flicker and sync on hold.

interface InterlaceTearConfig extends KineticBaseConfig {
  tearIntensity: number
  fieldOffset: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 33.9 + 4.1) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const FIELD_LINES = 24

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Interlace overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          rgba(255,255,255,0.015) 0px,
          rgba(255,255,255,0.015) 2px,
          transparent 2px,
          transparent 4px
        )`,
        pointerEvents: 'none',
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const lineH = height / FIELD_LINES

    // Field slip amount
    const glitchSeed = Math.floor(holdProgress * 20)
    const spontaneousGlitch = seeded(glitchSeed * 13) > 0.75 && phase === 'hold'

    let fieldOffset = 0  // pixels odd field is shifted relative to even

    if (phase === 'enter') {
      fieldOffset = (1 - easeOutCubic(enterProgress)) * 60
    } else if (phase === 'hold') {
      fieldOffset = spontaneousGlitch ? (seeded(glitchSeed) - 0.5) * 40 : Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      fieldOffset = easeInCubic(exitProgress) * 80
    }

    const lines = Array.from({ length: FIELD_LINES }, (_, i) => {
      const isOddField = i % 2 === 1
      // Odd field displaces opposite to even field
      const lineShift = isOddField ? fieldOffset : -fieldOffset * 0.3
      // Additional per-line tear during strong glitch
      const tearShift = Math.abs(fieldOffset) > 25
        ? (seeded(i * 7 + glitchSeed * 5) - 0.5) * (Math.abs(fieldOffset) * 0.5)
        : 0

      const totalShift = lineShift + tearShift

      let lineOp = isOddField ? 0.85 : 1.0
      // Flicker — brief opacity dip
      if (phase === 'enter' && enterProgress < 0.3) {
        lineOp *= Math.random() > 0.4 ? 1 : 0.3  // flicker in
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: i * lineH,
            width: '100%',
            height: lineH + 0.5,
            overflow: 'hidden',
            opacity: lineOp,
          }}
        >
          <div style={{
            position: 'absolute',
            top: -i * lineH,
            left: 0,
            width: '100%',
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateX(${totalShift}px)`,
          }}>
            <span style={{
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontSize: 'clamp(42px, 10vw, 136px)',
              fontWeight: 900,
              color: isOddField ? color : `rgba(255,255,255,0.92)`,
              filter: isOddField ? `hue-rotate(5deg)` : `hue-rotate(-5deg)`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}>
              {word}
            </span>
          </div>
        </div>
      )
    })

    // Sync flash — brief white overlay when fields re-lock
    const syncFlash = phase === 'enter' && enterProgress > 0.7 && enterProgress < 0.8
      ? (enterProgress - 0.7) / 0.1
      : 0
    const syncFlashOp = syncFlash > 0 ? Math.sin(syncFlash * Math.PI) * 0.15 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {lines}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'white',
          opacity: syncFlashOp,
          pointerEvents: 'none',
        }} />
      </div>
    )
  },
}

function InterlaceTearComponent(props: MotionGraphicProps<InterlaceTearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-interlace-tear',
  title: 'Kinetic Interlace Tear',
  description: 'Text rendered in interlaced odd/even scanlines that slip out of sync — fields drift apart on enter/exit, sync-lock flash, spontaneous glitch spikes on hold.',
  tags: ['kinetic', 'typography', 'interlace', 'glitch', 'scanline', 'crt', 'displacement', 'digital'],
  category: 'captions',
  component: InterlaceTearComponent as any,
  defaultConfig: {
    words: ['SYNC', 'TEAR', 'LOST', 'LOCK'],
    colors: ['#FFFFFF', '#00FFCC', '#FFFFFF', '#FF4444'],
    bgColor: '#040404',
    cycleDuration: 1.5,
    tearIntensity: 60,
    fieldOffset: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SYNC', 'TEAR', 'LOST', 'LOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00FFCC', '#FFFFFF', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040404', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'tearIntensity', label: 'Tear Intensity', type: 'number', defaultValue: 60, min: 10, max: 150, group: 'Animation' },
    { key: 'fieldOffset', label: 'Field Offset (px)', type: 'number', defaultValue: 40, min: 5, max: 100, group: 'Animation' },
  ],
})
