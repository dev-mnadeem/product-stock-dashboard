'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch and handle React errors gracefully.
 * Provides user-friendly error messages and recovery options.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service in production
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-error-50 border border-error-200 rounded-lg"
        >
          <h2 className="text-xl font-semibold text-error-900 mb-2">Something went wrong</h2>
          <p className="text-error-700 mb-4 text-center max-w-md">
            We encountered an unexpected error. Please try refreshing the page or contact
            support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 w-full max-w-2xl">
              <summary className="cursor-pointer text-sm text-error-600 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs bg-error-100 p-4 rounded overflow-auto">
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-error-600 text-white rounded-md hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
            type="button"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
