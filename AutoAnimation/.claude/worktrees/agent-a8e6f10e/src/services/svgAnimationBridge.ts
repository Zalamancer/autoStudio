/**
 * SVG Animation Playback Bridge
 *
 * Injects a <script> into SVG+CSS animation HTML that listens for
 * postMessage commands to control CSS animation playback via the
 * Web Animations API (document.getAnimations()).
 *
 * Messages (parent → iframe):
 *   { type: 'ANIM_PLAY' }
 *   { type: 'ANIM_PAUSE' }
 *   { type: 'ANIM_SET_SPEED', speed: number }
 *   { type: 'ANIM_SEEK', time: number }          // seconds
 *
 * Messages (iframe → parent):
 *   { type: 'SVG_ANIM_READY' }
 */

const BRIDGE_SCRIPT = `
<script>
(function() {
  function getAnims() { return document.getAnimations(); }

  window.addEventListener('message', function(e) {
    var d = e.data;
    if (!d || !d.type) return;
    var anims = getAnims();

    switch (d.type) {
      case 'ANIM_PLAY':
        anims.forEach(function(a) { a.play(); });
        break;
      case 'ANIM_PAUSE':
        anims.forEach(function(a) { a.pause(); });
        break;
      case 'ANIM_SET_SPEED':
        var speed = d.speed || 1;
        anims.forEach(function(a) { a.playbackRate = speed; });
        break;
      case 'ANIM_SEEK':
        var ms = (d.time || 0) * 1000;
        anims.forEach(function(a) {
          a.currentTime = ms;
        });
        break;
    }
  });

  // Signal ready once animations are parsed
  if (document.readyState === 'complete') {
    parent.postMessage({ type: 'SVG_ANIM_READY' }, '*');
  } else {
    window.addEventListener('load', function() {
      parent.postMessage({ type: 'SVG_ANIM_READY' }, '*');
    });
  }
})();
</script>`

/**
 * Inject the playback bridge script into an SVG animation HTML page.
 * Inserts before </body> if present, otherwise appends before </html> or at end.
 */
export function injectAnimationBridge(html: string): string {
  if (html.includes('ANIM_PLAY')) return html // already injected

  const bodyClose = html.lastIndexOf('</body>')
  if (bodyClose !== -1) {
    return html.slice(0, bodyClose) + BRIDGE_SCRIPT + html.slice(bodyClose)
  }

  const htmlClose = html.lastIndexOf('</html>')
  if (htmlClose !== -1) {
    return html.slice(0, htmlClose) + BRIDGE_SCRIPT + html.slice(htmlClose)
  }

  return html + BRIDGE_SCRIPT
}
