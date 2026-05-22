/**
 * AI Person Clone Service
 *
 * Analyzes a photo/video of a person to extract:
 * 1. Facial features (via Gemini Vision)
 * 2. Gesture patterns (via MediaPipe Pose on video)
 * 3. Voice characteristics (via audio analysis)
 * 4. Movement style (from gesture analysis)
 *
 * Then assembles a generation prompt for the NB2 character pipeline
 * that preserves the person's likeness in the chosen art style.
 */

import type {
  PersonCloneProfile,
  PersonCloneProgress,
  PersonCloneStyle,
  FacialFeatures,
  HairFeatures,
  BodyFeatures,
  StyleFeatures,
  VoiceCharacteristics,
  MovementStyle,
  GesturePattern,
  GestureKeyframe,
} from '@/types/personClone'
import { CLONE_STYLE_MODIFIERS, createEmptyCloneProfile } from '@/types/personClone'
import { generateAllVisemeSprites } from '@/services/nanoBanana'
import { generateAllEmotionHeads } from '@/services/emotionHeadGeneration'
import { buildVisemeSpriteMapFromCurved } from '@/services/visemeMapper'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore as _useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { computeCharacterLayout, type AspectRatioKey } from '@/services/compositionEngine'
import { createEmptySpriteSet as _createEmptySpriteSet } from '@/types/nanoBanana'
import type { SavedCharacter } from '@/stores/useSavedCharactersStore'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3-flash-preview' // model name for callGeminiProxy

/**
 * Analyze a photo to extract facial, hair, body, and style features using Gemini Vision.
 */
export async function analyzePhotoFeatures(
  imageDataUrl: string,
  onProgress?: (progress: PersonCloneProgress) => void,
): Promise<{
  facialFeatures: FacialFeatures
  hairFeatures: HairFeatures
  bodyFeatures: BodyFeatures
  styleFeatures: StyleFeatures
}> {
  onProgress?.({
    status: 'analyzing-photo',
    message: 'Analyzing facial features...',
    percentage: 10,
  })
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URL')
  const mimeType = match[1]
  const base64Data = match[2]

  const prompt = `Analyze this photo of a person in detail for creating an animated character avatar.

Output valid JSON with these exact fields:
{
  "facialFeatures": {
    "faceShape": "oval/round/square/heart/diamond/oblong",
    "eyeSpacing": "close-set/normal/wide-set",
    "eyeShape": "almond/round/hooded/monolid/upturned/downturned",
    "eyeColor": "brown/blue/green/hazel/gray/amber",
    "noseShape": "button/straight/aquiline/wide/narrow/upturned",
    "mouthShape": "thin/full/bow-shaped/wide/small",
    "chinShape": "pointed/rounded/square/dimpled",
    "cheekStructure": "high cheekbones/rounded/flat/hollow",
    "foreheadSize": "small/medium/large"
  },
  "hairFeatures": {
    "style": "e.g. short cropped, long wavy, pixie cut, etc.",
    "color": "e.g. dark brown, blonde, black, red, etc.",
    "length": "very short/short/medium/long/very long",
    "texture": "straight/wavy/curly/coily/kinky",
    "partSide": "left/right/center/none"
  },
  "bodyFeatures": {
    "height": "short/average/tall (estimated)",
    "build": "slim/average/athletic/broad/stocky",
    "skinTone": "e.g. fair/light/medium/olive/tan/brown/dark",
    "posture": "upright/relaxed/slouched"
  },
  "styleFeatures": {
    "clothingStyle": "describe visible clothing briefly",
    "primaryColors": ["list", "of", "dominant", "colors"],
    "accessories": ["list", "any", "visible", "accessories"],
    "distinctiveFeatures": ["list", "any", "unique", "features", "like", "mole", "scar", "tattoo", "piercing"]
  }
}

Be precise and descriptive. These details will be used to generate a character that resembles this person.`

  const response = await callGeminiProxy(GEMINI_API_URL, {
    contents: [
      {
        parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = JSON.parse(text)

  onProgress?.({
    status: 'analyzing-photo',
    message: 'Feature extraction complete',
    percentage: 40,
  })

  return {
    facialFeatures: parsed.facialFeatures,
    hairFeatures: parsed.hairFeatures,
    bodyFeatures: parsed.bodyFeatures,
    styleFeatures: parsed.styleFeatures,
  }
}

/**
 * Analyze gesture patterns from extracted video pose data.
 * Uses the motion transfer service's extracted pose frames.
 */
export function analyzeGesturePatterns(
  poseFrames: Array<{ timestamp: number; landmarks: Array<{ x: number; y: number; z: number; visibility: number }> }>,
  sourceFps: number,
): { gestures: GesturePattern[]; movementStyle: MovementStyle } {
  if (poseFrames.length === 0) {
    return {
      gestures: [],
      movementStyle: {
        energyLevel: 0.5,
        smoothness: 0.5,
        gestureAmplitude: 0.5,
        headMovementFrequency: 0,
        idleBehaviors: [],
        dominantHand: 'ambidextrous',
      },
    }
  }

  // Analyze movement energy from wrist/hand velocity
  let totalWristVelocity = 0
  let wristVelocityCount = 0
  let maxWristDisplacement = 0
  let headMovements = 0
  const headPositions: Array<{ x: number; y: number }> = []

  const NOSE = 0
  const L_WRIST = 15
  const R_WRIST = 16

  for (let i = 1; i < poseFrames.length; i++) {
    const prev = poseFrames[i - 1]
    const curr = poseFrames[i]

    // Track wrist velocity
    if (prev.landmarks[L_WRIST] && curr.landmarks[L_WRIST]) {
      const dx = curr.landmarks[L_WRIST].x - prev.landmarks[L_WRIST].x
      const dy = curr.landmarks[L_WRIST].y - prev.landmarks[L_WRIST].y
      totalWristVelocity += Math.sqrt(dx * dx + dy * dy)
      maxWristDisplacement = Math.max(maxWristDisplacement, Math.abs(dx) + Math.abs(dy))
      wristVelocityCount++
    }

    if (prev.landmarks[R_WRIST] && curr.landmarks[R_WRIST]) {
      const dx = curr.landmarks[R_WRIST].x - prev.landmarks[R_WRIST].x
      const dy = curr.landmarks[R_WRIST].y - prev.landmarks[R_WRIST].y
      totalWristVelocity += Math.sqrt(dx * dx + dy * dy)
      maxWristDisplacement = Math.max(maxWristDisplacement, Math.abs(dx) + Math.abs(dy))
      wristVelocityCount++
    }

    // Track head movement
    if (curr.landmarks[NOSE]) {
      headPositions.push({ x: curr.landmarks[NOSE].x, y: curr.landmarks[NOSE].y })
      if (headPositions.length > 1) {
        const lastHead = headPositions[headPositions.length - 2]
        const headDist = Math.sqrt(
          (curr.landmarks[NOSE].x - lastHead.x) ** 2 + (curr.landmarks[NOSE].y - lastHead.y) ** 2,
        )
        if (headDist > 0.01) headMovements++
      }
    }
  }

  const avgWristVelocity = wristVelocityCount > 0 ? totalWristVelocity / wristVelocityCount : 0
  const durationSec = poseFrames.length / sourceFps

  // Compute movement style metrics
  const energyLevel = Math.min(1, avgWristVelocity * 50) // Scale to 0-1
  const gestureAmplitude = Math.min(1, maxWristDisplacement * 10)
  const headMovementFrequency = durationSec > 0 ? (headMovements / durationSec) * 60 : 0

  // Compute smoothness from velocity variance
  const velocities: number[] = []
  for (let i = 1; i < poseFrames.length; i++) {
    const prev = poseFrames[i - 1]
    const curr = poseFrames[i]
    if (prev.landmarks[L_WRIST] && curr.landmarks[L_WRIST]) {
      const dx = curr.landmarks[L_WRIST].x - prev.landmarks[L_WRIST].x
      const dy = curr.landmarks[L_WRIST].y - prev.landmarks[L_WRIST].y
      velocities.push(Math.sqrt(dx * dx + dy * dy))
    }
  }
  const avgVel = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0
  const velVariance =
    velocities.length > 0 ? velocities.reduce((s, v) => s + (v - avgVel) ** 2, 0) / velocities.length : 0
  const smoothness = Math.max(0, 1 - Math.min(1, velVariance * 100))

  // Simple gesture detection: find peaks in wrist velocity above threshold
  const gestures: GesturePattern[] = []
  const gestureThreshold = avgWristVelocity * 2
  let inGesture = false
  let gestureStart = 0
  let gestureId = 0
  const gestureKeyframes: GestureKeyframe[] = []

  for (let i = 0; i < velocities.length; i++) {
    if (velocities[i] > gestureThreshold && !inGesture) {
      inGesture = true
      gestureStart = i
      gestureKeyframes.length = 0
    } else if ((velocities[i] < gestureThreshold || i === velocities.length - 1) && inGesture) {
      inGesture = false
      const gestureLength = i - gestureStart
      if (gestureLength > 3) {
        // Extract keyframes at start, peak, and end
        const peakIdx = gestureStart + Math.floor(gestureLength / 2)
        const frame = poseFrames[peakIdx]
        if (frame) {
          const kfs: GestureKeyframe[] = [
            { time: 0, joints: {} },
            { time: 0.5, joints: {} },
            { time: 1, joints: {} },
          ]
          for (const kf of kfs) {
            for (let lm = 0; lm < frame.landmarks.length; lm++) {
              kf.joints[`lm_${lm}`] = {
                x: frame.landmarks[lm].x,
                y: frame.landmarks[lm].y,
                z: frame.landmarks[lm].z,
              }
            }
          }
          gestures.push({
            id: `gesture_${gestureId++}`,
            name: `Gesture ${gestureId}`,
            description: gestureAmplitude > 0.6 ? 'Expressive hand gesture' : 'Subtle hand movement',
            frequency: 1,
            duration: gestureLength / sourceFps,
            involvedParts: ['wrist', 'elbow', 'shoulder'],
            keyframes: kfs,
          })
        }
      }
    }
  }

  // Determine dominant hand from average wrist displacement
  let leftTotal = 0
  let rightTotal = 0
  for (let i = 1; i < poseFrames.length; i++) {
    const prev = poseFrames[i - 1]
    const curr = poseFrames[i]
    if (prev.landmarks[L_WRIST] && curr.landmarks[L_WRIST]) {
      leftTotal += Math.abs(curr.landmarks[L_WRIST].x - prev.landmarks[L_WRIST].x)
    }
    if (prev.landmarks[R_WRIST] && curr.landmarks[R_WRIST]) {
      rightTotal += Math.abs(curr.landmarks[R_WRIST].x - prev.landmarks[R_WRIST].x)
    }
  }

  const dominantHand =
    Math.abs(leftTotal - rightTotal) < 0.1 * Math.max(leftTotal, rightTotal)
      ? 'ambidextrous'
      : leftTotal > rightTotal
        ? 'left'
        : 'right'

  return {
    gestures,
    movementStyle: {
      energyLevel,
      smoothness,
      gestureAmplitude,
      headMovementFrequency,
      idleBehaviors: energyLevel < 0.3 ? ['still', 'minimal fidgeting'] : ['hand gestures', 'head nodding'],
      dominantHand,
    },
  }
}

/**
 * Build a character generation prompt from the extracted profile.
 */
export function buildGenerationPrompt(profile: PersonCloneProfile): string {
  const { facialFeatures, hairFeatures, bodyFeatures, styleFeatures } = profile
  const styleModifier = CLONE_STYLE_MODIFIERS[profile.artStyle]
  const likenessWeight = profile.likenessStrength / 100

  const parts: string[] = [
    `A full character portrait of a person with`,
    `${facialFeatures.faceShape} face shape,`,
    `${facialFeatures.eyeShape} ${facialFeatures.eyeColor} eyes (${facialFeatures.eyeSpacing} set),`,
    `${facialFeatures.noseShape} nose,`,
    `${facialFeatures.mouthShape} mouth,`,
    `${facialFeatures.chinShape} chin,`,
    `${facialFeatures.cheekStructure},`,
    `${hairFeatures.length} ${hairFeatures.texture} ${hairFeatures.color} hair in ${hairFeatures.style} style,`,
    `${bodyFeatures.skinTone} skin tone,`,
    `${bodyFeatures.build} build,`,
  ]

  if (styleFeatures.clothingStyle) {
    parts.push(`wearing ${styleFeatures.clothingStyle},`)
  }

  if (styleFeatures.accessories.length > 0) {
    parts.push(`with ${styleFeatures.accessories.join(', ')},`)
  }

  if (styleFeatures.distinctiveFeatures.length > 0 && likenessWeight > 0.5) {
    parts.push(`distinctive features: ${styleFeatures.distinctiveFeatures.join(', ')},`)
  }

  parts.push(`${styleModifier},`)
  parts.push('white background, full body visible, centered composition, front-facing')

  return parts.join(' ')
}

/**
 * Create a full person clone profile from a photo.
 */
export async function createCloneFromPhoto(
  photoDataUrl: string,
  name: string,
  artStyle: PersonCloneStyle = 'cartoon',
  likenessStrength: number = 75,
  onProgress?: (progress: PersonCloneProgress) => void,
): Promise<PersonCloneProfile> {
  const id = `clone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const profile = createEmptyCloneProfile(id, name)
  profile.sourcePhoto = photoDataUrl
  profile.artStyle = artStyle
  profile.likenessStrength = likenessStrength

  onProgress?.({
    status: 'analyzing-photo',
    message: 'Analyzing photo features...',
    percentage: 10,
  })

  // Extract features from photo
  const features = await analyzePhotoFeatures(photoDataUrl, onProgress)
  profile.facialFeatures = features.facialFeatures
  profile.hairFeatures = features.hairFeatures
  profile.bodyFeatures = features.bodyFeatures
  profile.styleFeatures = features.styleFeatures

  onProgress?.({
    status: 'building-profile',
    message: 'Building character profile...',
    percentage: 70,
  })

  // Build generation prompt
  profile.generationPrompt = buildGenerationPrompt(profile)

  onProgress?.({
    status: 'complete',
    message: 'Person clone profile created',
    percentage: 100,
  })

  return profile
}

/**
 * Estimate voice characteristics from basic audio analysis.
 * This is a simplified version — real implementation would use
 * Web Audio API for pitch detection and ElevenLabs voice matching.
 */
export function estimateVoiceCharacteristics(_audioContext?: AudioContext): VoiceCharacteristics {
  // Placeholder: return reasonable defaults
  // A full implementation would analyze pitch, speaking rate, etc.
  return {
    pitchRange: { low: 85, high: 300, average: 165 },
    speakingSpeed: 140,
    qualities: ['clear', 'natural'],
    recommendedVoiceId: null,
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.5,
    },
  }
}

/**
 * Generate a full 2D character from a PersonCloneProfile.
 *
 * Uses the profile's source photo as the reference image and the
 * generation prompt (built from Gemini analysis) as the style prompt.
 * Runs the NB2 sprite sheet pipeline (visemes + expression variants),
 * saves the character to the library, and places it on the canvas.
 *
 * Returns the saved character ID.
 */
export async function generateCharacterFromProfile(
  profile: PersonCloneProfile,
  onProgress?: (progress: PersonCloneProgress) => void,
): Promise<string> {
  if (!profile.sourcePhoto) {
    throw new Error('Profile has no source photo')
  }

  if (!profile.generationPrompt) {
    throw new Error('Profile has no generation prompt. Analyze the photo first.')
  }

  // Step 1: Generate viseme sprite sheet (8x3 = 24 sprites)
  onProgress?.({
    status: 'generating-character',
    message: 'Generating viseme sprites...',
    percentage: 10,
  })

  const sprites = await generateAllVisemeSprites(
    {
      referenceImage: profile.sourcePhoto,
      stylePrompt: profile.generationPrompt,
    },
    (p) => {
      onProgress?.({
        status: 'generating-character',
        message: p.current || 'Generating viseme sprites...',
        percentage: 10 + Math.round((p.completed / Math.max(p.total, 1)) * 40),
      })
    },
  )

  // Step 2: Generate eye & eyebrow expression variants
  onProgress?.({
    status: 'generating-character',
    message: 'Generating expression variants...',
    percentage: 55,
  })

  let eyeVariants = undefined
  let eyebrowVariants = undefined

  try {
    const expressionResult = await generateAllEmotionHeads(
      {
        referenceImage: profile.sourcePhoto,
        stylePrompt: profile.generationPrompt,
      },
      (p) => {
        onProgress?.({
          status: 'generating-character',
          message: p.current || 'Generating expression variants...',
          percentage: 55 + Math.round((p.completed / Math.max(p.total, 1)) * 25),
        })
      },
    )
    eyeVariants = expressionResult.eyeVariants
    eyebrowVariants = expressionResult.eyebrowVariants
  } catch (err) {
    // Expression variant generation is optional; log but don't fail
    console.warn('[PersonClone] Expression variant generation failed, continuing without:', err)
  }

  // Step 3: Build viseme sprite map
  onProgress?.({
    status: 'generating-character',
    message: 'Building sprite map...',
    percentage: 82,
  })

  const visemeCount = Object.values(sprites).filter((s) => s !== null).length
  const visemeSpriteMap = visemeCount > 0 ? buildVisemeSpriteMapFromCurved(sprites) : undefined

  // Step 4: Save character to the character library
  onProgress?.({
    status: 'generating-character',
    message: 'Saving character...',
    percentage: 88,
  })

  const characterId = `char_${Date.now()}`
  const newCharacter: SavedCharacter = {
    id: characterId,
    name: profile.name,
    referenceImage: profile.sourcePhoto,
    stylePrompt: profile.generationPrompt,
    curvedVisemes: sprites,
    eyeVariants,
    eyebrowVariants,
    createdAt: Date.now(),
    visemeSpriteMap,
  }

  const { addCharacter, selectCharacter, persistImages } = useSavedCharactersStore.getState()

  addCharacter(newCharacter)
  selectCharacter(characterId)

  // Persist image data to IndexedDB
  persistImages(characterId).catch((err) => console.warn('[PersonClone] Failed to persist character images:', err))

  // Step 5: Load sprites into config store for immediate playback
  const { setCurvedVisemes, setUseCurvedVisemes, setEyeVariantSprites, setEyebrowVariantSprites } =
    useCharacterConfigStore.getState()

  if (visemeCount > 0) {
    setCurvedVisemes(sprites)
    setUseCurvedVisemes(true)
    if (visemeSpriteMap) {
      useCharacterConfigStore.getState().setVisemeSpriteMap(visemeSpriteMap)
    }
  }

  if (eyeVariants) {
    const eyeCount = Object.values(eyeVariants).filter((v) => v !== null).length
    if (eyeCount > 0) setEyeVariantSprites(eyeVariants)
  }
  if (eyebrowVariants) {
    const browCount = Object.values(eyebrowVariants).filter((v) => v !== null).length
    if (browCount > 0) setEyebrowVariantSprites(eyebrowVariants)
  }

  // Step 6: Place character on canvas as a dialogue character
  onProgress?.({
    status: 'generating-character',
    message: 'Placing character on canvas...',
    percentage: 95,
  })

  const { characters: dialogueChars, addDialogueCharacter, selectDialogueCharacter } = useMultiCharacterStore.getState()
  const { canvasWidth, canvasHeight } = useCanvasStore.getState()
  const { aspectRatio } = useEditorStore.getState()
  const charCount = dialogueChars.length + 1
  const layouts = computeCharacterLayout(charCount, aspectRatio as AspectRatioKey)
  const layout = layouts[charCount - 1] || layouts[0]

  const newDialogueId = addDialogueCharacter({
    name: newCharacter.name,
    savedCharacterId: newCharacter.id,
    position: {
      x: Math.round((layout.position.x * canvasWidth) / 100),
      y: Math.round((layout.position.y * canvasHeight) / 100),
    },
    scale: layout.scale,
    zIndex: dialogueChars.length,
    visible: true,
    locked: false,
    voiceId: null,
    color: '',
  })
  selectDialogueCharacter(newDialogueId)

  onProgress?.({
    status: 'complete',
    message: 'Character generated successfully!',
    percentage: 100,
  })

  return characterId
}
