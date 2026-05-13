import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getAuthUser } from '../utils/auth';
import { Home, Compass, BookOpen, PenTool, BarChart2, Users, FileText, Settings, LogOut, LayoutDashboard, Search, MessageSquare } from 'lucide-react';
// import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import '../styles/components/Sidebar.css';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getAuthUser());
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const role = user?.role || 'guest';

  const defaultLinks = [
    { name: 'Browse Courses', path: '/courses', icon: <Compass size={20} /> },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <Home size={20} /> },
    { name: 'Discussions', path: '/instructor/discussions', icon: <MessageSquare size={20} /> },
    { name: 'My Learning', path: '/lessons', icon: <BookOpen size={20} /> },
    { name: 'Assessments', path: '/assessment', icon: <PenTool size={20} /> },
    { name: 'My Progress', path: '/progress', icon: <BarChart2 size={20} /> },
  ];

  const instructorLinks = [
    { name: 'Dashboard', path: '/instructor/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Discussions', path: '/discussions', icon: <MessageSquare size={20} /> },
    { name: 'Manage Courses', path: '/instructor/courses', icon: <BookOpen size={20} /> },
    { name: 'Assessments', path: '/instructor/assessments', icon: <FileText size={20} /> },
    { name: 'Students', path: '/instructor/students', icon: <Users size={20} /> },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen size={20} /> },
  ];

  let displayLinks = [...defaultLinks];
  if (role?.toUpperCase() === 'STUDENT') displayLinks = [...studentLinks, ...defaultLinks];
  if (role?.toUpperCase() === 'INSTRUCTOR') displayLinks = [...instructorLinks, ...defaultLinks];
  if (role?.toUpperCase() === 'ADMIN') displayLinks = [...adminLinks, ...defaultLinks];

  return (
    <nav className="sidebar">
      {/* Sidebar Links */}
      <div className="sidebar-links">
        {displayLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
          >
            <div className="sidebar-link-icon">{link.icon}</div>
            <span className="sidebar-link-text">{link.name}</span>
            <span className="sidebar-tooltip">{link.name}</span>
            
            {isActive(link.path) && (
               <div
                 className="active-indicator"
                 style={{ 
                   position: 'absolute', 
                   left: 0, 
                   top: '15%', 
                   bottom: '15%', 
                   width: '4px', 
                   background: 'var(--page-primary)', 
                   borderRadius: '0 4px 4px 0' 
                 }}
               />
            )}
          </Link>
        ))}
      </div>

      {/* Bottom Actions */}
      <div style={{ width: '100%', marginTop: 'auto' }}>
        {!user ? (
           <Link to="/login" className="sidebar-link">
             <div className="sidebar-link-icon"><LogOut size={20} style={{ transform: 'rotate(180deg)' }} /></div>
             <span className="sidebar-link-text">Log In</span>
             <span className="sidebar-tooltip">Log In</span>
           </Link>
        ) : (
          <button 
            onClick={handleLogout} 
            className="sidebar-link" 
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <div className="sidebar-link-icon"><LogOut size={20} color="#fca5a5" /></div>
            <span className="sidebar-link-text" style={{ color: '#fca5a5' }}>Log Out</span>
            <span className="sidebar-tooltip">Log Out</span>
          </button>
        )}
      </div>
    </nav>
  );
}
