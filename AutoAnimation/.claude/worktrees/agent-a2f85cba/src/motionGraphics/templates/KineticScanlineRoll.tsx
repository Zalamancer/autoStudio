import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScanlineRollConfig extends KineticBaseConfig {
  lineThickness: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Horizontal frequency interference — rolling bar
    const rollY = (time * 22) % 110 - 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine scan lines — CRT raster structure */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Rolling interference band — vertical hold loss artifact */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${rollY}%`,
            height: 24,
            background: 'linear-gradient(0deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.04), transparent)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
        {/* Secondary weak roll band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(rollY + 55) % 110}%`,
            height: 10,
            background: 'rgba(255,255,255,0.02)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const fp = fps ?? 30
    const time = f / fp
    const seed = index * 103 + 41

    // The text exists but scan lines roll THROUGH it, creating gaps
    // As scan lines roll: text is only visible in the non-masked regions
    // Effect: text emerges between rolling horizontal scan gaps

    // Scan line roll position (0..100% of height, cycles every ~1.2s)
    const rollSpeed = 22  // percent per second
    const rollY = (time * rollSpeed + seed * 17) % 110 - 5

    // The "gap" in scan lines — text visible in the gap, dimmed through lines
    // Simulate by making portions of text dim based on scan position

    let baseOpacity = 0
    let scanContrast = 1

    if (phase === 'enter') {
      // Text builds up scan-line by scan-line from bottom/top
      baseOpacity = enterProgress
      // Initially heavy scan interference, clears as text settles
      scanContrast = 0.5 + enterProgress * 0.5
    } else if (phase === 'hold') {
      baseOpacity = 1
      scanContrast = 1
    } else {
      baseOpacity = 1 - exitProgress
      scanContrast = 1 - exitProgress * 0.5
    }

    // Clip: reveal text progressively upward (scan line sweep reveals text)
    const clipProgress = phase === 'enter' ? enterProgress : 1
    const clipY = clipProgress * 100

    return (
      <>
        {/* Dark underlayer — text "behind" scan lines */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: baseOpacity * 0.3 * scanContrast,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
          }}
        >
          {word}
        </div>
        {/* Bright text in scan gap — the actual visible portion */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: baseOpacity * scanContrast,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            // Scan line mask — CSS repeating gradient cuts horizontal strips
            WebkitMaskImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(0,0,0,1) 1px,
              rgba(0,0,0,1) 3px
            )`,
            maskImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              rgba(0,0,0,1) 1px,
              rgba(0,0,0,1) 3px
            )`,
            textShadow: `0 0 8px ${color}60`,
          }}
        >
          {word}
        </div>
        {/* Highlight pass — scan line peak brightness sweep */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: baseOpacity * 0.5,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            WebkitMaskImage: `linear-gradient(0deg, transparent, rgba(0,0,0,0.9) ${Math.max(0, rollY - 8)}%, rgba(0,0,0,0.9) ${rollY + 3}%, transparent ${rollY + 12}%)`,
            maskImage: `linear-gradient(0deg, transparent, rgba(0,0,0,0.9) ${Math.max(0, rollY - 8)}%, rgba(0,0,0,0.9) ${rollY + 3}%, transparent ${rollY + 12}%)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ScanlineRollComponent(props: MotionGraphicProps<ScanlineRollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scanline-roll',
  title: 'Kinetic Scanline Roll',
  description: 'CRT horizontal scan lines roll through the text — text emerges between the gaps as a bright sweep passes, simulating raster scan refresh',
  tags: ['kinetic', 'typography', 'scanline', 'crt', 'raster', 'roll', 'display', 'hardware', 'retro'],
  category: 'captions',
  component: ScanlineRollComponent as any,
  defaultConfig: {
    words: ['SCAN', 'ROLL', 'RASTER', 'SWEEP'],
    colors: ['#00e5ff', '#00cfff', '#40f0ff', '#80e8ff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
    lineThickness: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'ROLL', 'RASTER', 'SWEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00e5ff', '#00cfff', '#40f0ff', '#80e8ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'lineThickness', label: 'Scan Line Thickness', type: 'number', defaultValue: 1, min: 1, max: 3, group: 'Animation' },
  ],
})
