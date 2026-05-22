import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveThroughMutex, isSaveMutexLocked, _resetSaveMutex } from '../useAutoSave'

// Reset module-level mutex state before each test
beforeEach(() => {
  _resetSaveMutex?.()
})

/**
 * Helper: creates a save function that resolves after a controllable delay.
 * Returns { fn, resolve, reject } so the test can control when it completes.
 */
function createControllableSave() {
  let resolve!: () => void
  let reject!: (err: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  const fn = vi.fn(() => promise)
  return { fn, resolve, reject }
}

describe('saveThroughMutex', () => {
  it('executes the save function', async () => {
    const fn = vi.fn(async () => {})
    await saveThroughMutex(fn)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('two concurrent saves — second is queued, not executed immediately', async () => {
    const save1 = createControllableSave()
    const save2 = vi.fn(async () => {})

    // Start save1 — it will hold the mutex
    const p1 = saveThroughMutex(save1.fn)

    // save1 should be running
    expect(save1.fn).toHaveBeenCalledOnce()
    expect(isSaveMutexLocked()).toBe(true)

    // Queue save2 — it returns immediately (queued), save2.fn not called yet
    const p2 = saveThroughMutex(save2)
    expect(save2).not.toHaveBeenCalled()

    // p2 resolves immediately (the queue call just stores fn and returns)
    await p2

    // Complete save1 — save2 should run in the finally block
    save1.resolve()
    await p1

    // save2 should have been executed as part of the finally drain
    expect(save2).toHaveBeenCalledOnce()
  })

  it('queued save replaces earlier queued saves (only latest runs)', async () => {
    const save1 = createControllableSave()
    const saveA = vi.fn(async () => {})
    const saveB = vi.fn(async () => {})

    // Hold the mutex with save1
    const p1 = saveThroughMutex(save1.fn)

    // Queue saveA, then saveB — saveA should be replaced
    saveThroughMutex(saveA)
    saveThroughMutex(saveB)

    // Release save1 — only saveB should run
    save1.resolve()
    await p1

    expect(saveB).toHaveBeenCalledOnce()
    expect(saveA).not.toHaveBeenCalled()
  })

  it('mutex unlocks after save completes', async () => {
    expect(isSaveMutexLocked()).toBe(false)

    const fn = vi.fn(async () => {})
    await saveThroughMutex(fn)

    expect(isSaveMutexLocked()).toBe(false)
  })

  it('mutex unlocks after save fails (try/finally)', async () => {
    expect(isSaveMutexLocked()).toBe(false)

    const fn = vi.fn(async () => {
      throw new Error('save failed')
    })

    // The mutex should still unlock even though the save threw
    await expect(saveThroughMutex(fn)).rejects.toThrow('save failed')
    expect(isSaveMutexLocked()).toBe(false)
  })

  it('queued save runs even if first save fails', async () => {
    const save1 = createControllableSave()
    const save2 = vi.fn(async () => {})

    const p1 = saveThroughMutex(save1.fn)
    saveThroughMutex(save2)

    // Fail save1 — the finally block should still drain the queue
    save1.reject(new Error('network error'))

    // p1 will reject because the thrown error propagates
    await expect(p1).rejects.toThrow('network error')

    // save2 should still have run (mutex unlocked in finally block)
    expect(save2).toHaveBeenCalledOnce()
  })
})

describe('isSaveMutexLocked', () => {
  it('returns false when no save is in progress', () => {
    expect(isSaveMutexLocked()).toBe(false)
  })

  it('returns true during save execution', async () => {
    const save = createControllableSave()
    const p = saveThroughMutex(save.fn)

    expect(isSaveMutexLocked()).toBe(true)

    save.resolve()
    await p

    expect(isSaveMutexLocked()).toBe(false)
  })
})
