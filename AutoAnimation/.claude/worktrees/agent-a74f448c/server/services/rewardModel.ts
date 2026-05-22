/**
 * Template Reward Model — Ridge Regression
 *
 * Trains on user ratings to predict template quality scores.
 * Pure TypeScript, no external ML dependencies.
 *
 * Architecture:
 *   template TSX code → feature extractor → 28-dim vector → ridge regression → predicted avg score
 *
 * Training:
 *   1. Load all rated templates from Supabase
 *   2. Read each template's TSX file, extract features
 *   3. Fit ridge regression: features → average score (1-4)
 *   4. Save weights to disk
 *
 * Prediction:
 *   1. Extract features from template code
 *   2. Multiply by weights + bias → predicted score
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFeatures, featuresToVector, FEATURE_KEYS, type TemplateFeatures } from './templateFeatureExtractor'
import { getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODEL_PATH = path.join(__dirname, '..', 'data', 'reward-model.json')

// ── Types ────────────────────────────────────────────────────────────

export interface ModelWeights {
  weights: number[]          // One per feature
  bias: number
  featureKeys: string[]
  featureMeans: number[]     // For normalization
  featureStds: number[]      // For normalization
  trainedAt: string
  sampleCount: number
  r2Score: number            // Training R² (goodness of fit)
  featureImportance: { key: string; weight: number }[]
}

export interface PredictionResult {
  predictedScore: number     // 1-4 scale
  confidence: number         // 0-1 based on feature coverage
  verdict: 'liked' | 'disliked'
  features: TemplateFeatures
  topFactors: { feature: string; contribution: number; direction: 'positive' | 'negative' }[]
}

export interface TrainResult {
  sampleCount: number
  r2Score: number
  featureImportance: { key: string; weight: number }[]
  message: string
}

// ── Model state ──────────────────────────────────────────────────────

let cachedModel: ModelWeights | null = null

function loadModel(): ModelWeights | null {
  if (cachedModel) return cachedModel
  try {
    if (fs.existsSync(MODEL_PATH)) {
      cachedModel = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'))
      return cachedModel
    }
  } catch {
    // Corrupt file, retrain
  }
  return null
}

function saveModel(model: ModelWeights): void {
  const dir = path.dirname(MODEL_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(MODEL_PATH, JSON.stringify(model, null, 2))
  cachedModel = model
}

// ── Training ─────────────────────────────────────────────────────────

/**
 * Train the reward model on all rated templates.
 * Reads template files from the src/motionGraphics/templates/ directory.
 */
export async function trainRewardModel(templateDir: string): Promise<TrainResult> {
  if (!isSocialConfigured()) {
    return { sampleCount: 0, r2Score: 0, featureImportance: [], message: 'Supabase not configured' }
  }

  // 1. Load all ratings from Supabase
  const supabase = getSupabaseAdmin()
  const { data: ratingRows, error } = await supabase
    .from('template_ratings')
    .select('template_id, verdict, impact, finish, flow, versatility, appeal')

  if (error || !ratingRows || ratingRows.length === 0) {
    return { sampleCount: 0, r2Score: 0, featureImportance: [], message: `No ratings found: ${error?.message || 'empty'}` }
  }

  // 2. Build ID → file mapping
  const templateFiles = new Map<string, string>()
  const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.tsx'))
  for (const file of files) {
    const filePath = path.join(templateDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/)
    if (idMatch) {
      templateFiles.set(idMatch[1], content)
    }
  }

  // 3. Build training data: features (X) and scores (y)
  const X: number[][] = []
  const y: number[] = []
  let skipped = 0

  for (const row of ratingRows) {
    const code = templateFiles.get(row.template_id)
    if (!code) { skipped++; continue }
    if (row.impact == null) { skipped++; continue }

    const features = extractFeatures(code)
    const vector = featuresToVector(features)
    const avgScore = (row.impact + row.finish + (row as any).flow + row.versatility + row.appeal) / 5

    X.push(vector)
    y.push(avgScore)
  }

  if (X.length < 10) {
    return { sampleCount: X.length, r2Score: 0, featureImportance: [], message: `Need at least 10 rated templates with scores, got ${X.length} (${skipped} skipped)` }
  }

  // 4. Normalize features (z-score)
  const nFeatures = X[0].length
  const means = new Array(nFeatures).fill(0)
  const stds = new Array(nFeatures).fill(0)

  for (let j = 0; j < nFeatures; j++) {
    const col = X.map(row => row[j])
    means[j] = col.reduce((a, b) => a + b, 0) / col.length
    const variance = col.reduce((a, b) => a + (b - means[j]) ** 2, 0) / col.length
    stds[j] = Math.sqrt(variance) || 1 // Avoid division by zero
  }

  const Xnorm = X.map(row => row.map((val, j) => (val - means[j]) / stds[j]))

  // 5. Ridge regression (closed-form): w = (X^T X + λI)^{-1} X^T y
  const lambda = 1.0 // Regularization strength
  const result = ridgeRegression(Xnorm, y, lambda)

  // 6. Compute R² score
  const yMean = y.reduce((a, b) => a + b, 0) / y.length
  let ssRes = 0, ssTot = 0
  for (let i = 0; i < y.length; i++) {
    const pred = predictRaw(Xnorm[i], result.weights, result.bias)
    ssRes += (y[i] - pred) ** 2
    ssTot += (y[i] - yMean) ** 2
  }
  const r2Score = ssTot > 0 ? 1 - ssRes / ssTot : 0

  // 7. Feature importance (absolute weight, normalized)
  const maxWeight = Math.max(...result.weights.map(Math.abs), 0.001)
  const featureImportance = FEATURE_KEYS
    .map((key, i) => ({ key, weight: result.weights[i] / maxWeight }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

  // 8. Save model
  const model: ModelWeights = {
    weights: result.weights,
    bias: result.bias,
    featureKeys: [...FEATURE_KEYS],
    featureMeans: means,
    featureStds: stds,
    trainedAt: new Date().toISOString(),
    sampleCount: X.length,
    r2Score,
    featureImportance,
  }
  saveModel(model)

  return {
    sampleCount: X.length,
    r2Score: Math.round(r2Score * 1000) / 1000,
    featureImportance: featureImportance.slice(0, 10),
    message: `Trained on ${X.length} templates (${skipped} skipped). R²=${r2Score.toFixed(3)}`,
  }
}

// ── Prediction ───────────────────────────────────────────────────────

/**
 * Predict quality score for a template given its TSX code.
 */
export function predictTemplateScore(code: string): PredictionResult | null {
  const model = loadModel()
  if (!model) return null

  const features = extractFeatures(code)
  const vector = featuresToVector(features)

  // Normalize using training stats
  const normalized = vector.map((val, j) => (val - model.featureMeans[j]) / model.featureStds[j])

  // Predict
  let score = predictRaw(normalized, model.weights, model.bias)
  // Clamp to 1-4
  score = Math.max(1, Math.min(4, score))

  // Top contributing factors
  const contributions = normalized.map((val, j) => ({
    feature: FEATURE_KEYS[j],
    contribution: val * model.weights[j],
    direction: (val * model.weights[j] > 0 ? 'positive' : 'negative') as 'positive' | 'negative',
  }))
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  return {
    predictedScore: Math.round(score * 100) / 100,
    confidence: Math.min(model.sampleCount / 100, 1),
    verdict: score >= 2.5 ? 'liked' : 'disliked',
    features,
    topFactors: contributions.slice(0, 8),
  }
}

/**
 * Get model status (for API).
 */
export function getModelStatus(): { trained: boolean; sampleCount: number; r2Score: number; trainedAt: string | null; featureImportance: { key: string; weight: number }[] } {
  const model = loadModel()
  if (!model) return { trained: false, sampleCount: 0, r2Score: 0, trainedAt: null, featureImportance: [] }
  return {
    trained: true,
    sampleCount: model.sampleCount,
    r2Score: model.r2Score,
    trainedAt: model.trainedAt,
    featureImportance: model.featureImportance.slice(0, 15),
  }
}

// ── Ridge Regression (closed-form) ───────────────────────────────────

function ridgeRegression(X: number[][], y: number[], lambda: number): { weights: number[]; bias: number } {
  const n = X.length
  const p = X[0].length

  // Compute mean of y for bias
  const yMean = y.reduce((a, b) => a + b, 0) / n
  const yCentered = y.map(v => v - yMean)

  // X^T X (p × p matrix)
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0))
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j]
      }
      XtX[i][j] = sum
      XtX[j][i] = sum
    }
    // Add regularization
    XtX[i][i] += lambda
  }

  // X^T y (p-vector)
  const Xty = new Array(p).fill(0)
  for (let i = 0; i < p; i++) {
    for (let k = 0; k < n; k++) {
      Xty[i] += X[k][i] * yCentered[k]
    }
  }

  // Solve XtX * w = Xty via Cholesky decomposition
  const weights = solveLinearSystem(XtX, Xty)

  return { weights, bias: yMean }
}

/**
 * Solve Ax = b via Cholesky decomposition (A must be positive definite).
 * Ridge regression guarantees positive definiteness via λI.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length

  // Cholesky decomposition: A = L * L^T
  const L = Array.from({ length: n }, () => new Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k]
      }
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(A[i][i] - sum, 1e-10))
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j]
      }
    }
  }

  // Forward substitution: L * z = b
  const z = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let j = 0; j < i; j++) {
      sum += L[i][j] * z[j]
    }
    z[i] = (b[i] - sum) / L[i][i]
  }

  // Backward substitution: L^T * x = z
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0
    for (let j = i + 1; j < n; j++) {
      sum += L[j][i] * x[j]
    }
    x[i] = (z[i] - sum) / L[i][i]
  }

  return x
}

function predictRaw(x: number[], weights: number[], bias: number): number {
  let sum = bias
  for (let i = 0; i < x.length; i++) {
    sum += x[i] * weights[i]
  }
  return sum
}
