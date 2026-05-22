import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTunerDisplayConfig {
  noteName: string
  frequency: string
  centsOff: number
  stringNumber: number
  instrument: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTunerDisplayComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneTunerDisplayConfig>) {
  const { noteName, frequency, centsOff, stringNumber, instrument, bgColor, cardColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Note reveal
  const noteOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))
  const noteScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // Needle wobble during hold, settling toward center
  const needleOffset = centsOff * (1 - holdProgress * 0.7) + Math.sin(time * 6) * 3 * (1 - holdProgress * 0.8)
  const inTune = Math.abs(needleOffset) < 5
  const tuneColor = inTune ? '#22C55E' : Math.abs(needleOffset) < 15 ? '#FBBF24' : '#EF4444'

  // Meter marks
  const meterOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Info
  const infoOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${tuneColor}08 0%, transparent 50%)` }} />

      <div style={{
        width: 'clamp(280px, 68vw, 440px)',
        background: cardColor,
        borderRadius: 'clamp(16px, 3vw, 24px)',
        padding: 'clamp(24px, 5vw, 40px)',
        transform: `scale(${cardScale * exitScale})`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4)`,
        textAlign: 'center',
      }}>
        {/* Instrument label */}
        <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', fontWeight: 600, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'clamp(4px, 0.8vw, 6px)', opacity: infoOp }}>
          {instrument} TUNER
        </div>

        {/* String indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 10px)', marginBottom: 'clamp(14px, 3vw, 24px)', opacity: meterOp }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} style={{
              width: 'clamp(28px, 5vw, 38px)', height: 'clamp(28px, 5vw, 38px)',
              borderRadius: '50%',
              background: s === stringNumber ? accentColor : `${textColor}08`,
              border: `2px solid ${s === stringNumber ? accentColor : `${textColor}15`}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700,
              color: s === stringNumber ? '#fff' : `${textColor}40`,
            }}>
              {s}
            </div>
          ))}
        </div>

        {/* Big note name */}
        <div style={{
          fontSize: 'clamp(56px, 14vw, 100px)', fontWeight: 900, color: tuneColor,
          lineHeight: 0.9, opacity: noteOp, transform: `scale(${noteScale})`,
          marginBottom: 'clamp(4px, 0.8vw, 8px)',
          textShadow: `0 0 30px ${tuneColor}30`,
        }}>
          {noteName}
        </div>

        {/* Frequency */}
        <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 500, color: `${textColor}60`, fontFamily: "'Courier New', monospace", marginBottom: 'clamp(16px, 3vw, 28px)', opacity: noteOp }}>
          {frequency} Hz
        </div>

        {/* Tuning meter */}
        <div style={{ position: 'relative', height: 'clamp(40px, 8vw, 60px)', marginBottom: 'clamp(10px, 2vw, 18px)', opacity: meterOp }}>
          {/* Meter background */}
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: 4, background: `${textColor}10`, borderRadius: 2, transform: 'translateY(-50%)' }} />

          {/* Center mark */}
          <div style={{ position: 'absolute', top: '25%', left: '50%', width: 3, height: '50%', background: '#22C55E', transform: 'translateX(-50%)', borderRadius: 2 }} />

          {/* Tick marks */}
          {Array.from({ length: 21 }).map((_, i) => {
            const pos = 10 + (i / 20) * 80
            const isMajor = i % 5 === 0
            return (
              <div key={i} style={{
                position: 'absolute', top: isMajor ? '30%' : '38%', left: `${pos}%`,
                width: 1, height: isMajor ? '40%' : '24%',
                background: `${textColor}${isMajor ? '30' : '15'}`, transform: 'translateX(-50%)',
              }} />
            )
          })}

          {/* Needle */}
          <div style={{
            position: 'absolute', top: '20%', left: `${50 + needleOffset * 0.8}%`,
            width: 4, height: '60%', background: tuneColor, borderRadius: 2,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 10px ${tuneColor}60`,
          }} />

          {/* Flat/Sharp labels */}
          <div style={{ position: 'absolute', bottom: 0, left: '10%', fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 600, color: `${textColor}40` }}>
            {'\u266D'}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: '10%', fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 600, color: `${textColor}40` }}>
            {'\u266F'}
          </div>
        </div>

        {/* In tune indicator */}
        <div style={{
          display: 'inline-block',
          background: `${tuneColor}15`, borderRadius: 'clamp(6px, 1.2vw, 10px)',
          padding: 'clamp(4px, 0.8vw, 6px) clamp(14px, 2.5vw, 22px)',
          fontSize: 'clamp(11px, 2vw, 15px)', fontWeight: 700, color: tuneColor,
          opacity: infoOp,
        }}>
          {inTune ? 'IN TUNE' : Math.abs(needleOffset) < 15 ? 'CLOSE' : needleOffset > 0 ? 'SHARP' : 'FLAT'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tuner-display',
  title: 'Scene Tuner Display',
  description: 'Guitar tuner frequency display with wobbling needle, note name, string selector, flat/sharp meter, and in-tune indicator.',
  tags: ['scene', 'music', 'tuner', 'guitar', 'frequency', 'instrument', 'pitch', 'festival'],
  category: 'scene-layout',
  component: SceneTunerDisplayComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    noteName: 'A',
    frequency: '440.0',
    centsOff: 12,
    stringNumber: 5,
    instrument: 'Guitar',
    bgColor: '#080C08',
    cardColor: '#141A14',
    accentColor: '#22C55E',
    textColor: '#E8F0E8',
  },
  configSchema: [
    { key: 'noteName', label: 'Note', type: 'text', defaultValue: 'A', group: 'Content' },
    { key: 'frequency', label: 'Frequency (Hz)', type: 'text', defaultValue: '440.0', group: 'Content' },
    { key: 'centsOff', label: 'Cents Off', type: 'number', defaultValue: 12, min: -50, max: 50, group: 'Content' },
    { key: 'stringNumber', label: 'String #', type: 'number', defaultValue: 5, min: 1, max: 6, group: 'Content' },
    { key: 'instrument', label: 'Instrument', type: 'text', defaultValue: 'Guitar', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C08', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#141A14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#22C55E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F0E8', group: 'Style' },
  ],
})
