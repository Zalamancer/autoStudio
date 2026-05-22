/**
 * Remotion export layer for pixel art characters.
 * Uses useCurrentFrame() for animation frame cycling.
 * Renders with pixelated image rendering for crisp upscaling.
 */
import React from 'react'
import { useFrame, useComposition } from '@/engine'

/** Base sprite animation rate — pixel art typically runs at ~8fps */
const SPRITE_BASE_FPS = 8

export interface PixelArtCharacterExportData {
  id: string
  name: string
  position: { x: number; y: number }
  scale: number
  direction: string
  opacity: number
  zIndex: number
  visible: boolean
  startFrame?: number
  endFrame?: number
  /** Sprite data URL for the current direction */
  spriteDataUrl: string
  /** Pixel size of the character sprite */
  size: number
  /** Animation frames as data URLs (if playing animation) */
  animationFrames?: string[]
  animationSpeed?: number
  animationStartFrame?: number
}

interface RemotionPixelArtCharacterProps {
  characters: PixelArtCharacterExportData[]
}

export const RemotionPixelArtCharacter: React.FC<RemotionPixelArtCharacterProps> = ({
  characters,
}) => {
  const frame = useFrame()
  const { fps } = useComposition()

  return (
    <>
      {characters.map((char) => {
        if (!char.visible) return null
        if (char.startFrame !== undefined && frame < char.startFrame) return null
        if (char.endFrame !== undefined && frame >= char.endFrame) return null

        const displaySize = char.size * char.scale

        // Animation frame cycling (deterministic from timeline frame)
        let spriteUrl = char.spriteDataUrl
        if (char.animationFrames && char.animationFrames.length > 0) {
          const speed = char.animationSpeed || 1
          const totalAnimFrames = char.animationFrames.length
          const offset = Math.max(0, frame - (char.animationStartFrame ?? 0))
          const frameIndex = Math.floor(
            (offset / fps * SPRITE_BASE_FPS * speed) % totalAnimFrames
          )
          spriteUrl = char.animationFrames[frameIndex] || spriteUrl
        }

        return (
          <div
            key={char.id}
            style={{
              position: 'absolute',
              left: char.position.x - displaySize / 2,
              top: char.position.y - displaySize / 2,
              width: displaySize,
              height: displaySize,
              zIndex: char.zIndex,
              opacity: char.opacity,
            }}
          >
            <img
              src={spriteUrl}
              alt={char.name}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )
      })}
    </>
  )
}
