import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JPEGArtifactConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Map 0..1 progress to eased value (ease-out cubic) */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // DCT block grid in the background — mosaic of subtle 8x8 blocks
    const blockSize = 16
    const cols = Math.ceil(width / blockSize)
    const rows = Math.ceil(height / blockSize)
    const blocks: { x: number; y: number; color: string }[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = r * 200 + c + Math.floor(time * 3) * 37
        if (rand(s) < 0.08) {
          const hue = 180 + rand(s + 1) * 40
          const sat = 40 + rand(s + 2) * 30
          const lit = 10 + rand(s + 3) * 15
          blocks.push({
            x: c * blockSize,
            y: r * blockSize,
            color: `hsla(${hue}, ${sat}%, ${lit}%, ${0.15 + rand(s + 4) * 0.2})`,
          })
        }
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {blocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              width: blockSize,
              height: blockSize,
              background: b.color,
            }}
          />
        ))}
        {/* JPEG quality indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255, 170, 50, 0.15)',
            letterSpacing: 1,
          }}
        >
          JPEG Q={Math.floor(15 + ((Math.floor(time * 2) % 8) / 8) * 75)}
        </div>
        {/* Chroma subsampling artifact band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${50 + Math.sin(time * 0.4) * 5}%`,
            height: 1,
            background: 'rgba(255, 140, 20, 0.05)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 181 + 73

    if (phase === 'enter') {
      // Mosaic of 8x8 DCT blocks slowly clean up to reveal sharp text
      // Simulate by stacking progressively cleaner text layers
      const blockCleanProgress = easeOut(enterProgress)
      const numLayers = 5
      const layers = Array.from({ length: numLayers }, (_, li) => {
        const layerThreshold = li / (numLayers - 1)
        const layerOpacity = Math.max(0, Math.min(1, (blockCleanProgress - layerThreshold) * numLayers))
        const blurPx = Math.max(0, (1 - blockCleanProgress) * (numLayers - li) * 4)
        const blockShift = li < numLayers - 1
          ? Math.sin(seed + li * 7.3) * (1 - blockCleanProgress) * 8
          : 0
        const colorDistort = li < numLayers - 1
          ? li % 2 === 0 ? '#FF4400' : '#0066FF'
          : color

        return (
          <div
            key={li}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${blockShift}px), -50%)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 13vw, 170px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              color: colorDistort,
              opacity: li === numLayers - 1 ? blockCleanProgress : layerOpacity * 0.3,
              filter: `blur(${blurPx}px)`,
              mixBlendMode: li < numLayers - 1 ? 'screen' : 'normal',
            }}
          >
            {word}
          </div>
        )
      })

      return <div style={{ position: 'absolute', inset: 0 }}>{layers}</div>
    } else if (phase === 'hold') {
      // Clean text with occasional block artifact bursts
      const burst1 = holdProgress > 0.3 && holdProgress < 0.36
      const burst2 = holdProgress > 0.68 && holdProgress < 0.73
      const isBursting = burst1 || burst2
      const shiftX = isBursting ? (rand(seed + Math.floor(holdProgress * 30)) - 0.5) * 10 : 0
      const chromaR = isBursting ? 2 : 0
      const chromaB = isBursting ? -2 : 0

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {isBursting && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${shiftX + chromaR}px), -50%)`,
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(42px, 13vw, 170px)',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  letterSpacing: 2,
                  color: '#FF0000',
                  opacity: 0.4,
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${shiftX + chromaB}px), -50%)`,
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(42px, 13vw, 170px)',
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  letterSpacing: 2,
                  color: '#0000FF',
                  opacity: 0.4,
                  mixBlendMode: 'screen',
                }}
              >
                {word}
              </div>
            </>
          )}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${shiftX}px), -50%)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 13vw, 170px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              color,
              textShadow: isBursting
                ? `0 0 12px ${color}80`
                : `0 0 8px ${color}30`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: text re-blocks into JPEG artifacts and fades
      const blockProgress = exitProgress
      const blurPx = blockProgress * 6
      const shiftX = Math.sin(f * 0.3 + seed) * blockProgress * 6

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shiftX}px), -50%)`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 13vw, 170px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            color,
            opacity: 1 - blockProgress * 0.9,
            filter: `blur(${blurPx}px)`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function JPEGArtifactComponent(props: MotionGraphicProps<JPEGArtifactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jpeg-artifact',
  title: 'Kinetic JPEG Artifact',
  description:
    'JPEG compression DCT block artifacts that progressively clean up to reveal sharp text. Chroma subsampling distortion, mosaic block effects.',
  tags: ['kinetic', 'typography', 'glitch', 'jpeg', 'artifact', 'compression', 'digital', 'corruption'],
  category: 'captions',
  component: JPEGArtifactComponent as any,
  defaultConfig: {
    words: ['COMPRESS', 'ARTIFACT', 'LOSSY', 'DECODE'],
    colors: ['#FFB020', '#FF6020', '#FFD060', '#FF8040'],
    bgColor: '#060606',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COMPRESS', 'ARTIFACT', 'LOSSY', 'DECODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB020', '#FF6020', '#FFD060', '#FF8040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
