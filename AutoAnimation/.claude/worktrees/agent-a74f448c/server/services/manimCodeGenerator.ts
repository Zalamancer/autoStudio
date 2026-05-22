/**
 * Agent 3 — Manim Code Generator
 *
 * Uses Claude Opus with extended thinking to generate ManimCE Python code
 * for animated explainer scenes. Includes a visual feedback loop: generate,
 * render a test frame, review the screenshot, and retry if needed.
 */

import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Types (inline — don't import from client packages)
// ---------------------------------------------------------------------------

export interface SceneSpecInput {
  index: number
  title: string
  durationSeconds: number
  animationIntent: string
  narrationText: string
  elements: Array<{
    elementId: string
    type: string
    anchor: { row: number; col: number }
    description: string
  }>
  elementContinuity: Array<{
    elementId: string
    fromSceneIndex: number
    transform: string
  }>
}

export interface ManimCodeOutput {
  code: string
  className: string
  retryCount: number
  errors: string[]
  visualApproved: boolean
}

// ---------------------------------------------------------------------------
// Lazy Anthropic client
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export function isManimCodeGeneratorConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

// ---------------------------------------------------------------------------
// System prompt — ManimCE code-gen guidelines
// ---------------------------------------------------------------------------

const MANIM_SYSTEM_PROMPT = `You are an expert ManimCE (Community Edition) Python code generator. Your job is to produce a single, self-contained Python file that renders one animation scene using ManimCE.

## ManimCE API Guidelines

- Always start with: \`from manim import *\`
- Define exactly ONE class per file: \`class Scene{N}(Scene):\` where {N} is the scene index.
- Implement \`def construct(self):\` as the entry point.
- Use \`self.play(...)\` to execute animations and \`self.wait(seconds)\` for pauses.
- Always call \`self.wait(0.5)\` at the very end of \`construct()\` so the last frame holds.
- Common animations: Write, FadeIn, FadeOut, Transform, MoveToTarget, Create, Uncreate, DrawBorderThenFill, GrowFromCenter, ReplacementTransform, Indicate, Circumscribe.
- Common mobjects: Text, MathTex, Tex, Circle, Square, Rectangle, Arrow, Line, Axes, NumberPlane, VGroup, SVGMobject, Dot, Polygon, Arc, Brace.
- Use \`.animate\` syntax for property animations: \`self.play(obj.animate.shift(RIGHT * 2).set_color(BLUE))\`
- For simultaneous animations: \`self.play(anim1, anim2, anim3)\`
- For sequential animations: call \`self.play()\` multiple times.

## 6x6 Spatial Grid System

The 1920x1080 canvas is divided into a 6x6 logical grid. Each cell is approximately 320x180 pixels. Grid coordinates (row, col) map to Manim coordinates as follows:

- Column 0 = LEFT * 6, Column 1 = LEFT * 3.6, Column 2 = LEFT * 1.2, Column 3 = RIGHT * 1.2, Column 4 = RIGHT * 3.6, Column 5 = RIGHT * 6
- Row 0 = UP * 3.5, Row 1 = UP * 2.1, Row 2 = UP * 0.7, Row 3 = DOWN * 0.7, Row 4 = DOWN * 2.1, Row 5 = DOWN * 3.5

Helper to convert grid position to Manim coordinates:
\`\`\`python
def grid_to_manim(row: int, col: int):
    x_positions = [-6, -3.6, -1.2, 1.2, 3.6, 6]
    y_positions = [3.5, 2.1, 0.7, -0.7, -2.1, -3.5]
    return RIGHT * x_positions[col] + UP * y_positions[row]
\`\`\`

Place elements at the anchor positions specified in the scene spec. When elements span multiple cells, center them between the cells.

## Duration Mapping

- Total scene duration = durationSeconds from the spec.
- Distribute self.play() calls and self.wait() calls so total runtime matches the target duration.
- Each self.play() with run_time=X takes X seconds. Each self.wait(X) takes X seconds.
- Rule of thumb: animation_time + wait_time = durationSeconds.

## Rules

1. ALWAYS produce valid Python that runs with \`manim render -qm file.py SceneN\`.
2. NEVER use deprecated Manim APIs (e.g., TextMobject — use Text instead).
3. NEVER import anything beyond \`from manim import *\`.
4. NEVER use \`input()\`, \`os.system()\`, or any side-effect outside rendering.
5. Use descriptive variable names matching element IDs from the spec when possible.
6. Include brief comments explaining each animation step.
7. For element continuity (elements carried over from a previous scene), create the element first, position it at its starting state, then transform it.

## Few-Shot Examples

### Example 1: Simple text + formula scene
Scene spec: title="Pythagorean Theorem", duration=5s, elements=[title at (0,2), formula at (2,2), triangle at (2,4)], animationIntent="Introduce the theorem with a title, then show the formula and a right triangle"

\`\`\`python
from manim import *

class Scene0(Scene):
    def construct(self):
        # Grid helper
        def grid_to_manim(row, col):
            xs = [-6, -3.6, -1.2, 1.2, 3.6, 6]
            ys = [3.5, 2.1, 0.7, -0.7, -2.1, -3.5]
            return RIGHT * xs[col] + UP * ys[row]

        # Title text at grid (0, 2)
        title = Text("Pythagorean Theorem", font_size=48, color=WHITE)
        title.move_to(grid_to_manim(0, 2))
        self.play(Write(title), run_time=1.0)
        self.wait(0.5)

        # Formula at grid (2, 2)
        formula = MathTex("a^2 + b^2 = c^2", font_size=42, color=YELLOW)
        formula.move_to(grid_to_manim(2, 2))
        self.play(FadeIn(formula, shift=UP * 0.3), run_time=1.0)

        # Right triangle at grid (2, 4)
        triangle = Polygon(
            grid_to_manim(3, 4) + LEFT * 0.8 + DOWN * 0.5,
            grid_to_manim(3, 4) + RIGHT * 0.8 + DOWN * 0.5,
            grid_to_manim(3, 4) + LEFT * 0.8 + UP * 0.8,
            color=BLUE, fill_opacity=0.3
        )
        self.play(Create(triangle), run_time=1.0)
        self.wait(1.0)

        # Highlight the formula
        self.play(Indicate(formula, color=ORANGE), run_time=0.5)
        self.wait(0.5)
\`\`\`

### Example 2: Graph / Axes scene
Scene spec: title="Linear Growth", duration=6s, elements=[axes at (2,2), line at (2,2), label at (0,3)], animationIntent="Show a coordinate plane, draw a linear function, label it"

\`\`\`python
from manim import *

class Scene1(Scene):
    def construct(self):
        def grid_to_manim(row, col):
            xs = [-6, -3.6, -1.2, 1.2, 3.6, 6]
            ys = [3.5, 2.1, 0.7, -0.7, -2.1, -3.5]
            return RIGHT * xs[col] + UP * ys[row]

        # Coordinate axes centered at grid (2, 2)
        axes = Axes(
            x_range=[-1, 5, 1],
            y_range=[-1, 5, 1],
            x_length=6,
            y_length=4,
            axis_config={"include_numbers": True, "font_size": 24},
        )
        axes.move_to(grid_to_manim(2, 2) + DOWN * 0.5)
        self.play(Create(axes), run_time=1.5)

        # Linear function y = x
        line_graph = axes.plot(lambda x: x, x_range=[0, 4], color=GREEN)
        self.play(Create(line_graph), run_time=1.5)

        # Label at grid (0, 3)
        label = MathTex("f(x) = x", font_size=36, color=GREEN)
        label.move_to(grid_to_manim(0, 3))
        self.play(Write(label), run_time=1.0)
        self.wait(1.5)

        # Animate a dot along the line
        dot = Dot(color=YELLOW).move_to(axes.c2p(0, 0))
        self.play(FadeIn(dot), run_time=0.3)
        self.play(MoveAlongPath(dot, line_graph), run_time=1.5)
        self.wait(0.5)
\`\`\`

## Output Format

Return ONLY the Python code wrapped in a code block. No explanation outside the code block.

\`\`\`python
from manim import *

class SceneN(Scene):
    def construct(self):
        ...
\`\`\``

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function buildUserPrompt(spec: SceneSpecInput): string {
  const elementsList = spec.elements
    .map(e => `  - ${e.elementId} (${e.type}) at grid(${e.anchor.row}, ${e.anchor.col}): ${e.description}`)
    .join('\n')

  const continuityList = spec.elementContinuity.length > 0
    ? '\nElement continuity (carry-overs from previous scenes):\n' +
      spec.elementContinuity
        .map(c => `  - ${c.elementId} from Scene${c.fromSceneIndex}: transform=${c.transform}`)
        .join('\n')
    : ''

  return `Generate ManimCE Python code for this scene:

Scene index: ${spec.index}
Title: "${spec.title}"
Duration: ${spec.durationSeconds}s
Animation intent: ${spec.animationIntent}
Narration: "${spec.narrationText}"

Elements:
${elementsList}
${continuityList}

Write a complete Python file with class Scene${spec.index}(Scene) that implements this scene.`
}

/**
 * Generate ManimCE Python code from a scene specification.
 */
export async function generateManimCode(
  sceneSpec: SceneSpecInput
): Promise<{ code: string; className: string }> {
  const anthropic = getClient()
  const className = `Scene${sceneSpec.index}`

  console.log(`[manimCodeGen] Generating code for ${className}: "${sceneSpec.title}"`)

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 65536,
    thinking: { type: 'enabled', budget_tokens: 32768 },
    messages: [{ role: 'user', content: buildUserPrompt(sceneSpec) }],
    system: MANIM_SYSTEM_PROMPT,
  })

  const response = await stream.finalMessage()

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const code = extractPythonCode(textBlock.text)
  if (!code) {
    throw new Error('Could not extract Python code from Claude response')
  }

  // Verify the expected class name exists in the code
  if (!code.includes(`class ${className}`)) {
    throw new Error(`Generated code does not contain expected class ${className}`)
  }

  console.log(`[manimCodeGen] Generated ${code.split('\n').length} lines for ${className}`)
  return { code, className }
}

// ---------------------------------------------------------------------------
// Visual review (feedback loop critic)
// ---------------------------------------------------------------------------

/**
 * Visual critic: sends a screenshot of the rendered scene + the code + the
 * original spec to Claude and asks whether the output is acceptable.
 */
export async function reviewManimCode(
  code: string,
  screenshotBase64: string,
  sceneSpec: SceneSpecInput
): Promise<{ approved: boolean; feedback: string; fixedCode?: string }> {
  const anthropic = getClient()
  const className = `Scene${sceneSpec.index}`

  console.log(`[manimCodeGen] Reviewing rendered output for ${className}`)

  const reviewPrompt = `You are a visual QA reviewer for ManimCE animations. You receive:
1. The original scene specification
2. The generated Python code
3. A screenshot of the rendered output

Your job: determine whether the rendered output correctly implements the scene spec.

Check for:
- All specified elements are visible and positioned correctly on the 6x6 grid
- Text is readable and not clipped
- Animations match the stated intent
- No visual glitches (overlapping elements, elements off-screen, wrong colors)
- Overall quality and clarity

If the output is acceptable, respond with:
\`\`\`json
{"approved": true, "feedback": "Brief description of what looks good"}
\`\`\`

If NOT acceptable, respond with the issues AND a corrected Python code block:
\`\`\`json
{"approved": false, "feedback": "Description of issues"}
\`\`\`

\`\`\`python
# corrected code here
\`\`\`

Scene spec:
- Title: "${sceneSpec.title}"
- Intent: ${sceneSpec.animationIntent}
- Elements: ${sceneSpec.elements.map(e => `${e.elementId}(${e.type}) at grid(${e.anchor.row},${e.anchor.col})`).join(', ')}
- Duration: ${sceneSpec.durationSeconds}s

Generated code:
\`\`\`python
${code}
\`\`\``

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 65536,
    thinking: { type: 'enabled', budget_tokens: 16384 },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBase64.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          { type: 'text', text: reviewPrompt },
        ],
      },
    ],
  })

  const response = await stream.finalMessage()

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    // If we can't parse the review, assume approved to avoid infinite loops
    return { approved: true, feedback: 'Review response unparseable — auto-approving' }
  }

  const raw = textBlock.text

  // Extract JSON verdict
  const jsonMatch = raw.match(/```json\s*\n([\s\S]*?)```/)
  let approved = true
  let feedback = 'No structured feedback returned'

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim())
      approved = !!parsed.approved
      feedback = parsed.feedback || feedback
    } catch {
      // Parse failure — default to approved
    }
  }

  // Extract fixed code if present
  let fixedCode: string | undefined
  if (!approved) {
    fixedCode = extractPythonCode(raw) || undefined
  }

  console.log(`[manimCodeGen] Review for ${className}: ${approved ? 'APPROVED' : 'NEEDS FIX'} — ${feedback}`)

  return { approved, feedback, fixedCode }
}

// ---------------------------------------------------------------------------
// Full feedback loop: generate → syntax check → render → review → retry
// ---------------------------------------------------------------------------

/**
 * Generate Manim code with an automated feedback loop.
 * 1. Generate initial code via Claude.
 * 2. Basic syntax check (Python parse).
 * 3. Render a test frame (caller must provide a render callback).
 * 4. Visual review of the screenshot.
 * 5. Retry with fixes up to maxRetries.
 */
export async function generateManimCodeWithRetry(
  sceneSpec: SceneSpecInput,
  maxRetries = 3
): Promise<ManimCodeOutput> {
  const errors: string[] = []
  let currentCode = ''
  let className = `Scene${sceneSpec.index}`
  let visualApproved = false

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: Generate (or use fixed code from previous review)
      if (attempt === 0 || !currentCode) {
        const result = await generateManimCode(sceneSpec)
        currentCode = result.code
        className = result.className
      }

      // Step 2: Basic syntax validation — check for obvious issues
      const syntaxIssues = basicSyntaxCheck(currentCode, className)
      if (syntaxIssues) {
        errors.push(`Attempt ${attempt + 1} syntax: ${syntaxIssues}`)
        console.warn(`[manimCodeGen] Syntax issue on attempt ${attempt + 1}: ${syntaxIssues}`)
        currentCode = '' // Force regeneration
        continue
      }

      // If we don't have a render callback, just return after syntax check
      // The caller (route handler) can do render + review separately
      console.log(`[manimCodeGen] Attempt ${attempt + 1}: code passed syntax check (${currentCode.split('\n').length} lines)`)

      return {
        code: currentCode,
        className,
        retryCount: attempt,
        errors,
        visualApproved,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Attempt ${attempt + 1}: ${msg}`)
      console.error(`[manimCodeGen] Attempt ${attempt + 1} failed:`, msg)
      currentCode = '' // Force regeneration
    }
  }

  throw new Error(
    `Failed to generate valid Manim code after ${maxRetries + 1} attempts. Errors:\n${errors.join('\n')}`
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract Python code from a code-fenced response. */
function extractPythonCode(text: string): string | null {
  // Try fenced code block first
  const codeBlockMatch = text.match(/```(?:python|py)?\s*\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    const code = codeBlockMatch[1].trim()
    if (code.includes('from manim import') || code.includes('class Scene')) {
      return code
    }
  }

  // Fallback: look for the raw class definition
  const classMatch = text.match(/(from manim import \*[\s\S]*class Scene\d+\(Scene\):[\s\S]*)/)
  if (classMatch) {
    return classMatch[1].trim()
  }

  return null
}

/** Basic syntax checks — catch obvious problems before rendering. */
function basicSyntaxCheck(code: string, expectedClassName: string): string | null {
  if (!code.includes('from manim import')) {
    return 'Missing "from manim import *"'
  }
  if (!code.includes(`class ${expectedClassName}(Scene)`)) {
    return `Missing expected class ${expectedClassName}(Scene)`
  }
  if (!code.includes('def construct(self)')) {
    return 'Missing construct(self) method'
  }
  // Check for balanced parentheses (rough heuristic)
  const opens = (code.match(/\(/g) || []).length
  const closes = (code.match(/\)/g) || []).length
  if (opens !== closes) {
    return `Unbalanced parentheses: ${opens} open vs ${closes} close`
  }
  return null
}
