/**
 * Step Executor: Setup Characters + matchVoicesToCharacters
 */

import type { ClipPlan, ClipPlanCharacter } from '@/types/orchestrator'
import { debugWarn } from '@/utils/debug'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { removeImageBackground } from '@/services/backgroundRemoval'
import { generateAllVisemeSprites } from '@/services/nanoBanana'
import { loadCachedRig, loadSharedAnimationsForRig, getAllCachedRigs } from '@/services/rigCache'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'
import { matchPlanCharacterToIdentity } from '@/services/characterIdentityService'
import { logger } from '@/utils/logger'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'

export async function executeSetupCharacters(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const savedChars = useSavedCharactersStore.getState().characters
  const saved3DChars = useSaved3DCharactersStore.getState().characters
  const multiStore = useMultiCharacterStore.getState()
  const char3DStore = use3DCharacterStore.getState()

  // Canvas dimensions for converting Gemini's percentage positions (0-100) to absolute pixels
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  for (const planChar of plan.characters) {
    const is3D = planChar.dimension === '3d'

    if (is3D) {
      // ── 3D Character Setup ──
      let saved3DCharId: string | null = null
      if (planChar.savedCharacterName) {
        const match = saved3DChars.find((sc) => sc.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase())
        if (match) {
          saved3DCharId = match.id
          ctx.savedCharacterIdMap.set(planChar.name, match.id)
        }
      }

      // Fuzzy match if exact match failed
      if (!saved3DCharId) {
        const fuzzyMatch = saved3DChars.find(
          (sc) =>
            sc.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
            planChar.name.toLowerCase().includes(sc.name.toLowerCase()),
        )
        if (fuzzyMatch) {
          saved3DCharId = fuzzyMatch.id
          ctx.savedCharacterIdMap.set(planChar.name, fuzzyMatch.id)
        }
      }

      const pixelX = Math.round((planChar.position.x / 100) * dims.w)
      const pixelY = Math.round((planChar.position.y / 100) * dims.h)

      const charId = char3DStore.add3DCharacter({
        name: planChar.name,
        saved3DCharacterId: saved3DCharId,
        position: { x: pixelX, y: pixelY, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: planChar.scale || 1,
        zIndex: 7,
        visible: true,
        locked: false,
        activeAnimationId: null,
        animationSpeed: 1,
        voiceId: null,
        color: '',
      })

      ctx.characterIdMap.set(planChar.name, charId)
    } else {
      // ── 2D Character Setup ──
      let savedCharId: string | null = null
      let identityVoiceId: string | null = null

      // First: try identity resolution for deterministic character matching
      const identities = useCharacterIdentityStore.getState().identities
      const identityMatch = matchPlanCharacterToIdentity(planChar, identities)
      if (identityMatch && identityMatch.confidence >= 0.7) {
        const identity = identityMatch.identity
        if (identity.savedCharacterId) {
          const match = savedChars.find((sc) => sc.id === identity.savedCharacterId)
          if (match) {
            savedCharId = match.id
            ctx.savedCharacterIdMap.set(planChar.name, match.id)
            identityVoiceId = identity.voiceId
            logger.log(
              `[Orchestrator:char] Identity match: "${identity.name}" -> "${match.name}" (confidence: ${identityMatch.confidence})`,
            )
          }
        }
      }

      // Fall back to existing fuzzy match if identity didn't resolve
      console.log(
        `[Orchestrator:char] Looking for saved character: planChar.name="${planChar.name}", planChar.savedCharacterName="${planChar.savedCharacterName || '(none)'}", available saved chars: [${savedChars.map((c) => `"${c.name}"`).join(', ')}]`,
      )
      if (!savedCharId && planChar.savedCharacterName) {
        const match = savedChars.find((sc) => sc.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase())
        if (match) {
          savedCharId = match.id
          ctx.savedCharacterIdMap.set(planChar.name, match.id)
          console.log(`[Orchestrator:char] Exact match found: "${match.name}" (id=${match.id.slice(-6)})`)
        }
      }

      // Fuzzy match if exact match and identity match both failed
      if (!savedCharId) {
        const fuzzyMatch = savedChars.find(
          (sc) =>
            sc.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
            planChar.name.toLowerCase().includes(sc.name.toLowerCase()),
        )
        if (fuzzyMatch) {
          savedCharId = fuzzyMatch.id
          ctx.savedCharacterIdMap.set(planChar.name, fuzzyMatch.id)
          console.log(`[Orchestrator:char] Fuzzy match found: "${fuzzyMatch.name}" (id=${fuzzyMatch.id.slice(-6)})`)
        } else {
          console.log(`[Orchestrator:char] No match found for "${planChar.name}" — savedCharId will be null`)
        }
      }

      // Generate new 2D character via Vertex AI if plan requests it and no match found
      if (!savedCharId && planChar.generateNew) {
        try {
          const stylePrompt = planChar.referenceDescription || `${planChar.name}, character sprite, cartoon style`
          logger.log(`[Orchestrator] Generating new 2D character "${planChar.name}" via Vertex AI`)
          const sprites = await generateAllVisemeSprites({ stylePrompt, referenceImage: '' })
          if (sprites) {
            // Collect all sprite data URLs into body parts structure
            const bodyParts: Record<string, string[]> = { body: [], viseme: [] }
            // Put all viseme sprites into the viseme array (ordered by curvature x viseme)
            for (const curvature of ['upward', 'neutral', 'downward'] as const) {
              for (const viseme of ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest'] as const) {
                const key = `${curvature}_${viseme}` as keyof typeof sprites
                if (sprites[key]) {
                  bodyParts.viseme.push(sprites[key]!)
                }
              }
            }
            // Use neutral_Rest as the body sprite
            if (sprites.neutral_Rest) {
              bodyParts.body.push(sprites.neutral_Rest)
            }

            const savedStore = useSavedCharactersStore.getState()
            const newCharId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
            savedStore.addCharacter({
              id: newCharId,
              name: planChar.name,
              referenceImage: bodyParts.body[0] || '',
              stylePrompt: stylePrompt,
              curvedVisemes: sprites,
              createdAt: Date.now(),
              bodyParts,
            })
            savedCharId = newCharId
            ctx.savedCharacterIdMap.set(planChar.name, newCharId)
            logger.log(`[Orchestrator] Generated and saved new character "${planChar.name}" (id: ${newCharId})`)
          }
        } catch (err) {
          // Non-fatal: continue with no sprites
          logger.warn(`[Orchestrator] Character generation failed for "${planChar.name}":`, err)
        }
      }

      const pixelX = Math.round((planChar.position.x / 100) * dims.w)
      const pixelY = Math.round((planChar.position.y / 100) * dims.h)

      const charId = multiStore.addDialogueCharacter({
        name: planChar.name,
        savedCharacterId: savedCharId,
        position: { x: pixelX, y: pixelY },
        scale: planChar.scale || 1,
        zIndex: 7,
        visible: true,
        locked: false,
        voiceId: identityVoiceId,
        color: '',
        proceduralAnim: 'talking',
      })

      ctx.characterIdMap.set(planChar.name, charId)

      // Auto-enable rig for this character.
      // Strategy:
      //  1. Check useRigStore for an already-loaded rig (loaded from Supabase on project open)
      //  2. Fall back to localStorage cache (legacy path via loadCachedRig)
      console.log(
        `[Orchestrator:rig] Pre-check: savedCharId=${savedCharId ? savedCharId.slice(-6) : 'NULL'}, charId=${charId.slice(-6)}, will ${savedCharId ? 'search' : 'SKIP'} rig lookup`,
      )
      if (savedCharId) {
        let rigId: string | null = null

        // 1. Check useRigStore — rigs loaded from Supabase are already here
        const rigState = useRigStore.getState()
        const rigCount = Object.keys(rigState.rigs).length
        const savedChar = useSavedCharactersStore.getState().characters.find((c) => c.id === savedCharId)
        const bodySprites = savedChar?.bodyParts?.body || []
        console.log(
          `[Orchestrator:rig] Character "${planChar.name}" (savedCharId=${savedCharId?.slice(-6)}): ${rigCount} rigs in store, ${bodySprites.length} body sprites`,
        )

        if (savedChar) {
          // Match by source image URL in boneriggingSerializedData
          for (const [rId, rig] of Object.entries(rigState.rigs)) {
            if (!rig.boneriggingSerializedData) continue
            try {
              const parsed = JSON.parse(rig.boneriggingSerializedData)
              const srcUrl = parsed.sourceImageUrl || ''
              const matches = bodySprites.includes(srcUrl)
              console.log(
                `[Orchestrator:rig]   rig "${rId}" sourceImageUrl=${srcUrl ? srcUrl.slice(0, 50) + '...' : '(none)'} → match=${matches}`,
              )
              if (srcUrl && matches) {
                rigId = rId
                break
              }
            } catch {
              /* ignore parse errors */
            }
          }
          // Also try matching by rig name containing character name
          if (!rigId) {
            for (const [rId, rig] of Object.entries(rigState.rigs)) {
              if (
                rig.name &&
                savedChar.name &&
                (rig.name.toLowerCase().includes(savedChar.name.toLowerCase()) ||
                  savedChar.name.toLowerCase().includes(rig.name.toLowerCase()))
              ) {
                console.log(
                  `[Orchestrator:rig]   rig "${rId}" name-match: rig.name="${rig.name}" ↔ char.name="${savedChar.name}"`,
                )
                rigId = rId
                break
              }
            }
          }
        }

        // If found in store, set render mode directly
        if (rigId) {
          logger.log(`[Orchestrator] Found rig "${rigId}" in store for character "${planChar.name}"`)
          useCharacterPartsStore.getState().setRenderMode('rigged')
          useCharacterPartsStore.getState().setRigId(rigId)
          useMultiCharacterStore.getState().updateDialogueCharacter(charId, {
            renderMode: 'rigged',
            rigId,
          })
        } else {
          // 2. Fall back to IndexedDB cache (keyed by savedCharId)
          console.log(
            `[Orchestrator:rig]   No rig in store → trying IndexedDB cache for savedCharId=${savedCharId?.slice(-6)}`,
          )
          rigId = await loadCachedRig(savedCharId, charId)
          console.log(`[Orchestrator:rig]   IndexedDB result: rigId=${rigId || '(none)'}`)

          // 3. Scan ALL rig caches by body sprite match (handles ID mismatch / cross-project)
          if (!rigId && savedChar) {
            try {
              const allCached = await getAllCachedRigs()
              for (const { charId: cachedCharId, data: cached } of allCached) {
                if (cached.sourceImageUrl && bodySprites.includes(cached.sourceImageUrl)) {
                  console.log(
                    `[Orchestrator:rig]   Found rig in IndexedDB via body sprite match (charId=${cachedCharId})`,
                  )
                  rigId = await loadCachedRig(cachedCharId, charId)
                  if (rigId) break
                }
              }
            } catch {
              /* non-fatal */
            }
          }
        }

        if (rigId) {
          logger.log(`[Orchestrator] Auto-enabled rig "${rigId}" for character "${planChar.name}"`)

          // Set global activeRigId so the AnimationsPanel can find the rig.
          // Also select this character as active so the panel's per-character
          // rigId lookup works immediately.
          useRigStore.getState().selectRig(rigId)
          useMultiCharacterStore.getState().selectDialogueCharacter(charId)

          // Also load shared animations from IndexedDB (if any)
          const animCount = await loadSharedAnimationsForRig(rigId, charId)
          if (animCount > 0) {
            logger.log(`[Orchestrator] Loaded ${animCount} shared animation(s) for "${planChar.name}"`)
          }

          // Collect available animation names for prompt + auto-select default
          const rigAfterLoad = useRigStore.getState().rigs[rigId]
          if (rigAfterLoad?.boneriggingSerializedData) {
            try {
              const parsed = JSON.parse(rigAfterLoad.boneriggingSerializedData)
              const anims = parsed.animations as Array<{ name: string; duration: number }> | undefined
              if (anims && anims.length > 0) {
                // Store animation info for plan builder and motion step
                const animInfo = anims.map((a, idx) => ({ name: a.name, index: idx, duration: a.duration }))
                ctx.rigAnimationMap.set(planChar.name, animInfo)

                // Auto-select first animation (prefer "idle" or "talking" if available)
                const idleIdx = anims.findIndex((a) => /idle|talking|breathe/i.test(a.name))
                const defaultIdx = idleIdx >= 0 ? idleIdx : 0

                // Select the default animation's pose track
                const poseTracks = useRigStore.getState().poseTracks.filter((t) => t.characterId === charId)
                if (poseTracks[defaultIdx]) {
                  useRigStore.getState().selectCharacterPoseTrack(charId, poseTracks[defaultIdx].id)
                }

                logger.log(
                  `[Orchestrator] Auto-selected animation "${anims[defaultIdx].name}" for "${planChar.name}" (${anims.length} available)`,
                )
              }
            } catch {
              /* ignore parse errors */
            }
          }
        } else {
          console.log(
            `[Orchestrator:rig]   ⚠ No rig found for character "${planChar.name}" — character will render without rigging`,
          )
        }
      }
    }
  }

  // Auto-remove backgrounds from 2D character sprites if enabled
  if (ctx.settings?.autoBgRemoval) {
    const rawMode = ctx.settings.autoBgRemovalMode || 'free'
    const mode: 'local' | 'api' = rawMode === 'aggressive' ? 'api' : 'local'
    const savedStore = useSavedCharactersStore.getState()
    const SPRITE_TABS: Array<'body' | 'head' | 'viseme' | 'hair' | 'eye' | 'eyebrow' | 'shirt' | 'pants' | 'shoes'> = [
      'body',
      'head',
      'viseme',
      'hair',
      'eye',
      'eyebrow',
      'shirt',
      'pants',
      'shoes',
    ]

    for (const planChar of plan.characters) {
      if (planChar.dimension === '3d') continue
      const savedId = ctx.savedCharacterIdMap.get(planChar.name)
      if (!savedId) continue

      const savedChar = savedStore.characters.find((c) => c.id === savedId)
      if (!savedChar?.bodyParts) continue

      const updatedParts = { ...savedChar.bodyParts }
      let changed = false

      for (const tab of SPRITE_TABS) {
        const sprites = updatedParts[tab]
        if (!sprites || sprites.length === 0) continue

        const processed: string[] = []
        for (const sprite of sprites) {
          try {
            const parts = sprite.split(',')
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
            const bstr = atob(parts[1])
            const u8arr = new Uint8Array(bstr.length)
            for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
            const blob = new Blob([u8arr], { type: mime })

            const resultBlob = await removeImageBackground(blob, undefined, mode)

            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = () => reject(new Error('Failed to read blob'))
              reader.readAsDataURL(resultBlob)
            })
            processed.push(dataUrl)
          } catch {
            // Keep original sprite on failure
            processed.push(sprite)
          }
        }
        updatedParts[tab] = processed
        changed = true
      }

      if (changed) {
        savedStore.updateCharacter(savedId, { bodyParts: updatedParts })
        savedStore.persistImages(savedId).catch((err) => debugWarn('orchestrator', 'persistImages failed:', err))
      }
    }
  }

  // Match voices to characters (works for both 2D and 3D)
  await matchVoicesToCharacters(plan.characters, ctx)
}

async function matchVoicesToCharacters(characters: ClipPlanCharacter[], ctx: ExecutionContext): Promise<void> {
  const voiceState = useVoiceStore.getState()

  // Ensure voices are loaded — non-fatal if ElevenLabs isn't configured
  if (voiceState.availableVoices.length === 0) {
    try {
      await voiceState.fetchVoices()
    } catch {
      // ElevenLabs API key may not be configured — voice matching will be skipped
      logger.warn('[Orchestrator] Could not fetch voices — ElevenLabs may not be configured')
    }
  }

  const voices = useVoiceStore.getState().availableVoices
  if (voices.length === 0) {
    // No voices available — skip matching entirely, voice generation step will handle this
    logger.warn('[Orchestrator] No voices available — skipping voice-to-character matching')
    return
  }

  for (const planChar of characters) {
    const charId = ctx.characterIdMap.get(planChar.name)
    if (!charId) continue

    let matchedVoiceId: string | null = null

    // Try to match by preferred voice name
    if (planChar.voiceName) {
      const voiceMatch = voices.find((v) => v.name.toLowerCase().includes(planChar.voiceName!.toLowerCase()))
      if (voiceMatch) {
        matchedVoiceId = voiceMatch.voice_id
      }
    }

    // Fallback: auto-assign from available voices
    if (!matchedVoiceId && voices.length > 0) {
      // Assign different voices to different characters
      const charIndex = [...ctx.characterIdMap.keys()].indexOf(planChar.name)
      matchedVoiceId = voices[charIndex % voices.length].voice_id
    }

    if (matchedVoiceId) {
      ctx.voiceIdMap.set(planChar.name, matchedVoiceId)
      if (planChar.dimension === '3d') {
        use3DCharacterStore.getState().update3DCharacter(charId, {
          voiceId: matchedVoiceId,
        })
      } else {
        useMultiCharacterStore.getState().updateDialogueCharacter(charId, {
          voiceId: matchedVoiceId,
        })
      }
    }
  }
}
