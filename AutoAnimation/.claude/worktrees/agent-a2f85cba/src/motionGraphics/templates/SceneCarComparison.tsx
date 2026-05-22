import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCarComparisonConfig {
  car1Name: string
  car2Name: string
  spec1Label: string
  spec1Car1: string
  spec1Car2: string
  spec2Label: string
  spec2Car1: string
  spec2Car2: string
  spec3Label: string
  spec3Car1: string
  spec3Car2: string
  spec4Label: string
  spec4Car1: string
  spec4Car2: string
  bgColor: string
  color1: string
  color2: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCarComparisonComponent({ config, progress }: MotionGraphicProps<SceneCarComparisonConfig>) {
  const { car1Name, car2Name, spec1Label, spec1Car1, spec1Car2, spec2Label, spec2Car1, spec2Car2, spec3Label, spec3Car1, spec3Car2, spec4Label, spec4Car1, spec4Car2, bgColor, color1, color2, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const vsEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))

  const specs = [
    { label: spec1Label, v1: spec1Car1, v2: spec1Car2 },
    { label: spec2Label, v1: spec2Car1, v2: spec2Car2 },
    { label: spec3Label, v1: spec3Car1, v2: spec3Car2 },
    { label: spec4Label, v1: spec4Car1, v2: spec4Car2 },
  ]

  // VS pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const vsPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.08 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Split background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: `${color1}06` }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', background: `${color2}06` }} />

      {/* Center divider */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 2,
          height: `${enterProgress * 100}%`,
          background: `linear-gradient(180deg, transparent, ${textColor}15, transparent)`,
          transform: 'translateX(-50%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(14px, 3.5vw, 36px) clamp(16px, 4vw, 40px)',
          opacity: exitOpacity,
        }}
      >
        {/* Car names header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(10px, 2vw, 20px)',
            marginBottom: 'clamp(16px, 3.5vw, 32px)',
          }}
        >
          {/* Car 1 */}
          <div
            style={{
              flex: 1,
              textAlign: 'right',
              fontSize: 'clamp(14px, 3vw, 26px)',
              fontWeight: 900,
              color: color1,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              opacity: headerEnter,
              transform: `translateX(${(1 - headerEnter) * -30}px)`,
            }}
          >
            {car1Name}
          </div>

          {/* VS badge */}
          <div
            style={{
              width: 'clamp(32px, 6vw, 50px)',
              height: 'clamp(32px, 6vw, 50px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color1}30, ${color2}30)`,
              border: `2px solid ${textColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 900,
              color: textColor,
              letterSpacing: '0.05em',
              opacity: vsEnter,
              transform: `scale(${vsEnter * vsPulse})`,
              flexShrink: 0,
            }}
          >
            VS
          </div>

          {/* Car 2 */}
          <div
            style={{
              flex: 1,
              textAlign: 'left',
              fontSize: 'clamp(14px, 3vw, 26px)',
              fontWeight: 900,
              color: color2,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              opacity: headerEnter,
              transform: `translateX(${(1 - headerEnter) * 30}px)`,
            }}
          >
            {car2Name}
          </div>
        </div>

        {/* Spec comparison rows */}
        {specs.map((spec, i) => {
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - i * 0.08) / 0.45)))
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 'clamp(6px, 1.2vw, 12px)',
                opacity: rowEnter,
                transform: `translateY(${(1 - rowEnter) * 12}px)`,
              }}
            >
              {/* Car 1 value */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'right',
                  fontSize: 'clamp(13px, 2.2vw, 20px)',
                  fontWeight: 800,
                  color: textColor,
                  fontVariantNumeric: 'tabular-nums',
                  paddingRight: 'clamp(8px, 1.5vw, 14px)',
                }}
              >
                {spec.v1}
              </div>

              {/* Label center */}
              <div
                style={{
                  width: 'clamp(70px, 14vw, 110px)',
                  textAlign: 'center',
                  fontSize: 'clamp(8px, 1.2vw, 11px)',
                  fontWeight: 700,
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: 'clamp(6px, 1vw, 10px) 0',
                  background: `${textColor}05`,
                  borderRadius: 'clamp(4px, 0.6vw, 6px)',
                  flexShrink: 0,
                }}
              >
                {spec.label}
              </div>

              {/* Car 2 value */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'left',
                  fontSize: 'clamp(13px, 2.2vw, 20px)',
                  fontWeight: 800,
                  color: textColor,
                  fontVariantNumeric: 'tabular-nums',
                  paddingLeft: 'clamp(8px, 1.5vw, 14px)',
                }}
              >
                {spec.v2}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-car-comparison',
  title: 'Car Comparison',
  description: 'Side-by-side car comparison with VS badge, split color background, and staggered spec rows. VS badge pulses during hold.',
  tags: ['scene', 'car', 'comparison', 'versus', 'specs', 'auto', 'motorsport'],
  category: 'scene-layout',
  component: SceneCarComparisonComponent as any,
  defaultConfig: {
    car1Name: 'BMW M3',
    car2Name: 'AUDI RS5',
    spec1Label: 'HP',
    spec1Car1: '473',
    spec1Car2: '444',
    spec2Label: '0-60',
    spec2Car1: '3.8s',
    spec2Car2: '3.9s',
    spec3Label: 'TORQUE',
    spec3Car1: '406 lb-ft',
    spec3Car2: '442 lb-ft',
    spec4Label: 'PRICE',
    spec4Car1: '$75,900',
    spec4Car2: '$76,400',
    bgColor: '#0a0a14',
    color1: '#1c69d4',
    color2: '#ff3333',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'car1Name', label: 'Car 1 Name', type: 'text', defaultValue: 'BMW M3', group: 'Cars' },
    { key: 'car2Name', label: 'Car 2 Name', type: 'text', defaultValue: 'AUDI RS5', group: 'Cars' },
    { key: 'spec1Label', label: 'Spec 1 Label', type: 'text', defaultValue: 'HP', group: 'Specs' },
    { key: 'spec1Car1', label: 'Spec 1 Car 1', type: 'text', defaultValue: '473', group: 'Specs' },
    { key: 'spec1Car2', label: 'Spec 1 Car 2', type: 'text', defaultValue: '444', group: 'Specs' },
    { key: 'spec2Label', label: 'Spec 2 Label', type: 'text', defaultValue: '0-60', group: 'Specs' },
    { key: 'spec2Car1', label: 'Spec 2 Car 1', type: 'text', defaultValue: '3.8s', group: 'Specs' },
    { key: 'spec2Car2', label: 'Spec 2 Car 2', type: 'text', defaultValue: '3.9s', group: 'Specs' },
    { key: 'spec3Label', label: 'Spec 3 Label', type: 'text', defaultValue: 'TORQUE', group: 'Specs' },
    { key: 'spec3Car1', label: 'Spec 3 Car 1', type: 'text', defaultValue: '406 lb-ft', group: 'Specs' },
    { key: 'spec3Car2', label: 'Spec 3 Car 2', type: 'text', defaultValue: '442 lb-ft', group: 'Specs' },
    { key: 'spec4Label', label: 'Spec 4 Label', type: 'text', defaultValue: 'PRICE', group: 'Specs' },
    { key: 'spec4Car1', label: 'Spec 4 Car 1', type: 'text', defaultValue: '$75,900', group: 'Specs' },
    { key: 'spec4Car2', label: 'Spec 4 Car 2', type: 'text', defaultValue: '$76,400', group: 'Specs' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'color1', label: 'Car 1 Color', type: 'color', defaultValue: '#1c69d4', group: 'Style' },
    { key: 'color2', label: 'Car 2 Color', type: 'color', defaultValue: '#ff3333', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
