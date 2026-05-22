import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicroscopeSlideConfig {
  specimenName: string
  magnification: string
  stainType: string
  observation: string
  cellCount: string
  classification: string
  bgColor: string
  textColor: string
  lensColor: string
  specimenColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneMicroscopeSlideComponent({ config, frame, durationInFrames }: MotionGraphicProps<MicroscopeSlideConfig>) {
  const { specimenName, magnification, stainType, observation, cellCount, classification, bgColor, textColor, lensColor, specimenColor } = config
  const progress = frame / durationInFrames

  // Lens circle zooms in (0-0.2)
  const lensScale = easeOutCubic(Math.min(1, progress / 0.2))

  // Cell structures appear inside lens (0.1-0.3)
  const cellAppear = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.2)))

  // Specimen name (0.2-0.32)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.12)))

  // Magnification badge (0.25-0.35)
  const magPop = easeOutBack(Math.max(0, Math.min(1, (progress - 0.25) / 0.1)))

  // Data rows (0.32-0.55)
  const stainFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.32) / 0.1)))
  const cellFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.38) / 0.1)))
  const classFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.44) / 0.1)))
  const obsFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) / 0.12)))

  // Cells drift during hold (0.4-0.8)
  const driftTime = progress * 2

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  // Generate cell structures
  const cells = Array.from({ length: 12 }, (_, i) => ({
    x: 50 + ((i * 47 - 30) % 30) - 15,
    y: 28 + ((i * 31 - 20) % 24) - 12,
    size: 8 + ((i * 19) % 12),
    nucleusOffset: ((i * 7) % 5) - 2,
  }))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000000',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
      }}
    >
      {/* Microscope circular viewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          clipPath: `circle(${lensScale * 42}% at 50% 35%)`,
        }}
      >
        {/* Cell structures */}
        {cells.map((cell, i) => {
          const dx = Math.sin(driftTime + i * 0.8) * 1.5
          const dy = Math.cos(driftTime * 0.7 + i) * 1
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${cell.x + dx}%`,
                top: `${cell.y + dy}%`,
                width: cell.size,
                height: cell.size,
                borderRadius: '50%',
                border: `1px solid ${specimenColor}50`,
                background: `radial-gradient(circle at ${50 + cell.nucleusOffset}% ${50 + cell.nucleusOffset}%, ${specimenColor}40, ${specimenColor}15, transparent)`,
                opacity: cellAppear,
                transform: `scale(${cellAppear})`,
              }}
            >
              {/* Nucleus */}
              <div
                style={{
                  position: 'absolute',
                  left: `${40 + cell.nucleusOffset}%`,
                  top: `${40 + cell.nucleusOffset}%`,
                  width: '35%',
                  height: '35%',
                  borderRadius: '50%',
                  background: `${specimenColor}80`,
                }}
              />
            </div>
          )
        })}

        {/* Crosshair reticle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            bottom: '50%',
            width: 1,
            background: `${lensColor}15`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '35%',
            right: '35%',
            height: 1,
            background: `${lensColor}15`,
          }}
        />
      </div>

      {/* Lens ring border */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '35%',
          width: `${lensScale * 84}%`,
          height: `${lensScale * 84}%`,
          maxWidth: `${lensScale * 84}%`,
          maxHeight: `${lensScale * 84}%`,
          borderRadius: '50%',
          border: `2px solid ${lensColor}30`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `inset 0 0 40px rgba(0,0,0,0.4), 0 0 20px ${lensColor}10`,
          pointerEvents: 'none',
        }}
      />

      {/* Magnification badge */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '8%',
          fontSize: 'clamp(11px, 2.2vw, 18px)',
          fontWeight: 800,
          color: lensColor,
          background: `${lensColor}15`,
          padding: '4px 12px',
          borderRadius: 8,
          border: `1px solid ${lensColor}30`,
          opacity: magPop,
          transform: `scale(${magPop})`,
        }}
      >
        {magnification}
      </div>

      {/* Info panel - bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: `translateX(-50%) scale(${1 - exitProg * 0.1})`,
          width: '82%',
          maxWidth: 480,
        }}
      >
        {/* Specimen name */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 38px)',
            fontWeight: 800,
            color: specimenColor,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: nameFade,
            transform: `translateX(${(1 - nameFade) * 30}px)`,
          }}
        >
          {specimenName}
        </div>

        <div
          style={{
            fontSize: 'clamp(10px, 2vw, 15px)',
            color: `${textColor}60`,
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: classFade,
          }}
        >
          {classification}
        </div>

        <div style={{ width: `${nameFade * 40}%`, height: 1, background: `${specimenColor}30`, marginBottom: 'clamp(8px, 2vw, 16px)' }} />

        {/* Stain + cell count row */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 24px)', marginBottom: 'clamp(8px, 2vw, 14px)' }}>
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 18px)',
              color: `${textColor}80`,
              opacity: stainFade,
            }}
          >
            <span style={{ color: specimenColor, fontWeight: 700, marginRight: 6 }}>STAIN</span>
            {stainType}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 18px)',
              color: `${textColor}80`,
              opacity: cellFade,
            }}
          >
            <span style={{ color: specimenColor, fontWeight: 700, marginRight: 6 }}>COUNT</span>
            {cellCount}
          </div>
        </div>

        {/* Observation */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}AA`,
            lineHeight: 1.5,
            fontStyle: 'italic',
            borderLeft: `3px solid ${specimenColor}40`,
            paddingLeft: 'clamp(8px, 2vw, 14px)',
            opacity: obsFade,
            transform: `translateY(${(1 - obsFade) * 10}px)`,
          }}
        >
          {observation}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-microscope-slide',
  title: 'Microscope Slide',
  description: 'Microscope slide observation card with circular viewport, drifting cells, crosshair reticle, and specimen data panel',
  tags: ['scene', 'science', 'microscope', 'biology', 'cell', 'slide', 'educational'],
  category: 'scene-layout',
  component: SceneMicroscopeSlideComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'specimenName', label: 'Specimen Name', type: 'text', defaultValue: 'Paramecium', group: 'Content' },
    { key: 'magnification', label: 'Magnification', type: 'text', defaultValue: '400x', group: 'Content' },
    { key: 'stainType', label: 'Stain Type', type: 'text', defaultValue: 'Methylene Blue', group: 'Content' },
    { key: 'observation', label: 'Observation', type: 'text', defaultValue: 'Ciliated protozoan showing active movement and visible contractile vacuole', group: 'Content' },
    { key: 'cellCount', label: 'Cell Count', type: 'text', defaultValue: '~24 per field', group: 'Content' },
    { key: 'classification', label: 'Classification', type: 'text', defaultValue: 'Protista / Ciliophora', group: 'Content' },
    { key: 'lensColor', label: 'Lens Color', type: 'color', defaultValue: '#64D8FF', group: 'Style' },
    { key: 'specimenColor', label: 'Specimen Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1520', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    specimenName: 'Paramecium',
    magnification: '400x',
    stainType: 'Methylene Blue',
    observation: 'Ciliated protozoan showing active movement and visible contractile vacuole',
    cellCount: '~24 per field',
    classification: 'Protista / Ciliophora',
    lensColor: '#64D8FF',
    specimenColor: '#A78BFA',
    bgColor: '#0e1520',
    textColor: '#E8E8E8',
  },
})
