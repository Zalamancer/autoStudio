import React from 'react'
import { useFrame } from '@/engine'
import type { CharacterSpriteData, PartTransformData, WardrobeLayerData } from './types'
import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import { getCurvatureFromEmotion, getExpressionFromEmotion } from '@/services/emotionMapping'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { resolveVisemeSprite } from '@/services/visemeMapper'

interface RemotionCharacterProps {
  character: CharacterSpriteData
  visemeTimeline: VisemeEvent[]
  emotionTimeline: EmotionEvent[]
  canvasWidth: number
  canvasHeight: number
  /** When provided, use fixed-size box (multi-character dialogue mode) */
  dialogueScale?: number
  /** When provided, use pixel position instead of percentage (multi-character dialogue mode) */
  dialoguePosition?: { x: number; y: number }
  /** When true, skip rendering the body layer (used when body is rendered by a rig mesh instead) */
  skipBody?: boolean
  /** When true, skip rendering eye and eyebrow layers (used when head is baked into the rig composite) */
  skipHead?: boolean
  /** Outfit/accessory layers from wardrobe store */
  wardrobeLayers?: WardrobeLayerData[]
}

function getVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
  const event = timeline.find(e => frame >= e.startFrame && frame < e.endFrame)
  return (event?.viseme as Viseme) || 'Rest'
}

function getEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
  const event = timeline.find(e => frame >= e.startFrame && frame < e.endFrame)
  return event?.emotion || 'Neutral'
}

function getVisemeSpriteUrl(
  character: CharacterSpriteData,
  viseme: Viseme,
  emotion: string
): string | null {
  const { curvedVisemes, savedImages, visemeMapping, visemeSpriteMap } = character
  const visemeImages = savedImages.viseme || []
  const curvature = getCurvatureFromEmotion(emotion)

  // Use unified resolveVisemeSprite — handles visemeSpriteMap, curvedVisemes, and legacy fallback
  return resolveVisemeSprite(
    viseme,
    curvature,
    visemeSpriteMap as Record<string, string | null> | null | undefined,
    curvedVisemes,
    visemeImages,
    visemeMapping
  )
}

/**
 * PartLayer renders a character sprite at natural image size (single character mode).
 */
function PartLayer({ src, transform, zIndex, alt }: {
  src: string | null
  transform: PartTransformData
  zIndex: number
  alt: string
}) {
  if (!transform.visible || !src) return null

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: zIndex > 0 ? 'absolute' : undefined,
        top: zIndex > 0 ? 0 : undefined,
        left: zIndex > 0 ? 0 : undefined,
        maxWidth: 'none',
        pointerEvents: 'none',
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
        transformOrigin: 'center center',
        zIndex,
      }}
    />
  )
}

/**
 * DialoguePartLayer renders a character sprite constrained to the parent's box
 * using object-contain, matching how MultiCharacterLayer renders sprites on the live canvas.
 */
function DialoguePartLayer({ src, transform, zIndex, alt }: {
  src: string | null
  transform: PartTransformData
  zIndex: number
  alt: string
}) {
  if (!transform.visible || !src) return null

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
        transformOrigin: 'center center',
        zIndex,
      }}
    />
  )
}

/** Base character display size in pixels (must match CharacterLayer.tsx) */
const BASE_CHARACTER_SIZE = 200

export const RemotionCharacter: React.FC<RemotionCharacterProps> = ({
  character,
  visemeTimeline,
  emotionTimeline,
  canvasWidth,
  canvasHeight,
  dialogueScale,
  dialoguePosition,
  skipBody,
  skipHead,
  wardrobeLayers,
}) => {
  const frame = useFrame()
  const layerOrder = useCharacterPartsStore((s) => s.layerOrder)

  const { savedImages, transforms, selectedSprites } = character
  const eyeImages = savedImages.eye || []
  const eyebrowImages = savedImages.eyebrow || []
  const hairImages = savedImages.hair || []
  const bodyImages = savedImages.body || []
  const headImages = savedImages.head || []
  const shirtImages = savedImages.shirt || []
  const pantsImages = savedImages.pants || []
  const shoesImages = savedImages.shoes || []

  // Get display sprites
  const displayEye = (selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null) || eyeImages[0] || null
  const displayEyebrow = (selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null) || eyebrowImages[0] || null
  const displayHair = (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
  const displayBody = (selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null) || bodyImages[0] || null
  const displayHead = (selectedSprites.head !== null ? headImages[selectedSprites.head] : null) || headImages[0] || null
  const displayShirt = (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
  const displayPants = (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
  const displayShoes = (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

  // Get current viseme and emotion for this frame
  const currentViseme = getVisemeAtFrame(visemeTimeline, frame)
  const currentEmotion = getEmotionAtFrame(emotionTimeline, frame)
  const displayViseme = getVisemeSpriteUrl(character, currentViseme, currentEmotion)

  // Eye/eyebrow expression: resolve based on current emotion
  const expression = getExpressionFromEmotion(currentEmotion)
  const eyeVariantSprites = character.eyeVariantSprites as Record<string, string | null> | undefined
  const eyebrowVariantSprites = character.eyebrowVariantSprites as Record<string, string | null> | undefined
  const resolvedEye = eyeVariantSprites?.[expression.eye] || displayEye
  const resolvedEyebrow = eyebrowVariantSprites?.[expression.eyebrow] || displayEyebrow

  const groupTransform = transforms.group

  if (!groupTransform.visible) return null

  const hasAnySprites = resolvedEye || resolvedEyebrow || displayViseme || displayHair || displayBody || displayHead || displayShirt || displayPants || displayShoes

  // Multi-character dialogue mode: use fixed-size box with pixel positioning
  // (matches CharacterLayer.tsx / MultiCharacterLayer behavior)
  const isDialogueMode = dialogueScale !== undefined && dialoguePosition !== undefined
  const displaySize = isDialogueMode ? BASE_CHARACTER_SIZE * dialogueScale! : undefined

  // Position: pixel-based for dialogue mode, percentage-based for single character
  const wrapperStyle: React.CSSProperties = isDialogueMode
    ? {
        position: 'absolute',
        left: dialoguePosition!.x - displaySize! / 2,
        top: dialoguePosition!.y - displaySize! / 2,
        width: displaySize,
        height: displaySize,
      }
    : {
        position: 'absolute',
        left: `${(groupTransform.x / canvasWidth) * 100}%`,
        top: `${(groupTransform.y / canvasHeight) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${groupTransform.rotation}deg) scale(${groupTransform.scaleX}, ${groupTransform.scaleY})`,
      }

  return (
    <div style={wrapperStyle}>
      <div style={{
        position: 'relative',
        ...(isDialogueMode
          ? { width: '100%', height: '100%' }
          : { display: 'inline-block' }),
      }}>
        {/* Layers rendered in dynamic order from store */}
        {layerOrder.map((part, idx) => {
          // Map each layer part to its sprite source
          const spriteMap: Record<string, string | null> = {
            body: skipBody ? null : displayBody,
            head: skipHead ? null : displayHead,
            shirt: displayShirt,
            pants: displayPants,
            shoes: displayShoes,
            eye: skipHead ? null : resolvedEye,
            eyebrow: skipHead ? null : resolvedEyebrow,
            hair: displayHair,
            viseme: displayViseme,
          }
          const sprite = spriteMap[part] ?? null
          const t = transforms[part]
          if (!t || !sprite) return null

          const Layer = isDialogueMode ? DialoguePartLayer : PartLayer
          const alt = part.charAt(0).toUpperCase() + part.slice(1)
          return <Layer key={part} src={sprite} transform={t} zIndex={idx} alt={alt} />
        })}

        {/* Outfit / accessory layers from wardrobe */}
        {wardrobeLayers && wardrobeLayers.map((outfit) => {
          if (!outfit.visible) return null
          const Layer = isDialogueMode ? DialoguePartLayer : PartLayer
          const outfitTransform: PartTransformData = {
            x: outfit.position.x,
            y: outfit.position.y,
            rotation: outfit.rotation,
            scaleX: outfit.scale.x,
            scaleY: outfit.scale.y,
            visible: outfit.visible,
          }
          return (
            <Layer
              key={`outfit-${outfit.id}`}
              src={outfit.spriteUrl}
              transform={outfitTransform}
              zIndex={outfit.zOrder}
              alt={outfit.name}
            />
          )
        })}

        {/* Placeholder if no sprites */}
        {!hasAnySprites && (
          <div style={{
            width: isDialogueMode ? '100%' : 128,
            height: isDialogueMode ? '100%' : 160,
            background: 'linear-gradient(to bottom, #52525b, #3f3f46)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ width: 48, height: 48, background: '#71717a', borderRadius: '50%', marginBottom: 8 }} />
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>Character</span>
          </div>
        )}
      </div>
    </div>
  )
}
