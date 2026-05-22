import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubtitleDeSyncConfig extends KineticBaseConfig {
  earlyOffset: number
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Cinematic video player background with letterbox bars
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Simulate a dark film scene */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #0a0a12 0%, #12121e 40%, #0d0d18 100%)',
          }}
        />
        {/* Subtle film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(80,80,120,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(60,60,100,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Cinematic letterbox bars */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: '#000000',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: '#000000',
          }}
        />
        {/* Subtitle track indicator */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            fontFamily: "'Arial', sans-serif",
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          SUB: English
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 23
    // Desync timing: text arrives early then snaps to sync at holdProgress ~0.3
    // The "desync" is represented by the text being offset from a ghost "audio" marker

    let yOffset = 0
    let opacity = 0
    let xOffset = 0
    let isDesynced = false
    let snapScale = 1

    if (phase === 'enter') {
      // Text arrives too early — slides in immediately
      opacity = enterProgress > 0.2 ? 1 : enterProgress / 0.2
      // Slightly offset to show it's early/wrong position
      yOffset = (1 - enterProgress) * -8
      isDesynced = true
    } else if (phase === 'hold') {
      opacity = 1
      if (holdProgress < 0.3) {
        // Still desynced — subtle uncomfortable wobble
        isDesynced = true
        yOffset = Math.sin(holdProgress * 25 + seed) * 3
        xOffset = Math.sin(holdProgress * 18 + seed * 0.7) * 2
      } else if (holdProgress < 0.38) {
        // SNAP to sync — quick scale punch
        isDesynced = false
        const snapProgress = (holdProgress - 0.3) / 0.08
        snapScale = 1 + Math.sin(snapProgress * Math.PI) * 0.06
        yOffset = (1 - snapProgress) * yOffset
      } else {
        // Properly synced — stable
        isDesynced = false
        yOffset = 0
        xOffset = 0
      }
    } else {
      opacity = 1 - exitProgress
      yOffset = exitProgress * 6
    }

    // Desync color: slightly off-white with blue tint when desynced
    const textColor = isDesynced ? '#a8c4ff' : color

    // Subtitle box background
    const boxBg = isDesynced
      ? 'rgba(30, 50, 120, 0.55)'
      : 'rgba(0, 0, 0, 0.6)'

    // Audio waveform ghost bar (the "where the text should be")
    const waveBarVisible = phase === 'hold' && holdProgress < 0.4

    return (
      <>
        {/* Ghost "audio sync" marker — shows where text SHOULD appear */}
        {waveBarVisible && (
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${Math.min(80, word.length * 14)}%`,
              height: 2,
              background: holdProgress < 0.3
                ? 'rgba(255, 100, 100, 0.6)'
                : 'rgba(100, 255, 100, 0.6)',
              borderRadius: 1,
              transition: 'none',
            }}
          />
        )}
        {/* Main subtitle text */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: `translate(-50%, calc(${yOffset}px + ${xOffset}px * 0)) scale(${snapScale})`,
            opacity,
            display: 'inline-block',
          }}
        >
          <div
            style={{
              background: boxBg,
              padding: '6px 20px 8px',
              borderRadius: 4,
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontSize: 'clamp(24px, 6vw, 80px)',
              fontWeight: 600,
              color: textColor,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              textShadow: isDesynced
                ? '1px 1px 3px rgba(0,0,100,0.8), 0 0 10px rgba(100,150,255,0.4)'
                : '1px 1px 3px rgba(0,0,0,0.9)',
              outline: isDesynced ? '1px solid rgba(100,150,255,0.3)' : 'none',
              transition: 'none',
            }}
          >
            {word}
          </div>
        </div>
        {/* Sync confirmation flash */}
        {phase === 'hold' && holdProgress >= 0.3 && holdProgress < 0.42 && (
          <div
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Arial', sans-serif",
              fontSize: 9,
              color: 'rgba(100,255,100,0.7)',
              letterSpacing: 2,
              opacity: 1 - (holdProgress - 0.3) / 0.12,
            }}
          >
            SYNCED
          </div>
        )}
      </>
    )
  },
}

function SubtitleDeSyncComponent(props: MotionGraphicProps<SubtitleDeSyncConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subtitle-desync',
  title: 'Kinetic Subtitle DeSync',
  description: 'Subtitle desync effect: text appears too early in a blue-tinted box, wobbles, then snaps to sync with a visible correction flash',
  tags: ['kinetic', 'typography', 'glitch', 'subtitle', 'desync', 'film', 'streaming', 'cultural'],
  category: 'captions',
  component: SubtitleDeSyncComponent as any,
  defaultConfig: {
    words: ['WAIT', 'TOO EARLY', 'WRONG', 'SNAP'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#080810',
    cycleDuration: 2.0,
    earlyOffset: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAIT', 'TOO EARLY', 'WRONG', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
    { key: 'earlyOffset', label: 'Desync Offset (px)', type: 'number', defaultValue: 8, min: 2, max: 30, group: 'Animation' },
  ],
})
