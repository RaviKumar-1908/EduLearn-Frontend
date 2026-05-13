const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-color)] backdrop-blur-sm">
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-t-[var(--primary-color)] border-r-transparent border-b-transparent border-l-transparent animate-spin"
          style={{ animationDuration: '1s' }}
        />
        
        {/* Inner Pulsing Circle */}
        <div
          className="absolute inset-4 rounded-full bg-[var(--primary-color)] opacity-20"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />

        {/* Branded Logo Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-[var(--primary-color)]">L</span>
        </div>
      </div>
      
      <div
        className="mt-6 text-sm font-medium tracking-widest text-[var(--text-secondary)] uppercase animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        Initializing Dashboard...
      </div>

      {/* Progress Line */}
      <div className="mt-4 w-48 h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--primary-color)]"
          style={{ 
            width: '100%',
            animation: 'progress-shimmer 1.5s ease-in-out infinite',
            transformOrigin: 'left'
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
