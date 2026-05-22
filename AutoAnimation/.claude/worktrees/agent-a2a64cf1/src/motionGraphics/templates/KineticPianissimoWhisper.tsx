import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Visual Music 4/4 — Pianissimo Whisper
// pp dynamic: text is barely visible, soft and fragile, drifting gently

interface PianissimoWhisperConfig extends KineticBaseConfig {
  whisperOpacity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Extremely subtle center glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 25% at 50% 50%, rgba(200,220,255,0.04) 0%, transparent 100%)`,
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      // Very gentle, slow fade in from tiny
      opacity = Math.min(0.75, enterProgress * 0.75)
      scale = 0.55 + enterProgress * 0.2
      blur = (1 - enterProgress) * 6
    } else if (phase === 'hold') {
      // pp: tiny scale, low opacity, floats like a whisper
      opacity = 0.65 + Math.sin(holdProgress * Math.PI * 2) * 0.12
      scale = 0.72 + Math.sin(holdProgress * Math.PI * 1.5) * 0.04
      translateY = Math.sin(holdProgress * Math.PI * 3) * 6
      blur = Math.sin(holdProgress * Math.PI * 2.5) * 0.8
    } else {
      opacity = 0.65 * (1 - exitProgress)
      scale = 0.72 - exitProgress * 0.2
      blur = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 300, // thin weight for fragility
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Garamond', 'Georgia', 'Times New Roman', serif",
          fontStyle: 'italic',
          textTransform: 'lowercase',
          letterSpacing: '0.2em',
          filter: `blur(${blur}px)`,
          textShadow: `0 0 30px ${color}30`,
        }}
      >
        {word}
      </div>
    )
  },
}

function PianissimoWhisperComponent(props: MotionGraphicProps<PianissimoWhisperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pianissimo-whisper',
  title: 'Kinetic Pianissimo Whisper',
  description:
    'pp (pianissimo) dynamic: text is barely there — tiny scale, low opacity, soft blur, gentle drift. Like a musical whisper barely heard.',
  tags: ['kinetic', 'visual-music', 'pianissimo', 'whisper', 'soft', 'gentle', 'dynamics', 'music'],
  category: 'captions',
  component: PianissimoWhisperComponent as any,
  defaultConfig: {
    words: ['soft', 'still', 'quiet'],
    colors: ['#B8C8E8', '#9AB0D0', '#7A98B8'],
    bgColor: '#020508',
    cycleDuration: 2.5,
    whisperOpacity: 0.65,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['soft', 'still', 'quiet'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8C8E8', '#9AB0D0', '#7A98B8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020508', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.0, max: 8, group: 'Timing' },
    { key: 'whisperOpacity', label: 'Whisper Opacity', type: 'number', defaultValue: 0.65, min: 0.2, max: 0.9, group: 'Animation' },
  ],
})
