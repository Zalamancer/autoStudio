import { describe, it, expect } from 'vitest'
import { parseTemplateConfig, extractDomBindings } from '../templateConfigParser'

describe('parseTemplateConfig', () => {
  it('returns empty array for HTML without config', () => {
    const html = '<html><body>Hello</body></html>'
    expect(parseTemplateConfig(html)).toEqual([])
  })

  it('parses CONFIG object with string values', () => {
    const html = `
      <script>
        const CONFIG = {
          channelName: 'My Channel',
          subtitle: 'Welcome',
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result.length).toBe(2)
    expect(result[0].key).toBe('channelName')
    expect(result[0].value).toBe('My Channel')
    expect(result[0].type).toBe('text')
    expect(result[0].label).toBe('Channel Name')
  })

  it('parses CONFIG object with number values', () => {
    const html = `
      <script>
        const CONFIG = {
          speed: 1.5,
          count: 10,
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    const speed = result.find(p => p.key === 'speed')
    expect(speed?.type).toBe('number')
    expect(speed?.value).toBe(1.5)
    expect(speed?.group).toBe('Animation')
  })

  it('parses CONFIG object with boolean values', () => {
    const html = `
      <script>
        const CONFIG = {
          showLogo: true,
          hideGrid: false,
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    const showLogo = result.find(p => p.key === 'showLogo')
    expect(showLogo?.type).toBe('boolean')
    expect(showLogo?.value).toBe(true)
  })

  it('detects color values', () => {
    const html = `
      <script>
        const CONFIG = {
          bgColor: '#ff0000',
          textColor: 'rgba(0, 0, 0, 0.5)',
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result[0].type).toBe('color')
    expect(result[0].group).toBe('Colors')
    expect(result[1].type).toBe('color')
  })

  it('parses array values', () => {
    const html = `
      <script>
        const CONFIG = {
          items: ['one', 'two', 'three'],
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    const items = result.find(p => p.key === 'items')
    expect(items?.type).toBe('text-array')
    expect(items?.group).toBe('Data')
  })

  it('flattens nested color objects', () => {
    const html = `
      <script>
        const CONFIG = {
          colors: {
            bg: '#000000',
            text: '#ffffff',
            accent: '#ff0000',
          },
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result.length).toBe(3)
    expect(result[0].key).toBe('colors.bg')
    expect(result[0].type).toBe('color')
    expect(result[0].label).toContain('Bg')
  })

  it('parses standalone SCREAMING_SNAKE_CASE variables', () => {
    const html = `
      <script>
        // ====== EDITABLE VARIABLES ======
        const BG_COLOR = '#123456';
        const TITLE_TEXT = 'Hello World';
        const SPEED = 2.5;
        const SHOW_LOGO = true;
        // ====== END EDITABLE ======
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result.length).toBe(4)

    const bg = result.find(p => p.key === 'BG_COLOR')
    expect(bg?.value).toBe('#123456')
    expect(bg?.type).toBe('color')
    expect(bg?.label).toBe('Bg Color')

    const title = result.find(p => p.key === 'TITLE_TEXT')
    expect(title?.value).toBe('Hello World')
    expect(title?.type).toBe('text')
  })

  it('converts camelCase keys to labels', () => {
    const html = `
      <script>
        const CONFIG = {
          channelName: 'test',
          backgroundColor: '#000',
          animationSpeed: 1.0,
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result.find(p => p.key === 'channelName')?.label).toBe('Channel Name')
    expect(result.find(p => p.key === 'backgroundColor')?.label).toBe('Background Color')
    expect(result.find(p => p.key === 'animationSpeed')?.label).toBe('Animation Speed')
  })

  it('infers correct groups from key names', () => {
    const html = `
      <script>
        const CONFIG = {
          transitionDuration: 0.5,
          cycleSpeed: 1.0,
          itemCount: 5,
          borderRadius: 10,
          title: 'Hello',
        };
      </script>
    `
    const result = parseTemplateConfig(html)
    expect(result.find(p => p.key === 'transitionDuration')?.group).toBe('Animation')
    expect(result.find(p => p.key === 'cycleSpeed')?.group).toBe('Animation')
    expect(result.find(p => p.key === 'itemCount')?.group).toBe('Numbers')
    expect(result.find(p => p.key === 'borderRadius')?.group).toBe('Numbers')
    expect(result.find(p => p.key === 'title')?.group).toBe('Text')
  })
})

describe('extractDomBindings', () => {
  it('returns empty for HTML without bindings', () => {
    expect(extractDomBindings('<div>hello</div>')).toEqual({})
  })

  it('extracts textContent bindings', () => {
    const html = `
      document.getElementById('logo').textContent = CONFIG.channelName;
    `
    const result = extractDomBindings(html)
    expect(result['channelName']).toBeDefined()
    expect(result['channelName'][0].elId).toBe('logo')
    expect(result['channelName'][0].prop).toBe('textContent')
  })

  it('extracts innerHTML bindings', () => {
    const html = `
      document.getElementById('content').innerHTML = CONFIG.htmlContent;
    `
    const result = extractDomBindings(html)
    expect(result['htmlContent']).toBeDefined()
    expect(result['htmlContent'][0].prop).toBe('innerHTML')
  })

  it('extracts body style bindings', () => {
    const html = `
      document.body.style.background = CONFIG.bgColor;
    `
    const result = extractDomBindings(html)
    expect(result['bgColor']).toBeDefined()
    expect(result['bgColor'][0].elId).toBe('__body__')
    expect(result['bgColor'][0].prop).toBe('style')
    expect(result['bgColor'][0].styleProp).toBe('background')
  })

  it('extracts standalone variable bindings', () => {
    const html = `
      document.getElementById('title').textContent = TITLE_TEXT;
    `
    const result = extractDomBindings(html)
    expect(result['TITLE_TEXT']).toBeDefined()
  })
})
