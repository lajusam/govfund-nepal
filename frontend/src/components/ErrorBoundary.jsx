import React from 'react';
import { LanguageContext } from '../context/LanguageContext';

/**
 * React Error Boundary — catches render-time errors in the component tree
 * and displays a recovery UI instead of a white screen.
 *
 * Wrap around <Routes /> or any subtree that might throw during render.
 */
export default class ErrorBoundary extends React.Component {
  static contextType = LanguageContext;

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
      const t = this.context?.t || ((key) => key);
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-earth rounded-2xl shadow-basalt-xl border border-golden/20 p-8 text-center">
            {/* Icon */}
            <div className="text-6xl mb-4">⚠️</div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-parchment mb-2">
              {t('somethingWrong')}
            </h2>
            <p className="text-parchment-muted text-sm mb-6">
              {t('unexpectedError')}
            </p>

            {/* Error details (collapsible) */}
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-red-400 hover:underline">
                {t('showErrorDetails')}
              </summary>
              <div className="mt-2 p-3 bg-earth rounded-xl border border-red-500/30 overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-xs font-mono text-red-400 mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-earth-border text-parchment-muted hover:bg-earth-light hover:text-amber-glow transition-colors"
              >
                {t('tryAgain')}
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-golden to-golden-600 text-basalt font-bold hover:shadow-golden-md transition-all"
              >
                {t('reloadPage')}
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-parchment-ghost mt-6">
              {t('errorHelp')}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
