import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getAuthUser } from '../utils/auth';
import { enforceActiveSession } from '../utils/authSession';
// import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/pages/Auth.css';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [serverError, setServerError] = useState('');
   const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  // Always redirect to dashboard after login to avoid leaking previous user's navigation state
  const from = '/';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      const user = getAuthUser();
      if (!user) return;

      try {
        const result = await enforceActiveSession();
        if (!result.allowed) {
          setServerError('This account is suspended. Please contact support or an administrator.');
          toast.error('This account is suspended.');
          return;
        }
      } catch (error) {
        // If the profile check fails, fall back to existing token behavior.
      }

      const role = user.role?.toUpperCase();
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (role === 'INSTRUCTOR') navigate('/instructor/dashboard', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    };

    checkExistingSession();
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    // Clear all session and navigation state before new login
    sessionStorage.clear();
    // Optionally clear more localStorage if you store navigation state
    // localStorage.removeItem('lastVisitedUrl');
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const token = typeof response.data === 'string' ? response.data : (response.data?.token || response.data?.jwt);
      if (token) {
        localStorage.setItem('token', token);
        const sessionResult = await enforceActiveSession();
        if (!sessionResult.allowed) {
          setServerError('This account is suspended. Please contact support or an administrator.');
          toast.error('This account is suspended.');
          return;
        }

        const user = getAuthUser();
        if (user?.gender) localStorage.setItem('userGender', user.gender);

        // Sync context state immediately
        refreshUser();

        toast.success(`Welcome back, ${user?.email || 'User'}!`);
        // Always redirect to dashboard based on role
        if (user?.role?.toUpperCase() === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else if (user?.role?.toUpperCase() === 'INSTRUCTOR') navigate('/instructor/dashboard', { replace: true });
        else navigate('/student/dashboard', { replace: true });
      } else {
        setServerError('No token received from server');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      toast.error('Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div 
        className="glass-panel auth-card animate-scale-in"
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 950, margin: 0, letterSpacing: '-0.05em' }}>
            Welcome to <span className="text-gradient">EduLearn</span>
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>Sign in to continue your journey.</p>
        </div>

        {serverError && (
          <div className="alert error-alert" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {serverError}
          </div>
        )}

        <div className="role-selector">
          <button 
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`role-btn ${role === 'STUDENT' ? 'active' : 'inactive'}`}
          >
            Learner
          </button>
          <button 
            type="button"
            onClick={() => setRole('INSTRUCTOR')}
            className={`role-btn ${role === 'INSTRUCTOR' ? 'active' : 'inactive'}`}
          >
            Instructor
          </button>
          <button 
            type="button"
            onClick={() => setRole('ADMIN')}
            className={`role-btn ${role === 'ADMIN' ? 'active' : 'inactive'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="glass-input"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
               <label className="input-label" style={{ margin: 0 }} htmlFor="password">Password</label>
               <Link to="/forgot-password" style={{ color: 'var(--page-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              className="glass-input"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <button type="submit" className="glass-btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 900 }} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>

        <button 
          onClick={() => window.location.href = `http://localhost:8000/oauth2/authorization/google?role=${role}&mode=login`}
          className="glass-btn-secondary" 
          style={{ 
            width: '100%', 
            padding: '0.9rem', 
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M24 12.27c0-.85-.07-1.53-.22-2.23H12.23v4.46h6.6a5.66 5.66 0 0 1-2.46 3.71l-.02.02v2.85h3.98l.27-.27C22.93 18.15 24 15.46 24 12.27z"/>
            <path fill="#4285F4" d="M12.23 24c3.24 0 5.95-1.08 7.93-2.91l-3.96-2.85c-1.1.75-2.5 1.19-3.97 1.19-3.05 0-5.63-2.06-6.55-4.83l-.11.01H1.57l-.14.1C3.33 18.92 7.42 24 12.23 24z"/>
            <path fill="#FBBC05" d="M5.68 14.6c-.24-.7-.37-1.44-.37-2.2 0-.76.13-1.51.37-2.2l-.01-.13H1.43l-.14.1C.46 11.54 0 13.73 0 16s.46 4.46 1.29 5.8l4.39-4.2-.1-.01c-.24-.7-.37-1.44-.37-2.2z"/>
            <path fill="#34A853" d="M12.23 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C18.18 1.12 15.47 0 12.23 0 7.42 0 3.33 5.08 1.29 9.3l4.39 4.2c.92-2.77 3.5-4.83 6.55-4.83z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--page-primary)', fontWeight: 800, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
