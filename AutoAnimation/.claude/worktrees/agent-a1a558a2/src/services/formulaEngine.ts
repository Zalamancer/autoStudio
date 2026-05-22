/**
 * Formula Engine — evaluates math expressions with project variables.
 *
 * Wraps a safe subset of math operations (no eval/require/import).
 * Supports variables like width, height, fps, frame, time, etc.
 */

import type { FormulaContext, FormulaResult } from '@/types/formula'

// ── Built-in math functions (safe subset) ────────────────────────────────────

const BUILTIN_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  log: Math.log,
  log2: Math.log2,
  log10: Math.log10,
  exp: Math.exp,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  sign: Math.sign,
  clamp: (val: number, lo: number, hi: number) => Math.min(Math.max(val, lo), hi),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  random: () => Math.random(),
}

// ── Built-in constants ──────────────────────────────────────────────────────

const BUILTIN_CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  tau: Math.PI * 2,
}

// ── Tokenizer ───────────────────────────────────────────────────────────────

type TokenType =
  | 'number'
  | 'identifier'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'comma'

interface Token {
  type: TokenType
  value: string
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = expression.length

  while (i < len) {
    const ch = expression[i]

    // Whitespace
    if (/\s/.test(ch)) { i++; continue }

    // Number (including decimals)
    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < len && /[0-9.eE]/.test(expression[i])) {
        num += expression[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifier (variable or function name)
    if (/[a-zA-Z_]/.test(ch)) {
      let id = ''
      while (i < len && /[a-zA-Z0-9_]/.test(expression[i])) {
        id += expression[i]
        i++
      }
      tokens.push({ type: 'identifier', value: id })
      continue
    }

    // Operators
    if ('+-*/%^'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch })
      i++
      continue
    }

    if (ch === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue }
    if (ch === ',') { tokens.push({ type: 'comma', value: ',' }); i++; continue }

    // Unknown character — skip
    i++
  }

  return tokens
}

// ── Recursive descent parser + evaluator ────────────────────────────────────

class Parser {
  tokens: Token[]
  pos: number
  context: FormulaContext

  constructor(tokens: Token[], context: FormulaContext) {
    this.tokens = tokens
    this.pos = 0
    this.context = context
  }

  peek(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null
  }

  consume(): Token {
    return this.tokens[this.pos++]
  }

  expect(type: TokenType): Token {
    const token = this.consume()
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type} (${token.value})`)
    }
    return token
  }

  // expression = term (('+' | '-') term)*
  parseExpression(): number {
    let result = this.parseTerm()

    while (this.peek()?.type === 'operator' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value
      const right = this.parseTerm()
      result = op === '+' ? result + right : result - right
    }

    return result
  }

  // term = power (('*' | '/' | '%') power)*
  parseTerm(): number {
    let result = this.parsePower()

    while (this.peek()?.type === 'operator' && ('*/%'.includes(this.peek()!.value))) {
      const op = this.consume().value
      const right = this.parsePower()
      if (op === '*') result *= right
      else if (op === '/') result = right === 0 ? 0 : result / right
      else if (op === '%') result = right === 0 ? 0 : result % right
    }

    return result
  }

  // power = unary ('^' unary)*
  parsePower(): number {
    let result = this.parseUnary()

    while (this.peek()?.type === 'operator' && this.peek()!.value === '^') {
      this.consume()
      const right = this.parseUnary()
      result = Math.pow(result, right)
    }

    return result
  }

  // unary = ('-' | '+')? primary
  parseUnary(): number {
    if (this.peek()?.type === 'operator' && (this.peek()!.value === '-' || this.peek()!.value === '+')) {
      const op = this.consume().value
      const val = this.parsePrimary()
      return op === '-' ? -val : val
    }
    return this.parsePrimary()
  }

  // primary = number | identifier | function_call | '(' expression ')'
  parsePrimary(): number {
    const token = this.peek()

    if (!token) throw new Error('Unexpected end of expression')

    // Number literal
    if (token.type === 'number') {
      this.consume()
      const num = parseFloat(token.value)
      return isNaN(num) ? 0 : num
    }

    // Identifier (variable or function call)
    if (token.type === 'identifier') {
      this.consume()
      const name = token.value

      // Check for function call: identifier '(' args ')'
      if (this.peek()?.type === 'lparen') {
        this.consume() // eat '('
        const args: number[] = []

        if (this.peek()?.type !== 'rparen') {
          args.push(this.parseExpression())
          while (this.peek()?.type === 'comma') {
            this.consume()
            args.push(this.parseExpression())
          }
        }

        this.expect('rparen')

        const fn = BUILTIN_FUNCTIONS[name]
        if (fn) return fn(...args)

        throw new Error(`Unknown function: ${name}`)
      }

      // Built-in constant
      if (name in BUILTIN_CONSTANTS) return BUILTIN_CONSTANTS[name]

      // Context variable
      if (name in this.context) return this.context[name]

      throw new Error(`Unknown variable: ${name}`)
    }

    // Parenthesized expression
    if (token.type === 'lparen') {
      this.consume()
      const result = this.parseExpression()
      this.expect('rparen')
      return result
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Evaluate a formula expression with the given variable context.
 */
export function evaluateFormula(expression: string, context: FormulaContext = {}): FormulaResult {
  const warnings: string[] = []

  if (!expression || expression.trim() === '') {
    return { value: 0, error: 'Empty expression', warnings }
  }

  try {
    const tokens = tokenize(expression)
    if (tokens.length === 0) {
      return { value: 0, error: 'No valid tokens', warnings }
    }

    const parser = new Parser(tokens, context)
    let result = parser.parseExpression()

    // Handle edge cases
    if (!isFinite(result)) {
      warnings.push('Result is infinite, defaulting to 0')
      result = 0
    }
    if (isNaN(result)) {
      warnings.push('Result is NaN, defaulting to 0')
      result = 0
    }

    return { value: result, error: null, warnings }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Evaluation failed'
    return { value: 0, error: errorMsg, warnings }
  }
}

/**
 * Get list of all available formula variables for autocomplete.
 */
export function getAvailableVariables(): Array<{ name: string; description: string; category: string }> {
  return [
    // Canvas
    { name: 'width', description: 'Canvas width (px)', category: 'canvas' },
    { name: 'height', description: 'Canvas height (px)', category: 'canvas' },
    { name: 'centerX', description: 'Canvas center X (width/2)', category: 'canvas' },
    { name: 'centerY', description: 'Canvas center Y (height/2)', category: 'canvas' },
    { name: 'zoom', description: 'Canvas zoom level', category: 'canvas' },
    // Playback
    { name: 'frame', description: 'Current frame number', category: 'playback' },
    { name: 'fps', description: 'Frames per second', category: 'playback' },
    { name: 'time', description: 'Current time (seconds)', category: 'playback' },
    // Timeline
    { name: 'totalFrames', description: 'Total timeline frames', category: 'timeline' },
    { name: 'duration', description: 'Total duration (seconds)', category: 'timeline' },
    // Constants
    { name: 'pi', description: '3.14159...', category: 'constant' },
    { name: 'e', description: '2.71828...', category: 'constant' },
    { name: 'phi', description: 'Golden ratio (1.618...)', category: 'constant' },
    { name: 'tau', description: '2 * pi (6.283...)', category: 'constant' },
    // Functions
    { name: 'round', description: 'Round to nearest integer', category: 'function' },
    { name: 'floor', description: 'Round down', category: 'function' },
    { name: 'ceil', description: 'Round up', category: 'function' },
    { name: 'abs', description: 'Absolute value', category: 'function' },
    { name: 'min', description: 'Minimum of values', category: 'function' },
    { name: 'max', description: 'Maximum of values', category: 'function' },
    { name: 'clamp', description: 'Clamp(val, min, max)', category: 'function' },
    { name: 'lerp', description: 'Linear interpolation(a, b, t)', category: 'function' },
    { name: 'sin', description: 'Sine (radians)', category: 'function' },
    { name: 'cos', description: 'Cosine (radians)', category: 'function' },
    { name: 'sqrt', description: 'Square root', category: 'function' },
    { name: 'pow', description: 'Power(base, exponent)', category: 'function' },
    { name: 'random', description: 'Random number 0-1', category: 'function' },
  ]
}
