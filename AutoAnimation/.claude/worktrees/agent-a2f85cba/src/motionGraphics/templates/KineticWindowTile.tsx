import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── R11: Window Tile ────────────────────────────────────────────────────────
// Windows tile grid inspired. Each letter sits inside a colored tile that
// flips in from behind (rotateX). Tiles arranged in a grid layout with
// different Microsoft accent colors. Light gray background with subtle grid.
// Hold: tiles gently breathe/pulse. Exit: tiles flip back and shrink away.

interface WindowTileConfig extends KineticBaseConfig {}

// Microsoft accent palette — saturated, bold, clean
const TILE_COLORS = ['#0078D4', '#107C10', '#FFB900', '#D83B01', '#8661C5']

// Ease: smooth back-out for satisfying overshoot on flip
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle grid pulse
    const gridOpacity = 0.06 + Math.sin(time * 0.8) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle grid lines — Windows design language */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,${gridOpacity}) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,${gridOpacity}) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none' as const,
          }}
        />
        {/* Faint decorative tiles in corners — environment context */}
        {[
          { x: '6%', y: '8%', size: 28, color: TILE_COLORS[0], rot: 0 },
          { x: '90%', y: '12%', size: 22, color: TILE_COLORS[1], rot: 12 },
          { x: '8%', y: '82%', size: 24, color: TILE_COLORS[3], rot: -8 },
          { x: '88%', y: '78%', size: 20, color: TILE_COLORS[4], rot: 6 },
          { x: '50%', y: '6%', size: 18, color: TILE_COLORS[2], rot: 15 },
          { x: '50%', y: '90%', size: 16, color: TILE_COLORS[0], rot: -10 },
          { x: '20%', y: '18%', size: 14, color: TILE_COLORS[4], rot: 20 },
          { x: '78%', y: '86%', size: 16, color: TILE_COLORS[1], rot: -15 },
        ].map((tile, i) => {
          const drift = Math.sin(time * 0.5 + i * 1.2) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: tile.x,
                top: tile.y,
                width: tile.size,
                height: tile.size,
                borderRadius: 4,
                background: tile.color,
                opacity: 0.08,
                transform: `translate(-50%, -50%) rotate(${tile.rot + drift}deg)`,
                mixBlendMode: 'multiply' as const,
                pointerEvents: 'none' as const,
              }}
            />
          )
        })}
        {/* Windows logo hint — four quadrants in center-top */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            display: 'grid',
            gridTemplateColumns: '8px 8px',
            gap: 2,
            opacity: 0.1,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#F25022' }} />
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#7FBA00' }} />
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#00A4EF' }} />
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#FFB900' }} />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Tiles flip in one by one from behind (rotateX)
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 6,
              perspective: '800px',
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const tileColor = TILE_COLORS[ci % TILE_COLORS.length]
              // Staggered delay per character
              const charDelay = (ci / totalChars) * 0.6
              const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6)))
              const charEased = easeOutBack(Math.min(1, charProgress))

              // Flip from -90deg (behind) to 0deg
              const rotateX = -90 * (1 - charEased)
              const tileScale = 0.6 + charEased * 0.4
              const tileOpacity = Math.min(1, charProgress * 3)

              return (
                <div
                  key={ci}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'clamp(38px, 11vw, 140px)',
                    height: 'clamp(46px, 13.5vw, 175px)',
                    borderRadius: 8,
                    background: tileColor,
                    boxShadow: charEased > 0.5
                      ? `0 ${4 * charEased}px ${12 * charEased}px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)`
                      : 'none',
                    transform: `rotateX(${rotateX}deg) scale(${tileScale})`,
                    transformOrigin: 'center bottom',
                    opacity: tileOpacity,
                    backfaceVisibility: 'hidden' as const,
                    overflow: 'hidden' as const,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                      fontSize: 'clamp(32px, 9vw, 120px)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      lineHeight: 1,
                      userSelect: 'none' as const,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Tiles gently breathe — subtle scale pulse, shadow depth shift
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 6,
              perspective: '800px',
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const tileColor = TILE_COLORS[ci % TILE_COLORS.length]
              // Staggered breathing wave
              const breathPhase = holdProgress * Math.PI * 3 + ci * 0.7
              const breathScale = 1 + Math.sin(breathPhase) * 0.025
              const breathY = Math.sin(breathPhase + 0.5) * 2
              const shadowDepth = 6 + Math.sin(breathPhase) * 3

              // Specular highlight sweeping across tiles
              const highlightPos = holdProgress * (totalChars + 2) - 1
              const dist = Math.abs(ci - highlightPos)
              const highlight = Math.exp(-dist * dist * 0.8) * 0.3

              return (
                <div
                  key={ci}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'clamp(38px, 11vw, 140px)',
                    height: 'clamp(46px, 13.5vw, 175px)',
                    borderRadius: 8,
                    background: tileColor,
                    boxShadow: `0 ${shadowDepth}px ${shadowDepth * 2}px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)`,
                    transform: `translateY(${breathY}px) scale(${breathScale})`,
                    overflow: 'hidden' as const,
                    position: 'relative' as const,
                  }}
                >
                  {/* Specular highlight overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(135deg, rgba(255,255,255,${highlight}) 0%, transparent 60%)`,
                      borderRadius: 8,
                      pointerEvents: 'none' as const,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                      fontSize: 'clamp(32px, 9vw, 120px)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      lineHeight: 1,
                      position: 'relative' as const,
                      zIndex: 1,
                      userSelect: 'none' as const,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    } else {
      // Exit: tiles flip back (rotateX to +90) and shrink
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 6,
              perspective: '800px',
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const tileColor = TILE_COLORS[ci % TILE_COLORS.length]
              // Reverse stagger — last char exits first for variety
              const charDelay = ((totalChars - 1 - ci) / totalChars) * 0.4
              const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay * 0.4)))
              const charEased = easeInCubic(charProgress)

              // Flip forward to +90deg (behind again) and shrink
              const rotateX = 90 * charEased
              const tileScale = 1 - charEased * 0.5
              const tileOpacity = Math.max(0, 1 - charProgress * 1.5)

              return (
                <div
                  key={ci}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'clamp(38px, 11vw, 140px)',
                    height: 'clamp(46px, 13.5vw, 175px)',
                    borderRadius: 8,
                    background: tileColor,
                    boxShadow: tileOpacity > 0.3
                      ? `0 ${4 * (1 - charEased)}px ${8 * (1 - charEased)}px rgba(0,0,0,0.1)`
                      : 'none',
                    transform: `rotateX(${rotateX}deg) scale(${tileScale})`,
                    transformOrigin: 'center top',
                    opacity: tileOpacity,
                    backfaceVisibility: 'hidden' as const,
                    overflow: 'hidden' as const,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                      fontSize: 'clamp(32px, 9vw, 120px)',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      lineHeight: 1,
                      userSelect: 'none' as const,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  },
}

function WindowTileComponent(props: MotionGraphicProps<WindowTileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-window-tile',
  title: 'Kinetic Window Tile',
  description: 'Windows tile grid inspired: each letter sits inside a bold colored tile that flips in with satisfying overshoot. Microsoft accent color palette on a clean light grid background. Tiles breathe on hold, flip back and shrink on exit.',
  tags: ['kinetic', 'typography', 'microsoft', 'windows', 'tile', 'grid', 'flip', 'corporate', 'colorful', 'playful'],
  category: 'captions',
  component: WindowTileComponent as any,
  defaultConfig: {
    words: ['SURFACE', 'TEAMS', 'BUILD', 'SHIP'],
    colors: ['#0078D4', '#107C10', '#FFB900', '#D83B01'],
    bgColor: '#F0F0F0',
    cycleDuration: 0.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SURFACE', 'TEAMS', 'BUILD', 'SHIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0078D4', '#107C10', '#FFB900', '#D83B01'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.7, min: 0.3, max: 5, group: 'Timing' },
  ],
})
