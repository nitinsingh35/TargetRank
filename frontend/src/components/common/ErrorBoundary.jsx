import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a React runtime crash:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card border-rose-500/20 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <FiAlertTriangle className="text-3xl" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected error occurred while loading this page. This could be due to network drops or temporary data issues.
              </p>
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <pre className="text-[10px] text-rose-350 bg-dark-950 p-3 rounded-lg overflow-x-auto text-left max-h-36 font-mono border border-slate-900">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleReload}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <FiRefreshCw className="text-sm" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
