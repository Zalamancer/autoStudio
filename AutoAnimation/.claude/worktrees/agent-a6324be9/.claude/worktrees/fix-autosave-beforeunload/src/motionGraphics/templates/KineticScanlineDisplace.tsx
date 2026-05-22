import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Glitch Distort 1: Scanline Displacement ────────────────────────────────────
// Text is sliced into horizontal scanlines, each displaced horizontally by a
// different amount — classic CRT scan-head malfunction pattern.

interface ScanlineDisplaceConfig extends KineticBaseConfig {
  displaceIntensity: number
  scanlineCount: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 55.1 + 91.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 3px,
          rgba(0,0,0,0.15) 3px,
          rgba(0,0,0,0.15) 4px
        )`,
        pointerEvents: 'none',
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const LINES = 20
    const lineH = height / LINES

    // Glitch seed varies with frame
    const glitchSeed = Math.floor(holdProgress * 30)
    // Glitch intensity — bursts during enter/exit, occasional during hold
    const holdGlitch = Math.max(0, Math.sin(holdProgress * Math.PI * 7) * 0.5 + 0.3 * (seeded(glitchSeed * 17) > 0.85 ? 1 : 0))

    const lines = Array.from({ length: LINES }, (_, i) => {
      // Displacement amount for this scanline
      const baseDisplace = (seeded(i * 7 + glitchSeed * 3) - 0.5) * 2
      const displaceMag = baseDisplace * 60

      let lineDisplace = 0
      let lineOp = 1
      let rgbShift = 0  // chromatic aberration

      if (phase === 'enter') {
        // All lines start maximally displaced, converge
        const delay = (seeded(i * 11) * 0.3)
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay * 0.5)))
        const e = easeOutCubic(p)
        lineDisplace = displaceMag * (1 - e) + (seeded(i * 3 + 5) - 0.5) * 80 * (1 - e)
        lineOp = 0.3 + e * 0.7
        rgbShift = (1 - e) * 8
      } else if (phase === 'hold') {
        lineDisplace = displaceMag * holdGlitch
        lineOp = 1
        rgbShift = holdGlitch * 4
      } else {
        const p = easeInCubic(exitProgress)
        lineDisplace = displaceMag * p + (seeded(i * 5 + 9) - 0.5) * 120 * p
        lineOp = 1 - p * 0.6
        rgbShift = p * 10
      }

      // Color channel split — R/B offset for chromatic aberration look
      const rShift = rgbShift
      const bShift = -rgbShift

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
          {/* Red channel */}
          <div
            style={{
              position: 'absolute',
              top: -i * lineH,
              left: 0,
              width: '100%',
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${lineDisplace + rShift}px)`,
              mixBlendMode: 'screen',
            }}
          >
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 9.5vw, 132px)',
              fontWeight: 900,
              color: `rgba(255,0,0,0.6)`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {word}
            </span>
          </div>
          {/* Main text */}
          <div
            style={{
              position: 'absolute',
              top: -i * lineH,
              left: 0,
              width: '100%',
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${lineDisplace}px)`,
            }}
          >
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 9.5vw, 132px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {word}
            </span>
          </div>
          {/* Blue channel */}
          <div
            style={{
              position: 'absolute',
              top: -i * lineH,
              left: 0,
              width: '100%',
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${lineDisplace + bShift}px)`,
              mixBlendMode: 'screen',
            }}
          >
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 9.5vw, 132px)',
              fontWeight: 900,
              color: `rgba(0,80,255,0.5)`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}>
              {word}
            </span>
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {lines}
      </div>
    )
  },
}

function ScanlineDisplaceComponent(props: MotionGraphicProps<ScanlineDisplaceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scanline-displace',
  title: 'Kinetic Scanline Displace',
  description: 'Text sliced into CRT scanlines, each displaced by random amounts with chromatic aberration — glitch intensity bursts on enter/exit, occasional spikes during hold.',
  tags: ['kinetic', 'typography', 'scanline', 'glitch', 'displacement', 'crt', 'chromatic', 'distortion'],
  category: 'captions',
  component: ScanlineDisplaceComponent as any,
  defaultConfig: {
    words: ['GLITCH', 'ERROR', 'SIGNAL', 'NOISE'],
    colors: ['#00FF88', '#FFFFFF', '#00DDFF', '#FF0044'],
    bgColor: '#050505',
    cycleDuration: 1.5,
    displaceIntensity: 60,
    scanlineCount: 20,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLITCH', 'ERROR', 'SIGNAL', 'NOISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#FFFFFF', '#00DDFF', '#FF0044'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'displaceIntensity', label: 'Displace Intensity', type: 'number', defaultValue: 60, min: 10, max: 200, group: 'Animation' },
    { key: 'scanlineCount', label: 'Scanline Count', type: 'number', defaultValue: 20, min: 8, max: 40, group: 'Animation' },
  ],
})
