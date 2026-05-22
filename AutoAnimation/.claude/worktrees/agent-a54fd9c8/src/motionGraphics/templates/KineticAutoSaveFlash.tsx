import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AutoSaveFlashConfig extends KineticBaseConfig {}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Google Docs / Notion-style document editor

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top toolbar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
          }}
        >
          {/* Doc icon */}
          <div style={{ width: 20, height: 24, background: 'rgba(66,133,244,0.6)', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 4, left: 3, right: 3, height: 1, background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
            <div style={{ position: 'absolute', top: 8, left: 3, right: 3, height: 1, background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
            <div style={{ position: 'absolute', top: 12, left: 3, width: '50%', height: 1, background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
          </div>
          <div
            style={{
              fontFamily: "'Google Sans', Arial, sans-serif",
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            Untitled document
          </div>
          {/* Auto-save status in top right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: `rgba(100,220,100,${0.6 + Math.sin(time * 4) * 0.2})`,
                boxShadow: `0 0 4px rgba(100,220,100,0.4)`,
              }}
            />
            <div style={{ fontFamily: "'Google Sans', Arial, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              All changes saved
            </div>
          </div>
        </div>
        {/* Document lines */}
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: '15%',
            right: '15%',
            bottom: 20,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const lineWidth = 55 + Math.abs(dsin(i * 31 + 7)) * 35
            const isBlank = (i === 2 || i === 5 || i === 9)
            return (
              <div
                key={i}
                style={{
                  height: 14,
                  marginBottom: 10,
                  width: isBlank ? '0%' : `${lineWidth}%`,
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 2,
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 71 + 43

    // Auto-save lifecycle per word:
    // enter: word types in character by character
    // hold 0..0.2: stable, cursor visible
    // hold 0.2..0.45: "Saving..." indicator flashes on word
    // hold 0.45..0.7: spinning save indicator
    // hold 0.7..1.0: "Saved" confirmation with checkmark
    // exit: fade out

    let opacity = 1
    if (phase === 'exit') opacity = 1 - exitProgress

    // Typing-in animation
    const typedChars = phase === 'enter'
      ? Math.ceil(enterProgress * word.length)
      : word.length
    const displayWord = word.slice(0, typedChars)

    // Save state
    const isSaving = phase === 'hold' && holdProgress >= 0.2 && holdProgress < 0.7
    const isSaved = phase === 'hold' && holdProgress >= 0.7
    const savingProgress = isSaving ? (holdProgress - 0.2) / 0.5 : 0

    // Saving dots (1..3 cycling deterministically by progress)
    const dotCount = isSaving ? Math.floor(savingProgress * 6) % 3 + 1 : 0
    const savingDots = '.'.repeat(dotCount)

    // Subtle flash on word text when saving
    const saveFlashAlpha = isSaving
      ? 0.15 + Math.abs(Math.sin(savingProgress * Math.PI * 4)) * 0.15
      : 0

    // Spinner: 0..360 over saving phase
    const spinAngle = isSaving ? savingProgress * 360 * 2 : 0

    // Flash overlay — brief bright pulse on save completion
    const savedFlash = isSaved && holdProgress < 0.8
      ? (holdProgress - 0.7) / 0.1
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Main word */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Google Sans', Georgia, serif",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 600,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: saveFlashAlpha > 0
              ? `0 0 20px rgba(100,180,255,${saveFlashAlpha})`
              : isSaved
              ? `0 0 15px rgba(100,220,100,${(holdProgress - 0.7) / 0.3})`
              : undefined,
          }}
        >
          {displayWord}
          {/* Cursor */}
          {(phase === 'enter' || (phase === 'hold' && holdProgress < 0.2)) && (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: '0.85em',
                background: '#4285F4',
                marginLeft: 3,
                verticalAlign: 'text-bottom',
                opacity: phase === 'enter' ? 1 : (Math.floor(holdProgress * 8) % 2 === 0 ? 1 : 0),
              }}
            />
          )}
        </div>

        {/* Save status indicator */}
        {(isSaving || isSaved) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 20,
              padding: '4px 12px',
              border: `1px solid ${isSaved ? 'rgba(100,220,100,0.3)' : 'rgba(66,133,244,0.3)'}`,
            }}
          >
            {isSaving && (
              <div
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(66,133,244,0.3)',
                  borderTopColor: '#4285F4',
                  borderRadius: '50%',
                  transform: `rotate(${spinAngle}deg)`,
                }}
              />
            )}
            {isSaved && (
              <div style={{ color: '#34A853', fontSize: 12, fontWeight: 700 }}>✓</div>
            )}
            <div
              style={{
                fontFamily: "'Google Sans', Arial, sans-serif",
                fontSize: 13,
                color: isSaved ? '#34A853' : 'rgba(66,133,244,0.9)',
                fontWeight: 500,
              }}
            >
              {isSaved ? 'Saved' : `Saving${savingDots}`}
            </div>
          </div>
        )}

        {/* Save completion flash overlay */}
        {savedFlash > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: -20,
              background: `rgba(100,220,100,${savedFlash * 0.15})`,
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function AutoSaveFlashComponent(props: MotionGraphicProps<AutoSaveFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-auto-save-flash',
  title: 'Kinetic Auto Save Flash',
  description: 'Document auto-save effect: text types in, "Saving..." indicator with spinner appears, then "Saved" confirmation with green checkmark flash',
  tags: ['kinetic', 'typography', 'glitch', 'auto-save', 'google-docs', 'document', 'productivity', 'cultural'],
  category: 'captions',
  component: AutoSaveFlashComponent as any,
  defaultConfig: {
    words: ['DRAFT', 'IDEAS', 'NOTES', 'DONE'],
    colors: ['#e8eaed', '#e8eaed', '#e8eaed', '#e8eaed'],
    bgColor: '#1c1c1f',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAFT', 'IDEAS', 'NOTES', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8eaed', '#e8eaed', '#e8eaed', '#e8eaed'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1c1f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1, max: 6, group: 'Timing' },
  ],
})
