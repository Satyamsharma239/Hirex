import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#060d1a',
          color: '#e8f0fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          {/* Subtle dot-grid background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,201,167,0.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <div style={{
            background: '#0a1628',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '16px',
            padding: '40px 32px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 16px rgba(244, 63, 94, 0.15)'
            }}>
              <AlertCircle size={28} color="#f43f5e" />
            </div>

            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              marginBottom: '10px',
              color: '#e8f0fe'
            }}>Something went wrong</h1>
            
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}>
              The application encountered an unexpected error. Don't worry, your data is safe. Let's try reloading the application.
            </p>

            {this.state.error && (
              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#f43f5e',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px'
                }}>Error Details</span>
                <pre style={{
                  background: '#0d1f38',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  overflowX: 'auto',
                  maxHeight: '160px',
                  lineHeight: 1.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <button 
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #00c9a7, #0891b2)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 14px rgba(0, 201, 167, 0.25)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 201, 167, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 201, 167, 0.25)';
              }}
            >
              <RefreshCw size={14} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
