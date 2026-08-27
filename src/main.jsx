import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro na aplicação:', error, errorInfo);
  }

  handleReset = () => {
    try {
      // Limpa dados com erro se necessário
      window.location.reload();
    } catch (e) {
      window.location.href = '/';
    }
  };

  handleClearCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '420px',
            backgroundColor: '#1e293b',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>
              FinançasPro
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
              Ocorreu uma instabilidade no carregamento inicial. Clique no botão abaixo para restaurar o aplicativo.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: '800',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            >
              🔄 Recarregar Aplicativo
            </button>
            <button
              onClick={this.handleClearCache}
              style={{
                width: '100%',
                backgroundColor: '#334155',
                color: '#cbd5e1',
                fontWeight: '700',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Limpar Cache Local
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
