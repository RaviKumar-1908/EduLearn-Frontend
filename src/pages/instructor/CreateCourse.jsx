import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import { motion } from 'framer-motion';
import { Upload, Image, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { getAuthUser } from '../../utils/auth';

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a brief description"),
  category: z.string().min(2, "Category is required"),
  level: z.string().min(1, "Please select a level"),
  price: z.coerce.number().min(0, "Price must be a positive number or 0 for free"),
  language: z.string().min(2, "Language is required"),
  thumbnailUrl: z.string().optional(),
});

export default function CreateCourse() {
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const navigate = useNavigate();
  const user = getAuthUser();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: { price: 0, level: 'Beginner' }
  });

  if (!user?.userId && !user?.id) {
    return (
      <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Authentication Required</h2>
          <p>Please log in as an instructor to create courses.</p>
          <button onClick={() => navigate('/login')} className="glass-btn-primary">Go to Login</button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        instructorId: user.userId || user.id,
        instructorName: user.fullName || "Instructor",
        instructorEmail: user.email || "",
        totalDuration: 0
      };
      const response = await api.post('/api/course', payload);
      toast.success('Course initiated! Redirecting to curriculum...');
      navigate(`/instructor/course/${response.data.courseId || response.data.id}/curriculum`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem 2vw 6rem' }}>
      
      <header className="animate-fade-in" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.08)', padding: '0.3rem 0.8rem', borderRadius: '2rem', marginBottom: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Step 1: Configuration</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>Launch New <span className="text-gradient">Module</span></h1>
          
          <div style={{ 
            marginTop: '1rem', 
            background: 'rgba(99, 102, 241, 0.05)', 
            padding: '0.6rem 1rem', 
            borderRadius: '0.75rem', 
            borderLeft: '4px solid var(--page-primary)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            display: 'inline-block'
          }}>
            <span style={{ color: 'var(--page-primary)' }}>Note:</span> Fill in the details below to start adding your lessons.
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="create-course-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: CORE IDENTITY */}
          <div 
            className="glass-panel animate-slide-up" style={{ padding: '1.75rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Identity</label>
              <input
                type="text"
                className="glass-input"
                placeholder="Ex: Master Modern Web Architecture"
                {...register('title')}
                style={{ padding: '0.75rem 1rem', fontSize: '0.95rem', borderRadius: '0.75rem' }}
              />
              {errors.title && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: 700 }}>{errors.title.message}</p>}
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategic Description</label>
              <textarea
                className="glass-input"
                rows="4"
                placeholder="Describe the primary learning objectives..."
                {...register('description')}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', borderRadius: '0.75rem', lineHeight: 1.5 }}
              />
              {errors.description && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: 700 }}>{errors.description.message}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 900, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Classification</label>
                <input type="text" className="glass-input" placeholder="e.g., Development" {...register('category')} style={{ padding: '0.75rem', borderRadius: '0.6rem', fontSize: '0.9rem' }} />
                {errors.category && <p style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.3rem' }}>{errors.category.message}</p>}
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 900, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Language</label>
                <input type="text" className="glass-input" placeholder="e.g., English" {...register('language')} style={{ padding: '0.75rem', borderRadius: '0.6rem', fontSize: '0.9rem' }} />
                {errors.language && <p style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.3rem' }}>{errors.language.message}</p>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: VISUALS & LOGISTICS */}
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 950, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Visual Assets</label>
              <div 
                style={{ 
                  width: '100%', 
                  aspectRatio: '16/9', 
                  borderRadius: '1rem', 
                  background: thumbnailPreview ? `url(${thumbnailPreview}) center/cover` : 'var(--bg-secondary)', 
                  border: '2px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}
              >
                {!thumbnailPreview && <div style={{ textAlign: 'center', opacity: 0.3 }}><Image size={24} /></div>}
              </div>
              <div style={{ position: 'relative' }}>
                <Upload size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--page-primary)' }} />
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Paste Image URL"
                  {...register('thumbnailUrl')}
                  onChange={(e) => setThumbnailPreview(e.target.value)}
                  style={{ padding: '0.65rem 0.8rem 0.65rem 2.2rem', fontSize: '0.8rem', borderRadius: '0.6rem' }}
                />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 900, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expertise Level</label>
                <select className="glass-input" {...register('level')} style={{ padding: '0.65rem', borderRadius: '0.6rem', fontSize: '0.85rem' }}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 900, fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tuition (₹)</label>
                <input type="number" step="0.01" className="glass-input" placeholder="0 for Free" {...register('price')} style={{ padding: '0.65rem', borderRadius: '0.6rem', fontSize: '0.85rem' }} />
              </div>
            </div>

            <button
              type="submit"
              className="glass-btn-primary hover-scale"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.9rem',
                fontWeight: 950,
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? <div className="loading-spinner" style={{ width: '18px', height: '18px' }} /> : (
                <>Start Building Curriculum <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        @media (max-width: 900px) {
          .create-course-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}