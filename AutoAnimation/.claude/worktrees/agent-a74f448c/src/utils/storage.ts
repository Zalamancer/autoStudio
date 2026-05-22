/**
 * Safe wrappers for localStorage and IndexedDB quota monitoring.
 *
 * localStorage.setItem can throw QuotaExceededError when the ~5-10 MB
 * limit is reached. safeLocalStorageSet catches that specific error and
 * returns false instead of crashing the caller.
 *
 * checkStorageQuota / warnIfStorageLow use the StorageManager API to
 * report IndexedDB + origin-level usage so callers can log a warning
 * before large writes.
 */

/**
 * Attempt to write to localStorage. Returns true on success, false if
 * the quota has been exceeded. Re-throws any non-quota error.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.code === 22)
    ) {
      console.warn(
        `localStorage quota exceeded for key: ${key} (${(value.length / 1024).toFixed(1)}KB)`,
      )
      return false
    }
    throw e
  }
}

/**
 * Query the StorageManager API for current origin storage usage.
 * Returns zeros when the API is unavailable (e.g. in older browsers or
 * non-secure contexts).
 */
export async function checkStorageQuota(): Promise<{
  usage: number
  quota: number
  percentUsed: number
}> {
  if (navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    }
  }
  return { usage: 0, quota: 0, percentUsed: 0 }
}

/**
 * Log a console warning when origin storage usage exceeds the given
 * threshold. Returns true if usage is above the threshold.
 */
export async function warnIfStorageLow(
  thresholdPercent = 85,
): Promise<boolean> {
  const { percentUsed } = await checkStorageQuota()
  if (percentUsed > thresholdPercent) {
    console.warn(
      `Storage usage at ${percentUsed.toFixed(1)}% — consider cleaning up`,
    )
  }
  return percentUsed > thresholdPercent
}
