import React from 'react';

const PageSkeleton = () => {
  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Hero / Header Section Skeleton */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="skeleton-text" style={{ width: '60%', height: '3.5rem', marginBottom: '1.5rem', borderRadius: '1rem' }}></div>
        <div className="skeleton-text" style={{ width: '40%', height: '1.25rem', marginBottom: '3rem', borderRadius: '0.5rem' }}></div>
      </div>

      {/* Grid Section Skeleton */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '4rem' 
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ 
            height: '350px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '2rem',
            overflow: 'hidden',
            padding: '1.5rem'
          }}>
            <div className="skeleton-pulse" style={{ width: '100%', height: '180px', borderRadius: '1rem', marginBottom: '1.5rem' }}></div>
            <div className="skeleton-text" style={{ width: '80%', height: '1.5rem', marginBottom: '1rem' }}></div>
            <div className="skeleton-text" style={{ width: '50%', height: '1rem' }}></div>
          </div>
        ))}
      </div>

      <style>{`
        .skeleton-text {
          background: linear-gradient(90deg, var(--border-color) 25%, var(--input-bg) 50%, var(--border-color) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
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

export default PageSkeleton;
