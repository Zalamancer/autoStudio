/**
 * Remotion export layer for avatar characters.
 * Renders either the generated video or the static base image.
 */
import React from 'react'
import { useFrame } from '@/engine'

export interface AvatarCharacterExportData {
  id: string
  name: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  visible: boolean
  startFrame?: number
  endFrame?: number
  /** Base avatar image as data URL */
  imageDataUrl: string
  /** Generated video URL (if available) */
  videoUrl?: string
  /** Lip-synced video URL (if available, preferred over videoUrl) */
  lipSyncVideoUrl?: string
}

interface RemotionAvatarCharacterProps {
  characters: AvatarCharacterExportData[]
}

const AVATAR_DISPLAY_WIDTH = 300
const AVATAR_DISPLAY_HEIGHT = 400

export const RemotionAvatarCharacter: React.FC<RemotionAvatarCharacterProps> = ({
  characters,
}) => {
  const frame = useFrame()

  return (
    <>
      {characters.map((char) => {
        if (!char.visible) return null
        if (char.startFrame !== undefined && frame < char.startFrame) return null
        if (char.endFrame !== undefined && frame >= char.endFrame) return null

        const displayW = AVATAR_DISPLAY_WIDTH * char.scale
        const displayH = AVATAR_DISPLAY_HEIGHT * char.scale

        return (
          <div
            key={char.id}
            style={{
              position: 'absolute',
              left: char.position.x - displayW / 2,
              top: char.position.y - displayH / 2,
              width: displayW,
              height: displayH,
              zIndex: char.zIndex,
              opacity: char.opacity,
            }}
          >
            {(char.lipSyncVideoUrl || char.videoUrl) ? (
              <video
                src={char.lipSyncVideoUrl || char.videoUrl}
                loop
                muted
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            ) : (
              <img
                src={char.imageDataUrl}
                alt={char.name}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
