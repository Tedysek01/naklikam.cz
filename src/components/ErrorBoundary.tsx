import React, { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

// Inline Button component
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' :
      variant === 'ghost' ? 'text-gray-700 hover:bg-gray-100' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.log('🚨 [ErrorBoundary] ERROR CAUGHT - getDerivedStateFromError:', error.message)
    console.log('🚨 [ErrorBoundary] Stack:', error.stack)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 [ErrorBoundary] ERROR CAUGHT - componentDidCatch:', error, errorInfo)
    console.error('🚨 [ErrorBoundary] Component stack:', errorInfo.componentStack)
    console.error('🚨 [ErrorBoundary] This will cause UI to show error state!')
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold font-display mb-2 text-red-600">Something went wrong</h2>
            <p className="text-muted-foreground text-sm mb-4">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="text-xs text-left bg-muted p-2 rounded mb-4">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="space-x-2">
              <Button onClick={this.handleReset} size="sm">
                Try Again
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔄 [ErrorBoundary] User clicked refresh button')
                  window.location.reload()
                }} 
                variant="outline" 
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary