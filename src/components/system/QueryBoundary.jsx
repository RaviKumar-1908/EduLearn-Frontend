import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RefreshCcw, AlertCircle } from 'lucide-react';

/**
 * ErrorFallback Component
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="glass-panel centered-message animate-scale-in" style={{ padding: '3rem', borderRadius: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
    <div style={{ color: '#ef4444', marginBottom: '1.5rem' }}>
      <AlertCircle size={48} />
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Data Load Failed</h3>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '300px' }}>
      {error.message || 'We couldn\'t load the information for this section.'}
    </p>
    <button 
      onClick={resetErrorBoundary} 
      className="glass-btn-primary"
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem' }}
    >
      <RefreshCcw size={16} /> Try Again
    </button>
  </div>
);

/**
 * LoadingFallback Component
 */
const LoadingFallback = () => (
  <div className="centered-message animate-fade-in" style={{ padding: '4rem 0' }}>
    <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
  </div>
);

/**
 * QueryBoundary Component
 * 
 * Orchestrates loading and error states for React Query components.
 * Wrap your query-consuming components with this to handle states gracefully.
 */
export const QueryBoundary = ({ children, fallback = <LoadingFallback /> }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
