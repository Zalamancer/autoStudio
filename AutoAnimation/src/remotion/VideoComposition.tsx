import { Fill, AudioTrack, Clip, useFrame } from '@/engine'
import { RemotionCharacter } from './RemotionCharacter'
import { RemotionCaptions } from './RemotionCaptions'
import { RemotionVideoLayer } from './RemotionVideoLayer'
import { RemotionMediaLayer } from './RemotionMediaLayer'
import { RemotionTextOverlay } from './RemotionTextOverlay'
import { RemotionShapeLayer } from './RemotionShapeLayer'
import { RemotionAnnotationLayer } from './RemotionAnnotationLayer'
import { RemotionCrowdLayer } from './RemotionCrowdLayer'
import { RemotionArtCurveLayer } from './RemotionArtCurveLayer'
import { Remotion3DLayer } from './Remotion3DLayer'
import { RemotionRiggedCharacter } from './RemotionRiggedCharacter'
import { RemotionHTMLTemplateLayer } from './RemotionHTMLTemplateLayer'
import { RemotionLottieLayer } from './RemotionLottieLayer'
import { RemotionSVGObjectLayer } from './RemotionSVGObjectLayer'
import { RemotionRetentionHookLayer } from './RemotionRetentionHookLayer'
import { RemotionPixelArtCharacter } from './RemotionPixelArtCharacter'
import { RemotionAvatarCharacter } from './RemotionAvatarCharacter'
import { CameraTransformWrapper } from './CameraTransformWrapper'
import { RemotionImageStoryLayer } from './RemotionImageStoryLayer'
import { RemotionStyleFilter } from './RemotionStyleFilter'
import { RemotionStyleEffectFilters } from './RemotionStyleEffectFilters'
import { RemotionTransitionLayer } from './RemotionTransitionLayer'
import { RemotionParticleLayer } from './RemotionParticleLayer'
import { RemotionAudioReactiveLayer } from './RemotionAudioReactiveLayer'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getStyleEffectFilterStyle, isSVGFilterEffect } from '@/services/styleEffectFilters'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import type { VideoCompositionProps } from './types'
import type { ActiveStyleEffect } from '@/types/styleEffects'

/**
 * Wrapper that applies per-character SVG style effect filters (woodcut, cel-shade,
 * neon-outline, glitch, VHS, etc.) to the character's DOM subtree during export.
 * Returns children as-is when no SVG filter effect is active.
 */
function CharacterStyleEffectWrapper({
  activeStyleEffect,
  children,
}: {
  activeStyleEffect?: ActiveStyleEffect
  children: React.ReactNode
}) {
  const frame = useFrame()

  if (!activeStyleEffect || !activeStyleEffect.settings?.enabled) {
    return <>{children}</>
  }

  // SVG filter effects use CSS filter: url(#id)
  if (isSVGFilterEffect(activeStyleEffect.type)) {
    const filterStyle = getStyleEffectFilterStyle(frame, activeStyleEffect)
    if (filterStyle) {
      return <div style={{ filter: filterStyle }}>{children}</div>
    }
  }

  return <>{children}</>
}

/**
 * Wrapper for the single-character (non-dialogue) mode.
 * Reads activeStyleEffect from useCharacterPartsStore at render time.
 */
function SingleCharacterStyleEffectWrapper({ children }: { children: React.ReactNode }) {
  const activeStyleEffect = useCharacterPartsStore.getState().activeStyleEffect
  return <CharacterStyleEffectWrapper activeStyleEffect={activeStyleEffect}>{children}</CharacterStyleEffectWrapper>
}

export const VideoComposition = ({
  fps,
  character,
  audioUrl,
  visemeTimeline,
  emotionTimeline,
  captions,
  animations,
  width,
  height,
  dialogueCharacters,
  videos,
  mediaItems,
  textOverlays,
  shapes,
  artCurves,
  keyframeData,
  characters3D,
  backgroundAudio,
  rigData,
  htmlTemplates,
  svgComposition,
  retentionHooks,
  pixelArtCharacters,
  avatarCharacters,
  cameraPosition,
  cameraFov,
  ambientIntensity,
  keyLightIntensity,
  translationLanguage: _translationLanguage,
  wardrobeLayers,
  annotations,
  crowdGroups,
  clipTransitions,
  particleEmitters,
  audioReactiveVisualizers,
  imageStoryScenes,
  imageStoryAssets,
  imageStoryWordTimings,
}: VideoCompositionProps) => {
  // Background animations (zIndex < 0)
  const backgroundAnimations = animations.filter((a) => a.category === 'background')
  // Overlay animations (zIndex >= 0)
  const overlayAnimations = animations.filter((a) => a.category === 'overlay')

  const transparentExport = useSettingsStore((s) => s.transparentExport)

  return (
    <Fill style={{ backgroundColor: transparentExport ? 'transparent' : '#18181b' }}>
      {/* Checkerboard Pattern for Transparent Mode */}
      {transparentExport ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            opacity: 0.3,
          }}
        />
      ) : (
        /* Grid Pattern Background */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Camera Transform Wrapper — applies zoom/pan/rotation from useCameraStore */}
      <CameraTransformWrapper canvasWidth={width} canvasHeight={height}>
        {/* SVG filter definitions for per-character/per-object style effects
          (woodcut, cel-shade, neon-outline, glitch, VHS, etc.) */}
        <RemotionStyleEffectFilters dialogueCharacters={dialogueCharacters} svgComposition={svgComposition} />

        {/* Style Filter — applies CSS filter effects from useStyleStore */}
        <RemotionStyleFilter>
          {/* Background Animations (Lottie) */}
          {backgroundAnimations.length > 0 && (
            <RemotionLottieLayer animations={backgroundAnimations} canvasWidth={width} canvasHeight={height} />
          )}

          {/* AI Animation Videos */}
          {videos && videos.length > 0 && (
            <RemotionVideoLayer videos={videos} canvasWidth={width} canvasHeight={height} />
          )}

          {/* Media Images */}
          {mediaItems && mediaItems.length > 0 && (
            <RemotionMediaLayer
              mediaItems={mediaItems}
              canvasWidth={width}
              canvasHeight={height}
              keyframeData={keyframeData}
            />
          )}

          {/* Image Story Layer (Freepik images synced to word timings) */}
          {imageStoryScenes && imageStoryAssets && imageStoryWordTimings && (
            <RemotionImageStoryLayer
              scenes={imageStoryScenes}
              selectedAssets={imageStoryAssets}
              wordTimings={imageStoryWordTimings}
              canvasWidth={width}
              canvasHeight={height}
              fps={fps}
            />
          )}

          {/* HTML Motion Graphics Templates (z-index ~1, behind characters) */}
          {htmlTemplates && htmlTemplates.length > 0 && (
            <RemotionHTMLTemplateLayer htmlTemplates={htmlTemplates} canvasWidth={width} canvasHeight={height} />
          )}

          {/* Shapes */}
          {shapes && shapes.length > 0 && <RemotionShapeLayer shapes={shapes} keyframeData={keyframeData} />}

          {/* Art Curves */}
          {artCurves && artCurves.length > 0 && <RemotionArtCurveLayer compositions={artCurves} />}

          {/* Crowd / Background Characters */}
          {crowdGroups && crowdGroups.length > 0 && (
            <RemotionCrowdLayer crowdGroups={crowdGroups} canvasWidth={width} canvasHeight={height} fps={fps} />
          )}

          {/* SVG Object Composition (z-index ~6.5, between shapes and characters) */}
          {svgComposition && svgComposition.objects.length > 0 && (
            <RemotionSVGObjectLayer svgComposition={svgComposition} canvasWidth={width} canvasHeight={height} />
          )}

          {/* Characters & Audio */}
          {dialogueCharacters && dialogueCharacters.length > 0 ? (
            <>
              {dialogueCharacters.map((dChar) => {
                if (!dChar.visible) return null

                // Rigged mode: render rig body mesh + sprite overlays (head, viseme, hair)
                if (dChar.renderMode === 'rigged' && dChar.rigExportData) {
                  const BASE = 200
                  const bw = dChar.boundsWidth ?? BASE
                  const bh = dChar.boundsHeight ?? BASE
                  const displayW = bw * dChar.scale
                  const displayH = bh * dChar.scale
                  const rigW = dChar.rigExportData.imageWidth
                  const rigH = dChar.rigExportData.imageHeight
                  const cssScale = displayW / rigW
                  return (
                    <CharacterStyleEffectWrapper key={dChar.id} activeStyleEffect={dChar.activeStyleEffect}>
                      <div
                        style={{
                          position: 'absolute',
                          left: dChar.position.x - displayW / 2,
                          top: dChar.position.y - displayH / 2,
                          width: displayW,
                          height: displayH,
                          zIndex: dChar.zIndex,
                          overflow: 'visible',
                        }}
                      >
                        {/* Rig body mesh — Canvas2D renderer matches canvas2dRenderer.ts export */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: (displayH - rigH * cssScale) / 2,
                            width: rigW,
                            height: rigH,
                            transform: `scale(${cssScale})`,
                            transformOrigin: 'top left',
                          }}
                        >
                          <RemotionRiggedCharacter rigData={dChar.rigExportData} />
                        </div>
                        {/* Head, viseme, hair sprite overlays — sort by descending startFrame for overlap priority */}
                        <RemotionCharacter
                          character={dChar.savedCharacter}
                          visemeTimeline={[...dChar.dialogueLines]
                            .sort((a, b) => b.startFrame - a.startFrame)
                            .flatMap((l) =>
                              l.visemeTimeline.map((v) => ({
                                ...v,
                                startFrame: v.startFrame + l.startFrame,
                                endFrame: v.endFrame + l.startFrame,
                              })),
                            )}
                          emotionTimeline={[...dChar.dialogueLines]
                            .sort((a, b) => b.startFrame - a.startFrame)
                            .flatMap((l) =>
                              l.emotionTimeline.map((e) => ({
                                ...e,
                                startFrame: e.startFrame + l.startFrame,
                                endFrame: e.endFrame + l.startFrame,
                              })),
                            )}
                          canvasWidth={width}
                          canvasHeight={height}
                          dialogueScale={dChar.scale}
                          dialoguePosition={{ x: displayW / 2, y: displayH / 2 }}
                          skipBody
                          skipHead
                        />
                      </div>
                    </CharacterStyleEffectWrapper>
                  )
                }

                // Sprite mode: use RemotionCharacter for 4-layer composite export
                // Sort by descending startFrame so overlapping lines' later-starting events
                // take priority via .find() in getVisemeAtFrame.
                return (
                  <CharacterStyleEffectWrapper key={dChar.id} activeStyleEffect={dChar.activeStyleEffect}>
                    <RemotionCharacter
                      character={dChar.savedCharacter}
                      visemeTimeline={[...dChar.dialogueLines]
                        .sort((a, b) => b.startFrame - a.startFrame)
                        .flatMap((l) =>
                          l.visemeTimeline.map((v) => ({
                            ...v,
                            startFrame: v.startFrame + l.startFrame,
                            endFrame: v.endFrame + l.startFrame,
                          })),
                        )}
                      emotionTimeline={[...dChar.dialogueLines]
                        .sort((a, b) => b.startFrame - a.startFrame)
                        .flatMap((l) =>
                          l.emotionTimeline.map((e) => ({
                            ...e,
                            startFrame: e.startFrame + l.startFrame,
                            endFrame: e.endFrame + l.startFrame,
                          })),
                        )}
                      canvasWidth={width}
                      canvasHeight={height}
                      dialogueScale={dChar.scale}
                      dialoguePosition={dChar.position}
                    />
                  </CharacterStyleEffectWrapper>
                )
              })}
              {dialogueCharacters.flatMap((dChar) =>
                dChar.dialogueLines
                  .filter((l) => l.audioUrl)
                  .map((line) => (
                    <Clip key={line.id} from={line.startFrame} durationInFrames={line.endFrame - line.startFrame}>
                      <AudioTrack src={line.audioUrl!} />
                    </Clip>
                  )),
              )}
            </>
          ) : (
            <>
              <SingleCharacterStyleEffectWrapper>
                <RemotionCharacter
                  character={character}
                  visemeTimeline={visemeTimeline}
                  emotionTimeline={emotionTimeline}
                  canvasWidth={width}
                  canvasHeight={height}
                  wardrobeLayers={wardrobeLayers}
                />
              </SingleCharacterStyleEffectWrapper>
              {audioUrl && <AudioTrack src={audioUrl} />}
            </>
          )}

          {/* Pixel Art Characters */}
          {pixelArtCharacters && pixelArtCharacters.length > 0 && (
            <RemotionPixelArtCharacter characters={pixelArtCharacters} />
          )}

          {/* Avatar Characters */}
          {avatarCharacters && avatarCharacters.length > 0 && <RemotionAvatarCharacter characters={avatarCharacters} />}

          {/* 3D Characters (rendered via @remotion/three) */}
          {characters3D && characters3D.length > 0 && (
            <Remotion3DLayer
              characters3D={characters3D}
              fps={fps}
              width={width}
              height={height}
              cameraPosition={cameraPosition}
              cameraFov={cameraFov}
              ambientIntensity={ambientIntensity}
              keyLightIntensity={keyLightIntensity}
            />
          )}

          {/* 2D Rigged Characters (mesh deformation) */}
          {rigData &&
            rigData.length > 0 &&
            rigData.map((rd, idx) => (
              <div
                key={rd.id}
                style={{
                  position: 'absolute',
                  left: (width - rd.imageWidth) / 2,
                  top: (height - rd.imageHeight) / 2,
                  width: rd.imageWidth,
                  height: rd.imageHeight,
                  zIndex: 10 + idx,
                }}
              >
                <RemotionRiggedCharacter rigData={rd} />
              </div>
            ))}

          {/* Text Overlays */}
          {textOverlays && textOverlays.length > 0 && (
            <RemotionTextOverlay textOverlays={textOverlays} keyframeData={keyframeData} />
          )}

          {/* Annotations */}
          {annotations && annotations.length > 0 && (
            <RemotionAnnotationLayer annotations={annotations} canvasWidth={width} canvasHeight={height} />
          )}

          {/* Particle Effects */}
          {particleEmitters && particleEmitters.length > 0 && (
            <RemotionParticleLayer particleEmitters={particleEmitters} canvasWidth={width} canvasHeight={height} />
          )}

          {/* Audio-Reactive Visualizers */}
          {audioReactiveVisualizers && audioReactiveVisualizers.length > 0 && (
            <RemotionAudioReactiveLayer visualizers={audioReactiveVisualizers} />
          )}

          {/* Overlay Animations (Lottie) */}
          {overlayAnimations.length > 0 && (
            <RemotionLottieLayer animations={overlayAnimations} canvasWidth={width} canvasHeight={height} />
          )}
        </RemotionStyleFilter>

        {/* Background Audio (music from useMediaStore) — outside style filter */}
        {backgroundAudio &&
          backgroundAudio.length > 0 &&
          backgroundAudio.map((bgAudio) => (
            <Clip key={bgAudio.id} from={bgAudio.startFrame} durationInFrames={bgAudio.endFrame - bgAudio.startFrame}>
              <AudioTrack src={bgAudio.url} volume={bgAudio.volume ?? 0.4} />
            </Clip>
          ))}
      </CameraTransformWrapper>

      {/* Captions — rendered outside camera wrapper so they stay fixed on screen */}
      <RemotionCaptions captions={captions} />

      {/* Retention Hooks — progress bars, countdowns, etc. */}
      {retentionHooks && retentionHooks.length > 0 && <RemotionRetentionHookLayer hooks={retentionHooks} />}

      {/* Clip Transitions — rendered on top of all content */}
      {clipTransitions && clipTransitions.length > 0 && (
        <RemotionTransitionLayer clipTransitions={clipTransitions} width={width} height={height} />
      )}
    </Fill>
  )
}
