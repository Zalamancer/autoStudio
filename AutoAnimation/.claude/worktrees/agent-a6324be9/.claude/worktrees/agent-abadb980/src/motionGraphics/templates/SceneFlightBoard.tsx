import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlightBoardConfig {
  destination: string
  flightNumber: string
  gate: string
  time: string
  status: string
  bgColor: string
  textColor: string
  accentColor: string
  statusColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneFlightBoardComponent({ config, progress }: MotionGraphicProps<FlightBoardConfig>) {
  const { destination, flightNumber, gate, time, status, bgColor, textColor, accentColor, statusColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Flip-board character animation
  const getCharRevealProgress = (charIdx: number, totalChars: number, text: string): string => {
    const charDelay = charIdx / Math.max(totalChars, 1)
    const charProg = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.6) / 0.4))
    if (charProg < 1) {
      // Cycling through characters before landing
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const cycleIdx = Math.floor(charProg * 8) % alphabet.length
      return charProg < 0.1 ? ' ' : alphabet[cycleIdx]
    }
    return text[charIdx] || ' '
  }

  // Status blinks during hold
  const statusBlink = progress >= 0.25 && progress < 0.8
    ? (Math.sin(holdProgress * Math.PI * 8) > 0 ? 1 : 0.4)
    : 1

  const rows = [
    { label: 'DESTINATION', value: destination.toUpperCase() },
    { label: 'FLIGHT', value: flightNumber.toUpperCase() },
    { label: 'GATE', value: gate.toUpperCase() },
    { label: 'TIME', value: time },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Courier New', 'Consolas', monospace" }}>
      {/* Scanline effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, ${textColor}06 2px, ${textColor}06 4px)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '6% 8%',
          gap: 'clamp(6px, 1.5vh, 14px)',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.2em',
            marginBottom: 'clamp(6px, 1.5vh, 14px)',
            opacity: enterProgress,
            textTransform: 'uppercase',
          }}
        >
          DEPARTURES
        </div>

        {/* Board rows */}
        {rows.map((row, rowIdx) => {
          const rowDelay = rowIdx * 0.12
          const rowOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - rowDelay) / 0.4)))

          return (
            <div
              key={rowIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 20px)',
                opacity: rowOpacity,
              }}
            >
              {/* Label */}
              <div
                style={{
                  fontSize: 'clamp(9px, 1.4vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}60`,
                  width: 'clamp(70px, 14vw, 110px)',
                  flexShrink: 0,
                  letterSpacing: '0.05em',
                }}
              >
                {row.label}
              </div>

              {/* Flip characters */}
              <div style={{ display: 'flex', gap: 'clamp(1px, 0.3vw, 3px)' }}>
                {row.value.split('').map((_, charIdx) => {
                  const displayChar = getCharRevealProgress(charIdx, row.value.length, row.value)
                  return (
                    <div
                      key={charIdx}
                      style={{
                        width: 'clamp(16px, 3vw, 28px)',
                        height: 'clamp(22px, 4vw, 38px)',
                        background: `${textColor}10`,
                        borderRadius: 'clamp(2px, 0.4vw, 4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(14px, 2.5vw, 24px)',
                        fontWeight: 700,
                        color: textColor,
                        boxShadow: `inset 0 1px 2px ${bgColor}80`,
                      }}
                    >
                      {displayChar}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Status row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 20px)',
            marginTop: 'clamp(6px, 1.2vh, 12px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4))),
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 13px)',
              fontWeight: 600,
              color: `${textColor}60`,
              width: 'clamp(70px, 14vw, 110px)',
              flexShrink: 0,
              letterSpacing: '0.05em',
            }}
          >
            STATUS
          </div>
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              fontWeight: 900,
              color: statusColor,
              letterSpacing: '0.1em',
              opacity: statusBlink,
              textTransform: 'uppercase',
            }}
          >
            {status}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-flight-board',
  title: 'Flight Board',
  description: 'Airport departure board with flip-letter animation, blinking status, and classic airport aesthetic',
  tags: ['scene', 'travel', 'flight', 'airport', 'departure', 'adventure'],
  category: 'scene-layout',
  component: SceneFlightBoardComponent as any,
  defaultConfig: {
    destination: 'TOKYO',
    flightNumber: 'PA 2847',
    gate: 'B12',
    time: '14:35',
    status: 'ON TIME',
    bgColor: '#0a0a0a',
    textColor: '#f0e6d3',
    accentColor: '#f59e0b',
    statusColor: '#22c55e',
  },
  configSchema: [
    { key: 'destination', label: 'Destination', type: 'text', defaultValue: 'TOKYO', group: 'Content' },
    { key: 'flightNumber', label: 'Flight Number', type: 'text', defaultValue: 'PA 2847', group: 'Content' },
    { key: 'gate', label: 'Gate', type: 'text', defaultValue: 'B12', group: 'Content' },
    { key: 'time', label: 'Departure Time', type: 'text', defaultValue: '14:35', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'ON TIME', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0e6d3', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
    { key: 'statusColor', label: 'Status Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
})
