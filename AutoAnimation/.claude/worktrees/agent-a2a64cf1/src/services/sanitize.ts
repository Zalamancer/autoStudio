/**
 * Basic SVG sanitizer — strips script elements, event handler attributes,
 * and other dangerous content from SVG strings before inserting into the DOM.
 */

/** Elements that should be completely removed from SVG content */
const DANGEROUS_ELEMENTS = /(<script[\s>][\s\S]*?<\/script\s*>|<iframe[\s>][\s\S]*?<\/iframe\s*>|<object[\s>][\s\S]*?<\/object\s*>|<embed[\s>][\s\S]*?<\/embed\s*>|<foreignObject[\s>][\s\S]*?<\/foreignObject\s*>)/gi

/** Self-closing dangerous elements */
const DANGEROUS_SELF_CLOSING = /<(script|iframe|object|embed|foreignObject)\b[^>]*\/?\s*>/gi

/** Event handler attributes (on*="...") */
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

/** javascript: and data: URIs in href/xlink:href/src attributes */
const DANGEROUS_URIS = /\s+(href|xlink:href|src)\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(DANGEROUS_ELEMENTS, '')
    .replace(DANGEROUS_SELF_CLOSING, '')
    .replace(EVENT_HANDLERS, '')
    .replace(DANGEROUS_URIS, '')
}
