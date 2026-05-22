# CLAUDE.md

ProAnimate is a web-based animation studio for short-form talking character videos (TikTok/Shorts/Reels). It combines automated lip sync, AI orchestration, motion graphics, 2D/3D characters, and multi-format export into a browser-based editor.

React 19 + TypeScript + Vite | Zustand + Immer | Remotion | Three.js | Express + Supabase backend | Stripe

## AI Model Policy

**NEVER use Gemini generation models.** Always use Anthropic Claude for text/code generation:
- `claude-opus-4-6` (Claude Opus 4.6) — for complex tasks
- `claude-sonnet-4-6` (Claude Sonnet 4.6) — for standard tasks
- When writing code that calls AI generation APIs, default to Claude via `@anthropic-ai/sdk`, not Google Gemini or Vertex AI.
- **Exception: Gemini Embedding 2** — allowed for embedding/similarity tasks (template novelty detection, RLHF feature extraction). Embedding ≠ generation.

## Commands

```bash
npm run dev                   # Frontend (Vite, proxies /api to :3001)
cd server && npm run dev      # Backend (Express, port 3001)
npm run build                 # Production build
```

## Folder Structure

```
src/
  components/     # canvas/, panels/, dashboard/, layout/, timeline/
  services/       # Business logic, AI clients, orchestrator, effects, manim
  stores/         # Zustand stores (100+)
  remotion/       # Export layers (VideoComposition.tsx)
  engine/         # Animation engine (easing, spring, particles, path)
  motionGraphics/ # Kinetic typography templates (~90)
  types/, hooks/, data/, constants/
server/
  routes/, services/, middleware/
vendor/bonerigging/
docs/
  feature-list.md, tabs.md, plan.md, PROGRESS.md
```

## Context System

Three layers: **CLAUDE.md** (this file) -> **CONTEXT.md** (per-directory) -> **Skills** (task instructions).

For workspace context, read `CONTEXT.md` in the relevant directory.
For project roadmap and priorities, read `docs/plan.md`. See `docs/feature-list.md` for shipped features, `docs/PROGRESS.md` for session logs, `docs/skills-index.md` for all available skills.

## Routing Table

Before writing code, find the matching skill below. Read its SKILL.md first.
Skills live at `.claude/skills/<name>/SKILL.md`.

| User intent | Skill |
|---|---|
| "add a feature", "implement X" | `add-feature` |
| "add a panel", "create a tab" | `add-panel` |
| "add a store", "create state" | `add-store` |
| "add a route", "create endpoint" | `add-route` |
| "add a Remotion layer" | `add-remotion-layer` |
| "add a template", "kinetic typography" | `add-template` |
| "add an effect", "visual effect" | `add-effect` |
| "generate a clip", "video from prompt" | `create-clip` |
| "generate character", "create character" | `create-character` / `create-character-3d` |
| "generate voice", "TTS", "lip sync" | `generate-voice` |
| "export", "render video" | `export-video` |
| "silence removal", "remove dead space" | `smart-cut` |
| "virality", "score this clip" | `score-virality` |
| "standardize panel", "cinema pattern" | `standardize-panel` |
| "fix lip sync" | `debug-lipsync` |
| "export broken", "black screen" | `debug-export` |
| "orchestrator failing" | `debug-orchestrator` |
| "rig not working", "bones broken" | `debug-rig` |
| "brand check" | `audit-brand` |
| "add music" | `add-music` |
| "sound effects" | `sound-design` |
| "smart zoom", "Ken Burns" | `smart-zoom` |
| "extract clips" | `extract-clips` |
| "B-roll suggestions" | `add-broll` |
| "beat sync" | `beat-sync` |
| "transcript edit" | `transcript-edit` |
| "create script" | `create-script` |
| "create avatar" | `create-avatar` |
| "3D motion" | `create-motion` |
| "publish", "social media" | `publish-social` |
| "quality check", "QA" | `quality-check` |
| "voice clone" | `voice-clone` |
| "trending topics" | `analyze-trend` |
| "analyze templates", "improve templates", "next batch" | `analyze-improve` |

If no skill matches, read relevant source files before writing code.

## Auto-Applied Knowledge

These are read automatically when relevant -- never invoked directly:
- `architecture` -- Project structure, tech stack, layer system
- `patterns` -- Coding conventions, naming, import style
- `maintenance` -- Doc self-maintenance rules (triggers, what to update when)
- `ui-components` -- Component registry. Check BEFORE creating any UI element.

## Resource Limits

**Max parallel agents: 10.** Never launch more than 10 subagents simultaneously — this machine can't handle more.

## Session Context Footer

At the end of every message, append a one-line session summary in this format:

`SESSION: [10-15 word description of what this session is about]`

Keep it consistent throughout the session — update only if the session focus shifts significantly.

## Commit After Every Message

After every message that includes code changes, commit to GitHub with a clear title and description. Use conventional commit format: `type(scope): title` with a body describing what changed and why.

## Doc Maintenance

After every code change, update affected docs in the same commit.
Full rules: `.claude/skills/maintenance/SKILL.md`
