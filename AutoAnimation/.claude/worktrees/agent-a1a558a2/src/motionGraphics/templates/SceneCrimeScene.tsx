import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCrimeSceneConfig {
  caseNumber: string
  evidenceTitle: string
  evidenceDescription: string
  location: string
  dateFound: string
  classification: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneCrimeSceneComponent({ config, progress, frame }: MotionGraphicProps<SceneCrimeSceneConfig>) {
  const { caseNumber, evidenceTitle, evidenceDescription, location, dateFound, classification, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Crime tape animation
  const tapeOffset = -(f * 0.5) % 200

  // Camera flash on enter
  const flashOpacity = enterProgress > 0.15 && enterProgress < 0.25 ? 0.15 : 0

  // Evidence tag swing
  const tagSwing = Math.sin(f * 0.06) * 3

  const cardEnter = easeOutCubic(enterProgress)
  const detailEnter1 = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const detailEnter2 = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const detailEnter3 = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Camera flash */}
      <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: flashOpacity }} />

      {/* Crime tape top */}
      <div
        style={{
          position: 'absolute',
          top: '3%',
          left: 0,
          right: 0,
          height: 'clamp(18px, 4vw, 28px)',
          background: `repeating-linear-gradient(90deg, #DDC800 0px, #DDC800 80px, #111 80px, #111 100px)`,
          backgroundPosition: `${tapeOffset}px 0`,
          transform: 'rotate(-2deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: cardEnter * 0.8,
          overflow: 'hidden',
        }}
      >
        <span style={{ fontFamily: "Impact, sans-serif", fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#111', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 900 }}>
          CRIME SCENE DO NOT CROSS &nbsp;&nbsp; CRIME SCENE DO NOT CROSS &nbsp;&nbsp; CRIME SCENE DO NOT CROSS
        </span>
      </div>

      {/* Crime tape bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '3%',
          left: 0,
          right: 0,
          height: 'clamp(18px, 4vw, 28px)',
          background: `repeating-linear-gradient(90deg, #DDC800 0px, #DDC800 80px, #111 80px, #111 100px)`,
          backgroundPosition: `${-tapeOffset}px 0`,
          transform: 'rotate(1.5deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: cardEnter * 0.8,
          overflow: 'hidden',
        }}
      >
        <span style={{ fontFamily: "Impact, sans-serif", fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#111', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 900 }}>
          CRIME SCENE DO NOT CROSS &nbsp;&nbsp; CRIME SCENE DO NOT CROSS &nbsp;&nbsp; CRIME SCENE DO NOT CROSS
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10%',
          opacity: exitOpacity,
        }}
      >
        {/* Evidence card */}
        <div
          style={{
            width: 'clamp(270px, 72vw, 440px)',
            background: 'rgba(15, 12, 10, 0.9)',
            borderRadius: 'clamp(4px, 1vw, 8px)',
            border: '1px solid rgba(200, 180, 0, 0.15)',
            padding: 'clamp(20px, 5vw, 36px)',
            opacity: cardEnter,
            position: 'relative',
          }}
        >
          {/* Evidence tag */}
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: 20,
              background: accentColor,
              color: '#111',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.5vw, 11px)',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transform: `rotate(${tagSwing}deg)`,
              transformOrigin: 'top center',
            }}
          >
            Evidence
          </div>

          {/* Case number */}
          <div
            style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              color: `${textColor}55`,
              letterSpacing: '0.1em',
              marginBottom: 'clamp(10px, 2.5vw, 18px)',
              opacity: detailEnter1,
            }}
          >
            CASE #{caseNumber}
          </div>

          {/* Evidence title */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(18px, 4vw, 28px)',
              fontWeight: 800,
              color: textColor,
              marginBottom: 'clamp(6px, 1.5vw, 10px)',
              opacity: detailEnter1,
              transform: `translateX(${(1 - detailEnter1) * -20}px)`,
            }}
          >
            {evidenceTitle}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.2vw, 16px)',
              color: `${textColor}88`,
              lineHeight: 1.6,
              marginBottom: 'clamp(14px, 3.5vw, 24px)',
              opacity: detailEnter2,
              transform: `translateY(${(1 - detailEnter2) * 10}px)`,
            }}
          >
            {evidenceDescription}
          </div>

          {/* Details grid */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'clamp(6px, 1.5vw, 12px)',
              borderTop: `1px solid ${textColor}11`,
              paddingTop: 'clamp(10px, 2.5vw, 16px)',
              opacity: detailEnter3,
            }}
          >
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Location</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 600, color: textColor }}>{location}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Date</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 600, color: textColor }}>{dateFound}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Class</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 700, color: accentColor }}>{classification}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-crime-scene',
  title: 'Crime Scene Evidence',
  description: 'Crime scene evidence card with animated police tape, camera flash, evidence tag, case details and classification',
  tags: ['scene', 'horror', 'crime', 'evidence', 'mystery', 'investigation', 'dark', 'forensic'],
  category: 'scene-layout',
  component: SceneCrimeSceneComponent as any,
  defaultConfig: {
    caseNumber: 'JD-2024-0847',
    evidenceTitle: 'Unknown Substance',
    evidenceDescription: 'A dark viscous substance found near the basement entrance. Does not match any known chemical compound in our database.',
    location: 'Riverside Dr. #13',
    dateFound: 'Oct 31, 2024',
    classification: 'CLASSIFIED',
    bgColor: '#080808',
    textColor: '#d8d0c8',
    accentColor: '#DDC800',
  },
  configSchema: [
    { key: 'caseNumber', label: 'Case Number', type: 'text', defaultValue: 'JD-2024-0847', group: 'Content' },
    { key: 'evidenceTitle', label: 'Evidence Title', type: 'text', defaultValue: 'Unknown Substance', group: 'Content' },
    { key: 'evidenceDescription', label: 'Description', type: 'text', defaultValue: 'A dark viscous substance found near the basement entrance...', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Riverside Dr. #13', group: 'Content' },
    { key: 'dateFound', label: 'Date Found', type: 'text', defaultValue: 'Oct 31, 2024', group: 'Content' },
    { key: 'classification', label: 'Classification', type: 'text', defaultValue: 'CLASSIFIED', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d8d0c8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#DDC800', group: 'Style' },
  ],
})
