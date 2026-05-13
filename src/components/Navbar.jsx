import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuth, getAuthUser } from '../utils/auth';
import { usePageColor } from '../context/ColorContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Moon, Sun, BookOpen, Search, LogOut } from 'lucide-react';
import NotificationBell from './common/NotificationBell';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import '../styles/components/Navbar.css';

export default function Navbar() {
  const { user, profile, refreshUser } = useUser();
  const [menuOpenPath, setMenuOpenPath] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const colors = usePageColor();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const mobileMenuOpen = menuOpenPath === location.pathname;

  // Profile is handled by UserContext on mount. 
  // No need to refetch on every route change.

  const handleLogout = () => {
    const isConfirmed = window.confirm('Are you sure you want to logout? Your session will be ended.');
    if (isConfirmed) {
      clearAuth();
      refreshUser();
      navigate('/login');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchExpanded(false);
    }
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation and then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  const getDashboardRoute = () => {
    if (!user) return '/';
    const role = user.role?.toUpperCase();
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'INSTRUCTOR') return '/instructor/dashboard';
    return '/student/dashboard';
  };

  return (
    <>
      <nav
        className={`navbar ${!isVisible ? 'navbar-hidden' : ''}`}
        style={{ borderBottomColor: colors?.primary || '#6366f1', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to={getDashboardRoute()} className="logo-container">
              <div className="logo-icon-wrapper">
                <div className="logo-gradient-circle"></div>
                <BookOpen size={24} className="logo-icon" />
              </div>
              <span className="logo-text" style={{ position: 'relative' }}>
                Edu<span className="text-gradient">Learn</span>
                <div
                  className="ai-tutor-icon-animated"
                  title="AI Tutor is present"
                >
                  <svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="6" width="16" height="13" rx="4" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5" />
                    <line x1="13" y1="6" x2="13" y2="2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="13" cy="1.5" r="1.5" fill="#818cf8">
                      <animate attributeName="fill" values="#818cf8;#a5b4fc;#818cf8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="9.5" cy="11" r="2" fill="#6366f1">
                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="16.5" cy="11" r="2" fill="#6366f1">
                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <path d="M9.5 14.5 Q13 17 16.5 14.5" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </span>
            </Link>
          </div>

          <div className="navbar-search-container" style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            maxWidth: isSearchExpanded ? '560px' : '380px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            margin: '0 auto',
            paddingLeft: '3rem',   /* Push away from logo */
            paddingRight: '1.5rem',
          }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
              <input
                id="navbar-search"
                name="q"
                type="text"
                placeholder="Search for courses, skills, or teachers..."
                className="nav-search-input"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.25rem 0.65rem 2.75rem',
                  borderRadius: '2rem',
                  background: 'var(--input-bg)',
                  border: isSearchExpanded ? `2px solid ${colors?.primary || '#6366f1'}` : '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: isSearchExpanded ? `0 0 15px ${colors?.primary || '#6366f1'}20` : 'none',
                }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isSearchExpanded ? (colors?.primary || '#6366f1') : 'var(--text-secondary)',
                  transition: 'color 0.3s',
                }}
                onClick={handleSearchSubmit}
              />
            </form>
          </div>

          <div className="navbar-links-desktop">
            {!user ? (
              <>
                <button onClick={() => scrollToSection('home')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Home</button>
                <button onClick={() => scrollToSection('courses')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Courses</button>
                <button onClick={() => scrollToSection('features')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Features</button>
                <button onClick={() => scrollToSection('stats')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Stats</button>
                <Link to="/login" className="nav-btn-secondary">Log In</Link>
                <Link to="/register" className="nav-btn-primary" style={{ background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.accent || '#818cf8'} 100%)` }}>Sign Up</Link>
              </>
            ) : user.role?.toUpperCase() === 'ADMIN' ? (
              <>
                <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} style={{ ...isActive('/admin/dashboard') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Admin Panel</Link>
                <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`} style={isActive('/admin/users') ? { color: colors?.primary } : {}}>Users</Link>
                <Link to="/admin/courses" className={`nav-link ${isActive('/admin/courses') ? 'active' : ''}`} style={isActive('/admin/courses') ? { color: colors?.primary } : {}}>Courses</Link>
                <Link to="/admin/analytics" className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`} style={isActive('/admin/analytics') ? { color: colors?.primary } : {}}>Analytics</Link>
                <Link to="/admin/bugs" className={`nav-link ${isActive('/admin/bugs') ? 'active' : ''}`} style={isActive('/admin/bugs') ? { color: colors?.primary } : {}}>Bugs</Link>
              </>
            ) : user.role?.toUpperCase() === 'INSTRUCTOR' ? (
              <>
                <Link to="/instructor/dashboard" className={`nav-link ${isActive('/instructor/dashboard') ? 'active' : ''}`} style={isActive('/instructor/dashboard') ? { color: colors?.primary } : {}}>Dashboard</Link>
                <Link to="/instructor/create-course" className={`nav-link ${isActive('/instructor/create-course') ? 'active' : ''}`} style={{ ...isActive('/instructor/create-course') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Create Course</Link>
                <Link to="/instructor/analytics" className={`nav-link ${isActive('/instructor/analytics') ? 'active' : ''}`} style={{ ...isActive('/instructor/analytics') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Analytics</Link>
                <Link to="/instructor/transactions" className={`nav-link ${isActive('/instructor/transactions') ? 'active' : ''}`} style={{ ...isActive('/instructor/transactions') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Finances</Link>
                <Link to="/instructor/discussions" className={`nav-link ${isActive('/instructor/discussions') ? 'active' : ''}`} style={{ ...isActive('/instructor/discussions') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Discussions</Link>
              </>
            ) : (
              <>
                <Link to="/student/dashboard" className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`} style={{ ...isActive('/student/dashboard') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Dashboard</Link>
                <Link to="/student/learning" className={`nav-link ${isActive('/student/learning') ? 'active' : ''}`} style={{ ...isActive('/student/learning') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>My Learning</Link>
                <Link to="/student/transactions" className={`nav-link ${isActive('/student/transactions') ? 'active' : ''}`} style={{ ...isActive('/student/transactions') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Finances</Link>
                <Link to="/student/assessment" className={`nav-link ${isActive('/student/assessment') ? 'active' : ''}`} style={{ ...isActive('/student/assessment') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Assessments</Link>
                <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`} style={{ ...isActive('/courses') ? { color: colors?.primary } : {}, whiteSpace: 'nowrap' }}>Browse</Link>
              </>
            )}
          </div>

          <div className="navbar-right">
            {user && <NotificationBell user={user} />}

            <button onClick={toggleTheme} className="dark-mode-toggle" aria-label="Toggle dark mode" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <Link to="/profile" className="user-menu" style={{ textDecoration: 'none' }}>
                {profile?.profilePicUrl ? (
                  <img src={profile.profilePicUrl} alt="Profile" className="user-avatar" style={{ objectFit: 'cover', border: `2px solid ${colors?.primary || '#6366f1'}` }} />
                ) : (
                  <span className="user-avatar" title={profile?.fullName || user.email || 'User'} style={{ background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#a78bfa'} 100%)` }}>
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '👤'}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <button onClick={handleLogout} className="nav-btn-logout">Logout</button>
            )}

            <button
              className="hamburger-btn"
              onClick={() => setMenuOpenPath(mobileMenuOpen ? null : location.pathname)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu" style={{ borderTopColor: colors?.primary || '#6366f1', transition: 'border-top-color 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {!user ? (
              <>
                <button onClick={() => { scrollToSection('home'); setMenuOpenPath(null); }} className="mobile-menu-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>Home</button>
                <button onClick={() => { scrollToSection('courses'); setMenuOpenPath(null); }} className="mobile-menu-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>Featured Courses</button>
                <button onClick={() => { scrollToSection('features'); setMenuOpenPath(null); }} className="mobile-menu-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>Platform Features</button>
                <button onClick={() => { scrollToSection('stats'); setMenuOpenPath(null); }} className="mobile-menu-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>Statistics</button>
                <Link to="/courses" className="mobile-menu-link" onClick={() => setMenuOpenPath(null)}>Browse All Courses</Link>
                <Link to="/login" className="mobile-menu-link" onClick={() => setMenuOpenPath(null)}>Log In</Link>
                <Link to="/register" className="mobile-menu-link" onClick={() => setMenuOpenPath(null)}>Sign Up</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className={`mobile-menu-link ${isActive('/profile') ? 'active' : ''}`}>My Profile</Link>
                {user.role?.toUpperCase() === 'ADMIN' && (
                  <>
                    <Link to="/admin/dashboard" className="mobile-menu-link">Admin Panel</Link>
                    <Link to="/admin/users" className="mobile-menu-link">Manage Users</Link>
                    <Link to="/admin/courses" className="mobile-menu-link">Inventory</Link>
                    <Link to="/admin/bugs" className="mobile-menu-link">Manage Bugs</Link>
                  </>
                )}
                {user.role?.toUpperCase() === 'INSTRUCTOR' && (
                  <>
                    <Link to="/instructor/dashboard" className="mobile-menu-link">Dashboard</Link>
                    <Link to="/instructor/create-course" className="mobile-menu-link">Create Course</Link>
                    <Link to="/instructor/analytics" className="mobile-menu-link">Analytics</Link>
                    <Link to="/instructor/discussions" className="mobile-menu-link">Discussions</Link>
                  </>
                )}
                {(user.role?.toUpperCase() !== 'INSTRUCTOR' && user.role?.toUpperCase() !== 'ADMIN') && (
                  <>
                    <Link to="/student/dashboard" className="mobile-menu-link">Dashboard</Link>
                    <Link to="/student/assessment" className="mobile-menu-link">Assessments</Link>
                    <Link to="/student/progress" className="mobile-menu-link">My Progress</Link>
                  </>
                )}
                <Link to="/courses" className="mobile-menu-link">Browse Courses</Link>
                {user.role?.toUpperCase() !== 'STUDENT' && (
                  <Link to="/discussions" className="mobile-menu-link">Discussions</Link>
                )}
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={18} /> Exit Platform
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}