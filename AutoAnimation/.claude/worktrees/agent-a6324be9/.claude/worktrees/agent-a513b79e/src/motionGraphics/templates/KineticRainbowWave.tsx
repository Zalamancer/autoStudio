import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RainbowWaveConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    let masterOpacity = 1
    let desaturation = 0

    if (phase === 'exit') {
      desaturation = exitProgress
      masterOpacity = 1 - exitProgress * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 0,
          opacity: masterOpacity,
          whiteSpace: 'nowrap',
        }}
      >
        {letters.map((letter, i) => {
          const baseHue = (i / totalLetters) * 360
          const hueShift = phase === 'hold' ? holdProgress * 360 : phase === 'enter' ? enterProgress * 180 : 0
          const hue = (baseHue + hueShift) % 360
          const saturation = 100 - desaturation * 80
          const lightness = 60

          let letterOpacity = 1
          let scale = 1
          if (phase === 'enter') {
            const delay = i / totalLetters
            const adjusted = Math.max(0, (enterProgress - delay * 0.5) / (1 - delay * 0.5))
            letterOpacity = Math.min(1, adjusted * 2)
            scale = 0.3 + adjusted * 0.7
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: 'clamp(40px, 10vw, 140px)',
                fontWeight: 900,
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                opacity: letterOpacity,
                transform: `scale(${scale})`,
                textShadow: `0 0 20px hsla(${hue}, 100%, 50%, 0.4)`,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function RainbowWaveComponent(props: MotionGraphicProps<RainbowWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rainbow-wave',
  title: 'Kinetic Rainbow Wave',
  description: 'Each letter cycles through rainbow hues that shift and rotate over time, desaturating to gray on exit',
  tags: ['kinetic', 'typography', 'rainbow', 'colorful', 'gradient', 'hue'],
  category: 'captions',
  component: RainbowWaveComponent as any,
  defaultConfig: {
    words: ['RAINBOW', 'WAVE', 'COLOR', 'FLOW'],
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00'],
    bgColor: '#111111',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAINBOW', 'WAVE', 'COLOR', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
