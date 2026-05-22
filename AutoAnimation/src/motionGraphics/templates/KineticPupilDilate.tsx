import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PupilDilateConfig extends KineticBaseConfig {
  irisColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Eye white / sclera background
    const eyeW = Math.min(width * 0.9, height * 0.55)
    const eyeH = eyeW * 0.45
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Eye shape outline */}
        <div
          style={{
            width: eyeW,
            height: eyeH,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.07)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__pupilDilateConfig ?? { irisColor: '#4a7fa5' }
    const irisColor = config.irisColor ?? '#4a7fa5'

    // Pupil dilation: pinpoint (2%) to full (70% of eye height area)
    let dilateProgress = 0
    if (phase === 'enter') {
      dilateProgress = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      dilateProgress = 1
    } else {
      dilateProgress = 1 - easeInExpo(exitProgress)
    }

    // Pupil radius as % of viewport min dimension
    const minDim = Math.min(width, height)
    const minPupilR = minDim * 0.015 // pinpoint
    const maxPupilR = minDim * 0.44  // fully dilated — fills most of eye
    const pupilR = minPupilR + (maxPupilR - minPupilR) * dilateProgress
    const pupilD = pupilR * 2

    // Iris ring (slightly larger than pupil)
    const irisR = pupilR * 1.18
    const irisD = irisR * 2

    // Eye white almond shape — we use clip-path: ellipse to trim sides
    const eyeW = Math.min(width * 0.88, height * 0.52)
    const eyeH = eyeW * 0.44
    const eyeClip = `ellipse(${eyeW / 2}px ${eyeH / 2}px at 50% 50%)`

    // Text only visible inside dilated pupil
    const textClip = `circle(${pupilR.toFixed(1)}px at 50% 50%)`

    return (
      <>
        {/* Eye white zone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: eyeClip,
            background: '#f5f0ea',
          }}
        />
        {/* Iris ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: irisD,
            height: irisD,
            borderRadius: '50%',
            background: irisColor,
            clipPath: eyeClip,
          }}
        />
        {/* Pupil (black) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: pupilD,
            height: pupilD,
            borderRadius: '50%',
            background: '#000',
          }}
        />
        {/* Text revealed inside pupil */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(30px, 9vw, 120px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            clipPath: textClip,
          }}
        >
          {word}
        </div>
        {/* Eye lid lines */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={eyeW / 2}
            ry={eyeH / 2}
            fill="none"
            stroke="rgba(80,60,40,0.35)"
            strokeWidth={2}
          />
        </svg>
      </>
    )
  },
}

function PupilDilateComponent(props: MotionGraphicProps<PupilDilateConfig>) {
  ;(globalThis as any).__pupilDilateConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pupil-dilate',
  title: 'Kinetic Pupil Dilate',
  description: 'Eye pupil dilates from a pinpoint to wide open, revealing text through the expanding circular opening',
  tags: ['kinetic', 'typography', 'pupil', 'eye', 'dilate', 'iris', 'reveal', 'mechanical', 'aperture'],
  category: 'captions',
  component: PupilDilateComponent as any,
  defaultConfig: {
    words: ['SEE', 'LOOK', 'WIDE', 'FOCUS'],
    colors: ['#ffffff', '#f0f0f0', '#ffffff', '#e8e8e8'],
    bgColor: '#1a1410',
    cycleDuration: 1.6,
    irisColor: '#5a8fa8',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SEE', 'LOOK', 'WIDE', 'FOCUS'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#ffffff', '#f0f0f0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1410', group: 'Style' },
    { key: 'irisColor', label: 'Iris Color', type: 'color', defaultValue: '#5a8fa8', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
