# docs/ Workspace

Product documentation for ProAnimate. These files define what exists, what to build next, and how things are organized. They are the source of truth for feature scope and project planning.

## Files

| File | Purpose | When to update |
|------|---------|----------------|
| [[feature-list]] | Canonical list of all 167 user-facing features. Numbered, one-line each. | Every time a feature is added or removed |
| [[tabs]] | Current tab/sub-tab layout (8 groups, 36+ sub-tabs). Maps tab IDs to labels. | Every time a panel or tab changes |
| [[PROGRESS]] | Session-by-session log of completed work, bugs fixed, and key files touched. | After each coding session |
| [[plan]] | High-level roadmap index. Phase summary table, dependency chain, links to phase files. | When phases or timelines change |
| [[feature-specs]] | Full product specifications for all 60 planned features (user flows, parameters, acceptance criteria, edge cases, competitor analysis). | When feature specs change |
| [[phase-1]] through [[phase-10]] | Detailed implementation plans per phase. Each phase groups features by theme/timeline. | When a phase's scope or approach changes |
| [[research]] | Competitive analysis of 60+ competitors across 14 categories. | When new competitor research is done |
| [[feature-priorities]] | Scoring methodology (Need, Ease, Completes, Unlocks) and all 60 planned features ranked by priority score with tier assignments (T1-T4). Consolidated from former `feature-priority-matrix.md` and `feature-rankings.md`. | When priorities or tiers change |
| [[text-animation-presets-master-list]] | Reference catalog of 400+ text animation preset definitions. | When presets are added |
| [[skills-index]] | Index of all 37 Claude Code implementation skills (feature recipes + structural patterns). | When a skill is added or removed |

## Conventions

- **feature-list.md** is the running count of shipped features. If it is not in this file, it does not exist yet.
- **tabs.md** mirrors `src/constants/tabGroups.ts`. The doc and the code must match.
- **plan.md** is a concise roadmap index (phase summary table, dependency chain, links). **feature-specs.md** has the full-detail specs. Phase files (`phase-N.md`) are the actionable implementation plans.
- **PROGRESS.md** is append-only. Each session adds a new section at the bottom.
- **feature-priorities.md** drives build order. Tier 1 features ship first.

## What goes where

| You need to... | Write in... |
|----------------|-------------|
| Record a new shipped feature | `feature-list.md` (add numbered entry, update count) |
| Track a tab/panel change | `tabs.md` (match to tabGroups.ts) |
| Log what was built today | `PROGRESS.md` (new session section) |
| Spec out a future feature | `feature-specs.md` or relevant `phase-N.md` |
| Re-prioritize the backlog | `feature-priorities.md` |
| Find or add a Claude Code implementation guide | `skills-index.md` (and `.claude/skills/<name>/SKILL.md`) |

## Quality standard

Good docs entries are: one line for feature-list, table row for progress, exact tab IDs for tabs. No prose where a table works. Keep feature-list count accurate in the header.
