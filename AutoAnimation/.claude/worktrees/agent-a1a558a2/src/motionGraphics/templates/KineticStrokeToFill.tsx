import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StrokeToFillConfig extends KineticBaseConfig {
  strokeWidth: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    // Stroke-to-fill: text starts as pure outline, fill floods in from bottom
    // Implemented using two overlapping text layers:
    // 1. Outline layer (always present)
    // 2. Fill layer with clip-path animating from bottom

    let fillProgress = 0   // 0 = no fill, 1 = fully filled
    let outlineOpacity = 1
    let scale = 1
    let opacity = 1
    let strokeOpacity = 1

    if (phase === 'enter') {
      // Scale pop on entry with fill flooding simultaneously
      scale = easeOutExpo(enterProgress)
      fillProgress = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8))
      opacity = Math.min(1, enterProgress * 5)
    } else if (phase === 'hold') {
      // While filled: subtle "ink pressure" pulse — stroke glows slightly
      fillProgress = 1
      const pulse = Math.sin(holdProgress * Math.PI * 4) * 0.03
      scale = 1 + pulse * 0.5
      // Stroke briefly shows through at stroke edges with shimmer
      strokeOpacity = 1 + Math.abs(pulse) * 3
    } else {
      // Fill drains back out (from top to bottom), then stroke pops out with scale
      fillProgress = 1 - easeInCubic(exitProgress)
      scale = exitProgress > 0.7 ? 1 + (exitProgress - 0.7) * 2 : 1
      opacity = exitProgress > 0.8 ? 1 - (exitProgress - 0.8) / 0.2 : 1
    }

    // Fill clip: reveal from bottom up (percentage of height filled)
    const fillHeight = fillProgress * 100

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}>
        {/* Outline layer — always visible with stroke */}
        <div style={{
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 900,
          color: 'transparent',
          WebkitTextStroke: `2px ${color}`,
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
          lineHeight: 1,
          opacity: strokeOpacity,
          position: 'relative',
          userSelect: 'none',
        }}>
          {word}

          {/* Fill layer — clip-path floods upward from bottom */}
          {fillHeight > 0.5 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              // Clip from bottom: reveal bottom fillHeight% of the text
              clipPath: `inset(${100 - fillHeight}% 0% 0% 0%)`,
            }}>
              <div style={{
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color,
                WebkitTextStroke: '0px transparent',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
                lineHeight: 1,
                // Ink leading edge: brighter at fill boundary
                background: fillProgress < 0.98 && fillProgress > 0.02
                  ? `linear-gradient(180deg, ${color}ff 0%, ${color}cc 80%)`
                  : undefined,
                WebkitBackgroundClip: fillProgress < 0.98 && fillProgress > 0.02 ? 'text' : undefined,
                WebkitTextFillColor: fillProgress < 0.98 && fillProgress > 0.02 ? 'transparent' : color,
                textShadow: `0 0 10px ${color}44`,
              }}>
                {word}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
}

function StrokeToFillComponent(props: MotionGraphicProps<StrokeToFillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stroke-to-fill',
  title: 'Kinetic Stroke to Fill',
  description: 'Text begins as pure hollow outline strokes, then ink floods upward from the baseline filling each character solid — exits as fill drains back revealing the ghost outline',
  tags: ['kinetic', 'typography', 'stroke', 'fill', 'outline', 'morph', 'ink', 'flood', 'reveal', 'transform'],
  category: 'captions',
  component: StrokeToFillComponent as any,
  defaultConfig: {
    words: ['FILL', 'FLOOD', 'INK', 'SOLID'],
    colors: ['#FF6B6B', '#FFA07A', '#FFD700', '#98FB98'],
    bgColor: '#1C1C1C',
    cycleDuration: 1.4,
    strokeWidth: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FILL', 'FLOOD', 'INK', 'SOLID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#FFA07A', '#FFD700', '#98FB98'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'strokeWidth', label: 'Stroke Width (px)', type: 'number', defaultValue: 2, min: 1, max: 6, group: 'Animation' },
  ],
})
