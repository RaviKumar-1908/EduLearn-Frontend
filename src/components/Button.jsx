import { usePageColor } from '../context/ColorContext';

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  className = '',
  disabled = false,
  title = '',
  ...props 
}) {
  const colors = usePageColor();

  const baseStyles = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: `0 4px 15px ${colors.primary}40`,
      ...baseStyles,
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#e2e8f0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      ...baseStyles,
    },
    outlined: {
      background: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
      padding: '0.65rem 1.5rem',
      borderRadius: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      ...baseStyles,
    },
  };

  const handleMouseEnter = (e) => {
    if (variant === 'primary') {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = `0 8px 25px ${colors.primary}60`;
    } else if (variant === 'outlined') {
      e.target.style.background = `${colors.primary}15`;
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary') {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
    } else if (variant === 'outlined') {
      e.target.style.background = 'transparent';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`page-button ${className}`}
      style={variantStyles[variant]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}
