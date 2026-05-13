import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  MessageSquare, 
  PlayCircle, 
  AlertCircle,
  RefreshCcw,
  Layers,
  MessageCircle,
  Play,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import discussionService from '../../services/discussionService';
import { getAuthUser } from '../../utils/auth';
const StatCard = ({ icon, label, value, color, isSidebar }) => (
  <div className="glass-panel hover-lift"
    style={{ 
      padding: isSidebar ? '1.25rem' : '1.5rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: isSidebar ? '1rem' : '1.5rem', 
      borderRadius: '1.25rem', 
      background: 'var(--card-bg)', 
      border: '1px solid var(--border-color)',
      width: '100%',
      transition: 'all 0.3s ease'
    }}
  >
    <div style={{ 
      width: isSidebar ? '56px' : '72px', 
      height: isSidebar ? '56px' : '72px', 
      borderRadius: '1.15rem', 
      background: `${color}10`, 
      color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: isSidebar ? '1.5rem' : '2rem', 
      border: `1px solid ${color}20`, 
      boxShadow: `0 10px 20px -5px ${color}20`,
      flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: isSidebar ? '0.65rem' : '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>{label}</div>
      <div style={{ fontSize: isSidebar ? '1.4rem' : '1.75rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  </div>
);

export default function InstructorDiscussions() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCourseId = Number(location.state?.courseId) || null;
  const user = getAuthUser();

  const [courses, setCourses] = useState([]);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [threadCountsByLesson, setThreadCountsByLesson] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInstructorCurriculum();
  }, []);

  const fetchInstructorCurriculum = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const instructorId = Number(user?.userId || user?.id);
      if (!instructorId) {
        if (import.meta.env.DEV) console.error("No instructor ID found in token");
        setError("You must be logged in as an instructor to view this page.");
        setCourses([]);
        setSelectedCourseId(null);
        return;
      }

      const coursesRes = await api.get(`/api/course/instructor/${instructorId}`);
      const myCourses = Array.isArray(coursesRes.data) ? coursesRes.data : 
                        (coursesRes.data?.data ? coursesRes.data.data : []);
      
      setCourses(myCourses);

      if (myCourses.length === 0) {
        setSelectedCourseId(null);
        return;
      }

      const fallbackCourseId = initialCourseId && myCourses.some(course => Number(course.courseId) === initialCourseId)
        ? initialCourseId
        : myCourses[0].courseId;
      setSelectedCourseId(fallbackCourseId);

      const lessonsEntries = await Promise.all(
        myCourses.map(async (course) => {
          try {
            const lessonsRes = await api.get(`/api/lesson/course/${course.courseId}`);
            const lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data :
                           (lessonsRes.data?.data ? lessonsRes.data.data : []);
            
            return [course.courseId, lessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))];
          } catch (error) {
            if (import.meta.env.DEV) console.warn(`Failed to load lessons for course ${course.courseId}`, error);
            return [course.courseId, []];
          }
        })
      );

      const lessonsMap = Object.fromEntries(lessonsEntries);
      setLessonsByCourse(lessonsMap);

      const courseIds = myCourses.map(course => course.courseId);
      if (courseIds.length > 0) {
        try {
          const threadsRes = await discussionService.getThreadsByCourses(courseIds);
          const fetchedThreads = discussionService.normalizeArray(threadsRes.data);
          
          const threadCounts = fetchedThreads.reduce((acc, thread) => {
            if (thread.lessonId) {
              acc[thread.lessonId] = (acc[thread.lessonId] || 0) + 1;
            }
            return acc;
          }, {});
          setThreadCountsByLesson(threadCounts);
        } catch (error) {
          if (import.meta.env.DEV) console.error('Failed to load discussion counts:', error);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Critical failure in fetchInstructorCurriculum:', error);
      setError("Failed to fetch course data. The server might be unreachable.");
      toast.error('Could not load your lesson discussions.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = useMemo(
    () => courses.find(course => Number(course.courseId) === Number(selectedCourseId)) || null,
    [courses, selectedCourseId]
  );

  const selectedLessons = selectedCourse ? (lessonsByCourse[selectedCourse.courseId] || []) : [];
  const totalLessons = courses.reduce((sum, course) => sum + (lessonsByCourse[course.courseId]?.length || 0), 0);
  const totalThreads = Object.values(threadCountsByLesson).reduce((sum, count) => sum + count, 0);

  const openLessonDiscussion = (courseId, lessonId) => {
    navigate(`/student/course/${courseId}/lessons`, {
      state: {
        initialLessonId: lessonId,
        initialTab: 'discussions',
        fromInstructorDiscussions: true
      }
    });
  };

  if (error) {
    return (
      <div className="main-content centered-message" style={{ padding: '10rem 2rem' }}>
        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '2rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Data Fetch Error</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>{error}</p>
        <button onClick={fetchInstructorCurriculum} className="glass-btn-primary" style={{ padding: '0.8rem 2rem' }}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '4rem', alignItems: 'start' }} className="learning-grid-layout">
        
        {/* Sidebar Section (Managed Section on Left) */}
        <aside className="learning-sidebar" style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>Managed <span className="text-gradient">Courses</span></h3>
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
              {courses.map(course => {
                const isActive = Number(selectedCourseId) === Number(course.courseId);
                return (
                  <button
                    key={course.courseId}
                    onClick={() => setSelectedCourseId(course.courseId)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '1rem',
                      background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      border: isActive ? '1px solid var(--page-primary)' : '1px solid transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--page-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{lessonsByCourse[course.courseId]?.length || 0} Modules</div>
                    </div>
                    {isActive && <ChevronRight size={14} color="var(--page-primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 950, paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>Engagement <span className="text-gradient">Pulse</span></h3>
            <StatCard icon={<MessageCircle />} label="Global Threads" value={Object.values(threadCountsByLesson).reduce((sum, c) => sum + (Number(c) || 0), 0)} color="#ec4899" isSidebar />
            <StatCard icon={<Activity />} label="Response Yield" value="94%" color="#6366f1" isSidebar />
          </div>

          <div 
            className="premium-card hover-lift" 
            style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))', cursor: 'pointer', borderRadius: '1.75rem', border: '1px solid rgba(16, 185, 129, 0.15)', transition: 'all 0.3s ease' }} 
            onClick={() => navigate('/instructor/analytics')}
          >
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950 }}>Yield Insights</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: '1.5rem', lineHeight: 1.5, fontWeight: 600 }}>Convert interactions into success stories by analyzing feedback trends.</p>
            <span style={{ fontSize: '0.8rem', fontWeight: 950, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Performance <Activity size={12} /></span>
          </div>

        </aside>

        {/* Main Content Section */}
        <div className="learning-main-section" style={{ paddingTop: '1rem' }}>
          
          <div className="animate-slide-up" style={{ marginBottom: '6rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-100px', left: '-50px', width: '300px', height: '300px', background: 'rgba(236, 72, 153, 0.04)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(236, 72, 153, 0.08)', padding: '0.4rem 1.25rem', borderRadius: '2.5rem', marginBottom: '1.5rem', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
              <div style={{ width: '10px', height: '10px', background: '#ec4899', borderRadius: '50%', boxShadow: '0 0 10px #ec4899' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 950, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Support Center</span>
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
                Student <span className="text-gradient">Discussions</span>
              </h1>
              <p className="page-subtitle" style={{ fontSize: '1.05rem', maxWidth: '700px', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500, opacity: 0.9 }}>
                Chat with your students and answer their questions. The <span style={{ color: 'var(--page-primary)', fontWeight: 800 }}>AI Tutor</span> is also helping them with basic queries!
              </p>
            </div>
          </div>

          {/* Discussion List */}
            {isLoading ? (
              <div key="loader" className="centered-message animate-fade-in" style={{ padding: '8rem 0' }}>
                <div className="loading-spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }}></div>
                <p style={{ marginTop: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading curriculum flow...</p>
              </div>
            ) : selectedLessons.length > 0 ? (
              <div key="list" className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                {selectedLessons.map((lesson, index) => {
                  const commentCount = threadCountsByLesson[lesson.lessonId] || 0;
                  return (
                    <div
                      key={lesson.lessonId}
                      className="premium-card animate-slide-up hover-lift"
                      onClick={() => openLessonDiscussion(selectedCourse.courseId, lesson.lessonId)}
                      style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 950,
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        border: '1px solid rgba(99, 102, 241, 0.15)'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--page-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module {index + 1}</span>
                          {commentCount > 0 && (
                            <span style={{ background: '#10b981', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontWeight: 900 }}>{commentCount} NEW</span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 950, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>{lesson.title}</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MessageCircle size={14} /> {commentCount} Interactions</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14} /> Active Discussion</span>
                        </div>
                      </div>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div key="empty" className="glass-panel animate-scale-in" style={{ padding: '8rem 2rem', textAlign: 'center', borderRadius: '2rem', border: '2px dashed var(--border-color)' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                  <MessageSquare size={56} style={{ opacity: 0.3 }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>No Conversations Found</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 3rem' }}>This course curriculum doesn't have any active student threads yet.</p>
                <button onClick={() => navigate('/instructor/courses')} className="glass-btn-primary" style={{ padding: '1.25rem 3.5rem', borderRadius: '1.5rem', fontWeight: 900, fontSize: '1.1rem' }}>Manage Curriculum</button>
              </div>
            )}
          {/* End of discussions section */}
        </div>

      </div>

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
            flex: 1 1 300px;
          }
        }
      `}</style>
    </div>
  );
}
