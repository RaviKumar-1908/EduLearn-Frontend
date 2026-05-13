import { useEffect } from 'react';
import { usePageColor } from '../context/ColorContext';

export default function ColorUpdater() {
  const colors = usePageColor();

  useEffect(() => {
    // Update CSS custom properties based on page color
    document.documentElement.style.setProperty('--page-primary', colors?.primary || '#6366f1');
    document.documentElement.style.setProperty('--page-secondary', colors?.secondary || '#a78bfa');
    document.documentElement.style.setProperty('--page-accent', colors?.accent || '#818cf8');
  }, [colors]);

  return null;
}
