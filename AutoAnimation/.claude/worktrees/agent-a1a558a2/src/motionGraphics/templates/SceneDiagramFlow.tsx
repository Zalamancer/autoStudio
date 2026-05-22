import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiagramFlowConfig {
  steps: string[]
  boxColor: string
  arrowColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneDiagramFlowComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<DiagramFlowConfig>) {
  const { steps, boxColor, arrowColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  const count = steps.length

  // Sequential reveal: each box + arrow takes a slice of 0-0.6
  const revealDuration = 0.6
  const slicePerStep = revealDuration / count

  const getBoxProgress = (index: number): number => {
    const start = index * slicePerStep
    const end = start + slicePerStep * 0.5
    return easeOutBack(Math.max(0, Math.min(1, (progress - start) / (end - start))))
  }

  const getArrowProgress = (index: number): number => {
    // Arrow draws after the box appears
    const start = index * slicePerStep + slicePerStep * 0.4
    const end = start + slicePerStep * 0.5
    return easeOutCubic(Math.max(0, Math.min(1, (progress - start) / (end - start))))
  }

  // Hold: flowing dash animation on arrows (0.6-0.85)
  const holdProgress = progress >= 0.6 && progress < 0.85 ? (progress - 0.6) / 0.25 : 0
  const dashOffset = holdProgress * 200

  // Exit: boxes fade out in reverse order (0.85-1.0)
  const exitDuration = 0.15
  const exitStart = 0.85
  const getExitProgress = (index: number): number => {
    const reverseIndex = count - 1 - index
    const start = exitStart + (reverseIndex / count) * exitDuration
    const end = start + exitDuration / count
    return easeOutCubic(Math.max(0, Math.min(1, (progress - start) / (end - start))))
  }

  // Calculate layout
  const boxWidth = 100 / (count * 2 - 1) // boxes + gaps for arrows
  const isVertical = count > 4

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontWeight: 700,
          color: `${textColor}60`,
          textTransform: 'uppercase',
          letterSpacing: 4,
          marginBottom: '5%',
          opacity: easeOutCubic(Math.min(1, progress / 0.1)),
        }}
      >
        Process Flow
      </div>

      {/* Flow diagram - horizontal layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          width: '90%',
          maxWidth: 900,
        }}
      >
        {steps.map((step, i) => {
          const boxProg = getBoxProgress(i)
          const exitProg = getExitProgress(i)
          const boxOpacity = boxProg * (1 - exitProg)
          const boxScale = 0.7 + boxProg * 0.3
          const isLast = i === count - 1

          return (
            <React.Fragment key={i}>
              {/* Box */}
              <div
                style={{
                  flex: isVertical ? 'none' : 1,
                  padding: isVertical
                    ? 'clamp(10px, 2vw, 18px) clamp(16px, 4vw, 32px)'
                    : 'clamp(14px, 3vw, 28px) clamp(8px, 2vw, 16px)',
                  background: `${boxColor}18`,
                  border: `2px solid ${boxColor}`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: boxOpacity,
                  transform: `scale(${boxScale})`,
                  boxShadow: `0 0 20px ${boxColor}20`,
                  minWidth: isVertical ? '60%' : 'auto',
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    fontSize: 'clamp(10px, 1.5vw, 14px)',
                    fontWeight: 800,
                    color: boxColor,
                    marginRight: 'clamp(6px, 1vw, 10px)',
                    opacity: 0.6,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 2.2vw, 20px)',
                    fontWeight: 600,
                    color: textColor,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step}
                </div>
              </div>

              {/* Arrow between boxes */}
              {!isLast && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: isVertical ? 'column' : 'row',
                    padding: isVertical ? '4px 0' : '0 4px',
                    minWidth: isVertical ? 'auto' : 'clamp(30px, 5vw, 60px)',
                    minHeight: isVertical ? 'clamp(20px, 3vw, 36px)' : 'auto',
                  }}
                >
                  {/* Arrow line */}
                  <div
                    style={
                      isVertical
                        ? {
                            width: 2,
                            height: `${getArrowProgress(i) * 100}%`,
                            background: arrowColor,
                            borderRadius: 1,
                          }
                        : {
                            height: 2,
                            width: `${getArrowProgress(i) * 100}%`,
                            background: arrowColor,
                            borderRadius: 1,
                            backgroundImage: holdProgress > 0
                              ? `repeating-linear-gradient(90deg, ${arrowColor} 0px, ${arrowColor} 6px, transparent 6px, transparent 12px)`
                              : 'none',
                            backgroundSize: '12px 2px',
                            backgroundPosition: `${-dashOffset}px 0`,
                          }
                    }
                  />
                  {/* Arrow head */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      opacity: getArrowProgress(i),
                      ...(isVertical
                        ? {
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: `8px solid ${arrowColor}`,
                          }
                        : {
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            borderLeft: `8px solid ${arrowColor}`,
                          }),
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-diagram-flow',
  title: 'Diagram Flow',
  description:
    'Sequential flow diagram with boxes and animated arrows, flowing dash effect, and reverse-order fade exit',
  tags: ['scene', 'educational', 'diagram', 'flow', 'process', 'flowchart'],
  category: 'scene-layout',
  component: SceneDiagramFlowComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'steps', label: 'Steps', type: 'text-array', defaultValue: ['Input', 'Process', 'Output', 'Result'], group: 'Content' },
    { key: 'boxColor', label: 'Box Color', type: 'color', defaultValue: '#4A90D9', group: 'Style' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#4A90D9', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    steps: ['Input', 'Process', 'Output', 'Result'],
    boxColor: '#4A90D9',
    arrowColor: '#4A90D9',
    bgColor: '#0F0F1A',
    textColor: '#E8E8E8',
  },
})
