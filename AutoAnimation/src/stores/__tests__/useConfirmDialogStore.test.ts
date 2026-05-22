import { describe, it, expect, beforeEach } from 'vitest'
import { useConfirmDialogStore } from '../useConfirmDialogStore'

// Reset the store between tests to avoid state leaking
beforeEach(() => {
  const store = useConfirmDialogStore.getState()
  // Reset to initial state
  useConfirmDialogStore.setState({
    open: false,
    options: { title: '', description: '' },
    resolve: null,
  })
  // Ensure no dangling resolve callbacks
  if (store.resolve) store.resolve(false)
})

describe('useConfirmDialogStore', () => {
  describe('confirm()', () => {
    it('opens the dialog and sets options', () => {
      const options = { title: 'Delete?', description: 'This cannot be undone.' }
      useConfirmDialogStore.getState().confirm(options)

      const state = useConfirmDialogStore.getState()
      expect(state.open).toBe(true)
      expect(state.options).toEqual(options)
      expect(state.resolve).toBeTypeOf('function')
    })

    it('returns a promise that resolves true on accept', async () => {
      const promise = useConfirmDialogStore
        .getState()
        .confirm({ title: 'Continue?', description: 'Proceed with action.' })

      // Simulate user clicking "Confirm"
      useConfirmDialogStore.getState().accept()

      const result = await promise
      expect(result).toBe(true)
    })

    it('returns a promise that resolves false on cancel', async () => {
      const promise = useConfirmDialogStore
        .getState()
        .confirm({ title: 'Delete?', description: 'Are you sure?' })

      // Simulate user clicking "Cancel"
      useConfirmDialogStore.getState().cancel()

      const result = await promise
      expect(result).toBe(false)
    })
  })

  describe('accept()', () => {
    it('closes the dialog and clears resolve', async () => {
      useConfirmDialogStore
        .getState()
        .confirm({ title: 'T', description: 'D' })

      useConfirmDialogStore.getState().accept()

      const state = useConfirmDialogStore.getState()
      expect(state.open).toBe(false)
      expect(state.resolve).toBeNull()
    })
  })

  describe('cancel()', () => {
    it('closes the dialog and clears resolve', async () => {
      useConfirmDialogStore
        .getState()
        .confirm({ title: 'T', description: 'D' })

      useConfirmDialogStore.getState().cancel()

      const state = useConfirmDialogStore.getState()
      expect(state.open).toBe(false)
      expect(state.resolve).toBeNull()
    })
  })

  describe('race condition: second confirm auto-cancels first', () => {
    it('first confirm resolves false when second confirm is called', async () => {
      const promise1 = useConfirmDialogStore
        .getState()
        .confirm({ title: 'First', description: 'First dialog' })

      // Open a second dialog before the first is resolved
      const promise2 = useConfirmDialogStore
        .getState()
        .confirm({ title: 'Second', description: 'Second dialog' })

      // First dialog should have been auto-cancelled (resolved false)
      const result1 = await promise1
      expect(result1).toBe(false)

      // Second dialog should still be open with its options
      const state = useConfirmDialogStore.getState()
      expect(state.open).toBe(true)
      expect(state.options.title).toBe('Second')

      // Accept second dialog
      useConfirmDialogStore.getState().accept()
      const result2 = await promise2
      expect(result2).toBe(true)
    })

    it('three rapid confirms — only the last one stays open', async () => {
      const p1 = useConfirmDialogStore
        .getState()
        .confirm({ title: 'A', description: '' })

      const p2 = useConfirmDialogStore
        .getState()
        .confirm({ title: 'B', description: '' })

      const p3 = useConfirmDialogStore
        .getState()
        .confirm({ title: 'C', description: '' })

      // A and B should both resolve false (auto-cancelled)
      expect(await p1).toBe(false)
      expect(await p2).toBe(false)

      // C should still be open
      expect(useConfirmDialogStore.getState().options.title).toBe('C')

      // Cancel C
      useConfirmDialogStore.getState().cancel()
      expect(await p3).toBe(false)
    })
  })

  describe('no-op safety', () => {
    it('accept does not throw when no dialog is open', () => {
      expect(() => useConfirmDialogStore.getState().accept()).not.toThrow()
    })

    it('cancel does not throw when no dialog is open', () => {
      expect(() => useConfirmDialogStore.getState().cancel()).not.toThrow()
    })
  })
})
