// src/utils/idGenerator.ts
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}
