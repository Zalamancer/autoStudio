import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelMapConfig {
  locationName: string
  mapSize: number
  bgColor: string
  landColor: string
  waterColor: string
  pathColor: string
  markerColor: string
  textColor: string
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function ScenePixelMapComponent({ config, frame, fps, progress }: MotionGraphicProps<PixelMapConfig>) {
  const { locationName, mapSize, bgColor, landColor, waterColor, pathColor, markerColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.88 ? (progress - 0.88) / 0.12 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Generate terrain grid
  const gridSize = mapSize
  const cellSize = Math.floor(Math.min(300, 60 * (gridSize / 8)) / gridSize)
  const terrain: number[][] = []
  for (let y = 0; y < gridSize; y++) {
    terrain[y] = []
    for (let x = 0; x < gridSize; x++) {
      const seed = y * gridSize + x + 42
      const val = seededRandom(seed)
      // 0 = water, 1 = land, 2 = path, 3 = tree
      if (val < 0.25) terrain[y][x] = 0
      else if (val < 0.7) terrain[y][x] = 1
      else if (val < 0.8) terrain[y][x] = 2
      else terrain[y][x] = 3
    }
  }

  // Player marker position (moves over time)
  const markerPath = [
    { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 4 },
    { x: 5, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 6 },
  ]
  const pathProgress = progress * (markerPath.length - 1)
  const pathIdx = Math.min(Math.floor(pathProgress), markerPath.length - 2)
  const pathLerp = pathProgress - pathIdx
  const markerX = markerPath[pathIdx].x + (markerPath[pathIdx + 1].x - markerPath[pathIdx].x) * pathLerp
  const markerY = markerPath[pathIdx].y + (markerPath[pathIdx + 1].y - markerPath[pathIdx].y) * pathLerp

  // Marker blink
  const markerBlink = Math.floor(time * 4) % 2 === 0

  // Reveal animation - cells appear in expanding radius from center
  const revealRadius = enterProgress * gridSize

  function getCellColor(type: number): string {
    switch (type) {
      case 0: return waterColor
      case 1: return landColor
      case 2: return pathColor
      case 3: return `${landColor}CC`
      default: return landColor
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Map title */}
      <div
        style={{
          fontSize: 'clamp(10px, 2vw, 16px)',
          fontWeight: 700,
          color: `${textColor}88`,
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: 'clamp(6px, 1vw, 12px)',
        }}
      >
        {'AREA MAP'}
      </div>

      {/* Map container */}
      <div
        style={{
          border: `3px solid ${textColor}40`,
          padding: 4,
          background: `${bgColor}CC`,
          position: 'relative',
          imageRendering: 'pixelated' as any,
        }}
      >
        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            gap: 1,
          }}
        >
          {terrain.flat().map((type, idx) => {
            const cx = idx % gridSize
            const cy = Math.floor(idx / gridSize)
            const distFromCenter = Math.sqrt(
              Math.pow(cx - gridSize / 2, 2) + Math.pow(cy - gridSize / 2, 2)
            )
            const cellVisible = distFromCenter < revealRadius

            // Tree decoration
            const isTree = type === 3

            return (
              <div
                key={idx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: cellVisible ? getCellColor(type) : `${bgColor}80`,
                  opacity: cellVisible ? 1 : 0.2,
                  position: 'relative',
                  imageRendering: 'pixelated' as any,
                }}
              >
                {/* Tree marker */}
                {isTree && cellVisible && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20%',
                      left: '30%',
                      width: '40%',
                      height: '60%',
                      background: '#006600',
                      borderRadius: '50% 50% 0 0',
                    }}
                  />
                )}
                {/* Water shimmer */}
                {type === 0 && cellVisible && Math.floor(time * 3 + cx + cy) % 4 === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '30%',
                      left: '30%',
                      width: '40%',
                      height: 2,
                      background: 'rgba(255,255,255,0.2)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Player marker */}
        <div
          style={{
            position: 'absolute',
            left: 4 + markerX * (cellSize + 1),
            top: 4 + markerY * (cellSize + 1),
            width: cellSize,
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          {/* Marker ping */}
          <div
            style={{
              position: 'absolute',
              width: cellSize * 2,
              height: cellSize * 2,
              border: `2px solid ${markerColor}`,
              borderRadius: '50%',
              opacity: (Math.sin(time * 4) + 1) * 0.2,
            }}
          />
          {/* Marker dot */}
          <div
            style={{
              width: cellSize * 0.7,
              height: cellSize * 0.7,
              background: markerBlink ? markerColor : `${markerColor}80`,
              boxShadow: `0 0 6px ${markerColor}`,
              imageRendering: 'pixelated' as any,
            }}
          />
        </div>

        {/* Destination marker (X) */}
        <div
          style={{
            position: 'absolute',
            left: 4 + 7 * (cellSize + 1) + cellSize / 2,
            top: 4 + 6 * (cellSize + 1) + cellSize / 2,
            transform: 'translate(-50%, -50%)',
            fontSize: cellSize * 0.8,
            fontWeight: 700,
            color: '#FF4444',
            opacity: Math.floor(time * 2) % 2 === 0 ? 0.9 : 0.4,
            zIndex: 5,
            lineHeight: 1,
          }}
        >
          X
        </div>

        {/* Map border corners */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={`mc-${c}`}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -2,
              [c % 2 === 0 ? 'left' : 'right']: -2,
              width: 6,
              height: 6,
              background: `${textColor}60`,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}
      </div>

      {/* Location name */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 26px)',
          fontWeight: 700,
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginTop: 'clamp(8px, 1.5vw, 16px)',
          textShadow: `0 0 6px ${markerColor}40`,
        }}
      >
        {locationName}
      </div>

      {/* Compass indicator */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          opacity: 0.4,
        }}
      >
        <div style={{ fontSize: 'clamp(8px, 1.2vw, 11px)', color: textColor, fontWeight: 700 }}>N</div>
        <div style={{ width: 1, height: 'clamp(8px, 1.5vw, 14px)', background: textColor }} />
        <div style={{ width: 6, height: 6, borderLeft: `3px solid ${textColor}`, borderBottom: `3px solid ${textColor}`, transform: 'rotate(-45deg)', marginTop: -4 }} />
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pixel-map',
  title: 'Scene Pixel Map',
  description: 'Pixel art mini-map with procedural terrain, animated player marker, destination X, compass, and expanding reveal',
  tags: ['scene', 'map', 'pixel', 'minimap', 'retro', 'gaming', 'RPG', 'terrain'],
  category: 'scene-layout',
  component: ScenePixelMapComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    locationName: 'DARK FOREST',
    mapSize: 10,
    bgColor: '#0a0a14',
    landColor: '#3a6b35',
    waterColor: '#1a3a6b',
    pathColor: '#8B7355',
    markerColor: '#FFD700',
    textColor: '#CCCCCC',
  },
  configSchema: [
    { key: 'locationName', label: 'Location', type: 'text', defaultValue: 'DARK FOREST', group: 'Content' },
    { key: 'mapSize', label: 'Grid Size', type: 'number', defaultValue: 10, min: 6, max: 16, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'landColor', label: 'Land', type: 'color', defaultValue: '#3a6b35', group: 'Style' },
    { key: 'waterColor', label: 'Water', type: 'color', defaultValue: '#1a3a6b', group: 'Style' },
    { key: 'pathColor', label: 'Path', type: 'color', defaultValue: '#8B7355', group: 'Style' },
    { key: 'markerColor', label: 'Marker', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'textColor', label: 'Text', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
  ],
})
