import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
          style={{ background: '#f0e6d0', color: '#1a2e1a' }}
        >
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 22,
              fontWeight: 800,
              margin: '0 0 12px',
              textAlign: 'center',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 14,
              color: 'rgba(26,46,26,0.65)',
              margin: '0 0 24px',
              textAlign: 'center',
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            The app hit an unexpected error. You can reload the page to try again.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              padding: '12px 24px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
              color: '#122012',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
