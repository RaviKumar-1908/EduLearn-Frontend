import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, ArrowLeft, CheckCircle, Clock, Edit } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getAuthUser } from '../../utils/auth';

// Reuse the same schema
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a brief description"),
  category: z.string().min(2, "Category is required"),
  level: z.string().min(1, "Please select a level"),
  price: z.coerce.number().min(0, "Price must be a positive number or 0 for free"),
  language: z.string().min(2, "Language is required"),
});

export default function EditCourse() {
  const { courseId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const navigate = useNavigate();
  const user = getAuthUser();

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      price: 0,
      level: 'Beginner'
    }
  });

  // Fetch existing course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/api/course/${courseId}`);
        const course = response.data;
        
        // Populate form with existing data
        reset({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          language: course.language
        });
        
          if (course.thumbnailUrl) {
            setCurrentThumbnail(course.thumbnailUrl);
            setThumbnailPreview(course.thumbnailUrl);
          }
          setCourseData(course);
      } catch (error) {
        toast.error("Failed to load course data.");
        navigate('/instructor/dashboard');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchCourse();
  }, [courseId, navigate, reset]);


  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        price: data.price,
        language: data.language,
        instructorId: user.userId,
        thumbnailUrl: currentThumbnail || "",
        totalDuration: 0
      };

      // Update course
      await api.put(`/api/course/${courseId}`, payload);
      
      // Upload new thumbnail if provided
      // REMOVED: Backend does not support multipart file uploads yet. The thumbnailUrl string is saved via the standard PUT above.
      
      toast.success('Course updated successfully!');
      navigate('/instructor/dashboard');
      
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update course.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await api.put(`/api/course/publish/${courseId}`);
      toast.success('Course published successfully!');
      setCourseData({ ...courseData, isPublished: true, published: true });
    } catch (err) {
      toast.error('Failed to publish course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    try {
      await api.put(`/api/course/admin/status/${courseId}?status=Draft`);
      toast.info('Course reverted to draft status.');
      setCourseData({ ...courseData, isPublished: false, published: false });
    } catch (err) {
      toast.error('Failed to unpublish course.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* HEADER SECTION */}
      <header className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/instructor/dashboard')} 
          className="glass-btn-secondary" 
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', 
            width: '48px', height: '48px', borderRadius: '1rem', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
          }}>
            <Edit color="white" size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '2rem' }}>Edit <span className="text-gradient">Course</span></h1>
            <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '0.2rem', opacity: 0.8 }}>Update your course details and settings.</p>
          </div>
        </div>
      </header>

      <div 
        className="glass-panel animate-scale-in"
        style={{ 
          padding: '1.5rem', 
          borderRadius: '1.5rem', 
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Accent Blurs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.05)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />

        {courseData && (
          <div 
            className="animate-fade-in"
            style={{ 
              marginBottom: '2.5rem', padding: '1.25rem 1.5rem', 
              background: (courseData.isPublished || courseData.published) ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)', 
              border: (courseData.isPublished || courseData.published) ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              borderRadius: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: (courseData.isPublished || courseData.published) ? '#10b981' : '#f59e0b', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                {(courseData.isPublished || courseData.published) ? <CheckCircle size={18} color="white" /> : <Clock size={18} color="white" />}
              </div>
              <div>
                <span style={{ color: (courseData.isPublished || courseData.published) ? '#10b981' : '#f59e0b', fontWeight: 900, display: 'block', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  Status: {(courseData.isPublished || courseData.published) ? 'Live' : 'Draft'}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {(courseData.isPublished || courseData.published) ? 'Visible to all students.' : 'Hidden from public catalog.'}
                </span>
              </div>
            </div>
            
            {(courseData.isPublished || courseData.published) ? (
              <button 
                type="button" 
                onClick={handleUnpublish} 
                className="hover-scale" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                  color: '#ef4444', padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontWeight: 950, borderRadius: '0.75rem',
                  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Reverting...' : 'Unpublish Course'}
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handlePublish} 
                className="glass-btn-primary" 
                style={{ background: '#10b981', border: 'none', color: 'white', padding: '0.6rem 1.5rem', fontSize: '0.95rem', fontWeight: 900, borderRadius: '0.75rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish Course'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Title</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g., Modern Web Architecture" 
              {...register('title')} 
              style={{ padding: '1rem 1.25rem', fontSize: '1rem', borderRadius: '1rem' }}
            />
            {errors.title && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{errors.title.message}</p>}
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            <textarea 
              className="glass-input" 
              rows="6" 
              placeholder="What will students master in this course?" 
              {...register('description')} 
              style={{ padding: '1rem 1.25rem', fontSize: '1rem', borderRadius: '1rem', lineHeight: 1.6 }}
            />
            {errors.description && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>{errors.description.message}</p>}
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Thumbnail</label>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="https://example.com/image.jpg" 
                  value={currentThumbnail || ''}
                  onChange={(e) => {
                    setCurrentThumbnail(e.target.value);
                    setThumbnailPreview(e.target.value);
                  }}
                  style={{ padding: '1rem 1.25rem', fontSize: '0.95rem', borderRadius: '1rem' }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 500 }}>
                  Paste a direct link to a high-quality thumbnail image.
                </p>
              </div>
              
              <div 
                className="hover-scale"
                style={{ 
                  width: '200px', 
                  aspectRatio: '16 / 9', 
                  borderRadius: '1rem', 
                  border: '2px dashed var(--border-color)',
                  background: thumbnailPreview ? `url(${thumbnailPreview}) center/cover` : 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: thumbnailPreview ? '0 15px 30px rgba(0,0,0,0.2)' : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {!thumbnailPreview && <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.3 }}>PREVIEW</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</label>
              <input type="text" className="glass-input" placeholder="e.g., Design" {...register('category')} style={{ padding: '1rem', borderRadius: '0.75rem' }} />
              {errors.category && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.category.message}</p>}
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Difficulty</label>
              <select className="glass-input" {...register('level')} style={{ padding: '1rem', borderRadius: '0.75rem', appearance: 'none' }}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Price (₹)</label>
              <input type="number" step="0.01" className="glass-input" placeholder="0 for Free" {...register('price')} style={{ padding: '1rem', borderRadius: '0.75rem' }} />
              {errors.price && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.price.message}</p>}
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Language</label>
              <input type="text" className="glass-input" placeholder="e.g., English" {...register('language')} style={{ padding: '1rem', borderRadius: '0.75rem' }} />
              {errors.language && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errors.language.message}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => navigate('/instructor/dashboard')} 
              className="glass-btn-secondary"
              style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800, borderRadius: '1rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="glass-btn-primary hover-scale" 
              disabled={isLoading}
              style={{ 
                padding: '1rem 3rem', 
                fontSize: '1rem', 
                fontWeight: 900, 
                borderRadius: '1rem', 
                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}