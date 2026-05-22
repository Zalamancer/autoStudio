/**
 * Canvas layer for rendering pixel art characters.
 * Renders each PixelArtCharacter from usePixelArtCharacterStore with:
 * - Crisp pixelated upscaling via image-rendering: pixelated
 * - Direction sprite selection
 * - Animation frame cycling (driven by timeline playhead)
 * - Keyframe-driven position/scale/opacity (synced to timeline playback)
 * - Click-to-select with right panel integration
 * - SelectionTransformBox for drag/resize
 */
import { useRef, useCallback } from 'react'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useEditorStore, useKeyframeStore, useTimelineStore } from '@/stores'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import { SelectionTransformBox } from './SelectionTransformBox'
import type { PixelArtCharacter } from '@/types/pixelLab'

export function PixelArtCharacterLayer() {
  const characters = usePixelArtCharacterStore((s) => s.characters)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)

  if (characters.length === 0) return null

  return (
    <>
      {characters.map((char) => (
        <PixelArtCharacterItem
          key={char.id}
          character={char}
          currentFrame={currentFrame}
          fps={fps}
        />
      ))}
    </>
  )
}

/** Base sprite animation rate — pixel art typically runs at ~8fps */
const SPRITE_BASE_FPS = 8

function PixelArtCharacterItem({
  character,
  currentFrame,
  fps,
}: {
  character: PixelArtCharacter
  currentFrame: number
  fps: number
}) {
  const savedCharacters = useSavedPixelArtCharactersStore((s) => s.characters)
  const blobUrls = useSavedPixelArtCharactersStore((s) => s.blobUrls)
  const tracks = useKeyframeStore((s) => s.tracks)
  const activeCharacterId = usePixelArtCharacterStore((s) => s.activeCharacterId)
  const selectCharacter = usePixelArtCharacterStore((s) => s.selectPixelArtCharacter)
  const updateCharacter = usePixelArtCharacterStore((s) => s.updatePixelArtCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const targetRef = useRef<HTMLDivElement>(null)
  const isSelected = activeCharacterId === character.id

  const savedChar = savedCharacters.find((c) => c.id === character.savedPixelArtCharacterId)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectCharacter(character.id)
    setRightPanelTab('pixelart-character-properties')
  }, [character.id, selectCharacter, setRightPanelTab])

  const handleTransformEnd = useCallback((state: { translate: [number, number]; width: number; height: number; rotate: number; left: number; top: number }) => {
    const baseSize = savedChar?.size || 64
    const newScale = state.width / baseSize
    const newDisplaySize = baseSize * newScale
    // Compute center position from element's actual left/top after drag/resize
    updateCharacter(character.id, {
      position: {
        x: state.left + newDisplaySize / 2,
        y: state.top + newDisplaySize / 2,
      },
      scale: newScale,
    })
  }, [character.id, savedChar?.size, updateCharacter])

  // Time range visibility
  if (character.startFrame !== undefined && currentFrame < character.startFrame) return null
  if (character.endFrame !== undefined && currentFrame >= character.endFrame) return null
  if (!character.visible) return null
  if (!savedChar) return null

  // Get the sprite for the current direction
  const dirBlobId = savedChar.directionBlobIds[character.direction]
  let spriteUrl = dirBlobId ? blobUrls[dirBlobId] : savedChar.thumbnailDataUrl

  // Animation frame cycling (driven by timeline playhead)
  // Check animation clips first, then fall back to activeAnimation
  const activeClip = character.animationClips?.find(
    (c) => currentFrame >= c.startFrame && currentFrame < c.endFrame
  )
  const animName = activeClip?.animationName ?? character.activeAnimation
  const animSpeed = activeClip?.speed ?? character.animationSpeed ?? 1
  const animOffset = activeClip ? currentFrame - activeClip.startFrame : Math.max(0, currentFrame - (character.animationStartFrame ?? 0))

  if (animName && savedChar.animationBlobIds[animName]) {
    const animDirs = savedChar.animationBlobIds[animName]
    const animDir = animDirs.find((d) => d.direction === character.direction) || animDirs[0]
    if (animDir && animDir.frameBlobIds.length > 0) {
      const totalAnimFrames = animDir.frameBlobIds.length
      const frameIndex = Math.floor(
        (animOffset / fps * SPRITE_BASE_FPS * animSpeed) % totalAnimFrames
      )
      const frameBlobUrl = blobUrls[animDir.frameBlobIds[frameIndex]]
      if (frameBlobUrl) spriteUrl = frameBlobUrl
    }
  }

  // Get keyframe-interpolated values
  const objectRef = { objectType: 'pixelArtCharacter' as const, objectId: character.id }
  const kfTracks = tracks.filter(
    (t) => t.objectRef.objectType === objectRef.objectType && t.objectRef.objectId === objectRef.objectId
  )

  let x = character.position.x
  let y = character.position.y
  let scale = character.scale
  let opacity = character.opacity

  for (const track of kfTracks) {
    if (track.keyframes.length === 0) continue
    const val = interpolatePropertyKeyframes(track.keyframes, currentFrame)
    if (val === undefined) continue

    switch (track.property) {
      case 'position.x': x = val; break
      case 'position.y': y = val; break
      case 'scale': scale = val; break
      case 'opacity': opacity = val; break
    }
  }

  // Character display size (pixel art upscaled)
  const displaySize = savedChar.size * scale

  return (
    <>
      <div
        ref={targetRef}
        onClick={handleClick}
        style={{
          position: 'absolute',
          left: x - displaySize / 2,
          top: y - displaySize / 2,
          width: displaySize,
          height: displaySize,
          zIndex: character.zIndex,
          opacity,
          cursor: 'pointer',
          outline: isSelected ? `2px solid ${character.color || '#10b981'}` : 'none',
          outlineOffset: 2,
        }}
      >
        {spriteUrl ? (
          <img
            src={spriteUrl}
            alt={character.name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #065f46, #064e3b)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#6ee7b7',
            }}
          >
            PX
          </div>
        )}
      </div>
      {isSelected && !character.locked && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          keepRatio
        />
      )}
    </>
  )
}
