import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-7xl mb-4 animate-bounce">🤖</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Oops! Something went wobbly
            </h1>
            <p className="text-slate-600 mb-6">
              Our friendly AI helper got a little confused. Don&apos;t worry—we&apos;re on it! Try going back or refreshing the page.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-white text-brand-600 font-semibold border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
