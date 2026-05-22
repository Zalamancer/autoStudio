import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** Label shown in the error fallback (e.g. "Left Panel") */
  panelName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Lightweight error boundary for wrapping individual panels/sections.
 * Unlike the root ErrorBoundary, this renders a compact inline fallback
 * so the rest of the editor remains usable when one panel crashes.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PanelErrorBoundary:${this.props.panelName ?? 'unknown'}]`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex flex-col items-center justify-center h-full min-h-[120px] p-4 text-center">
          <p className="text-sm text-red-400 font-medium mb-1">
            {this.props.panelName ?? 'Panel'} crashed
          </p>
          <p className="text-xs text-zinc-500 mb-3 max-w-[240px] break-words">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            aria-label={`Retry loading ${this.props.panelName ?? 'panel'}`}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
