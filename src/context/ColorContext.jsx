import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';

const ColorContext = createContext();

// Default color palettes
const maleColorMap = {
  '/dashboard': {
    primary: '#6366f1',      // Indigo
    secondary: '#a78bfa',    // Indigo light
    accent: '#818cf8'        // Indigo medium
  },
  '/courses': {
    primary: '#3b82f6',      // Blue
    secondary: '#60a5fa',    // Blue light
    accent: '#1e40af'        // Blue dark
  },
  '/lessons': {
    primary: '#a855f7',      // Purple
    secondary: '#c084fc',    // Purple light
    accent: '#7e22ce'        // Purple dark
  },
  '/assessment': {
    primary: '#ec4899',      // Pink
    secondary: '#f472b6',    // Pink light
    accent: '#be185d'        // Pink dark
  },
  '/progress': {
    primary: '#06b6d4',      // Cyan
    secondary: '#22d3ee',    // Cyan light
    accent: '#0891b2'        // Cyan dark
  },
  '/login': {
    primary: '#6366f1',
    secondary: '#a78bfa',
    accent: '#818cf8'
  },
  '/register': {
    primary: '#6366f1',
    secondary: '#a78bfa',
    accent: '#818cf8'
  },
  '/forgot-password': {
    primary: '#6366f1',
    secondary: '#a78bfa',
    accent: '#818cf8'
  },
  '/reset-password': {
    primary: '#6366f1',
    secondary: '#a78bfa',
    accent: '#818cf8'
  }
};

// Pink-themed palette for female users
const femaleColorMap = {
  '/dashboard': {
    primary: '#ec4899',      // Pink
    secondary: '#f9a8d4',    // Pink light
    accent: '#f472b6'        // Pink medium
  },
  '/courses': {
    primary: '#e879a2',      // Rose
    secondary: '#fbb4ca',    // Rose light
    accent: '#db2777'        // Rose dark
  },
  '/lessons': {
    primary: '#d946ef',      // Fuchsia
    secondary: '#e879f9',    // Fuchsia light
    accent: '#a21caf'        // Fuchsia dark
  },
  '/assessment': {
    primary: '#f43f5e',      // Rose Red
    secondary: '#fb7185',    // Rose Red light
    accent: '#be123c'        // Rose Red dark
  },
  '/progress': {
    primary: '#e879a2',      // Soft Pink
    secondary: '#fda4af',    // Soft Pink light
    accent: '#be185d'        // Deep Pink
  },
  '/login': {
    primary: '#ec4899',
    secondary: '#f9a8d4',
    accent: '#f472b6'
  },
  '/register': {
    primary: '#ec4899',
    secondary: '#f9a8d4',
    accent: '#f472b6'
  },
  '/forgot-password': {
    primary: '#ec4899',
    secondary: '#f9a8d4',
    accent: '#f472b6'
  },
  '/reset-password': {
    primary: '#ec4899',
    secondary: '#f9a8d4',
    accent: '#f472b6'
  }
};

// Default color fallbacks
const maleDefault = {
  primary: '#6366f1',
  secondary: '#a78bfa',
  accent: '#818cf8'
};

const femaleDefault = {
  primary: '#ec4899',
  secondary: '#f9a8d4',
  accent: '#f472b6'
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

export function ColorProvider({ children }) {
  const location = useLocation();
  const [currentColor, setCurrentColor] = useState(() => {
    const user = getAuthUser();
    const savedGender = localStorage.getItem('userGender');
    const gender = savedGender || user?.gender;
    const isFemale = gender?.toUpperCase() === 'FEMALE';
    const colorMap = isFemale ? femaleColorMap : maleColorMap;
    const defaultColor = isFemale ? femaleDefault : maleDefault;
    return colorMap['/dashboard'] || defaultColor;
  });
  
  // Separate useEffect for calculating colors (pure calculation)
  const calculatedColor = useMemo(() => {
    const user = getAuthUser();
    const savedGender = localStorage.getItem('userGender');
    const gender = savedGender || user?.gender;
    const isFemale = gender?.toUpperCase() === 'FEMALE';
    const colorMap = isFemale ? femaleColorMap : maleColorMap;
    const defaultColor = isFemale ? femaleDefault : maleDefault;
    return colorMap[location.pathname] || defaultColor;
  }, [location.pathname]);
  
  // Separate useEffect for side effects (CSS updates)
  useEffect(() => {
    setCurrentColor(calculatedColor);
    
    const root = document.documentElement;
    const secondaryColor = calculatedColor.secondary || calculatedColor.accent;
    
    root.style.setProperty('--page-primary', calculatedColor.primary);
    root.style.setProperty('--page-secondary', secondaryColor);
    root.style.setProperty('--page-accent', calculatedColor.accent);
    root.style.setProperty('--page-primary-rgb', hexToRgb(calculatedColor.primary));
    root.style.setProperty('--page-secondary-rgb', hexToRgb(secondaryColor));
    root.style.setProperty('--page-accent-rgb', hexToRgb(calculatedColor.accent));
  }, [calculatedColor]);

  return (
    <ColorContext.Provider value={currentColor}>
      {children}
    </ColorContext.Provider>
  );
}

export function usePageColor() {
  const context = useContext(ColorContext);
  if (!context) {
    return maleDefault;
  }
  return context;
}
