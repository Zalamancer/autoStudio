/**
 * templateBridge.ts
 *
 * Injects a postMessage bridge script into an HTML template string so the
 * React parent can send CONFIG_UPDATE / CONFIG_BULK_UPDATE messages to the
 * iframe, and the template updates its DOM in real-time without reloading.
 *
 * The bridge:
 *  1. Builds a _domMap by statically analysing the template for patterns like
 *     `getElementById('x').textContent = CONFIG.key`
 *  2. Exposes `window.__applyConfigUpdate(key, value)` that:
 *     - Updates CONFIG[key] or the global variable
 *     - Re-applies DOM bindings from _domMap
 *  3. Listens for `message` events from the parent
 *  4. Sends `TEMPLATE_READY` once the bridge is initialised
 */

import { extractDomBindings, type DomBinding } from './templateConfigParser'

// ---------------------------------------------------------------------------
// Bridge script template
// ---------------------------------------------------------------------------

function buildBridgeScript(domMap: Record<string, DomBinding[]>): string {
  // Serialise the DOM binding map into the injected script
  const serialisedMap = JSON.stringify(domMap)

  return `
<script data-template-bridge="1">
(function(){
  var _domMap = ${serialisedMap};

  window.__applyConfigUpdate = function(key, value) {
    // Handle dotted keys for nested objects (e.g. "colors.bg")
    var parts = key.split('.');
    if (parts.length === 2 && typeof CONFIG !== 'undefined' && CONFIG[parts[0]] && typeof CONFIG[parts[0]] === 'object') {
      CONFIG[parts[0]][parts[1]] = value;
    } else if (typeof CONFIG !== 'undefined' && parts.length === 1) {
      CONFIG[key] = value;
    } else if (parts.length === 1) {
      // Standalone global variable
      try { window[key] = value; } catch(e) {}
    }

    // Re-apply DOM bindings
    var bindings = _domMap[key] || [];
    for (var i = 0; i < bindings.length; i++) {
      var b = bindings[i];
      if (b.elId === '__body__') {
        if (b.prop === 'style' && b.styleProp) {
          document.body.style[b.styleProp] = value;
        }
      } else {
        var el = document.getElementById(b.elId);
        if (!el) continue;
        if (b.prop === 'textContent') el.textContent = value;
        else if (b.prop === 'innerHTML') el.innerHTML = value;
        else if (b.prop === 'style' && b.styleProp) el.style[b.styleProp] = value;
      }
    }

    // Signal templates that CONFIG changed — allows procedural templates to re-init
    try {
      window.dispatchEvent(new CustomEvent('configupdate', { detail: { key: key, value: value } }));
    } catch(e) {}
  };

  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'CONFIG_UPDATE') {
      if (e.data.key) {
        window.__applyConfigUpdate(e.data.key, e.data.value);
      }
      // Some templates expect CONFIG_UPDATE with a payload object (bulk)
      if (e.data.payload && typeof e.data.payload === 'object') {
        var pkeys = Object.keys(e.data.payload);
        for (var pi = 0; pi < pkeys.length; pi++) {
          window.__applyConfigUpdate(pkeys[pi], e.data.payload[pkeys[pi]]);
        }
      }
    }
    if (e.data.type === 'CONFIG_BULK_UPDATE' && e.data.values) {
      var keys = Object.keys(e.data.values);
      for (var i = 0; i < keys.length; i++) {
        window.__applyConfigUpdate(keys[i], e.data.values[keys[i]]);
      }
      // Signal bulk update completion for procedural templates
      try {
        window.dispatchEvent(new CustomEvent('configupdate', { detail: { bulk: true, keys: keys } }));
      } catch(e2) {}
    }
    if (e.data.type === 'FRAME_UPDATE') {
      if (typeof window.__onFrameUpdate === 'function') {
        window.__onFrameUpdate(e.data.currentFrame, e.data.isPlaying, e.data.fps, e.data.totalFrames);
      }
    }
    // CSS Variable update
    if (e.data.type === 'CSS_VAR_UPDATE' && e.data.variable) {
      document.documentElement.style.setProperty(e.data.variable, e.data.value);
    }
    // Direct style update via selector
    if (e.data.type === 'STYLE_UPDATE' && e.data.selector) {
      document.querySelectorAll(e.data.selector).forEach(function(el) {
        el.style[e.data.property] = e.data.value;
      });
    }
    // Text content update via selector
    if (e.data.type === 'TEXT_UPDATE' && e.data.selector) {
      document.querySelectorAll(e.data.selector).forEach(function(el) {
        el.textContent = e.data.value;
      });
    }
  });

  // Signal readiness to parent
  try { window.parent.postMessage({ type: 'TEMPLATE_READY' }, '*'); } catch(e) {}
})();
</script>`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Inject the postMessage bridge into an HTML template string.
 * Idempotent — if the bridge is already present, returns the original HTML.
 */
export function injectMessageBridge(html: string): string {
  // Don't double-inject
  if (html.includes('data-template-bridge="1"')) return html

  // Extract DOM bindings from template source
  const domBindings = extractDomBindings(html)

  const bridgeScript = buildBridgeScript(domBindings)

  // Inject before </body> if present, otherwise before </html>, otherwise at end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${bridgeScript}\n</body>`)
  }
  if (html.includes('</html>')) {
    return html.replace('</html>', `${bridgeScript}\n</html>`)
  }
  return html + bridgeScript
}

/**
 * Bake updated CONFIG values directly into template HTML source.
 *
 * Kinetic typography and other procedural templates read CONFIG once during
 * initialization and never check it again. postMessage-based updates have no
 * effect because there are no DOM bindings to re-apply. This function patches
 * the CONFIG object literal in the HTML source so when the iframe reloads
 * with the new srcDoc, the template initializes with the updated values.
 */
export function bakeConfigIntoHtml(
  html: string,
  config: Array<{ key: string; value: unknown }>,
): string {
  if (config.length === 0) return html

  // Match `const CONFIG = { ... }` or `var CONFIG = { ... }` or `let CONFIG = { ... }`
  // The regex captures the CONFIG object literal (handles nested braces up to 2 levels)
  const configRegex = /((?:const|let|var)\s+CONFIG\s*=\s*)(\{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\})/

  const match = html.match(configRegex)
  if (!match) return html

  const [fullMatch, prefix, configStr] = match

  // Parse the CONFIG object safely without eval/new Function.
  // Normalize JS object literal syntax to JSON, then parse.
  let parsed: Record<string, unknown>
  try {
    const jsonified = configStr
      // Replace single-quoted strings with double-quoted
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, '$1')
      // Quote unquoted object keys
      .replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":')
    parsed = JSON.parse(jsonified) as Record<string, unknown>
  } catch {
    // If parsing fails, fall back to returning original HTML
    return html
  }

  // Merge in the new config values
  for (const { key, value } of config) {
    const parts = key.split('.')
    if (parts.length === 2 && parsed[parts[0]] && typeof parsed[parts[0]] === 'object') {
      ;(parsed[parts[0]] as Record<string, unknown>)[parts[1]] = value
    } else {
      parsed[key] = value
    }
  }

  // Serialize back — use JSON.stringify with 2-space indent for readable output
  const newConfigStr = JSON.stringify(parsed, null, 2)

  return html.replace(fullMatch, `${prefix}${newConfigStr}`)
}

/**
 * Apply row data from a batch spreadsheet to an HTML template.
 *
 * Sends all column values as CONFIG updates by baking them into the HTML
 * source. This allows using HTML motion graphics templates as batch templates
 * where each row produces a different visual.
 */
export function applyRowData(
  html: string,
  rowData: Record<string, string>,
): string {
  const config = Object.entries(rowData).map(([key, value]) => ({
    key,
    value,
  }))
  return bakeConfigIntoHtml(html, config)
}
