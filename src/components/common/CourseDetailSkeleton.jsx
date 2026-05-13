import React from 'react';

const CourseDetailSkeleton = () => {
  return (
    <div style={{ width: '100%', padding: '0 4vw 6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', paddingTop: '4rem' }}>
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="skeleton-pill" style={{ width: '100px', height: '24px', borderRadius: '2rem' }}></div>
            <div className="skeleton-pill" style={{ width: '80px', height: '24px', borderRadius: '2rem' }}></div>
          </div>
          
          <div className="skeleton-text" style={{ width: '80%', height: '3.5rem', marginBottom: '1.5rem' }}></div>
          
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="skeleton-text" style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }}></div>
            <div className="skeleton-text" style={{ width: '90%', height: '1rem', marginBottom: '0.5rem' }}></div>
            <div className="skeleton-text" style={{ width: '95%', height: '1rem' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="skeleton-avatar" style={{ width: '48px', height: '48px', borderRadius: '1rem' }}></div>
              <div>
                <div className="skeleton-text" style={{ width: '60px', height: '0.75rem', marginBottom: '0.4rem' }}></div>
                <div className="skeleton-text" style={{ width: '120px', height: '1rem' }}></div>
              </div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }}></div>
            <div>
              <div className="skeleton-text" style={{ width: '40px', height: '0.75rem', marginBottom: '0.4rem' }}></div>
              <div className="skeleton-text" style={{ width: '80px', height: '1rem' }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="skeleton-pill" style={{ width: '180px', height: '50px', borderRadius: '1.25rem' }}></div>
            <div className="skeleton-pill" style={{ width: '150px', height: '50px', borderRadius: '1.25rem' }}></div>
          </div>
        </div>

        <div className="glass-panel" style={{ borderRadius: '1.5rem', height: '500px', border: '1px solid var(--border-color)' }}>
          <div className="skeleton-pulse" style={{ width: '100%', height: '200px', borderBottom: '1px solid var(--border-color)' }}></div>
          <div style={{ padding: '1.5rem' }}>
            <div className="skeleton-text" style={{ width: '140px', height: '1.25rem', marginBottom: '1.25rem' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-pill" style={{ width: '100%', height: '45px', borderRadius: '0.75rem' }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .skeleton-text, .skeleton-pill, .skeleton-avatar, .skeleton-pulse {
          background: linear-gradient(90deg, var(--border-color) 25%, var(--input-bg) 50%, var(--border-color) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default CourseDetailSkeleton;
