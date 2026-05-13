import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
// import { motion } from 'framer-motion';
import { getAuthUser } from '../utils/auth';

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function Register() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [gender, setGender] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Redirect if already logged in
  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (role === 'INSTRUCTOR') navigate('/instructor/dashboard', { replace: true });
      else navigate('/student/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      if (!gender) {
        setServerError('Please select your gender');
        toast.error('Please select your gender');
        setIsLoading(false);
        return;
      }

      await api.post('/auth/register', {
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        role: role,
        gender: gender,
      });

      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again later.');
      toast.error('Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div 
        className="glass-panel auth-card animate-scale-in"
      >
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 950, margin: 0, letterSpacing: '-0.05em' }}>
            Create an <span className="text-gradient">Account</span>
          </h2>
          <p style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.8rem', fontWeight: 500 }}>Join the community today.</p>
        </div>

        {serverError && (
          <div className="alert error-alert" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {serverError}
          </div>
        )}

        <div className="role-selector" style={{ marginBottom: '1rem' }}>
          <button 
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`role-btn ${role === 'STUDENT' ? 'active' : 'inactive'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            Learner
          </button>
          <button 
            type="button"
            onClick={() => setRole('INSTRUCTOR')}
            className={`role-btn ${role === 'INSTRUCTOR' ? 'active' : 'inactive'}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            Instructor
          </button>
        </div>

        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => setGender('MALE')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '1rem',
                border: '1px solid',
                borderColor: gender === 'MALE' ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                background: gender === 'MALE' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                color: gender === 'MALE' ? '#60a5fa' : 'var(--text-secondary)',
                fontWeight: 850,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gender === 'MALE' ? '#60a5fa' : 'transparent', border: gender === 'MALE' ? 'none' : '1px solid #94a3b8' }} />
              Male
            </button>
            <button 
              type="button"
              onClick={() => setGender('FEMALE')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '1rem',
                border: '1px solid',
                borderColor: gender === 'FEMALE' ? '#f472b6' : 'rgba(255,255,255,0.1)',
                background: gender === 'FEMALE' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(255,255,255,0.02)',
                color: gender === 'FEMALE' ? '#f472b6' : 'var(--text-secondary)',
                fontWeight: 850,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gender === 'FEMALE' ? '#f472b6' : 'transparent', border: gender === 'FEMALE' ? 'none' : '1px solid #94a3b8' }} />
              Female
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <div className="input-group" style={{ flex: 1 }}>
               <label className="input-label" htmlFor="firstName">First name</label>
               <input
                 id="firstName"
                 name="firstName"
                 type="text"
                 className="glass-input"
                 placeholder="John"
                 autoComplete="given-name"
                 style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                 {...register('firstName')}
               />
               {errors.firstName && <p className="error-text">{errors.firstName.message}</p>}
             </div>
             
             <div className="input-group" style={{ flex: 1 }}>
               <label className="input-label" htmlFor="lastName">Last name</label>
               <input
                 id="lastName"
                 name="lastName"
                 type="text"
                 className="glass-input"
                 placeholder="Doe"
                 autoComplete="family-name"
                 style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                 {...register('lastName')}
               />
               {errors.lastName && <p className="error-text">{errors.lastName.message}</p>}
             </div>
          </div>

          <div className="input-group" style={{ marginBottom: '0.85rem' }}>
            <label className="input-label" htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" className="glass-input" placeholder="you@example.com" autoComplete="email" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }} {...register('email')} />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="glass-input" placeholder="••••••••" autoComplete="new-password" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }} {...register('password')} />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
            
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="confirmPassword">Confirm</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="glass-input" placeholder="••••••••" autoComplete="new-password" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }} {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button type="submit" className="glass-btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 950 }} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--page-primary)', fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
