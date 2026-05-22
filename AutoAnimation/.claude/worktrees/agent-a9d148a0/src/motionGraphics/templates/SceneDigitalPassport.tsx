import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDigitalPassportConfig {
  displayName: string
  citizenId: string
  clearanceLevel: string
  biometricHash: string
  issueDate: string
  expiryDate: string
  jurisdiction: string
  verificationStatus: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneDigitalPassportComponent({ config, progress }: MotionGraphicProps<SceneDigitalPassportConfig>) {
  const { displayName, citizenId, clearanceLevel, biometricHash, issueDate, expiryDate, jurisdiction, verificationStatus, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 60
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.35))

  const frame = Math.floor(progress * 300)
  const isVerified = verificationStatus === 'VERIFIED'

  // Scan line for verification
  const scanY = progress >= 0.2 && progress < 0.8
    ? ((holdProgress * 150) % 120) - 10
    : -10

  // Clearance level colors
  const clearColors: Record<string, string> = {
    'ALPHA': '#FFD700',
    'BETA': '#FF00FF',
    'GAMMA': '#00FFFF',
    'DELTA': '#00FF88',
    'OMEGA': '#FF4444',
  }
  const clearColor = clearColors[clearanceLevel] || accentColor

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Holographic pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 20px, ${accentColor}02 20px, ${accentColor}02 21px),
          repeating-linear-gradient(-45deg, transparent, transparent 20px, ${accentColor}02 20px, ${accentColor}02 21px)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 78vw, 480px)',
          background: 'linear-gradient(145deg, rgba(10,12,30,0.97), rgba(5,6,18,0.99))',
          border: `1px solid ${accentColor}25`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}10, inset 0 1px 0 ${accentColor}15`,
        }}>
          {/* Verification scan line */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${scanY}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}25, transparent)`,
            pointerEvents: 'none',
          }} />

          {/* Top: DIGITAL PASSPORT header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            paddingBottom: 'clamp(8px, 1.5vw, 12px)',
            borderBottom: `1px solid ${accentColor}15`,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(10px, 2vw, 14px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 4,
              textShadow: `0 0 8px ${accentColor}30`,
            }}>
              DIGITAL PASSPORT
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: isVerified ? '#00FF88' : '#FF4444',
              background: isVerified ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${isVerified ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,68,0.25)'}`,
              letterSpacing: 1,
            }}>
              {verificationStatus}
            </div>
          </div>

          {/* Photo placeholder + Name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 20px)',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            {/* Biometric scan placeholder */}
            <div style={{
              width: 'clamp(48px, 12vw, 72px)',
              height: 'clamp(58px, 14vw, 86px)',
              borderRadius: 'clamp(4px, 1vw, 8px)',
              border: `1px solid ${accentColor}30`,
              background: `linear-gradient(145deg, ${accentColor}10, ${accentColor}05)`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Face silhouette */}
              <div style={{
                width: 'clamp(20px, 5vw, 30px)',
                height: 'clamp(20px, 5vw, 30px)',
                borderRadius: '50%',
                border: `1px solid ${accentColor}30`,
                marginBottom: 'clamp(2px, 0.5vw, 4px)',
              }} />
              {/* Scan overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.03) 3px, rgba(0,255,255,0.03) 4px)',
                pointerEvents: 'none',
              }} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(16px, 4vw, 26px)',
                fontWeight: 700,
                color: textColor,
                letterSpacing: 2,
                lineHeight: 1.1,
              }}>
                {displayName}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(9px, 1.6vw, 11px)',
                color: `${textColor}50`,
                letterSpacing: 1,
                marginTop: 4,
              }}>
                ID: {citizenId}
              </div>
              <div style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(8px, 1.4vw, 10px)',
                color: clearColor,
                background: `${clearColor}10`,
                padding: '2px 8px',
                borderRadius: 3,
                border: `1px solid ${clearColor}25`,
                letterSpacing: 2,
                marginTop: 4,
              }}>
                {clearanceLevel}
              </div>
            </div>
          </div>

          {/* Biometric hash */}
          <div style={{
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1vw, 8px)', color: `${textColor}30`, letterSpacing: 2, marginBottom: 2 }}>
              BIOMETRIC HASH
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.3vw, 10px)',
              color: `${textColor}50`,
              letterSpacing: 1,
              wordBreak: 'break-all',
            }}>
              {biometricHash}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)`, marginBottom: 'clamp(10px, 2vw, 14px)' }} />

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {[
              { label: 'ISSUED', value: issueDate },
              { label: 'EXPIRES', value: expiryDate },
              { label: 'JURISDICTION', value: jurisdiction },
              { label: 'PROTOCOL', value: 'DID v3.0' },
            ].map((item, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.45 - i * 0.06) / 0.4))
              return (
                <div key={i} style={{
                  background: `${accentColor}05`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}08`,
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 8}px)`,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: `${textColor}30`, letterSpacing: 1, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: textColor }}>
                    {item.value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom holographic strip */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accentColor}, #FF00FF, #B400FF, ${accentColor})`,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)) * 0.4,
          }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-digital-passport',
  title: 'Digital Identity Passport',
  description: 'Digital identity passport card with biometric hash, clearance level, holographic strip, and verification scan',
  tags: ['scene', 'digital', 'passport', 'identity', 'biometric', 'cyberpunk', 'futuristic', 'id'],
  category: 'scene-layout',
  component: SceneDigitalPassportComponent as any,
  defaultConfig: {
    displayName: 'ECHO TANAKA',
    citizenId: 'CZN-7749-X',
    clearanceLevel: 'GAMMA',
    biometricHash: 'bx7f...9a2c4e8d1b0f',
    issueDate: '2049.03.15',
    expiryDate: '2054.03.15',
    jurisdiction: 'SECTOR-12',
    verificationStatus: 'VERIFIED',
    bgColor: '#060810',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'displayName', label: 'Display Name', type: 'text', defaultValue: 'ECHO TANAKA', group: 'Content' },
    { key: 'citizenId', label: 'Citizen ID', type: 'text', defaultValue: 'CZN-7749-X', group: 'Content' },
    { key: 'clearanceLevel', label: 'Clearance', type: 'text', defaultValue: 'GAMMA', group: 'Content' },
    { key: 'biometricHash', label: 'Biometric Hash', type: 'text', defaultValue: 'bx7f...9a2c4e8d1b0f', group: 'Content' },
    { key: 'issueDate', label: 'Issue Date', type: 'text', defaultValue: '2049.03.15', group: 'Content' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'text', defaultValue: '2054.03.15', group: 'Content' },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', defaultValue: 'SECTOR-12', group: 'Content' },
    { key: 'verificationStatus', label: 'Verification', type: 'text', defaultValue: 'VERIFIED', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
