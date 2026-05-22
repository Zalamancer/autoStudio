import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMixingDeskConfig {
  channelName1: string
  channelName2: string
  channelName3: string
  channelName4: string
  masterLabel: string
  bgColor: string
  consoleColor: string
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

function SceneMixingDeskComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneMixingDeskConfig>) {
  const { channelName1, channelName2, channelName3, channelName4, masterLabel, bgColor, consoleColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const consoleScale = easeOutBack(Math.min(1, enterProgress / 0.6))
  const consoleOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const channels = [
    { name: channelName1, color: '#4FC3F7' },
    { name: channelName2, color: '#66BB6A' },
    { name: channelName3, color: '#FFA726' },
    { name: channelName4, color: '#AB47BC' },
  ]

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 80

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 70%, ${accentColor}06 0%, transparent 60%)` }} />

      <div style={{
        width: 'clamp(300px, 75vw, 500px)',
        background: consoleColor,
        borderRadius: 'clamp(12px, 2.5vw, 18px)',
        padding: 'clamp(16px, 3vw, 28px)',
        transform: `scale(${consoleScale}) translateY(${exitY}px)`,
        opacity: consoleOpacity * exitOpacity,
        boxShadow: '0 16px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: `1px solid rgba(255,255,255,0.06)`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 'clamp(12px, 2.5vw, 20px)',
          opacity: easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4))),
        }}>
          <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            MIXING DESK
          </div>
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}40` }}>
            {masterLabel}
          </div>
        </div>

        {/* Channel strips */}
        <div style={{ display: 'flex', gap: 'clamp(6px, 1.2vw, 10px)' }}>
          {channels.map((ch, i) => {
            const chOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - i * 0.1) / 0.4)))
            const faderPos = 0.3 + 0.4 * Math.sin(time * 1.2 + i * 1.5) + 0.1 * Math.cos(time * 2.5 + i)
            const level = 0.2 + 0.6 * Math.abs(Math.sin(time * 3.5 + i * 0.8))
            const knobAngle = 30 + Math.sin(time * 0.8 + i * 1.2) * 120
            const muted = false
            const solo = i === 1

            return (
              <div key={i} style={{
                flex: 1, background: `${textColor}04`, borderRadius: 8,
                padding: 'clamp(8px, 1.5vw, 14px) clamp(4px, 0.8vw, 8px)',
                opacity: chOp, transform: `translateY(${(1 - chOp) * 20}px)`,
              }}>
                {/* Channel name */}
                <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 600, color: ch.color, textAlign: 'center', marginBottom: 'clamp(6px, 1.2vw, 10px)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {ch.name}
                </div>

                {/* EQ knob */}
                <div style={{ margin: '0 auto', width: 'clamp(20px, 4vw, 28px)', height: 'clamp(20px, 4vw, 28px)', borderRadius: '50%', background: '#222', marginBottom: 'clamp(6px, 1.2vw, 10px)', position: 'relative', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
                  <div style={{ position: 'absolute', top: '15%', left: '50%', width: 2, height: '35%', background: '#fff', borderRadius: 1, transform: `translateX(-50%) rotate(${knobAngle}deg)`, transformOrigin: 'bottom center' }} />
                </div>

                {/* Level meter */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, height: 'clamp(50px, 10vw, 80px)', marginBottom: 'clamp(6px, 1.2vw, 10px)' }}>
                  {[0, 1].map((bar) => (
                    <div key={bar} style={{ width: 'clamp(4px, 0.8vw, 6px)', height: '100%', background: `${textColor}08`, borderRadius: 2, display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
                      <div style={{
                        width: '100%', height: `${(level + (bar * 0.05 - 0.025)) * 100}%`,
                        background: `linear-gradient(to top, ${ch.color} 0%, ${ch.color}CC 60%, #FF4444 90%)`,
                        borderRadius: 2,
                      }} />
                    </div>
                  ))}
                </div>

                {/* Fader track */}
                <div style={{ position: 'relative', height: 'clamp(60px, 12vw, 90px)', marginBottom: 'clamp(6px, 1.2vw, 10px)' }}>
                  <div style={{ position: 'absolute', left: '50%', top: 0, width: 3, height: '100%', background: '#222', borderRadius: 2, transform: 'translateX(-50%)' }} />
                  {/* Fader handle */}
                  <div style={{
                    position: 'absolute', left: '50%', top: `${faderPos * 80}%`,
                    width: 'clamp(18px, 3.5vw, 26px)', height: 8,
                    background: 'linear-gradient(180deg, #666, #444)',
                    borderRadius: 3, transform: 'translate(-50%, -50%)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 10, height: 1, background: 'rgba(255,255,255,0.3)', transform: 'translate(-50%, -50%)' }} />
                  </div>
                </div>

                {/* Mute/Solo buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                  <div style={{
                    width: 'clamp(18px, 3.5vw, 24px)', height: 'clamp(12px, 2.2vw, 16px)',
                    borderRadius: 3, background: muted ? '#EF4444' : `${textColor}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(6px, 1vw, 8px)', fontWeight: 800, color: muted ? '#fff' : `${textColor}40`,
                  }}>
                    M
                  </div>
                  <div style={{
                    width: 'clamp(18px, 3.5vw, 24px)', height: 'clamp(12px, 2.2vw, 16px)',
                    borderRadius: 3, background: solo ? '#FBBF24' : `${textColor}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(6px, 1vw, 8px)', fontWeight: 800, color: solo ? '#000' : `${textColor}40`,
                  }}>
                    S
                  </div>
                </div>
              </div>
            )
          })}

          {/* Master channel */}
          <div style={{
            flex: 1.2, background: `${accentColor}08`, borderRadius: 8,
            padding: 'clamp(8px, 1.5vw, 14px) clamp(4px, 0.8vw, 8px)',
            border: `1px solid ${accentColor}20`,
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.35))),
          }}>
            <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 700, color: accentColor, textAlign: 'center', marginBottom: 'clamp(6px, 1.2vw, 10px)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              MASTER
            </div>

            {/* Master level meter */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, height: 'clamp(120px, 24vw, 180px)', marginBottom: 'clamp(8px, 1.5vw, 12px)' }}>
              {[0, 1].map((bar) => {
                const masterLevel = 0.4 + 0.35 * Math.abs(Math.sin(time * 2.5 + bar * 0.3))
                return (
                  <div key={bar} style={{ width: 'clamp(6px, 1.2vw, 10px)', height: '100%', background: `${textColor}08`, borderRadius: 2, display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
                    <div style={{
                      width: '100%', height: `${masterLevel * 100}%`,
                      background: `linear-gradient(to top, ${accentColor} 0%, ${accentColor}CC 50%, #FF4444 85%, #FF0000 100%)`,
                      borderRadius: 2,
                    }} />
                  </div>
                )
              })}
            </div>

            {/* Master dB readout */}
            <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: accentColor, textAlign: 'center', fontFamily: "'Courier New', monospace" }}>
              -3.2 dB
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mixing-desk',
  title: 'Scene Mixing Desk',
  description: 'Mixing desk channel strip display with faders, EQ knobs, level meters, mute/solo buttons, and master channel. Studio console aesthetic.',
  tags: ['scene', 'music', 'mixer', 'desk', 'console', 'studio', 'fader', 'production', 'festival'],
  category: 'scene-layout',
  component: SceneMixingDeskComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    channelName1: 'Kick',
    channelName2: 'Bass',
    channelName3: 'Synth',
    channelName4: 'Vocal',
    masterLabel: 'STUDIO A',
    bgColor: '#080808',
    consoleColor: '#1A1A1A',
    accentColor: '#4FC3F7',
    textColor: '#E0E0E0',
  },
  configSchema: [
    { key: 'channelName1', label: 'Channel 1', type: 'text', defaultValue: 'Kick', group: 'Channels' },
    { key: 'channelName2', label: 'Channel 2', type: 'text', defaultValue: 'Bass', group: 'Channels' },
    { key: 'channelName3', label: 'Channel 3', type: 'text', defaultValue: 'Synth', group: 'Channels' },
    { key: 'channelName4', label: 'Channel 4', type: 'text', defaultValue: 'Vocal', group: 'Channels' },
    { key: 'masterLabel', label: 'Master Label', type: 'text', defaultValue: 'STUDIO A', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'consoleColor', label: 'Console Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#4FC3F7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0E0E0', group: 'Style' },
  ],
})
