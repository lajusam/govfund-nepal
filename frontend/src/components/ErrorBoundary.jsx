import React from 'react';

/**
 * React Error Boundary — catches render-time errors in the component tree
 * and displays a recovery UI instead of a white screen.
 *
 * Wrap around <Routes /> or any subtree that might throw during render.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 p-8 text-center">
            {/* Icon */}
            <div className="text-6xl mb-4">⚠️</div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              An unexpected error occurred. This might be a temporary issue.
            </p>

            {/* Error details (collapsible) */}
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                Show error details
              </summary>
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-xs font-mono text-red-500 dark:text-red-400 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-lg transition-all"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-400 mt-6">
              If this keeps happening, check your wallet connection and ensure the
              Solana program is deployed to Devnet.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
