import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LifelineX module render error:", error);
    if (import.meta.env.DEV) {
      console.error("[LifelineX Error Details]:", {
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      });
    }
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-3xl p-6 sm:p-8 max-w-xl mx-auto my-8 text-center border shadow-sm lx-animate-in"
          style={{
            background: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-subtle)',
          }}
          role="alert"
        >
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-h3 font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {this.props.fallbackTitle || 'Section Temporarily Unavailable'}
          </h3>
          <p className="text-body-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            An unexpected problem occurred while rendering this module. Your emergency session and data are secure.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-6 p-4 rounded-xl text-left bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 max-h-40 overflow-y-auto">
              <p className="font-bold text-rose-300 mb-1">{this.state.error.name}: {this.state.error.message}</p>
              <pre className="whitespace-pre-wrap text-[11px] text-slate-400">{this.state.error.stack}</pre>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Module</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
