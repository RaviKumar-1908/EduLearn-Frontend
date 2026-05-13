import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Clock, BookOpen, Star, User, Globe, Award, CheckCircle, ChevronRight, Shield, Zap, Lock } from 'lucide-react';
import api from '../services/api';
import enrollmentService from '../services/enrollmentService';
import { getAuthUser } from '../utils/auth';
import { toast } from 'react-toastify';
import CourseDetailSkeleton from '../components/common/CourseDetailSkeleton';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = getAuthUser();
  const userId = user?.userId;
  const isInstructor = user?.role === 'INSTRUCTOR';
  const isAdmin = user?.role === 'ADMIN';

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/api/course/${courseId}`);
      return res.data;
    },
    staleTime: 300000,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const res = await api.get(`/api/lesson/course/${courseId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 300000,
  });

  const { data: instructor, isLoading: instructorLoading } = useQuery({
    queryKey: ['instructorProfile', courseData?.instructorId],
    queryFn: async () => {
      if (!courseData?.instructorId) return null;
      const res = await api.get(`/auth/profile/${courseData.instructorId}`);
      return res.data;
    },
    enabled: !!courseData?.instructorId,
    staleTime: 600000, // Instructors rarely change
  });

  const course = courseData;
  const isOwner = course && Number(userId) === Number(course.instructorId);

  const { data: isEnrolled = false, isLoading: enrollLoading } = useQuery({
    queryKey: ['isEnrolled', userId, courseId],
    queryFn: async () => {
      if (!userId || isOwner) return false;
      const res = await enrollmentService.checkEnrollment(userId, courseId);
      return res.data === true;
    },
    enabled: !!userId && !!courseData && !isOwner,
    staleTime: 300000,
  });

  const isLoading = courseLoading || lessonsLoading || enrollLoading;

  const handleEnroll = () => {
    if (!user) {
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    navigate(`/enroll/${courseId}`);
  };

  if (courseLoading) return <CourseDetailSkeleton />;
  if (!course) return <div className="centered-message">Repository entity not found.</div>;

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>
      
      {/* 1. HERO ARCHITECTURE */}
      <div style={{ position: 'relative', padding: '4rem 0', marginBottom: '4rem' }}>

        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
               <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#6366f1', textTransform: 'uppercase' }}>{course.category}</span>
               </div>
               <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#10b981', textTransform: 'uppercase' }}>{course.level}</span>
               </div>
            </div>
            
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '1.5rem', lineHeight: '1.1', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{course.title}</h1>
            <div className="study-text" style={{ 
              marginBottom: '2.5rem', 
              whiteSpace: 'pre-wrap'
            }}>
              {course.description}
            </div>
            
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '1rem', 
                    background: instructor?.profilePicUrl ? 'transparent' : 'var(--border-color)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    transition: 'background 0.3s ease'
                  }}>
                    {instructorLoading ? (
                      <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }} />
                    ) : instructor?.profilePicUrl ? (
                      <img src={instructor.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={24} color="var(--text-secondary)" />
                    )}
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor</div>
                    <div style={{ fontSize: '1rem', fontWeight: 950, minHeight: '1.2em' }}>
                      {instructorLoading ? 'Loading Identity...' : (instructor?.fullName || 'Academic Lead')}
                    </div>
                  </div>
               </div>
               <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }} />
               <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontWeight: 950, fontSize: '1rem', color: '#10b981' }}>{course.status || 'Active'}</span>
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
               {isOwner ? (
                 <button onClick={() => navigate(`/instructor/course/${courseId}/curriculum`)} className="glass-btn-primary" style={{ padding: '1rem 3rem', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 950, background: 'var(--page-primary)' }}>MANAGE CURRICULUM</button>
               ) : isEnrolled ? (
                 <button onClick={() => navigate(`/student/course/${courseId}/lessons`)} className="glass-btn-primary" style={{ padding: '1rem 3rem', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 950 }}>CONTINUE LEARNING</button>
               ) : (
                 <button onClick={handleEnroll} className="glass-btn-primary" style={{ padding: '1rem 3rem', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 950, background: 'var(--page-primary)' }}>ENROLL NOW</button>
               )}
               
               {isOwner ? (
                 <button onClick={() => navigate(`/instructor/course/${courseId}/edit`)} className="glass-btn-secondary" style={{ padding: '1rem 2.5rem', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 950 }}>EDIT SETTINGS</button>
               ) : (
                 <button onClick={() => navigate(`/course/${courseId}/lesson/${lessons[0]?.lessonId}/preview`)} className="glass-btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '1.25rem', fontSize: '1rem', fontWeight: 950 }}>FREE PREVIEW</button>
               )}
            </div>
          </div>

          <div className="course-card glass-panel sticky-card" style={{ position: 'sticky', top: '2rem', padding: '0', overflow: 'hidden', borderRadius: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', height: 'fit-content' }}>
            <div style={{ 
              width: '100%',
              aspectRatio: '16 / 9', 
              background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--bg-secondary)', 
              position: 'relative',
              borderBottom: '1px solid var(--border-color)'
            }} />
            
            <div style={{ padding: '1.5rem' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem' }}>Course Highlights:</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { icon: <Shield size={18} />, text: 'Lifetime Access', color: '#6366f1' },
                    { icon: <PlayCircle size={18} />, text: `${lessons.length} Lessons`, color: '#ec4899' },
                    { icon: <Award size={18} />, text: 'Certification Included', color: '#10b981' },
                    { icon: <Zap size={18} />, text: 'Assessments & Quizzes', color: '#f59e0b' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                       <div style={{ color: item.color }}>{item.icon}</div>
                       <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{item.text}</span>
                    </div>
                  ))}
               </div>
               
               
               {isOwner && (
                 <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                    <div style={{ color: '#10b981', fontWeight: 950, fontSize: '0.85rem' }}>YOU OWN THIS COURSE</div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CURRICULUM ARCHITECTURE */}
      <div style={{ maxWidth: '900px' }}>
         <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <BookOpen size={28} color="#6366f1" /> Curriculum
         </h2>
         
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lessons.map((lesson, idx) => {
              const isLocked = !isEnrolled && !isInstructor && !isAdmin && !isOwner && !lesson.preview;
              
              return (
                <div 
                  key={lesson.lessonId} 
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    background: isLocked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)', 
                    borderRadius: '1.25rem', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: isLocked ? 0.7 : 1,
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                    willChange: 'transform'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '0.75rem', 
                      background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.1)', 
                      color: isLocked ? 'var(--text-secondary)' : '#6366f1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.9rem', 
                      fontWeight: 950 
                    }}>
                      {isLocked ? <Lock size={16} /> : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{lesson.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {lesson.durationMinutes} Minutes
                        {lesson.preview && <span style={{ marginLeft: '0.75rem', color: '#10b981', fontWeight: 950 }}>• FREE PREVIEW</span>}
                      </div>
                    </div>
                  </div>
                  
                  {lesson.preview ? (
                    <button 
                      onClick={() => navigate(`/course/${courseId}/lesson/${lesson.lessonId}/preview`)} 
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        padding: '0.4rem 1rem', 
                        borderRadius: '2rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 950, 
                        cursor: 'pointer' 
                      }}
                    >
                      PREVIEW
                    </button>
                  ) : isLocked ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800 }}>
                      <Shield size={14} />
                      <span>PREMIUM</span>
                    </div>
                  ) : (
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  )}
                </div>
              );
            })}
            
            {!isEnrolled && !isOwner && lessons.length > lessons.filter(l => l.preview).length && (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.02)', borderRadius: '1.25rem', border: '1px dashed var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  + {lessons.length - lessons.filter(l => l.preview).length} Premium lessons will be unlocked after enrollment
                </p>
              </div>
            )}
            
            {isOwner && (
               <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1.25rem', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                    You have full access to all {lessons.length} lessons as the instructor.
                  </p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default CourseDetail;