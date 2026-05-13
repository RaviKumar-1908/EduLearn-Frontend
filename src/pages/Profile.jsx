import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
// import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { clearAuth } from '../utils/auth';
import { User, Mail, Shield, Camera, Save, LogOut, ArrowLeft } from 'lucide-react';

// --- Zod Schemas ---
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{10,15}$/.test(value), 'Enter a valid phone number'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer').optional(),
  profilePicUrl: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Enter a valid image URL')
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm the new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export default function Profile() {
  const { user: currentUser, profile: contextProfile, setProfile } = useUser();
  const [isFetching, setIsFetching] = useState(!contextProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [localProfile, setLocalProfile] = useState(contextProfile);
  const [gender, setGender] = useState('');

  const navigate = useNavigate();
  const { userId: paramUserId } = useParams();
  
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const targetUserId = (isAdmin && paramUserId) ? paramUserId : (currentUser?.userId || currentUser?.id);
  const isViewOnly = isAdmin && paramUserId && String(paramUserId) !== String(currentUser?.userId);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue,
    watch,
    formState: { errors: profileErrors }
  } = useForm({ 
    resolver: zodResolver(profileSchema),
    defaultValues: contextProfile || {}
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    const fetchProfileData = async () => {
      // If we are looking at self and already have contextProfile, don't fetch unless it's a forced refresh
      if (!targetUserId) return;
      
      // If it's self and we have context data, use it
      if (String(targetUserId) === String(currentUser?.userId) && contextProfile) {
        setLocalProfile(contextProfile);
        setValue('fullName', contextProfile.fullName || '');
        setValue('mobile', contextProfile.mobile ? String(contextProfile.mobile) : '');
        setValue('bio', contextProfile.bio || '');
        setValue('profilePicUrl', contextProfile.profilePicUrl || '');
        setGender(contextProfile.gender || '');
        setIsFetching(false);
        return;
      }

      try {
        const response = await api.get(`/auth/profile/${targetUserId}`);
        const userData = response.data;
        setLocalProfile(userData);

        setValue('fullName', userData.fullName || '');
        setValue('mobile', userData.mobile ? String(userData.mobile) : '');
        setValue('bio', userData.bio || '');
        setValue('profilePicUrl', userData.profilePicUrl || '');
        setGender(userData.gender || '');
      } catch (error) {
        toast.error("Could not load profile data.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfileData();
  }, [targetUserId, setValue, contextProfile, currentUser?.userId]);

  const onProfileSubmit = async (data) => {
    if (isViewOnly) return;
    setIsSavingProfile(true);
    try {
      const payload = {
        fullName: data.fullName,
        mobile: data.mobile ? parseInt(data.mobile, 10) : null,
        bio: data.bio,
        profilePicUrl: data.profilePicUrl,
        gender: gender || null,
      };

      const response = await api.put(`/auth/profile/${targetUserId}`, payload);
      
      if (gender) {
        localStorage.setItem('userGender', gender);
      }
      
      const updatedProfile = { ...localProfile, ...payload };
      setLocalProfile(updatedProfile);
      
      // If it's self, update the global context
      if (String(targetUserId) === String(currentUser?.userId)) {
        setProfile(updatedProfile);
      }
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsSavingPassword(true);
    try {
      await api.put(`/auth/password/${targetUserId}`, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      });
      toast.success("Password changed successfully!");
      resetPasswordForm(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isAdmin && String(targetUserId) === String(currentUser?.userId)) {
      toast.error("Administrators cannot delete their own account.");
      return;
    }
    const isConfirmed = window.confirm("Are you sure you want to delete this account?");
    if (!isConfirmed) return;

    try {
      await api.delete(`/auth/delete/${targetUserId}`);
      toast.success("Account deleted.");
      if (targetUserId === currentUser?.userId) {
        clearAuth();
        navigate('/register');
      } else {
        navigate('/admin/users');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account.");
    }
  };

  if (isFetching) {
    return (
      <div className="main-content centered-message" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '1rem', fontWeight: 800, color: 'var(--text-secondary)' }}>LOADING IDENTITY...</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>

      <div
        className="animate-fade-in"
        style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', paddingTop: '1.5rem' }}
      >
        {isViewOnly && (
          <button 
            onClick={() => navigate('/admin/users')}
            className="glass-btn-secondary"
            style={{ width: '40px', height: '40px', borderRadius: '0.75rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="icon-box" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', margin: 0, width: '56px', height: '56px', borderRadius: '1.25rem' }}>
          <User size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 950, letterSpacing: '-0.04em' }}>
            {isViewOnly ? 'User Identity' : 'Account Settings'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {isViewOnly ? 'Reviewing system member profile.' : 'Update your profile and security.'}
          </p>
        </div>
      </div>

      <div
        className="animate-slide-up"
        style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem', position: 'relative', animationDelay: '0.1s' }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: '-5px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '2rem', opacity: 0.2, filter: 'blur(10px)' }} />
          {watch('profilePicUrl') ? (
            <img src={watch('profilePicUrl')} alt="Identity" style={{ width: '100px', height: '100px', borderRadius: '1.75rem', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }} />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '1.75rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 950, color: 'white', position: 'relative', zIndex: 1 }}>
              {localProfile?.fullName?.charAt(0)?.toUpperCase() || 'L'}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#6366f1', textTransform: 'uppercase' }}>Member Identity</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            {localProfile?.fullName || 'Profile Settings'}
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
            {localProfile?.email || currentUser?.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="premium-card animate-slide-up" style={{ padding: '2rem', animationDelay: '0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 950, marginBottom: '1.5rem' }}>Personal Information</h2>
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input type="text" className="glass-input" placeholder="Name" {...registerProfile('fullName')} />
                {profileErrors.fullName && <p className="error-text">{profileErrors.fullName.message}</p>}
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input type="text" className="glass-input" placeholder="e.g., 9876543210" {...registerProfile('mobile')} />
                {profileErrors.mobile && <p className="error-text">{profileErrors.mobile.message}</p>}
              </div>
              <div className="input-group">
                <label className="input-label">Profile Picture URL</label>
                <input type="text" className="glass-input" placeholder="Paste link" {...registerProfile('profilePicUrl')} />
                {profileErrors.profilePicUrl && <p className="error-text">{profileErrors.profilePicUrl.message}</p>}
              </div>
              <div className="input-group">
                <label className="input-label">Bio</label>
                <textarea className="glass-input" rows="3" placeholder="About you..." {...registerProfile('bio')} />
                {profileErrors.bio && <p className="error-text">{profileErrors.bio.message}</p>}
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setGender('MALE')} disabled={isViewOnly} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: gender === 'MALE' ? '2px solid #6366f1' : '1px solid var(--border-color)', background: gender === 'MALE' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: gender === 'MALE' ? '#6366f1' : 'var(--text-secondary)', fontWeight: 700, cursor: isViewOnly ? 'default' : 'pointer' }}>Male</button>
                  <button type="button" onClick={() => setGender('FEMALE')} disabled={isViewOnly} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: gender === 'FEMALE' ? '2px solid #ec4899' : '1px solid var(--border-color)', background: gender === 'FEMALE' ? 'rgba(236, 72, 153, 0.1)' : 'transparent', color: gender === 'FEMALE' ? '#ec4899' : 'var(--text-secondary)', fontWeight: 700, cursor: isViewOnly ? 'default' : 'pointer' }}>Female</button>
                </div>
              </div>
              {!isViewOnly && (
                <button type="submit" className="glass-btn-primary" disabled={isSavingProfile} style={{ padding: '1rem', borderRadius: '1rem', fontWeight: 950 }}>{isSavingProfile ? 'SAVING...' : 'SAVE CHANGES'}</button>
              )}
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {!isViewOnly && (
            <div className="premium-card animate-slide-up" style={{ padding: '1.5rem', animationDelay: '0.3s' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 950, marginBottom: '1.5rem' }}>Security</h2>
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input type="password" placeholder="••••••••" className="glass-input" {...registerPassword('oldPassword')} />
                  {passwordErrors.oldPassword && <p className="error-text">{passwordErrors.oldPassword.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input type="password" placeholder="••••••••" className="glass-input" {...registerPassword('newPassword')} />
                  {passwordErrors.newPassword && <p className="error-text">{passwordErrors.newPassword.message}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <input type="password" placeholder="••••••••" className="glass-input" {...registerPassword('confirmPassword')} />
                  {passwordErrors.confirmPassword && <p className="error-text">{passwordErrors.confirmPassword.message}</p>}
                </div>
                <button type="submit" className="glass-btn-secondary" disabled={isSavingPassword} style={{ padding: '0.85rem', borderRadius: '1rem', fontWeight: 900 }}>{isSavingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}</button>
              </form>
            </div>
          )}

          {!isViewOnly && !(isAdmin && String(targetUserId) === String(currentUser?.userId)) && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 950, marginBottom: '0.75rem', color: '#ef4444' }}>Danger Zone</h2>
              <button onClick={handleDeleteAccount} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.85rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 950 }}>DELETE ACCOUNT</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
