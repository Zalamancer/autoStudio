import React from 'react'
import { useFrame, interpolate } from '@/engine'
import type { ImageStoryScene, ImageStoryWordTiming } from '@/types/imageStory'
import { computeRegion } from '@/types/imageStory'

interface RemotionImageStoryLayerProps {
  scenes: ImageStoryScene[]
  selectedAssets: Record<string, string>
  wordTimings: ImageStoryWordTiming[]
  canvasWidth: number
  canvasHeight: number
  fps: number
}

export const RemotionImageStoryLayer: React.FC<RemotionImageStoryLayerProps> = ({
  scenes,
  selectedAssets,
  wordTimings,
  canvasWidth,
  canvasHeight,
  fps,
}) => {
  const frame = useFrame()
  const preEntryFrames = Math.round((200 / 1000) * fps)

  // Find active scene for current frame
  const activeScene = scenes.find((scene) => {
    const sceneTimings = wordTimings.filter((t) => scene.words.some((w) => w.text === t.word.text))
    if (sceneTimings.length === 0) return false
    const start = sceneTimings[0].startFrame
    const end = sceneTimings[sceneTimings.length - 1].endFrame
    return frame >= start && frame <= end
  })

  if (!activeScene) return null

  // Render background
  const bgUrl = selectedAssets[`bg_${activeScene.id}`]

  // Collect active nouns at this frame
  const activeNounWords = activeScene.words.filter((w) => {
    if (w.role !== 'image_noun') return false
    const timing = wordTimings.find((t) => t.word.text === w.text)
    if (!timing) return false
    const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
    const sceneTimings = wordTimings.filter((t) => activeScene.words.some((sw) => sw.text === t.word.text))
    const exitFrame =
      sceneTimings.length > 0 ? sceneTimings[sceneTimings.length - 1].endFrame : timing.endFrame + fps * 2
    return frame >= entryFrame && frame <= exitFrame
  })

  return (
    <>
      {/* Background */}
      {bgUrl && (
        <img
          src={bgUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvasWidth,
            height: canvasHeight,
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Noun images */}
      {activeNounWords.map((nounWord, i) => {
        const assetUrl = selectedAssets[nounWord.text]
        if (!assetUrl) return null

        const timing = wordTimings.find((t) => t.word.text === nounWord.text)
        if (!timing) return null

        const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
        const region = computeRegion(i, activeNounWords.length, canvasWidth, canvasHeight)

        // Entry animation: fade + scale
        const opacity = interpolate(frame, [entryFrame, entryFrame + 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const scale = interpolate(frame, [entryFrame, entryFrame + 12], [0.7, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <img
            key={nounWord.text}
            src={assetUrl}
            style={{
              position: 'absolute',
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
              objectFit: 'contain',
              opacity,
              transform: `scale(${scale})`,
              zIndex: region.zIndex,
            }}
          />
        )
      })}
    </>
  )
}
