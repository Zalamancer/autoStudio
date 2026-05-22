import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotoExifConfig {
  cameraModel: string
  iso: number
  aperture: string
  shutterSpeed: string
  focalLength: string
  date: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function ScenePhotoExifComponent({ config, progress }: MotionGraphicProps<PhotoExifConfig>) {
  const { cameraModel, iso, aperture, shutterSpeed, focalLength, date, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.6))
  const cardY = (1 - cardEnter) * 100
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const getRowDelay = (idx: number): number => {
    const start = 0.2 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.4)))
  }

  const exifRows = [
    { label: 'ISO', value: String(iso), icon: 'ISO' },
    { label: 'Aperture', value: aperture, icon: 'f/' },
    { label: 'Shutter', value: shutterSpeed, icon: 'S' },
    { label: 'Focal Length', value: focalLength, icon: 'FL' },
  ]

  // ISO counter animation
  const isoCountProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const displayIso = Math.round(isoCountProgress * iso)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '6%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(12px, 2vw, 20px)',
          padding: 'clamp(20px, 4%, 40px)',
          maxWidth: 400,
          width: '100%',
          transform: `translateY(${cardY + exitEased * -60}px)`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          border: `1px solid ${accentColor}20`,
        }}
      >
        {/* Camera icon and model */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {/* Camera icon */}
          <div
            style={{
              width: 'clamp(36px, 6vw, 52px)',
              height: 'clamp(36px, 6vw, 52px)',
              borderRadius: 10,
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '55%',
                height: '40%',
                borderRadius: 4,
                border: '2px solid #FFFFFF',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: '15%',
                  top: '50%',
                  width: '30%',
                  height: '60%',
                  borderRadius: '50%',
                  border: '1.5px solid #FFFFFF',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 800, color: textColor }}>{cameraModel}</div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}70`, fontWeight: 500 }}>{date}</div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `${textColor}15`,
            marginBottom: 'clamp(12px, 2vh, 20px)',
            transform: `scaleX(${easeOutCubic(Math.min(1, enterProgress / 0.4))})`,
            transformOrigin: 'left',
          }}
        />

        {/* EXIF data grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(10px, 1.8vh, 18px)' }}>
          {exifRows.map((row, i) => {
            const rowProg = getRowDelay(i)
            return (
              <div
                key={i}
                style={{
                  opacity: rowProg,
                  transform: `translateY(${(1 - rowProg) * 15}px)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(22px, 3.5vw, 30px)',
                      height: 'clamp(22px, 3.5vw, 30px)',
                      borderRadius: 6,
                      background: `${accentColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Courier New', monospace",
                      fontSize: 'clamp(8px, 1.2vw, 11px)',
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {row.icon}
                  </div>
                  <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}70`, fontWeight: 500 }}>
                    {row.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'clamp(18px, 3.5vw, 28px)',
                    fontWeight: 900,
                    color: textColor,
                    fontFamily: "'Courier New', monospace",
                    paddingLeft: 'clamp(28px, 4.5vw, 36px)',
                  }}
                >
                  {i === 0 ? displayIso : row.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Focal length bar at bottom */}
        <div
          style={{
            marginTop: 'clamp(14px, 2.5vh, 24px)',
            height: 'clamp(4px, 0.6vw, 6px)',
            background: `${textColor}10`,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, isoCountProgress * 65)}%`,
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}80)`,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-photo-exif',
  title: 'Scene Photo EXIF',
  description: 'EXIF data display card showing camera model, ISO, aperture, shutter speed, and focal length with staggered entrance',
  tags: ['scene', 'photography', 'camera', 'exif', 'data', 'technical'],
  category: 'scenes',
  component: ScenePhotoExifComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    cameraModel: 'Canon EOS R5',
    iso: 400,
    aperture: 'f/2.8',
    shutterSpeed: '1/250s',
    focalLength: '85mm',
    date: '2026-03-19',
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#E8593E',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'cameraModel', label: 'Camera Model', type: 'text', defaultValue: 'Canon EOS R5', group: 'Content' },
    { key: 'iso', label: 'ISO', type: 'number', defaultValue: 400, min: 50, max: 102400, group: 'Content' },
    { key: 'aperture', label: 'Aperture', type: 'text', defaultValue: 'f/2.8', group: 'Content' },
    { key: 'shutterSpeed', label: 'Shutter Speed', type: 'text', defaultValue: '1/250s', group: 'Content' },
    { key: 'focalLength', label: 'Focal Length', type: 'text', defaultValue: '85mm', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: '2026-03-19', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E8593E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
