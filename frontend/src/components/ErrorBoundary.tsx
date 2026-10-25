/**
 * ErrorBoundary — production-grade React error boundary.
 *
 * Catches runtime JavaScript errors anywhere in the child component tree,
 * logs them for telemetry, and displays a graceful fallback UI instead of crashing.
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error captured by ErrorBoundary:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-ivory-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-ivory-300 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              CelebrAI encountered an unexpected issue while rendering this page. You can try refreshing
              or returning to the home screen.
            </p>

            {this.state.error && (
              <div className="w-full mb-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-left overflow-auto max-h-32 text-xs font-mono text-slate-600 dark:text-slate-400">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-ivory-200 dark:bg-slate-800 hover:bg-ivory-300 dark:hover:bg-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
