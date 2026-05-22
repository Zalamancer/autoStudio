import { Router } from 'express'
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai'

const router = Router()

const TEXT_MODEL = 'gemini-3.1-flash-lite-preview'

// Lazy-init Vertex AI to avoid crashing the server if GCP_PROJECT_ID is unset
let _vertexAI: VertexAI | null = null
function getVertexAI(): VertexAI {
  if (!_vertexAI) {
    const projectId = process.env.GCP_PROJECT_ID
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required for auto-rig')
    }
    const location = process.env.GCP_LOCATION || 'us-central1'
    _vertexAI = new VertexAI({ project: projectId, location })
  }
  return _vertexAI
}

interface JointDetection {
  id: string
  name: string
  x: number
  y: number
  parentId: string | null
  category: string
}

/**
 * POST /api/auto-rig
 * Body: { referenceImage: string (base64 data URL or raw base64), imageWidth: number, imageHeight: number }
 * Returns: { skeleton: { joints: JointDetection[], rootJointId: string } }
 */
router.post('/', async (req, res) => {
  try {
    const { referenceImage, imageWidth, imageHeight } = req.body

    if (!referenceImage) {
      return res.status(400).json({ error: 'referenceImage is required' })
    }

    // Extract base64 data from data URL if needed
    let base64Data = referenceImage
    let mimeType = 'image/png'
    if (referenceImage.startsWith('data:')) {
      const match = referenceImage.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        mimeType = match[1]
        base64Data = match[2]
      }
    }

    // Vertex AI doesn't support SVG — reject with a clear message
    if (mimeType === 'image/svg+xml') {
      return res.status(400).json({
        error: 'SVG images must be rasterized to PNG before auto-rigging. Please re-create the rig.'
      })
    }

    const prompt = `You are a professional character rigger. Analyze this 2D character image and identify precise skeleton joint positions for a 2D animation rigging system.

IMAGE DIMENSIONS: ${imageWidth}x${imageHeight} pixels (origin = top-left corner, x increases rightward, y increases downward).

CRITICAL PLACEMENT RULES:
- Place joints at the CENTER of the limb/body part at each anatomical landmark
- hip_center should be at the belt/waist line, horizontally centered on the pelvis
- spine_mid should be vertically between hip_center and chest
- chest should be at the sternum/upper ribcage level
- Shoulders should be where the arm meets the torso (not the outer edge of the shoulder)
- Elbows should be at the bend point of the arm (middle of upper/lower arm transition)
- Wrists should be where the hand meets the forearm
- Knees should be at the bend point of the leg
- Ankles should be where the foot meets the shin
- head_top should be at the very top of the head/hair
- LEFT/RIGHT is from the CHARACTER'S perspective (left_shoulder = viewer's right side for front-facing characters)

BODY JOINTS (always include all visible ones — the more joints, the better the rig):
- hip_center (root — center of hips/waist)
- spine_mid (middle of torso, between hip and chest)
- chest (upper chest / sternum)
- neck (base of neck, where neck meets shoulders)
- head_top (top of head including hair)
- left_shoulder, left_elbow, left_wrist
- right_shoulder, right_elbow, right_wrist
- left_hip, left_knee, left_ankle
- right_hip, right_knee, right_ankle

FINGER JOINTS (only if hands are clearly visible and large enough to distinguish fingers):

Left hand (children of left_wrist):
- left_thumb_1, left_thumb_2
- left_index_1, left_index_2, left_index_3
- left_middle_1, left_middle_2, left_middle_3
- left_ring_1, left_ring_2, left_ring_3
- left_pinky_1, left_pinky_2, left_pinky_3

Right hand (children of right_wrist):
- right_thumb_1, right_thumb_2
- right_index_1, right_index_2, right_index_3
- right_middle_1, right_middle_2, right_middle_3
- right_ring_1, right_ring_2, right_ring_3
- right_pinky_1, right_pinky_2, right_pinky_3

HIERARCHY (parentId for each joint):
hip_center(null) → spine_mid → chest → neck → head_top
hip_center → left_hip → left_knee → left_ankle
hip_center → right_hip → right_knee → right_ankle
chest → left_shoulder → left_elbow → left_wrist → [finger chains]
chest → right_shoulder → right_elbow → right_wrist → [finger chains]

CATEGORY values: "root", "torso", "head", "arm-left", "arm-right", "hand-left", "hand-right", "leg-left", "leg-right"

VALIDATION CHECKS (verify before responding):
1. spine_mid.y must be between hip_center.y and chest.y
2. Shoulders should be at roughly the same y-coordinate (within 10% of image height)
3. For a front-facing character: left_shoulder.x > right_shoulder.x (character's left = viewer's right)
4. Elbows must be between shoulder and wrist (both x and y)
5. Knees must be between hip and ankle (y-coordinate)
6. All joints must be within the visible character silhouette, not in empty/transparent space

Respond ONLY with JSON (no markdown fences, no explanation):
{
  "joints": [
    { "id": "hip_center", "name": "Hip Center", "x": 100, "y": 200, "parentId": null, "category": "root" },
    { "id": "spine_mid", "name": "Spine Mid", "x": 100, "y": 175, "parentId": "hip_center", "category": "torso" }
  ],
  "rootJointId": "hip_center"
}`

    const model = getVertexAI().getGenerativeModel({
      model: TEXT_MODEL,
      generationConfig: {
        temperature: 0.1,
        topP: 0.85,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      }],
    })

    const result = response.response
    const textContent = result.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.text
    )

    if (!textContent || !('text' in textContent)) {
      return res.status(500).json({ error: 'No text response from Gemini' })
    }

    // Parse the JSON response
    let parsed: { joints: JointDetection[]; rootJointId: string }
    try {
      const rawText = textContent.text!.trim()
      // Remove markdown code fences if present
      const jsonText = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      parsed = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error('Failed to parse Gemini auto-rig response:', textContent.text)
      return res.status(500).json({ error: 'Failed to parse AI response as JSON' })
    }

    // Validate and sanitize joints
    const validCategories = new Set(['root', 'torso', 'head', 'arm-left', 'arm-right', 'hand-left', 'hand-right', 'leg-left', 'leg-right', 'tail', 'other'])
    const w = imageWidth || 512
    const h = imageHeight || 512
    const sanitizedJoints = parsed.joints
      .filter((j: JointDetection) => j.id && typeof j.x === 'number' && typeof j.y === 'number')
      .map((j: JointDetection) => ({
        id: j.id,
        name: j.name || j.id,
        x: Math.round(Math.max(0, Math.min(j.x, w))),
        y: Math.round(Math.max(0, Math.min(j.y, h))),
        parentId: j.parentId || null,
        category: validCategories.has(j.category) ? j.category : 'other',
      }))

    // Build joint lookup for validation
    const jointMap = new Map(sanitizedJoints.map((j: JointDetection) => [j.id, j]))

    // Post-processing: fix broken parent references
    for (const joint of sanitizedJoints) {
      if (joint.parentId && !jointMap.has(joint.parentId)) {
        // Parent doesn't exist — try to find the correct parent from hierarchy
        const hierarchyParents: Record<string, string> = {
          spine_mid: 'hip_center', chest: 'spine_mid', neck: 'chest', head_top: 'neck',
          left_shoulder: 'chest', left_elbow: 'left_shoulder', left_wrist: 'left_elbow',
          right_shoulder: 'chest', right_elbow: 'right_shoulder', right_wrist: 'right_elbow',
          left_hip: 'hip_center', left_knee: 'left_hip', left_ankle: 'left_knee',
          right_hip: 'hip_center', right_knee: 'right_hip', right_ankle: 'right_knee',
        }
        const expectedParent = hierarchyParents[joint.id]
        if (expectedParent && jointMap.has(expectedParent)) {
          joint.parentId = expectedParent
        } else {
          // Fall back to root
          joint.parentId = jointMap.has('hip_center') ? 'hip_center' : null
        }
      }
    }

    // Post-processing: validate spine_mid is between hip_center and chest
    const hipJoint = jointMap.get('hip_center')
    const spineJoint = jointMap.get('spine_mid')
    const chestJoint = jointMap.get('chest')
    if (hipJoint && spineJoint && chestJoint) {
      const minY = Math.min(hipJoint.y, chestJoint.y)
      const maxY = Math.max(hipJoint.y, chestJoint.y)
      if (spineJoint.y < minY || spineJoint.y > maxY) {
        // spine_mid is outside the hip-chest range — fix it
        spineJoint.x = Math.round((hipJoint.x + chestJoint.x) / 2)
        spineJoint.y = Math.round((hipJoint.y + chestJoint.y) / 2)
      }
    }

    // Post-processing: check elbow is between shoulder and wrist (interpolate if wildly off)
    for (const side of ['left', 'right'] as const) {
      const shoulder = jointMap.get(`${side}_shoulder`)
      const elbow = jointMap.get(`${side}_elbow`)
      const wrist = jointMap.get(`${side}_wrist`)
      if (shoulder && elbow && wrist) {
        // Check if elbow is roughly between shoulder and wrist
        const midX = (shoulder.x + wrist.x) / 2
        const midY = (shoulder.y + wrist.y) / 2
        const armLen = Math.sqrt((wrist.x - shoulder.x) ** 2 + (wrist.y - shoulder.y) ** 2)
        const elbowDist = Math.sqrt((elbow.x - midX) ** 2 + (elbow.y - midY) ** 2)
        // If elbow is further than the arm length from the midpoint, it's wrong
        if (elbowDist > armLen * 0.8) {
          elbow.x = Math.round(midX)
          elbow.y = Math.round(midY)
        }
      }
      // Same check for knee between hip and ankle
      const hip = jointMap.get(`${side}_hip`)
      const knee = jointMap.get(`${side}_knee`)
      const ankle = jointMap.get(`${side}_ankle`)
      if (hip && knee && ankle) {
        const midX = (hip.x + ankle.x) / 2
        const midY = (hip.y + ankle.y) / 2
        const legLen = Math.sqrt((ankle.x - hip.x) ** 2 + (ankle.y - hip.y) ** 2)
        const kneeDist = Math.sqrt((knee.x - midX) ** 2 + (knee.y - midY) ** 2)
        if (kneeDist > legLen * 0.8) {
          knee.x = Math.round(midX)
          knee.y = Math.round(midY)
        }
      }
    }

    // Post-processing: remove duplicate joints (same id)
    const seen = new Set<string>()
    const dedupedJoints = sanitizedJoints.filter((j: JointDetection) => {
      if (seen.has(j.id)) return false
      seen.add(j.id)
      return true
    })

    // Ensure root joint exists
    const rootId = parsed.rootJointId || dedupedJoints[0]?.id || 'hip_center'

    res.json({
      skeleton: {
        joints: dedupedJoints.map((j: JointDetection) => ({
          id: j.id,
          name: j.name,
          parentId: j.parentId,
          restPosition: { x: j.x, y: j.y },
          category: j.category,
        })),
        rootJointId: rootId,
      },
    })
  } catch (error: any) {
    console.error('Auto-rig error:', error?.message || error)
    res.status(500).json({ error: error?.message || 'Auto-rig failed' })
  }
})

/**
 * POST /api/character-landmarks
 * Body: { referenceImage: string (base64 data URL or raw base64) }
 * Returns: CharacterLandmarks with normalized 0-1 coordinates
 *
 * Used by the sprite auto-alignment system to detect facial feature
 * positions on the concept image after AI character generation.
 */
router.post('/character-landmarks', async (req, res) => {
  try {
    const { referenceImage } = req.body

    if (!referenceImage) {
      return res.status(400).json({ error: 'referenceImage is required' })
    }

    // Extract base64 data from data URL if needed
    let base64Data = referenceImage
    let mimeType = 'image/png'
    if (referenceImage.startsWith('data:')) {
      const match = referenceImage.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        mimeType = match[1]
        base64Data = match[2]
      }
    }

    if (mimeType === 'image/svg+xml') {
      return res.status(400).json({
        error: 'SVG images must be rasterized to PNG before landmark detection.'
      })
    }

    const prompt = `Analyze this 2D character image and identify key landmark positions for aligning character parts (head, mouth, eyes, hair) onto the body.

Return the following landmarks as normalized coordinates where (0,0) is the top-left corner and (1,1) is the bottom-right corner of the image:

1. faceCenter: The center of the face (midpoint between forehead and chin, horizontally centered on face)
2. mouthCenter: The center of the mouth/lips
3. eyeCenter: The midpoint between both eyes
4. hairlineCenter: The center of the hairline (top of the forehead where hair begins)
5. faceTop: The y-coordinate of the top of the forehead (just the y value)
6. faceBottom: The y-coordinate of the bottom of the chin (just the y value)
7. bodyTop: The y-coordinate of the topmost point of the character (head top)
8. bodyBottom: The y-coordinate of the bottommost point of the character (feet)

IMPORTANT:
- All x and y values must be between 0 and 1 (normalized to image dimensions)
- Be precise — these landmarks are used for automatic part alignment
- If the character is facing forward, faceCenter.x should be near 0.5
- bodyTop should be close to the top of the head, bodyBottom near the feet

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "faceCenter": { "x": 0.5, "y": 0.3 },
  "mouthCenter": { "x": 0.5, "y": 0.4 },
  "eyeCenter": { "x": 0.5, "y": 0.28 },
  "hairlineCenter": { "x": 0.5, "y": 0.2 },
  "faceTop": 0.18,
  "faceBottom": 0.45,
  "bodyTop": 0.05,
  "bodyBottom": 0.95
}`

    const model = getVertexAI().getGenerativeModel({
      model: TEXT_MODEL,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      }],
    })

    const result = response.response
    const textContent = result.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.text
    )

    if (!textContent || !('text' in textContent)) {
      return res.status(500).json({ error: 'No text response from Gemini' })
    }

    let parsed: any
    try {
      const rawText = textContent.text!.trim()
      const jsonText = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      parsed = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error('Failed to parse landmark response:', textContent.text)
      return res.status(500).json({ error: 'Failed to parse AI response as JSON' })
    }

    // Validate and clamp all coordinates to 0-1
    const clamp = (v: number) => Math.max(0, Math.min(1, v || 0))
    const clampPoint = (p: any) => ({
      x: clamp(p?.x ?? 0.5),
      y: clamp(p?.y ?? 0.5),
    })

    const landmarks = {
      faceCenter: clampPoint(parsed.faceCenter),
      mouthCenter: clampPoint(parsed.mouthCenter),
      eyeCenter: clampPoint(parsed.eyeCenter),
      hairlineCenter: clampPoint(parsed.hairlineCenter),
      faceTop: clamp(parsed.faceTop ?? 0.15),
      faceBottom: clamp(parsed.faceBottom ?? 0.5),
      bodyTop: clamp(parsed.bodyTop ?? 0.05),
      bodyBottom: clamp(parsed.bodyBottom ?? 0.95),
    }

    res.json(landmarks)
  } catch (error: any) {
    console.error('Character landmarks error:', error?.message || error)
    res.status(500).json({ error: error?.message || 'Landmark detection failed' })
  }
})

export default router
