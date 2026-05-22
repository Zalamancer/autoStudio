import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LabResultConfig {
  testName: string
  sampleId: string
  result: string
  unit: string
  referenceRange: string
  status: string
  labName: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneLabResultComponent({ config, frame, durationInFrames }: MotionGraphicProps<LabResultConfig>) {
  const { testName, sampleId, result, unit, referenceRange, status, labName, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  const isNormal = status.toLowerCase() === 'normal'
  const statusColor = isNormal ? '#22C55E' : '#EF4444'

  // Scanning line animation (0-0.2)
  const scanProgress = Math.min(1, progress / 0.2)
  const scanY = scanProgress * 100

  // Header appears (0.1-0.22)
  const headerFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.12)))

  // Test name (0.18-0.3)
  const testFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.18) / 0.12)))

  // Result value counts up (0.25-0.45)
  const resultProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.2))
  const resultFade = easeOutCubic(resultProgress)
  const displayValue = parseFloat(result)
  const countedValue = isNaN(displayValue) ? result : (displayValue * resultProgress).toFixed(result.includes('.') ? result.split('.')[1].length : 0)

  // Reference range (0.4-0.5)
  const refFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) / 0.1)))

  // Status badge pops (0.48-0.6)
  const statusPop = easeOutBack(Math.max(0, Math.min(1, (progress - 0.48) / 0.12)))

  // Bar indicator (0.35-0.55)
  const barFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.35) / 0.2)))

  // Lab name (0.55-0.65)
  const labFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.55) / 0.1)))

  // Hold pulse (0.6-0.8)
  const holdPulse = progress >= 0.6 && progress < 0.8 ? Math.sin(((progress - 0.6) / 0.2) * Math.PI * 4) * 0.3 : 0

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1 - exitProg,
        transform: `scale(${1 - exitProg * 0.15})`,
      }}
    >
      {/* Scanning line */}
      {scanProgress < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        />
      )}

      {/* Background grid dots */}
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 67 + 11) % 90) + 5}%`,
            top: `${((i * 41 + 23) % 90) + 5}%`,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: `${accentColor}10`,
          }}
        />
      ))}

      {/* Main card */}
      <div
        style={{
          width: '82%',
          maxWidth: 480,
          padding: 'clamp(20px, 5vw, 40px)',
          background: `${textColor}06`,
          border: `1px solid ${accentColor}25`,
          borderRadius: 'clamp(10px, 2vw, 16px)',
        }}
      >
        {/* Header with lab name */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: headerFade,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.8vw, 14px)',
              color: `${textColor}50`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Lab Report
          </div>
          <div
            style={{
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              color: `${textColor}40`,
              fontFamily: "'Courier New', monospace",
            }}
          >
            ID: {sampleId}
          </div>
        </div>

        {/* Test name */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 38px)',
            fontWeight: 800,
            color: textColor,
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: testFade,
            transform: `translateY(${(1 - testFade) * 15}px)`,
          }}
        >
          {testName}
        </div>

        {/* Result value */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'clamp(4px, 1vw, 10px)',
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
            opacity: resultFade,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(36px, 10vw, 72px)',
              fontWeight: 900,
              color: accentColor,
              fontVariantNumeric: 'tabular-nums',
              textShadow: holdPulse > 0 ? `0 0 ${holdPulse * 20}px ${accentColor}40` : 'none',
            }}
          >
            {countedValue}
          </span>
          <span
            style={{
              fontSize: 'clamp(14px, 3vw, 24px)',
              fontWeight: 600,
              color: `${textColor}70`,
            }}
          >
            {unit}
          </span>
        </div>

        {/* Visual bar indicator */}
        <div
          style={{
            width: '100%',
            height: 'clamp(6px, 1.2vw, 10px)',
            background: `${textColor}10`,
            borderRadius: 20,
            marginBottom: 'clamp(8px, 2vw, 16px)',
            overflow: 'hidden',
            opacity: barFade,
          }}
        >
          <div
            style={{
              width: `${barFade * 65}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${accentColor}, ${statusColor})`,
              borderRadius: 20,
              boxShadow: `0 0 8px ${statusColor}40`,
            }}
          />
        </div>

        {/* Reference range + status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(12px, 3vw, 24px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 18px)',
              color: `${textColor}60`,
              opacity: refFade,
            }}
          >
            Ref: {referenceRange} {unit}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 800,
              color: statusColor,
              background: `${statusColor}18`,
              padding: '3px 12px',
              borderRadius: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: statusPop,
              transform: `scale(${statusPop})`,
            }}
          >
            {status}
          </div>
        </div>

        {/* Lab name footer */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            color: `${textColor}30`,
            textAlign: 'right',
            opacity: labFade,
          }}
        >
          {labName}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lab-result',
  title: 'Lab Result',
  description: 'Laboratory test result card with scanning animation, counting value, status badge, bar indicator, and reference range',
  tags: ['scene', 'science', 'lab', 'medical', 'test', 'result', 'data'],
  category: 'scene-layout',
  component: SceneLabResultComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'testName', label: 'Test Name', type: 'text', defaultValue: 'Blood Glucose', group: 'Content' },
    { key: 'sampleId', label: 'Sample ID', type: 'text', defaultValue: 'SMP-2847', group: 'Content' },
    { key: 'result', label: 'Result', type: 'text', defaultValue: '95.4', group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: 'mg/dL', group: 'Content' },
    { key: 'referenceRange', label: 'Reference Range', type: 'text', defaultValue: '70-100', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'Normal', group: 'Content' },
    { key: 'labName', label: 'Lab Name', type: 'text', defaultValue: 'Central Diagnostics Lab', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#64D8FF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    testName: 'Blood Glucose',
    sampleId: 'SMP-2847',
    result: '95.4',
    unit: 'mg/dL',
    referenceRange: '70-100',
    status: 'Normal',
    labName: 'Central Diagnostics Lab',
    accentColor: '#64D8FF',
    bgColor: '#0a0e17',
    textColor: '#E8E8E8',
  },
})
