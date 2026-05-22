import React from 'react'
import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PolygonTearConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Polygon tearing: mesh tears apart, vertices displace, triangles separate
// Text appears to be a 3D polygon mesh being torn at triangle seams

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Wireframe mesh remnants in background
    const meshLines = 12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Torn wireframe segments */}
        {Array.from({ length: meshLines }, (_, i) => {
          const angle = rand(i * 17) * 180 - 90
          const x = rand(i * 23 + 1) * 100
          const y = rand(i * 31 + 2) * 100
          const len = 20 + rand(i * 11) * 40
          const drift = Math.sin(time * (0.5 + rand(i * 7)) + i) * 8
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x + drift}%`,
                top: `${y}%`,
                width: len,
                height: 1,
                background: `rgba(255,60,120,${0.04 + rand(i * 13) * 0.06})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 50%',
              }}
            />
          )
        })}
        {/* Poly count readout */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,60,120,0.2)',
            letterSpacing: 1,
          }}
        >
          TRIS: {Math.floor(2048 - Math.sin(time) * 800)} / 2048
        </div>
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,60,120,0.15)',
          }}
        >
          MESH INTEGRITY: {Math.max(0, Math.floor(100 - Math.abs(Math.sin(time * 0.7)) * 60))}%
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 193 + 67
    const chars = word.split('')

    // Split word into "triangle strips" — groups of characters
    // Each strip displaces independently on enter/exit

    const stripSize = Math.max(1, Math.ceil(chars.length / 3))

    const getStripDisplace = (stripIdx: number, progress: number) => {
      const angle = rand(seed + stripIdx * 41) * Math.PI * 2
      const dist = (1 - progress) * (40 + rand(seed + stripIdx * 19) * 60)
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.5,
        rot: (rand(seed + stripIdx * 29) - 0.5) * 30 * (1 - progress),
      }
    }

    if (phase === 'enter') {
      const strips: React.ReactNode[] = []
      for (let si = 0; si < 3; si++) {
        const stripChars = chars.slice(si * stripSize, (si + 1) * stripSize)
        if (stripChars.length === 0) continue
        const { dx, dy, rot } = getStripDisplace(si, enterProgress)
        const stripOpacity = Math.max(0, enterProgress * 1.5 - si * 0.1)
        strips.push(
          <span
            key={si}
            style={{
              display: 'inline-block',
              transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
              opacity: stripOpacity,
              color,
            }}
          >
            {stripChars.join('')}
          </span>,
        )
      }
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {strips}
        </div>
      )
    }

    if (phase === 'hold') {
      // Mesh stress: occasional vertex pop — one character jumps
      const stressMoment = holdProgress > 0.45 && holdProgress < 0.5
      const popChar = Math.floor(rand(seed + Math.floor(holdProgress * 20)) * chars.length)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const popping = stressMoment && ci === popChar
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color,
                  transform: popping
                    ? `translateY(${(rand(seed + ci + f) - 0.5) * 20}px) translateX(${(rand(seed + ci + f + 1) - 0.5) * 12}px)`
                    : 'none',
                  textShadow: `0 0 6px ${color}50`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: strips tear apart
    const strips: React.ReactNode[] = []
    for (let si = 0; si < 3; si++) {
      const stripChars = chars.slice(si * stripSize, (si + 1) * stripSize)
      if (stripChars.length === 0) continue
      const { dx, dy, rot } = getStripDisplace(si, 1 - exitProgress)
      strips.push(
        <span
          key={si}
          style={{
            display: 'inline-block',
            transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
            opacity: Math.max(0, 1 - exitProgress * 1.3),
            color,
          }}
        >
          {stripChars.join('')}
        </span>,
      )
    }
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
        }}
      >
        {strips}
      </div>
    )
  },
}

function PolygonTearComponent(props: MotionGraphicProps<PolygonTearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-polygon-tear',
  title: 'Kinetic Polygon Tear',
  description:
    'GPU polygon mesh tearing — text splits into triangle strips that fly apart and reassemble, with wireframe remnants and mesh integrity readout',
  tags: ['kinetic', 'typography', 'glitch', 'gpu', 'render', 'polygon', 'mesh', '3d', 'digital'],
  category: 'captions',
  component: PolygonTearComponent as any,
  defaultConfig: {
    words: ['SHATTER', 'MESH', 'TEAR', 'VERTEX'],
    colors: ['#FF3C78', '#FF5599', '#FF3C78', '#FF7799'],
    bgColor: '#08000f',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SHATTER', 'MESH', 'TEAR', 'VERTEX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3C78', '#FF5599', '#FF3C78', '#FF7799'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08000f', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
