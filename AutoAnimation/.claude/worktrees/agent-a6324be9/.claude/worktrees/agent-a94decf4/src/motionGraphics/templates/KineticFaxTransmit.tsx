import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FaxTransmitConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Scan line position — moves from top to bottom at fax speed
    const scanLineY = (time * 28) % (height + 40) - 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper texture — very faint horizontal lines like thermal paper */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
          pointerEvents: 'none',
        }} />
        {/* Fax scan line — bright horizontal stripe moving downward */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: scanLineY,
          height: 3,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 5%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.18) 70%, rgba(255,255,255,0.08) 95%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {/* Scan line glow */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: scanLineY - 4,
          height: 12,
          background: 'linear-gradient(90deg, transparent 0%, rgba(200,220,255,0.04) 20%, rgba(200,220,255,0.08) 50%, rgba(200,220,255,0.04) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {/* FAX header at top */}
        <div style={{
          position: 'absolute', top: 10, left: 14, right: 14,
          display: 'flex', justifyContent: 'space-between',
          fontFamily: "'Courier New', monospace",
          fontSize: 8, color: 'rgba(255,255,255,0.12)',
          letterSpacing: 1,
        }}>
          <span>FAX TRANSMISSION</span>
          <span>PG 1 OF 1</span>
        </div>
        {/* Telephone line noise at bottom */}
        <div style={{
          position: 'absolute', bottom: 12, left: '5%', right: '5%',
          height: 16, display: 'flex', alignItems: 'center', gap: 1,
        }}>
          {Array.from({ length: 30 }, (_, i) => {
            const h = rand(i * 37 + frame * 5) > 0.5
              ? 2 + rand(i * 71 + frame * 3) * 12
              : 1
            return (
              <div key={i} style={{
                flex: 1,
                height: h,
                background: `rgba(255,255,255,${0.05 + rand(i * 53 + frame) * 0.08})`,
              }} />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 97 + 43

    if (phase === 'enter') {
      // Fax scan reveal — text appears line by line from top to bottom
      // scanProgress 0..1 represents the scan line passing through the text area
      // Text is fully revealed when scanProgress=1

      const scanProgress = enterProgress

      // Text occupies roughly the center 40% of height
      // Map scan position to text reveal
      const textStart = 0.3  // normalized position in full height
      const textEnd = 0.7
      const textScanProgress = Math.max(0, Math.min(1,
        (scanProgress - textStart) / (textEnd - textStart)
      ))

      // Use clip to reveal text top-to-bottom
      const revealHeight = textScanProgress * 100

      // Add telephone line artifacts — random horizontal streaks in already-scanned area
      const streaks = Array.from({ length: 4 }, (_, i) => {
        const streakYNorm = rand(seed + i * 67) * textScanProgress
        const streakY = streakYNorm
        const isVisible = streakYNorm < textScanProgress && rand(seed + i * 113 + Math.floor(f / 5)) > 0.5
        const streakWidth = 10 + rand(seed + i * 43) * 60
        const streakX = rand(seed + i * 89) * (100 - streakWidth)
        return { streakY: streakY * 100, streakX, streakWidth, isVisible }
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Clipped text — only visible portion above scan line */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: `inset(0 0 ${100 - revealHeight}% 0)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            // Thermal paper slight yellow-white
            filter: 'contrast(1.1)',
          }}>
            {word}
          </div>
          {/* Artifact streaks in scanned area */}
          {streaks.map((s, i) => s.isVisible && (
            <div key={i} style={{
              position: 'absolute',
              top: `calc(50% - clamp(20px, 5vw, 70px) + ${(s.streakY - 50) * 0.6}%)`,
              left: `${s.streakX}%`,
              width: `${s.streakWidth}%`,
              height: 2,
              background: `rgba(255,255,255,${0.05 + rand(seed + i + f) * 0.1})`,
            }} />
          ))}
          {/* Scan line position indicator on the text area */}
          {textScanProgress > 0 && textScanProgress < 1 && (
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              // Position relative to where text block is
              top: `calc(50% - clamp(20px, 5vw, 70px) + ${textScanProgress * 100}% * 0.4 - 20%)`,
              height: 2,
              background: 'rgba(255,255,255,0.12)',
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Fully received — stable with faint scan artifacts
      const hasArtifact = (holdProgress > 0.3 && holdProgress < 0.35) || (holdProgress > 0.7 && holdProgress < 0.74)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: hasArtifact ? 0.85 : 1,
            filter: hasArtifact ? `contrast(${1.2 + rand(seed + f) * 0.3})` : undefined,
          }}>
            {word}
          </div>
          {hasArtifact && (
            <div style={{
              position: 'absolute',
              top: `calc(50% + ${(rand(seed + f * 7) - 0.5) * 40}%)`,
              left: `${rand(seed + f * 11) * 40}%`,
              width: `${20 + rand(seed + f * 3) * 40}%`,
              height: 2,
              background: `rgba(255,255,255,${0.06 + rand(seed + f) * 0.08})`,
            }} />
          )}
        </div>
      )
    } else {
      // Exit: paper feeds out — text scrolls upward as page exits fax machine
      const scrollUp = exitProgress * height * 0.6

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% - ${scrollUp}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: Math.max(0, 1 - exitProgress * 1.5),
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function FaxTransmitComponent(props: MotionGraphicProps<FaxTransmitConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fax-transmit',
  title: 'Kinetic Fax Transmit',
  description: 'Fax transmission scan — text revealed line by line by moving scan head with telephone noise artifacts, thermal paper texture, and FAX header',
  tags: ['kinetic', 'typography', 'glitch', 'fax', 'scan', 'retro', 'office', 'transmission', 'telephone', 'analog'],
  category: 'captions',
  component: FaxTransmitComponent as any,
  defaultConfig: {
    words: ['URGENT', 'TRANSMIT', 'RECEIVE', 'CONFIRM'],
    colors: ['#E8E8D8', '#CCCCBC', '#E8E8D8', '#AAAAAA'],
    bgColor: '#080808',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['URGENT', 'TRANSMIT', 'RECEIVE', 'CONFIRM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E8D8', '#CCCCBC', '#E8E8D8', '#AAAAAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
  ],
})
