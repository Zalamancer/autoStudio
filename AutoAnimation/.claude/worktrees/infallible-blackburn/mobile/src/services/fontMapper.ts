// mobile/src/services/fontMapper.ts
import { Platform } from 'react-native'

const FONT_MAP: Record<string, { ios: string; android: string }> = {
  'Inter':             { ios: 'System', android: 'sans-serif' },
  'Segoe UI':          { ios: 'System', android: 'Roboto' },
  'Helvetica Neue':    { ios: 'Helvetica Neue', android: 'Roboto' },
  'Arial':             { ios: 'Arial', android: 'sans-serif' },
  'Arial Black':       { ios: 'Arial Black', android: 'sans-serif-black' },
  'Courier New':       { ios: 'Courier New', android: 'monospace' },
  'Georgia':           { ios: 'Georgia', android: 'serif' },
  'Times New Roman':   { ios: 'Times New Roman', android: 'serif' },
  'Comic Sans MS':     { ios: 'Comic Sans MS', android: 'sans-serif' },
  'Impact':            { ios: 'Impact', android: 'sans-serif-condensed' },
  'Verdana':           { ios: 'Verdana', android: 'sans-serif' },
  'Trebuchet MS':      { ios: 'Trebuchet MS', android: 'sans-serif' },
  'cursive':           { ios: 'Snell Roundhand', android: 'sans-serif' },
  'sans-serif':        { ios: 'System', android: 'sans-serif' },
  'serif':             { ios: 'Georgia', android: 'serif' },
  'monospace':         { ios: 'Menlo', android: 'monospace' },
}

/**
 * Resolve a CSS font-family string to a platform-appropriate font name.
 * Handles comma-separated fallback lists.
 */
export function resolveFont(fontFamily: string): string {
  // Parse CSS font-family: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif"
  const families = fontFamily
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))

  const platform = Platform.OS

  for (const family of families) {
    const mapping = FONT_MAP[family]
    if (mapping) {
      return platform === 'ios' ? mapping.ios : mapping.android
    }
    // If no mapping, try the font name directly (works if loaded via expo-font)
    // Return it as-is — the system will fall back if not found
  }

  // Final fallback
  return families[0] || (platform === 'ios' ? 'System' : 'sans-serif')
}
