/**
 * Z-Index Token System
 *
 * Centralized z-index values for the ProAnimate UI.
 * Use these tokens instead of ad-hoc z-[N] values.
 *
 * Layer hierarchy (lowest to highest):
 *   base       (0)    — default canvas/page content
 *   overlay    (10)   — in-panel overlays, badges, progress indicators
 *   panel      (20)   — floating panels, side drawers, panel toggles
 *   dropdown   (30)   — dropdowns, popovers, context menus
 *   modal      (40)   — modal dialogs, fullscreen overlays
 *   modalRaised(45)   — confirm dialogs layered on top of another modal
 *   toast      (50)   — toasts, notifications, tooltips
 *   devTools   (9999) — dev-only overlays (TemplateDevMode, debug)
 *
 * NOTE: Do NOT use these for canvas layer ordering (CharacterLayer,
 * TextOverlayLayer, etc.) — those z-indexes are semantic for element stacking.
 */

/** Tailwind class tokens — use in className strings */
export const Z = {
  /** Default content layer */
  base: 'z-0',
  /** In-panel overlays, badges, upload indicators */
  overlay: 'z-overlay',
  /** Floating panels, side drawers, panel toggle buttons */
  panel: 'z-panel',
  /** Dropdowns, popovers, select menus, context menus */
  dropdown: 'z-dropdown',
  /** Modal dialogs, fullscreen previews, backdrops */
  modal: 'z-modal',
  /** Confirm dialog on top of another modal */
  modalRaised: 'z-modal-raised',
  /** Toasts, notifications, tooltips */
  toast: 'z-toast',
  /** Dev-only: template dev mode, debug overlays */
  devTools: 'z-[9999]',
} as const

/** Raw numeric values — use in inline style={{ zIndex }} */
export const Z_RAW = {
  base: 0,
  overlay: 10,
  panel: 20,
  dropdown: 30,
  modal: 40,
  modalRaised: 45,
  toast: 50,
  devTools: 9999,
} as const
