---
aliases: [skills-overview, implementation-guides]
---

# Skills Index

Index of all 37 Claude Code skills — step-by-step implementation guides for ProAnimate features and structural patterns. Each entry corresponds to a `SKILL.md` file in `.claude/skills/<name>/`. For product specifications (user flows, acceptance criteria, edge cases), see [[feature-specs]]. For the shipped feature list, see [[feature-list]]. For roadmap, see [[plan]]. For session logs, see [[PROGRESS]].

## Feature Skills

### AI / Generation
- **create-clip** — Generate a full animated clip from a text prompt using the AI orchestrator pipeline
- **create-script** — Generate an AI script with emotion cues and dialogue formatting
- **create-character** — Generate a 2D character with sprite sheets, viseme mapping, and emotion heads
- **create-character-3d** — Generate a 3D character model using Meshy API
- **create-avatar** — Create an animated avatar character from a photo
- **create-motion** — Generate 3D character motion/animation using HunyuanMotion
- **generate-voice** — TTS voiceover with ElevenLabs, phoneme alignment, and viseme mapping
- **voice-clone** — Clone a voice for use in TTS generation via ElevenLabs

### Editing / Post-Production
- **smart-cut** — Detect and remove silences, filler words, and dead space
- **smart-zoom** — AI-powered Ken Burns zoom with focus detection and subject tracking
- **beat-sync** — Synchronize video cuts, transitions, and animations to audio beats
- **transcript-edit** — Edit video by editing its transcript text (Whisper/Deepgram/AssemblyAI)
- **extract-clips** — Extract and rank short clips from long-form video for repurposing
- **add-broll** — AI B-roll suggestions using Pixabay stock media
- **add-music** — AI background music generation with mood analysis
- **sound-design** — Add sound effects using Freesound API
- **add-effect** — Add a new visual effect (dispatcher registration, style filters)

### Export / Publishing
- **export-video** — Multi-format export (MP4, WebM, GIF, SCORM, interactive HTML)
- **publish-social** — Publish to social media with platform-specific optimization
- **quality-check** — Pre-publish QA checks (visual, audio, platform compliance)

### Analytics
- **analyze-trend** — Detect trending topics for content ideation
- **score-virality** — Virality potential scoring across multiple dimensions
- **audit-brand** — Brand consistency audit (colors, typography, tone)

### Debugging
- **debug-export** — Troubleshoot video export failures (codecs, rendering, audio sync)
- **debug-lipsync** — Debug viseme timing, phoneme alignment, curvature issues
- **debug-orchestrator** — Debug AI orchestrator pipeline failures
- **debug-rig** — Debug 2D/3D rigging (bones, mesh, weight painting, spring bones)

## Structural Skills

### Scaffolding (how to add new things)
- **add-feature** — Full feature implementation guide (types, store, service, panel, canvas, route, tab)
- **add-panel** — Add editor panel to left sidebar
- **add-store** — Add Zustand store with Immer + Zundo
- **add-route** — Add Express.js server route
- **add-remotion-layer** — Add Remotion export layer
- **add-template** — Add motion graphics / kinetic typography template

### Auto-Applied Knowledge (read automatically, never invoked)
- **architecture** — Project structure, tech stack, layer system, state management
- **patterns** — Coding conventions, naming rules, import style, component patterns
- **ui-components** — Component registry and design system (checked before creating any UI)
- **maintenance** — Doc self-maintenance rules (triggers, what to update when)
