import React from 'react';

const AdminSkeleton = () => {
  return (
    <div style={{ width: '100%', padding: '0 4vw 5rem' }}>
      <header style={{ marginBottom: '2.5rem', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="skeleton-text" style={{ width: '200px', height: '2.5rem', marginBottom: '1rem' }}></div>
        <div className="skeleton-text" style={{ width: '400px', height: '1rem' }}></div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-panel" style={{ height: '120px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '1.25rem' }}>
            <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ height: '400px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '1.75rem' }}>
          <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
        </div>
        <div className="glass-panel" style={{ height: '400px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '1.75rem' }}>
          <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
        </div>
      </div>

      <style>{`
        .skeleton-text {
          background: linear-gradient(90deg, var(--border-color) 25%, var(--input-bg) 50%, var(--border-color) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
          border-radius: 4px;
        }
        .skeleton-pulse {
          background: var(--input-bg);
          animation: skeleton-pulse 2s infinite ease-in-out;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default AdminSkeleton;
