// ── Data-Driven Procedural Animation Types ──

export type DataSourceType = 'csv' | 'json' | 'rest-api' | 'google-sheets'

export type DataSourceStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  /** URL for REST API / Google Sheets, or empty for uploaded files */
  url: string
  /** Polling interval in seconds (0 = no polling) */
  pollInterval: number
  /** Last fetch timestamp */
  lastFetched: number | null
  /** Current status */
  status: DataSourceStatus
  /** Error message if status is 'error' */
  error: string | null
  /** Raw data rows (array of objects) */
  data: Record<string, unknown>[]
  /** Column names extracted from data */
  columns: string[]
  /** Whether to freeze data on export (snapshot) */
  freezeOnExport: boolean
}

export interface DataBinding {
  id: string
  /** Source data source ID */
  dataSourceId: string
  /** Column/field name from the data source */
  columnName: string
  /** Target template layer ID (HTML template) */
  targetLayerId: string
  /** Target CONFIG key in the template */
  targetConfigKey: string
  /** Optional transform: 'none' | 'round' | 'currency' | 'percentage' | 'uppercase' */
  transform: DataTransform
  /** For array data: which row index to use (or 'all' for array binding) */
  rowIndex: number | 'all'
}

export type DataTransform =
  | 'none'
  | 'round'
  | 'floor'
  | 'ceil'
  | 'currency'
  | 'percentage'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'truncate-50'
  | 'truncate-100'

export interface DataKeyframeRule {
  id: string
  /** Source data source ID */
  dataSourceId: string
  /** Column name to generate keyframes from */
  columnName: string
  /** Target element type */
  targetType: 'text' | 'shape' | 'media'
  /** Target element ID */
  targetId: string
  /** Which property to animate */
  property: string
  /** How to map data values to keyframe values */
  mappingMode: 'linear' | 'stepped' | 'proportional'
  /** Duration per data point in frames */
  framesPerPoint: number
  /** Easing between points */
  easing: string
}

/**
 * Apply a data transform to a value.
 */
export function applyDataTransform(value: unknown, transform: DataTransform): unknown {
  if (value === null || value === undefined) return ''

  const str = String(value)
  const num = typeof value === 'number' ? value : parseFloat(str)

  switch (transform) {
    case 'round':
      return isNaN(num) ? str : Math.round(num)
    case 'floor':
      return isNaN(num) ? str : Math.floor(num)
    case 'ceil':
      return isNaN(num) ? str : Math.ceil(num)
    case 'currency':
      return isNaN(num) ? str : `$${num.toFixed(2)}`
    case 'percentage':
      return isNaN(num) ? str : `${(num * 100).toFixed(1)}%`
    case 'uppercase':
      return str.toUpperCase()
    case 'lowercase':
      return str.toLowerCase()
    case 'titlecase':
      return str.replace(/\b\w/g, (c) => c.toUpperCase())
    case 'truncate-50':
      return str.length > 50 ? str.slice(0, 47) + '...' : str
    case 'truncate-100':
      return str.length > 100 ? str.slice(0, 97) + '...' : str
    default:
      return value
  }
}
