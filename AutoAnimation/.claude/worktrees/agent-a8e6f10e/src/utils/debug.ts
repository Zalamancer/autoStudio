// src/utils/debug.ts
const isDev = import.meta.env.DEV;

export function debug(tag: string, ...args: unknown[]): void {
  if (isDev) {
    console.log(`[${tag}]`, ...args);
  }
}

export function debugWarn(tag: string, ...args: unknown[]): void {
  if (isDev) {
    console.warn(`[${tag}]`, ...args);
  }
}

export function debugError(tag: string, ...args: unknown[]): void {
  console.error(`[${tag}]`, ...args);
}
