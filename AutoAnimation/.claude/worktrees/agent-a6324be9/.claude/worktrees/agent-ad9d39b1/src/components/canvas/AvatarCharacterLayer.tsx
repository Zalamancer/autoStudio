/**
 * Canvas layer for rendering avatar characters.
 * Renders:
 * - Static base image when no video is generated
 * - AI-generated video (lip-synced) when video URL is available
 * - Keyframe-driven position/scale/opacity
 * - Click-to-select with right panel integration
 * - SelectionTransformBox for drag/resize
 */
import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useEditorStore, useKeyframeStore, useTimelineStore } from '@/stores'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import { SelectionTransformBox } from './SelectionTransformBox'
import type { AvatarCharacter } from '@/types/avatar'

export const AvatarCharacterLayer = memo(function AvatarCharacterLayer() {
  const characters = useAvatarCharacterStore((s) => s.characters)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)

  if (characters.length === 0) return null

  return (
    <>
      {characters.map((char) => (
        <AvatarCharacterItem
          key={char.id}
          character={char}
          currentFrame={currentFrame}
          fps={fps}
        />
      ))}
    </>
  )
})

/** Default display size for avatar images on canvas */
const AVATAR_DISPLAY_WIDTH = 300
const AVATAR_DISPLAY_HEIGHT = 400

function AvatarCharacterItem({
  character,
  currentFrame,
  fps,
}: {
  character: AvatarCharacter
  currentFrame: number
  fps: number
}) {
  const savedCharacters = useSavedAvatarCharactersStore((s) => s.characters)
  const blobUrls = useSavedAvatarCharactersStore((s) => s.blobUrls)
  const tracks = useKeyframeStore((s) => s.tracks)
  const activeCharacterId = useAvatarCharacterStore((s) => s.activeCharacterId)
  const selectCharacter = useAvatarCharacterStore((s) => s.selectAvatarCharacter)
  const updateCharacter = useAvatarCharacterStore((s) => s.updateAvatarCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)

  const targetRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isSelected = activeCharacterId === character.id

  // Track video's natural aspect ratio so container matches the video, not the image
  const [videoAspect, setVideoAspect] = useState<number | null>(null)

  const savedChar = savedCharacters.find((c) => c.id === character.savedAvatarCharacterId)

  // Resolve which video to display: prefer lip sync > regular video
  const activeVideoUrl =
    (character.lipSyncVideoUrl && character.lipSyncStatus === 'ready')
      ? character.lipSyncVideoUrl
      : (character.videoUrl && character.videoStatus === 'ready')
        ? character.videoUrl
        : null

  // Reset video aspect when the active video changes
  useEffect(() => {
    if (!activeVideoUrl) setVideoAspect(null)
  }, [activeVideoUrl])

  // Sync video playback with timeline
  useEffect(() => {
    if (!videoRef.current || !activeVideoUrl) return
    if (isPlaying) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying, activeVideoUrl])

  // Sync video time with timeline frame
  useEffect(() => {
    if (!videoRef.current || !activeVideoUrl || isPlaying) return
    const startFrame = character.startFrame ?? 0
    const desiredTime = Math.max(0, (currentFrame - startFrame) / fps)
    if (Math.abs(videoRef.current.currentTime - desiredTime) > 0.05) {
      videoRef.current.currentTime = desiredTime
    }
  }, [currentFrame, fps, isPlaying, activeVideoUrl, character.startFrame])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectCharacter(character.id)
    setRightPanelTab('avatar-character-properties')
  }, [character.id, selectCharacter, setRightPanelTab])

  const handleTransformEnd = useCallback((state: { translate: [number, number]; width: number; height: number; rotate: number; left: number; top: number }) => {
    const newScale = state.width / AVATAR_DISPLAY_WIDTH
    // Use actual element dimensions for center computation (respects video aspect ratio)
    updateCharacter(character.id, {
      position: {
        x: state.left + state.width / 2,
        y: state.top + state.height / 2,
      },
      scale: newScale,
    })
  }, [character.id, updateCharacter])

  // Time range visibility
  if (character.startFrame !== undefined && currentFrame < character.startFrame) return null
  if (character.endFrame !== undefined && currentFrame >= character.endFrame) return null
  if (!character.visible) return null
  if (!savedChar) return null

  // Get the image URL for the base avatar
  const imageUrl = blobUrls[savedChar.baseBlobId] || savedChar.thumbnailDataUrl

  // Get keyframe-interpolated values
  const objectRef = { objectType: 'avatarCharacter' as const, objectId: character.id }
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

  // Use video's native aspect ratio when a video is active, otherwise image's 3:4
  const baseW = AVATAR_DISPLAY_WIDTH
  const baseH = (activeVideoUrl && videoAspect)
    ? AVATAR_DISPLAY_WIDTH / videoAspect
    : AVATAR_DISPLAY_HEIGHT
  const displayW = baseW * scale
  const displayH = baseH * scale

  return (
    <>
      <div
        ref={targetRef}
        onClick={handleClick}
        style={{
          position: 'absolute',
          left: x - displayW / 2,
          top: y - displayH / 2,
          width: displayW,
          height: displayH,
          zIndex: character.zIndex,
          opacity,
          cursor: 'pointer',
          outline: isSelected ? `2px solid ${character.color || '#f59e0b'}` : 'none',
          outlineOffset: 2,
        }}
      >
        {/* Render video if available, otherwise static image */}
        {activeVideoUrl ? (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            loop
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              if (v.videoWidth && v.videoHeight) {
                setVideoAspect(v.videoWidth / v.videoHeight)
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={character.name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #78350f, #451a03)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#fbbf24',
            }}
          >
            AV
          </div>
        )}

        {/* Video/lip sync generation overlay */}
        {(character.videoStatus === 'generating' || character.lipSyncStatus === 'generating') && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-amber-400 font-medium">
              {character.lipSyncStatus === 'generating' ? 'Generating lip sync...' : 'Generating video...'}
            </span>
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
