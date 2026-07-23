import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// The one place a class component is still the right tool — React has no
// hook equivalent for catching render errors in descendants.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in the app:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-md border border-danger-fg/40 bg-danger-fg/10 p-6 text-center">
          <h1 className="text-base font-semibold text-danger-fg mb-1">Something went wrong</h1>
          <p className="text-sm text-fg-muted mb-6">{error.message || 'An unexpected error occurred.'}</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-md border border-danger-fg/40 px-3 py-1.5 text-sm font-medium hover:bg-danger-fg/10"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-danger-emphasis text-white text-sm font-medium px-3 py-1.5 hover:opacity-90"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
