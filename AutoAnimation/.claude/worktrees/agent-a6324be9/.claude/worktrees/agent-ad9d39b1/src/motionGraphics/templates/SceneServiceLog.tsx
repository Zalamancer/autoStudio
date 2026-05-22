import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneServiceLogConfig {
  vehicleName: string
  currentMileage: string
  service1: string
  service1Date: string
  service1Status: string
  service2: string
  service2Date: string
  service2Status: string
  service3: string
  service3Date: string
  service3Status: string
  service4: string
  service4Date: string
  service4Status: string
  bgColor: string
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

function SceneServiceLogComponent({ config, progress }: MotionGraphicProps<SceneServiceLogConfig>) {
  const { vehicleName, currentMileage, service1, service1Date, service1Status, service2, service2Date, service2Status, service3, service3Date, service3Status, service4, service4Date, service4Status, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const lineGrow = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))

  const services = [
    { name: service1, date: service1Date, status: service1Status },
    { name: service2, date: service2Date, status: service2Status },
    { name: service3, date: service3Date, status: service3Status },
    { name: service4, date: service4Date, status: service4Status },
  ]

  const statusColors: Record<string, string> = {
    'Done': '#44cc66',
    'Due Soon': '#ffaa00',
    'Overdue': '#ff4444',
    'Scheduled': '#4488ff',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -15}px)`,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
              Service History
            </div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 32px)', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
              {vehicleName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 600, color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Odometer
            </div>
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 22px)', fontWeight: 800, color: textColor, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
              {currentMileage}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, ${accentColor}50, transparent)`,
            marginBottom: 'clamp(14px, 3vw, 24px)',
            transform: `scaleX(${lineGrow})`,
            transformOrigin: 'left',
          }}
        />

        {/* Timeline with service items */}
        <div style={{ position: 'relative', paddingLeft: 'clamp(20px, 4vw, 36px)' }}>
          {/* Vertical timeline line */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(6px, 1.2vw, 10px)',
              top: 0,
              bottom: 0,
              width: 2,
              background: `${textColor}10`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${lineGrow * 100}%`,
                background: `linear-gradient(180deg, ${accentColor}60, ${accentColor}10)`,
              }}
            />
          </div>

          {services.map((s, i) => {
            const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - i * 0.08) / 0.45)))
            const statusColor = statusColors[s.status] || `${textColor}80`
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 'clamp(10px, 2vw, 18px)',
                  opacity: rowEnter,
                  transform: `translateX(${(1 - rowEnter) * 25}px)`,
                  position: 'relative',
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: `clamp(-16px, -3.2vw, -28px)`,
                    width: 'clamp(8px, 1.4vw, 12px)',
                    height: 'clamp(8px, 1.4vw, 12px)',
                    borderRadius: '50%',
                    background: statusColor,
                    border: `2px solid ${bgColor}`,
                    boxShadow: `0 0 6px ${statusColor}40`,
                  }}
                />

                {/* Service info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1px, 0.2vw, 3px)' }}>
                    <div style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 700, color: textColor }}>
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(8px, 1.1vw, 10px)',
                        fontWeight: 700,
                        color: statusColor,
                        background: `${statusColor}15`,
                        padding: 'clamp(2px, 0.3vw, 3px) clamp(6px, 1vw, 10px)',
                        borderRadius: 100,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {s.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 500, color: `${textColor}50` }}>
                    {s.date}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-service-log',
  title: 'Service Log',
  description: 'Car service/maintenance timeline log with color-coded statuses, odometer reading, and staggered timeline dot reveals.',
  tags: ['scene', 'service', 'maintenance', 'log', 'car', 'auto', 'mechanic'],
  category: 'scene-layout',
  component: SceneServiceLogComponent as any,
  defaultConfig: {
    vehicleName: '2022 Toyota Camry',
    currentMileage: '45,230 mi',
    service1: 'Oil Change',
    service1Date: 'Mar 15, 2024',
    service1Status: 'Done',
    service2: 'Tire Rotation',
    service2Date: 'Apr 20, 2024',
    service2Status: 'Done',
    service3: 'Brake Inspection',
    service3Date: 'Jun 01, 2024',
    service3Status: 'Due Soon',
    service4: 'Air Filter Replace',
    service4Date: 'Aug 15, 2024',
    service4Status: 'Scheduled',
    bgColor: '#0a0a14',
    accentColor: '#3388ff',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'vehicleName', label: 'Vehicle Name', type: 'text', defaultValue: '2022 Toyota Camry', group: 'Content' },
    { key: 'currentMileage', label: 'Current Mileage', type: 'text', defaultValue: '45,230 mi', group: 'Content' },
    { key: 'service1', label: 'Service 1', type: 'text', defaultValue: 'Oil Change', group: 'Service 1' },
    { key: 'service1Date', label: 'Date 1', type: 'text', defaultValue: 'Mar 15, 2024', group: 'Service 1' },
    { key: 'service1Status', label: 'Status 1', type: 'text', defaultValue: 'Done', group: 'Service 1' },
    { key: 'service2', label: 'Service 2', type: 'text', defaultValue: 'Tire Rotation', group: 'Service 2' },
    { key: 'service2Date', label: 'Date 2', type: 'text', defaultValue: 'Apr 20, 2024', group: 'Service 2' },
    { key: 'service2Status', label: 'Status 2', type: 'text', defaultValue: 'Done', group: 'Service 2' },
    { key: 'service3', label: 'Service 3', type: 'text', defaultValue: 'Brake Inspection', group: 'Service 3' },
    { key: 'service3Date', label: 'Date 3', type: 'text', defaultValue: 'Jun 01, 2024', group: 'Service 3' },
    { key: 'service3Status', label: 'Status 3', type: 'text', defaultValue: 'Due Soon', group: 'Service 3' },
    { key: 'service4', label: 'Service 4', type: 'text', defaultValue: 'Air Filter Replace', group: 'Service 4' },
    { key: 'service4Date', label: 'Date 4', type: 'text', defaultValue: 'Aug 15, 2024', group: 'Service 4' },
    { key: 'service4Status', label: 'Status 4', type: 'text', defaultValue: 'Scheduled', group: 'Service 4' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#3388ff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
