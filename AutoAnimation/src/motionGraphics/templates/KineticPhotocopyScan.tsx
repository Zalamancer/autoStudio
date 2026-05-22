import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotocopyScanConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ width, height, frame, fps }: BackgroundRenderProps) => {
    // Copier scan bar sweeps top-to-bottom continuously
    const time = frame / fps
    const scanY = ((time * 0.55) % 1.3 - 0.15) * height

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#F5F2EC' }}>
        {/* Paper texture — faint grain */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)',
        }} />
        {/* Shadow top and bottom edge (paper in machine) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: 'linear-gradient(180deg, rgba(0,0,0,0.12), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: 'linear-gradient(0deg, rgba(0,0,0,0.12), transparent)' }} />
        {/* The bright scanner lamp bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: scanY,
          height: 6,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,220,0.95) 40%, rgba(255,255,255,1) 50%, rgba(255,255,220,0.95) 60%, rgba(255,255,255,0.0) 100%)',
          boxShadow: '0 0 20px 6px rgba(255,255,200,0.7), 0 2px 30px 2px rgba(255,255,180,0.3)',
        }} />
        {/* Faint green/teal glow of fluorescent lamp */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: scanY - 20, height: 40,
          background: 'radial-gradient(ellipse 100% 50% at 50% 50%, rgba(200,255,200,0.08) 0%, transparent 70%)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Photocopy: scan bar moves top-to-bottom, text appears row-by-row behind it
    // Use clipPath to reveal text as scan line passes

    const scanY = phase === 'enter' ? enterProgress * 100
      : phase === 'hold' ? 100
      : (1 - exitProgress * 0.3) * 100 // exit: text slowly fades (copy ejects)

    const textOpacity = phase === 'enter'
      ? Math.min(1, enterProgress * 1.4)
      : phase === 'hold' ? 1
      : 1 - exitProgress

    // Text that has been "copied" appears behind scan line
    const revealedClip = `inset(0 0 ${100 - scanY}% 0)`

    // Slight blur ahead of the scan line (original not yet scanned)
    const blurredClip = `inset(${scanY}% 0 0 0)`

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {/* Original text — visible above scan line, slightly washed out */}
        {phase === 'enter' && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: 'clamp(44px, 12vw, 165px)',
            fontWeight: 700,
            color: 'rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            clipPath: blurredClip,
            filter: 'blur(0.5px)',
          }}>
            {word}
          </div>
        )}
        {/* Copied text — dark, sharp, appears behind scan */}
        <div style={{
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: 'clamp(44px, 12vw, 165px)',
          fontWeight: 700,
          color: '#1a1a1a',
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          opacity: textOpacity,
          clipPath: phase === 'enter' ? revealedClip : 'none',
        }}>
          {word}
        </div>
        {/* Scan line glow at the reveal edge during enter */}
        {phase === 'enter' && (
          <div style={{
            position: 'absolute', left: -40, right: -40,
            top: `${scanY}%`,
            height: 4,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,200,0.9) 20%, rgba(255,255,255,1) 50%, rgba(255,255,200,0.9) 80%, transparent 100%)',
            boxShadow: '0 0 14px 4px rgba(255,255,180,0.65)',
          }} />
        )}
      </div>
    )
  },
}

function PhotocopyScanComponent(props: MotionGraphicProps<PhotocopyScanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-photocopy-scan',
  title: 'Kinetic Photocopy Scan',
  description: 'Photocopier scan bar sweeps top-to-bottom on white paper, revealing crisp dark text behind the bright fluorescent lamp',
  tags: ['kinetic', 'typography', 'photocopy', 'scanner', 'office', 'paper', 'copy', 'reveal'],
  category: 'captions',
  component: PhotocopyScanComponent as any,
  defaultConfig: {
    words: ['COPY', 'PRINT', 'SCAN', 'DONE'],
    colors: ['#1a1a1a', '#111111', '#1a1a1a', '#222222'],
    bgColor: '#F5F2EC',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COPY', 'PRINT', 'SCAN', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#111111', '#1a1a1a', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F2EC', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
