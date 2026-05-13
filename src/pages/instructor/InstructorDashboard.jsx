import React, { useState, useMemo, useCallback } from 'react';
import { Plus, BookOpen, Users, CheckCircle, Clock, ExternalLink, Edit, Trash2, Settings, XCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import enrollmentService from '../../services/enrollmentService';
import courseService from '../../services/courseService';
import userService from '../../services/userService';
import { fetchEnrollmentCounts, fetchUniqueStudentCountByCourses } from '../../services/dashboardService';
import { useUser } from '../../context/UserContext';

// const defaultDashboard = {
//   courses: [],
//   enrollmentCounts: {},
//   uniqueStudents: 0,
// };

const StatCard = React.memo(({ icon, label, value, color, onClick, isSidebar }) => (
  <div
    onClick={onClick}
    className="glass-panel hover-lift"
    style={{
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
      willChange: 'transform',
      padding: isSidebar ? '1rem 1.25rem' : '1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      borderRadius: '1.75rem',
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      cursor: onClick ? 'pointer' : 'default',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: `${color}05`, borderRadius: '50%', filter: 'blur(10px)' }} />

    <div style={{
      width: isSidebar ? '44px' : '52px',
      height: isSidebar ? '44px' : '52px',
      borderRadius: '0.85rem',
      background: `${color}10`,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isSidebar ? '1.1rem' : '1.3rem',
      border: `1px solid ${color}15`,
      flexShrink: 0
    }}>
      {icon}
    </div>

    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ fontSize: isSidebar ? '0.75rem' : '0.85rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <div style={{ fontSize: isSidebar ? '1.5rem' : '2rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
));

export default function InstructorDashboard() {
  const { user, profile } = useUser();
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const instructorId = Number(user?.userId || user?.id);

  // 1. Fetch Instructor Courses (Fast)
  const { data: instructorCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['instructorCourses', instructorId],
    queryFn: async () => {
      const res = await courseService.getInstructorCourses(instructorId);
      return Array.isArray(res) ? res : [];
    },
    enabled: !!instructorId,
    staleTime: 60000,
  });

  // 2. Fetch Enrollment Counts (Batched)
  const courseIds = useMemo(() => instructorCourses.map(c => c.courseId), [instructorCourses]);
  const { data: enrollmentCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['enrollmentCounts', courseIds],
    queryFn: () => fetchEnrollmentCounts(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 1000 * 60 * 5, // Stats can be slightly stale
  });

  // 3. Fetch Unique Students (Slow, heavy storm)
  const { data: uniqueStudents = 0, isLoading: uniqueLoading } = useQuery({
    queryKey: ['uniqueStudents', courseIds],
    queryFn: () => fetchUniqueStudentCountByCourses(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 1000 * 60 * 10, // Very heavy, keep cached
  });

  const dashboardData = useMemo(() => ({
    courses: instructorCourses,
    enrollmentCounts,
    uniqueStudents,
  }), [instructorCourses, enrollmentCounts, uniqueStudents]);

  const isLoading = coursesLoading; // Only block on courses, stats can load in background

  const totalEnrollments = useMemo(() =>
    Object.values(dashboardData.enrollmentCounts).reduce((acc, curr) => acc + curr, 0),
    [dashboardData.enrollmentCounts]
  );

  const handleDelete = useCallback(async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/course/${courseId}`);
      queryClient.setQueryData(['instructorCourses', instructorId], prev => 
        Array.isArray(prev) ? prev.filter(c => c.courseId !== courseId) : prev
      );
      toast.success("Course deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete course. It may have active enrollments.");
    }
  }, [instructorId, queryClient]);

  const handlePublish = useCallback(async (courseId) => {
    try {
      await api.put(`/api/course/publish/${courseId}`);
      queryClient.setQueryData(['instructorCourses', instructorId], prev => 
        Array.isArray(prev) ? prev.map(c => c.courseId === courseId ? { ...c, isPublished: true, published: true } : c) : prev
      );
      toast.success("Course published successfully!");
    } catch (error) {
      toast.error("Failed to publish course.");
    }
  }, [instructorId, queryClient]);

  const handleUnpublish = useCallback(async (courseId) => {
    try {
      await api.put(`/api/course/admin/status/${courseId}?status=Draft`);
      queryClient.setQueryData(['instructorCourses', instructorId], prev => 
        Array.isArray(prev) ? prev.map(c => c.courseId === courseId ? { ...c, isPublished: false, published: false } : c) : prev
      );
      toast.info("Course moved back to draft.");
    } catch (error) {
      toast.error("Failed to unpublish course.");
    }
  }, [instructorId, queryClient]);

  const handleViewStudents = useCallback(async (course) => {
    setSelectedCourseForStudents(course);
    setLoadingStudents(true);
    setEnrolledStudents([]);
    try {
      const res = await enrollmentService.getCourseEnrollments(course.courseId);
      const enrollments = res.data || [];
      const profileMap = await userService.getBulkProfiles(
        [...new Set(enrollments.map(e => e.studentId).filter(Boolean))]
      ).catch(() => ({}));
      setEnrolledStudents(enrollments.map(enrollment => ({
        ...enrollment,
        studentProfile: profileMap[enrollment.studentId] || {
          fullName: `Student #${enrollment.studentId}`,
          profilePicUrl: null
        }
      })));
    } catch (error) {
      toast.error('Failed to fetch students.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);



  const CourseCard = React.memo(({ course, enrollmentCount, onDelete, onPublish, onUnpublish, onViewStudents, navigate }) => (
    <div
      className="premium-card animate-slide-up hover-lift"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '2rem', transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease', willChange: 'transform' }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: '1.25rem', marginBottom: '1.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '100%', height: '100%', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--bg-secondary)' }} />
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          {(course.isPublished || course.published) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 950, fontSize: '0.75rem', background: '#10b981', padding: '0.5rem 1rem', borderRadius: '2rem', boxShadow: '0 10px 20px rgba(16,185,129,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <CheckCircle size={14} strokeWidth={3} /> PUBLISHED
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 950, fontSize: '0.75rem', background: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '2rem', boxShadow: '0 10px 20px rgba(245,158,11,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Clock size={14} strokeWidth={3} /> DRAFT
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 0.5rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--page-primary)', fontWeight: 950, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.15em' }}>{course.category}</div>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.3, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{course.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Users size={18} color="#6366f1" />
            <span style={{ color: 'var(--text-primary)' }}>{enrollmentCount}</span> Learners
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 950 }}>
            ₹{(enrollmentCount * (course.price || 0)).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          <button onClick={() => onViewStudents(course)} className="glass-btn-secondary" style={{ padding: '0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '1rem', fontWeight: 800 }}>
            <Users size={16} /> Students
          </button>
          <button onClick={() => navigate('/instructor/discussions', { state: { courseId: course.courseId } })} className="glass-btn-secondary" style={{ padding: '0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '1rem', fontWeight: 800 }}>
            <MessageSquare size={16} /> Chat
          </button>
          <button onClick={() => navigate(`/instructor/course/${course.courseId}/curriculum`)} className="glass-btn-secondary" style={{ padding: '0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '1rem', fontWeight: 800 }}>
            <Edit size={16} /> Content
          </button>
          <button onClick={() => navigate(`/instructor/course/${course.courseId}/edit`)} className="glass-btn-secondary" style={{ padding: '0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '1rem', fontWeight: 800 }}>
            <Settings size={16} /> Config
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate(`/course/${course.courseId}`)} className="action-btn" title="Preview" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--page-primary)', border: '1px solid var(--border-color)', width: '42px', height: '42px' }}><ExternalLink size={20} /></button>
            <button onClick={() => onDelete(course.courseId)} className="action-btn" style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444', border: '1px solid var(--border-color)', width: '42px', height: '42px' }} title="Delete"><Trash2 size={20} /></button>
          </div>
          {(course.isPublished || course.published) ? (
            <button 
              onClick={() => onUnpublish(course.courseId)} 
              className="hover-scale" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', 
                borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
                fontSize: '0.75rem', fontWeight: 950, cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}
            >
              <XCircle size={14} strokeWidth={3} /> Unpublish
            </button>
          ) : (
            <button onClick={() => onPublish(course.courseId)} className="glass-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 900, borderRadius: '1rem' }}>🚀 Go Live</button>
          )}
        </div>
      </div>
    </div>
  ));

  const StudentRegistryModal = React.memo(({ course, students, loading, onClose }) => (
    <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
      <div
        className="premium-card animate-scale-in"
        style={{ width: '95%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', padding: '2.5rem', position: 'relative', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', borderRadius: '2rem' }}
      >
        <button
          onClick={onClose}
          className="action-btn"
          style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'var(--input-bg)', borderRadius: '50%', width: '48px', height: '48px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <XCircle size={28} />
        </button>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1.2rem', borderRadius: '2rem', marginBottom: '1.25rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <Users size={14} color="#6366f1" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Enrollment Matrix</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Learner <span className="text-gradient">Registry</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 600 }}>{course.title}</p>
        </div>

        {loading ? (
          <div style={{ padding: '10rem 0', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 2rem auto', width: '60px', height: '60px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em' }}>RETRIEVING DATA ARCHIVES...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '8rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '2.5rem', border: '1px dashed var(--border-color)' }}>
            <Users size={80} style={{ opacity: 0.1, marginBottom: '2.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>Matrix Empty</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Students waiting for admission will appear in this registry once they enroll.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.15em' }}>
                  <th style={{ padding: '0 1.5rem 1rem', fontWeight: 900 }}>Learner</th>
                  <th style={{ padding: '0 1.5rem 1rem', fontWeight: 900 }}>Registration</th>
                  <th style={{ padding: '0 1.5rem 1rem', fontWeight: 900 }}>Yield</th>
                  <th style={{ padding: '0 1.5rem 1rem', fontWeight: 900 }}>Progression</th>
                  <th style={{ padding: '0 1.5rem 1rem', fontWeight: 900, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.enrollmentId} style={{ transition: 'background-color 0.2s ease, transform 0.2s ease' }}>
                    <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem 0 0 1.25rem', border: '1px solid var(--border-color)', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {student.studentProfile?.profilePicUrl ? (
                          <img src={student.studentProfile.profilePicUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '1rem', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 950, color: 'var(--page-primary)' }}>
                            {(student.studentProfile?.fullName || 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{student.studentProfile?.fullName || `Student #${student.studentId}`}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>ID: {student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 800, background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      {new Date(student.enrolledAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 950, color: '#10b981', fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      ₹{(student.priceAtPurchase || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span style={{ fontSize: '1rem', width: '45px', fontWeight: 950, color: 'var(--text-primary)' }}>{student.progressPercent}%</span>
                        <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', minWidth: '100px' }}>
                          <div
                            style={{ height: '100%', width: `${student.progressPercent}%`, background: 'var(--page-primary)', boxShadow: '0 0 10px rgba(0,0,0,0.1)', transition: 'width 1.2s ease-out' }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', borderRadius: '0 1.25rem 1.25rem 0', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderLeft: 'none', textAlign: 'right' }}>
                      {student.status === 'Completed' || student.progressPercent === 100 ? (
                        <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.1em', border: '1px solid rgba(16, 185, 129, 0.2)' }}>COMPLETED</span>
                      ) : (
                        <span style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.1em', border: '1px solid rgba(99, 102, 241, 0.2)' }}>ACTIVE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '2rem 5vw 8rem' }}>



      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '4rem', alignItems: 'start', position: 'relative', zIndex: 1 }} className="learning-grid-layout">

        <aside className="learning-sidebar" style={{ position: 'sticky', top: '3rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          <div
            className="premium-card animate-slide-up"
            style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '2rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ position: 'absolute', inset: '-2px', background: 'var(--page-primary)', borderRadius: '1.75rem', opacity: 0.2 }} />
              {profile?.profilePicUrl ? (
                <img src={profile.profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '1.5rem', objectFit: 'cover', border: '3px solid var(--bg-secondary)', position: 'relative' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 950, color: 'var(--page-primary)', position: 'relative' }}>
                  {(profile?.fullName || user?.fullName || 'I').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{profile?.fullName || user?.fullName || 'Instructor'}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Senior Educator</div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button onClick={() => navigate('/profile')} className="glass-btn-secondary" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 800 }}>Profile</button>
              <button onClick={() => navigate('/instructor/settings')} className="glass-btn-secondary" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 800 }}>Settings</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, paddingLeft: '0.5rem', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>Impact <span className="text-gradient">Summary</span></h3>
            <StatCard label="Total Students" value={dashboardData.uniqueStudents} icon={<Users />} color="#f59e0b" isSidebar />
            <StatCard label="Total Enrollments" value={totalEnrollments} icon={<BookOpen />} color="#06b6d4" isSidebar />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, paddingLeft: '0.5rem', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>Catalog <span className="text-gradient">Status</span></h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.75rem 1.25rem', borderRadius: '1.5rem', textAlign: 'center', background: 'var(--card-bg)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Courses</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#6366f1' }}>{dashboardData.courses.length}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.75rem 1.25rem', borderRadius: '1.5rem', textAlign: 'center', background: 'var(--card-bg)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Published</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#10b981' }}>{dashboardData.courses.filter(c => c.isPublished || c.published).length}</div>
              </div>
            </div>
          </div>

          <div
            className="premium-card hover-lift transition-all-fast"
            style={{ padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', cursor: 'pointer', borderRadius: '1.75rem' }}
            onClick={() => navigate('/instructor/analytics')}
          >
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Deep Insights</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>View detailed performance analytics and revenue reports.</p>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--page-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Open Analytics <ExternalLink size={12} /></span>
          </div>

        </aside>

        <div className="learning-main-section" style={{ paddingTop: '1rem' }}>

          <div className="animate-slide-up" style={{ marginBottom: '6rem', position: 'relative' }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99, 102, 241, 0.08)', padding: '0.4rem 1.2rem', borderRadius: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <div style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', boxShadow: '0 0 10px #6366f1' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Teacher Dashboard</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
                  Your <span className="text-gradient">Teaching Hub</span>
                </h1>
                <p className="page-subtitle" style={{ fontSize: '1rem', maxWidth: '650px', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500, opacity: 0.9 }}>
                  Manage your courses easily. Our <span style={{ color: 'var(--page-primary)', fontWeight: 800 }}>EduLearn AI Tutor</span> is always online to help your students learn faster!
                </p>
              </div>
              <button onClick={() => navigate('/instructor/create-course')} className="glass-btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.15rem', fontWeight: 950, fontSize: '0.95rem', boxShadow: '0 12px 25px rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Plus size={20} strokeWidth={3} /> Create New Course
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Your <span className="text-gradient">Courses</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>Manage your active and draft courses here.</p>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '10rem 0', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: '60px', height: '60px', borderWidth: '5px' }}></div>
              <p style={{ marginTop: '2rem', fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>SYNCHRONIZING CATALOG...</p>
            </div>
          ) : dashboardData.courses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '10rem 2rem', textAlign: 'center', borderRadius: '2.5rem', border: '2px dashed var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3rem' }}>
                <BookOpen size={64} style={{ opacity: 0.2 }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.25rem' }}>No Courses Found</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '550px', margin: '0 auto 4rem', lineHeight: 1.6 }}>You haven't initiated any courses yet. Start your journey by creating your first educational module.</p>
              <button onClick={() => navigate('/instructor/create-course')} className="glass-btn-primary" style={{ padding: '1.5rem 4rem', borderRadius: '1.75rem', fontWeight: 900, fontSize: '1.2rem' }}>Launch First Course</button>
            </div>
          ) : (
            <div
              className="animate-slide-up"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}
            >
              {dashboardData.courses.map((course, idx) => (
                <CourseCard
                  key={course.courseId}
                  course={course}
                  enrollmentCount={dashboardData.enrollmentCounts[String(course.courseId)] || 0}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onViewStudents={handleViewStudents}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {selectedCourseForStudents && (
        <StudentRegistryModal
          course={selectedCourseForStudents}
          students={enrolledStudents}
          loading={loadingStudents}
          onClose={() => setSelectedCourseForStudents(null)}
        />
      )}

      <style>{`
        @media (max-width: 1200px) {
          .learning-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .learning-sidebar {
            position: static !important;
            order: -1;
            flex-direction: row !important;
            flex-wrap: wrap;
          }
          .learning-sidebar > * {
            flex: 1 1 350px;
          }
        }
      `}</style>
    </div>
  );
}


