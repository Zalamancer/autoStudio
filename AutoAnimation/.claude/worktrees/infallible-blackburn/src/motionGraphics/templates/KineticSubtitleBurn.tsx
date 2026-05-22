import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubtitleBurnConfig extends KineticBaseConfig {
  barOpacity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Simulated "movie scene" behind the subtitle — dark cinematic gradient
    const ambientShift = Math.sin(time * 0.3) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cinematic scene simulation — blurred dark landscape */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg,
              hsl(${220 + ambientShift}, 15%, 12%) 0%,
              hsl(${225 + ambientShift}, 18%, 18%) 40%,
              hsl(${215 + ambientShift}, 12%, 22%) 60%,
              hsl(${210 + ambientShift}, 10%, 15%) 100%)`,
          }}
        />
        {/* Slight film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Translucent subtitle bar at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '10%',
            height: '16%',
            background: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none',
          }}
        />
        {/* Letterbox bars — top and bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '5%',
            background: '#000000',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '5%',
            background: '#000000',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      // Subtitle lag: slight delay before appearing, then pop in
      if (enterProgress < 0.3) {
        opacity = 0
      } else {
        const adjustedP = (enterProgress - 0.3) / 0.7
        opacity = Math.min(1, adjustedP * 2.5)
        // Slight upward slide mimicking real subtitle render lag
        translateY = (1 - adjustedP) * 6
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
    } else {
      // Pop out — subtitles disappear abruptly
      if (exitProgress < 0.7) {
        opacity = 1
      } else {
        opacity = 1 - ((exitProgress - 0.7) / 0.3)
      }
    }

    // Character-by-character reveal during enter for that "burned-in" timing feel
    const totalChars = word.length
    const charsVisible = phase === 'enter'
      ? Math.ceil(enterProgress * totalChars * 1.2)
      : totalChars

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '50%',
          transform: `translate(-50%, ${translateY}px)`,
          opacity,
          display: 'flex',
          gap: 0,
        }}
      >
        {word.split('').map((char, ci) => {
          const charOpacity = ci < charsVisible ? 1 : 0
          return (
            <span
              key={ci}
              style={{
                fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(28px, 7vw, 90px)',
                fontWeight: 700,
                color,
                textShadow: '1px 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5)',
                whiteSpace: 'pre',
                opacity: charOpacity,
                display: 'inline-block',
              }}
            >
              {char}
            </span>
          )
        })}
      </div>
    )
  },
}

function SubtitleBurnComponent(props: MotionGraphicProps<SubtitleBurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subtitle-burn',
  title: 'Kinetic Subtitle Burn',
  description: 'Burned-in subtitle style with yellow text on translucent bar, slight lag timing, letterbox bars, and character-by-character reveal',
  tags: ['kinetic', 'typography', 'subtitle', 'burn', 'cinema', 'film', 'caption', 'letterbox'],
  category: 'captions',
  component: SubtitleBurnComponent as any,
  defaultConfig: {
    words: ['I know.', 'Run.', 'Trust me.', 'Now.'],
    colors: ['#FFE040', '#FFE040', '#FFE040', '#FFE040'],
    bgColor: '#0a0a12',
    cycleDuration: 1.3,
    barOpacity: 55,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['I know.', 'Run.', 'Trust me.', 'Now.'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE040', '#FFE040', '#FFE040', '#FFE040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'barOpacity', label: 'Bar Opacity (%)', type: 'number', defaultValue: 55, min: 0, max: 100, group: 'Animation' },
  ],
})
