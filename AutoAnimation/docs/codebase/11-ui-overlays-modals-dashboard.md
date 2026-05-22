# Components: Overlays, Modals, Dashboard

## Dashboard (8 components)
- `DashboardPage` — Main page with clip tabs, search/filter, batch panel; first-run welcome state shows AI orchestrator prompt when `isFirstVisit && clips.length === 0`
- `ClipCard` — Expandable clip with phase badge, progress, actions
- `DashboardOrchestratorPanel` — Pipeline UI per clip
- `BatchCreatePanel` — Multi-prompt batch generation; "Brainstorm from topic" expands one topic into N prompts via `promptIdeator`; "Stock-only fast mode" toggle forces the image-heavy narration pipeline (stock images only, varied transitions, no characters/templates/SVGs/motion graphics)
- `ClipDoneActions` — Post-export play/download/publish/insights

## Modals
- `ModalShell` — Reusable modal with header, backdrop, escape key
- `LibraryModal`, `ProjectsModal`, `SettingsModal`, `ExportModal`, `ShareModal`, `AnalyticsModal`
- `SignInModal`, `UpgradeModal`, `RecordingsModal`

## Landing (3 components)
- `LandingPage` — Full page with hero, features, pricing, FAQ
- `HeroSection` — GSAP animated headline with 3D mockup rotation
- `Navbar` — Sticky nav with smooth scroll

---

# Components: Auth, Credits, Charts

## Auth
- `AuthGuard` — Initializes auth, triggers cloud sync
- `LoginPage` — Sign in/up with Google OAuth
- `ResetPasswordPage` — Password reset form

## Credits
- `BillingPage` — Plan cards, usage bar, credit packages
- `CreditBadge` — Compact remaining credits badge
- `UpgradeModal` — Upgrade prompt on credit exhaustion

## Charts
- `ComparisonBar` — Animated horizontal bar chart
- `DonutChart` — Ring chart with center value
- `GaugeChart` — Half-circle gauge
- `MiniSparkline` — Tiny trend line

---

# Components: Copilot, Collaboration, Node Canvas

## Copilot (7 components)
- `CopilotDrawer` — Main panel with messages and suggestions
- `CopilotInput` — Textarea with Enter/Shift+Enter handling
- `CopilotMessage` — Chat message with action cards
- `CopilotActionCard` — AI action with apply/skip buttons
- `CopilotSuggestions` — Context-aware suggestion pills
- `CopilotToggle` — Floating bot button

## Collaboration
- `CollabCursors` — Remote peer cursor overlay
- `CollaborationPanel` — Session management with invite links

## Node Canvas
- `NodeCanvas` — Infinite pan-zoom node graph with spotlight command palette

---

