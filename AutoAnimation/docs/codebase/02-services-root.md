# Services (root)

## src/services/supabase.ts
Supabase client initialization and storage helpers.
- `supabase: SupabaseClient | null` — Client instance (null if unconfigured)
- `isSupabaseConfigured(): boolean` — Check env vars
- `uploadSprite(projectId, dataURL, partType, index): Promise<string>` — Upload sprite to Storage
- `uploadAudio(projectId, blob, voiceId): Promise<string>` — Upload audio
- `uploadThumbnail(projectId, blob): Promise<string>` — Upload thumbnail
- `deleteProjectSprites(projectId): Promise<void>` — Delete project sprites
- `urlToDataURL(url): Promise<string>` — Fetch image as data URL

## src/services/auth.ts
Supabase auth wrapper (signUp, signIn, signInWithGoogle, signOut, getSession, getUser, resetPassword, onAuthStateChange).

## src/services/apiClient.ts
Centralized API client for authenticated backend requests.
- `apiClient.get<T>(path): Promise<T>` — GET with auth
- `apiClient.post<T>(path, body): Promise<T>` — POST with auth + JSON
- `apiClient.put<T>(path, body): Promise<T>` — PUT with auth
- `apiClient.del<T>(path): Promise<T>` — DELETE with auth
- `apiClient.isAuthenticated(): boolean` — Check session

## src/services/creditsService.ts
Frontend API client for credit & billing system.
- `fetchCreditBalance(): Promise<CreditBalance>`
- `deductCredits(operation): Promise<DeductResult>`
- `refundCredits(operation): Promise<RefundResult>`
- `createCheckoutSession(priceId): Promise<{sessionUrl}>`
- `createPortalSession(): Promise<{portalUrl}>`

## src/services/nanoBanana.ts
Character sprite sheet generation (8x3 grid, 24 visemes).
- `generateFullSpriteSheet(options, onProgress?): Promise<FullSheetResult | null>`
- `sliceFullSpriteSheet(sheetDataUrl): Promise<CurvedVisemeSprites>`
- `generateAllVisemeSprites(options, onProgress?): Promise<CurvedVisemeSprites>`

## src/services/emotionMapping.ts
Maps emotion names to mouth curvature, eye variants, eyebrow variants.
- `getCurvatureFromEmotion(emotion): MouthCurvature`
- `getExpressionFromEmotion(emotion): {eye, eyebrow, curvature}`
- `detectEmotionFromText(text): DetectableEmotion`
- `extractInlineEmotionCue(text): string | null`

## src/services/htmlRenderer.ts
Render HTML to image via SVG foreignObject + Canvas.
- `renderHTMLToImage(html, width, height): Promise<string>`
- `generateHTMLThumbnail(html): Promise<string>`

## src/services/templateAnalyzer.ts
AI-powered template analysis with caching.
- `analyzeTemplateWithAI(templateId, html): Promise<AITemplateAnalysis>`
- `getTemplateAnalysis(templateId, html): Promise<AITemplateAnalysis>`
- `preAnalyzeTemplates(templates, onProgress?): Promise<void>`

## src/services/rigCache.ts
Rig data persistence via IndexedDB (migrated from localStorage).
- `cacheRigForCharacter(savedCharId, data): Promise<void>`
- `getCachedRig(savedCharId): Promise<SerializedRigData | null>`
- `getAllCachedRigs(): Promise<Array<{charId, data}>>`
- `loadCachedRig(savedCharId, dialogueCharId): Promise<string | null>`
- `loadSharedAnimationsForRig(rigId, characterId): Promise<number>`

## src/services/idb.ts
Generic IndexedDB store factory.
- `createIDBStore<T>(dbName, storeName, version?): IDBStoreOps<T>` — save, get, delete, getAllKeys, clear
- `createMultiIDBStore(dbName, storeNames, version?)` — Multiple stores in one DB

## src/services/meshyAPI.ts
Meshy API client for 3D character generation and auto-rigging.
- `startTextTo3D(request): Promise<{taskId}>` — Text-to-3D
- `startImageTo3D(request): Promise<{taskId}>` — Image-to-3D
- `pollUntilComplete(taskId): Promise<MeshyTaskStatus>`
- `generateAndRig3DCharacter(prompt, style?, onProgress?): Promise<{modelUrl, thumbnailUrl?}>`

## src/services/liveAvatar.ts
Real-time conversational AI avatar via ElevenLabs WebSocket.
- `class LiveAvatarSession` — connect, disconnect, sendTextMessage, setMicMuted, on/off events
- `createLiveAvatarSession(config): LiveAvatarSession`

## src/services/viralityAnalyzer.ts
Client-side and Gemini-powered virality analysis.
- `analyzeViralityFast(input): ViralityAnalysis` — 7 dimensions scored instantly
- `analyzeViralityDeep(input, script): Promise<ViralityAnalysis>` — NLP-enhanced via Gemini

## src/services/agentWorkflows.ts
Multi-step autonomous workflow engine for AI director tasks.
- `executeWorkflow(workflowId, onStepUpdate): Promise<WorkflowResult>`
- 4 workflows: optimize-virality, enhance-engagement, platform-optimize, add-production-value

## src/services/svgArtGenerator.ts
Procedural SVG art generator with 20 styles.
- `generateSVGArt(options): {svg, name}`
- `wrapSVGAsHTML(svg, palette, name): string`
- 20 art styles, 8 color palettes

## src/services/photoToAvatar.ts
Photo-to-avatar: analyze photo → extract description → generate sprite sheet.
- `analyzePhotoForAvatar(imageDataUrl, style?): Promise<AvatarDescription>`

## src/services/subtitleExport.ts
SRT/VTT subtitle export from word timing data.
- `generateSRT(words): string` / `generateVTT(words): string`
- `generateMultiCharacterSRT(dialogueLines, fps): string`
- `downloadSRT(content, projectName?): void`

## src/services/proceduralAnimation.ts
Procedural animation — parametric sine/cosine oscillations per body part.
- `getProceduralTransform(preset, part, frame, fps, intensity?, isSpeaking?): ProceduralTransform`
- 6 presets: idle, talking, excited, nervous, sad, dramatic

## src/services/rigAnimationGenerator.ts
AI-powered 2D rig animation generation via Gemini.
- `generateRigAnimation(request): Promise<RigAnimationResult>`
- `toBoneRiggingAnimation(result, fps?): object`

## src/services/poseInterpolation.ts / poseInterpolation3d.ts
Bone pose interpolation (2D lerp/angle-lerp, 3D quaternion slerp).
- `interpolatePoses(poseA, poseB, t, easing?): BonePose`
- `getPoseAtFrame(keyframes, frame): BonePose | null`

## src/services/componentGenerator.ts
AI-powered HTML5 component generation via Gemini.
- `generateComponent(options): Promise<GeneratedComponent>`

## src/services/sanitize.ts
SVG sanitizer — strips scripts, event handlers, dangerous content.
- `sanitizeSvg(svg): string`

## src/services/errorHandler.ts
Centralized error handling with toast notifications.
- `reportError(error, context): Error`
- `withErrorHandling<T>(fn, context, fallback): Promise<T>`

## src/services/schemaRuntime.ts
Runtime schema binding dispatcher.
- `dispatchSchemaBindings(changedKeys, variables, bindings): void`

## src/services/emojiCaptions.ts
Maps words to contextual emojis for captions.
- `getEmojiForWord(word, mode, emotion?): string | null`
- `insertEmojisIntoText(text, mode, emotion?): string`

## src/services/textAnimationCompute.ts
Thin lazy-loading wrapper around `textAnimationPresets.computeTextAnimation`.
Canvas components import this instead of the full 1,300-line preset file to keep preset data out of the main chunk.
- `computeTextAnimation(presetId, currentFrame, startFrame, endFrame, fps): TextAnimationStyle | undefined`

---

