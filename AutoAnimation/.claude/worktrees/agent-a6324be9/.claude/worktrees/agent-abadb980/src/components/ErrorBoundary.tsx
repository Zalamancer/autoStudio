import { Component, type ReactNode, type ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] Caught render crash:', error, errorInfo)
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            background: '#18181b',
            color: '#fca5a5',
            minHeight: '100vh',
            fontFamily: 'monospace',
          }}
        >
          <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Something crashed</h1>
          <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>
            A render error caused the app to crash. Details below:
          </p>
          <pre
            style={{
              background: '#27272a',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          {this.state.errorInfo && (
            <pre
              style={{
                background: '#27272a',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '0.75rem',
                color: '#71717a',
              }}
            >
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null })
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try to recover
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
