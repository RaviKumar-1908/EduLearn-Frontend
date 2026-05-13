import React from 'react';

/**
 * Animated Floating Blob - Lightweight SVG alternative to heavy blurs
 */
export const FloatingBlob = ({ color = '#6366f1', size = '400px', top, left, right, bottom, opacity = 0.1, delay = '0s' }) => (
  <div style={{
    position: 'absolute',
    top, left, right, bottom,
    width: size,
    height: size,
    zIndex: 0,
    pointerEvents: 'none',
    opacity: opacity,
    animation: `blob-float 15s ease-in-out infinite alternate ${delay}`,
  }}>
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,72.6,41.4C63.8,53.7,51.8,63.7,38.2,71.1C24.6,78.5,9.4,83.3,-5.3,82.4C-20,81.5,-34.2,74.9,-46.8,66.2C-59.4,57.5,-70.3,46.7,-77.3,33.8C-84.3,20.9,-87.4,5.9,-85.4,-8.6C-83.3,-23.1,-76.1,-37.2,-65.9,-48.3C-55.7,-59.4,-42.6,-67.5,-29.4,-75.1C-16.2,-82.7,-3.1,-89.8,11.3,-88.4C25.7,-87,44.7,-76.4Z" transform="translate(100 100)" />
    </svg>
    <style>{`
      @keyframes blob-float {
        0% { transform: translate(0, 0) scale(1) rotate(0deg); }
        33% { transform: translate(30px, -50px) scale(1.1) rotate(10deg); }
        66% { transform: translate(-20px, 20px) scale(0.9) rotate(-10deg); }
        100% { transform: translate(0, 0) scale(1) rotate(0deg); }
      }
    `}</style>
  </div>
);

/**
 * Geometric Pattern - Lightweight background decoration
 */
export const GeoPattern = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.03, pointerEvents: 'none' }}>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

/**
 * Modern Wave Divider
 */
export const WaveDivider = ({ top, bottom, flip = false, color = 'var(--bg-primary)' }) => (
  <div style={{
    position: 'absolute',
    top, bottom,
    left: 0,
    width: '100%',
    lineHeight: 0,
    zIndex: 1,
    transform: flip ? 'rotate(180deg)' : 'none'
  }}>
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
      <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill={color}></path>
    </svg>
  </div>
);
