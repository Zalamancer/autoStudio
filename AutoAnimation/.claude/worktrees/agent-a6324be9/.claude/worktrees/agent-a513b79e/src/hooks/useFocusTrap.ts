import { useEffect, type RefObject } from 'react'

/**
 * Traps keyboard focus within a container element when active.
 * Cycles through focusable elements with Tab/Shift+Tab.
 * Restores focus to the previously focused element on deactivation.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Store the element that was focused before the trap activated
    const previouslyFocused = document.activeElement as HTMLElement | null

    const FOCUSABLE_SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    function getFocusableElements(): HTMLElement[] {
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null) // filter hidden elements
    }

    // Focus the first focusable element inside the container
    const focusables = getFocusableElements()
    if (focusables.length > 0) {
      focusables[0].focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const elements = getFocusableElements()
      if (elements.length === 0) return

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if focus is on the last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the previously focused element
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [containerRef, active])
}
