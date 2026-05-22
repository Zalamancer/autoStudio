# Engine

13 core animation modules in `src/engine/`:

## src/engine/interpolate.ts
- `interpolate(value, inputRange, outputRange, options?): number` — Multi-stop interpolation with easing

## src/engine/spring.ts
- `spring(opts): number` — RK4-integrated damped spring
- `measureSpring(config?): number` — Measure settling duration

## src/engine/easing.ts
- `EASING_CSS_MAP` — Maps all easing types to CSS cubic-bezier
- `easingToCss(type, bezierParams?): string`

## src/engine/particles.ts
Particle system: confetti, sparkles, smoke, fire, snow, rain, bubbles, hearts, stars, dust, explosion, fireworks.
- `createParticleSystem(config): ParticleSystem`
- `updateParticleSystem(system, dt): ParticleSystem`
- `renderParticles(ctx, system): void`
- `burstEffect(type, x, y, w, h): ParticleSystem`

## src/engine/path.ts
Path animation: linear, bezier, catmull-rom, arc, ellipse, figure-eight, spiral.
- `evaluatePath(t, config): PathResult`
- `evaluatePathAtFrame(frame, startFrame, durationFrames, config): PathResult`
- `PathPresets` — 8 pre-built paths

## src/engine/stagger.ts
Sequential animation timing.
- `calculateStagger(count, config): StaggerResult`
- `StaggerPresets` — cascade, waterfall, explode, implode, popcorn, typewriter

## src/engine/attention.ts
Looping idle animations: float, pulse, breathe, bob, wiggle, sway, heartbeat, glow, shake, rock, bounce-idle, pendulum.
- `getAttentionTransform(time, config): AttentionTransform`

## src/engine/beatSync.ts
Beat detection and keyframe generation.
- `detectBeats(audioBuffer): Beat[]`
- `estimateBPM(beats): number`
- `generateBeatKeyframes(beats, objectRef, config, fps): BeatKeyframe[]`
- `snapToBeat(frame, bpm, fps): number`

## src/engine/presets.ts
55+ animation presets (entrance, exit, emphasis, transition).
- `getPresetsByCategory(category): AnimationPreset[]`
- `applyPreset(preset, objectRef, startFrame): Keyframe[]`

## src/engine/autoAnimate.ts
Orchestrator bridge for auto-animation with 15 element roles.
- `autoAnimateElement(objectType, objectId, startFrame, endFrame, options): AutoAnimateResult`
- `autoAnimateElements(elements, fps, beats?): AutoAnimateResult`

## src/engine/primitives.tsx
Remotion-compatible primitives: `Fill`, `Clip`, `AudioTrack`, `VideoTrack`.

## src/engine/CompositionContext.tsx
React context for composition playback.
- `useFrame(): number`
- `useComposition(): CompositionContextValue`

## src/engine/CompositionPlayer.tsx
Composition playback container with RAF-based timing and optional controls bar.

---

