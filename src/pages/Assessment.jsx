import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import assessmentService from '../services/assessmentService';
import enrollmentService from '../services/enrollmentService';
import { getAuthUser } from '../utils/auth';
import { extractLessonIdFromQuizTitle, isQuizVisibleToStudent } from '../utils/quiz';
// import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Target, Award, CheckCircle, XCircle, ChevronRight, List, BookOpen, Filter, ArrowLeft, Zap } from 'lucide-react';
import QuizPlayer from '../components/student/QuizPlayer';
import { fetchCoursesByIds } from '../services/dashboardService';

export default function Assessment() {
  const user = getAuthUser();
  const studentId = user?.userId || user?.id;
  const isInstructor = user?.role?.toUpperCase() === 'INSTRUCTOR';

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [view, setView] = useState('quizzes');

  // Query 1 — enrolled courses (cached, won't refetch on page revisit)
  const { data: enrolledCourses = [], isLoading: loading } = useQuery({
    queryKey: ['enrolledCourses', studentId],
    queryFn: async () => {
      const res = await enrollmentService.getStudentEnrollments(studentId);
      const enrollments = res.data || [];
      const courseMap = await fetchCoursesByIds(enrollments.map((enrollment) => enrollment.courseId));
      return Object.values(courseMap);
    },
    enabled: !!studentId,
    staleTime: 300000,
  });

  // Set first course as selected once loaded
  useEffect(() => {
    if (enrolledCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(enrolledCourses[0]);
    }
  }, [enrolledCourses]);

  // Query 2 — quizzes or attempts for selected course (cached per course + view)
  const { data: courseViewData = [], isLoading: dataLoading, refetch: refetchCourseData } = useQuery({
    queryKey: ['assessmentData', selectedCourse?.courseId, view],
    queryFn: async () => {
      if (view === 'quizzes') {
        const qRes = await assessmentService.getQuizzesByCourse(selectedCourse.courseId);
        return (qRes.data || [])
          .filter(isInstructor ? () => true : isQuizVisibleToStudent)
          .map(quiz => ({ ...quiz, isLive: true }));
      } else {
        const [res, qRes] = await Promise.all([
          assessmentService.getStudentAttempts(studentId),
          assessmentService.getQuizzesByCourse(selectedCourse.courseId)
        ]);
        const courseQuizIds = new Set((qRes.data || []).map(q => Number(q.quizId)));
        return (res.data || []).filter(a => courseQuizIds.has(Number(a.quizId)));
      }
    },
    enabled: !!selectedCourse?.courseId,
    staleTime: 60000,
  });

  const quizzes = view === 'quizzes' ? courseViewData : [];
  const attempts = view === 'attempts' ? courseViewData : [];

  const handleStartQuiz = (quiz) => setActiveQuiz(quiz);

  const masteryStats = {
    totalQuizzes: quizzes.length,
    passedQuizzes: attempts.filter(a => a.passed).length,
    avgScore: attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0,
    bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0
  };




  if (activeQuiz) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050a', padding: '4rem 2rem' }}>
        <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button onClick={() => setActiveQuiz(null)}
            className="hover-lift"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', fontWeight: 900, marginBottom: '3rem', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={18} /> EXIT QUIZ
          </button>
          <div className="glass-panel" style={{ padding: '4rem', borderRadius: '4rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <QuizPlayer quiz={activeQuiz} studentId={studentId} onComplete={() => { setActiveQuiz(null); refetchCourseData(); }} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05050a' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: '60px', height: '60px', margin: '0 auto 2rem auto' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 900, letterSpacing: '0.2em' }}>LOADING ASSESSMENTS...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '4rem 2rem' }}>
      <header style={{ maxWidth: '1400px', margin: '0 auto 4rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '30px', height: '4px', background: 'var(--page-primary)', borderRadius: '2px' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--page-primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Academy Hub</span>
          <div style={{ width: '30px', height: '4px', background: 'var(--page-primary)', borderRadius: '2px' }} />
        </div>
        <h1 className="animate-slide-up" style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
          Mastery <span style={{ color: 'var(--page-primary)' }}>Vault</span>
        </h1>
        <p className="animate-slide-up" style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 600, animationDelay: '0.1s' }}>Validate your skills and track your academic journey.</p>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '4rem' }}>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 950, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.5 }}>
              <BookOpen size={16} /> MY COURSES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {enrolledCourses.map(course => {
                const isActive = selectedCourse?.courseId === course.courseId;
                return (
                  <button key={course.courseId} onClick={() => setSelectedCourse(course)}
                    className={isActive ? '' : 'hover-lift'}
                    style={{ padding: '1.25rem 2rem', borderRadius: '1.5rem', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: isActive ? 'white' : 'var(--text-primary)', transition: 'all 0.3s ease' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '1rem', background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={18} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{course.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main>
          {!selectedCourse ? (
            <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '1rem', opacity: 0.5, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <Filter size={48} color="var(--text-secondary)" style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Select a Course</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Choose a course to view your assessments.</p>
            </div>
          ) : (
            <div className="animate-fade-in" key={selectedCourse.courseId}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '3rem' }}>
                <StatCard icon={<FileText size={20} />} label="Available" value={masteryStats.totalQuizzes} color="#6366f1" />
                <StatCard icon={<CheckCircle size={20} />} label="Completed" value={masteryStats.passedQuizzes} color="#10b981" />
                <StatCard icon={<Target size={20} />} label="Avg Score" value={`${masteryStats.avgScore}%`} color="#f59e0b" />
                <StatCard icon={<Award size={20} />} label="Best" value={`${masteryStats.bestScore}%`} color="#ec4899" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 950, margin: 0 }}>{selectedCourse.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem', fontWeight: 600 }}>Curriculum validation portal</p>
                </div>
                <div style={{ display: 'flex', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                  {['quizzes', 'attempts'].map(tab => (
                    <button key={tab} onClick={() => setView(tab)}
                      className={view === tab ? '' : 'hover-lift'}
                      style={{ padding: '1rem 2rem', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', background: view === tab ? 'var(--page-primary)' : 'transparent', color: view === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.3s ease' }}
                    >
                      {tab === 'quizzes' ? 'Assessments' : 'History'}
                    </button>
                  ))}
                </div>
              </div>

              {dataLoading ? (
                <div style={{ padding: '10rem 0', textAlign: 'center' }}>
                  <div className="animate-pulse" style={{ color: 'var(--page-primary)', textAlign: 'center' }}><Zap size={48} /></div>
                </div>
              ) : (
                view === 'quizzes' ? (
                  <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {quizzes.length > 0 ? quizzes.map((quiz) => (
                      <div key={quiz.quizId} className="hover-lift" style={{ borderRadius: '0.85rem', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--border-color)', position: 'relative', boxShadow: '0 15px 30px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }}>
                        <div style={{ padding: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--page-primary)' }}>
                              <FileText size={28} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 950, background: 'var(--input-bg)', padding: '0.6rem 1.2rem', borderRadius: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                              {extractLessonIdFromQuizTitle(quiz.title) ? 'Lesson Quiz' : 'Final Exam'}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 950, marginBottom: '0.75rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{quiz.title.replace(/\[L-\d+\]/g, '').trim()}</h3>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', height: '3rem', overflow: 'hidden' }}>{quiz.description || 'Test your knowledge with this quiz.'}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div style={{ background: 'var(--input-bg)', padding: '1.25rem', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '0.5rem', opacity: 0.5 }}>DURATION</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{quiz.timeLimitMinutes}m</div>
                            </div>
                            <div style={{ background: 'var(--input-bg)', padding: '1.25rem', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-secondary)', marginBottom: '0.5rem', opacity: 0.5 }}>THRESHOLD</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{quiz.passingScore}%</div>
                            </div>
                          </div>
                          <button onClick={() => handleStartQuiz(quiz)}
                            className="hover-scale"
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.85rem', fontWeight: 950, fontSize: '0.85rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
                          >
                            START ASSESSMENT
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', opacity: 0.3 }}>
                        <p style={{ fontWeight: 900, letterSpacing: '0.1em' }}>NO QUIZZES AVAILABLE YET</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {attempts.length > 0 ? attempts.map((attempt) => (
                      <div key={attempt.attemptId} className="hover-lift"
                        style={{ padding: '1rem 1.5rem', borderRadius: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 5px 10px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: attempt.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: attempt.passed ? '#10b981' : '#ef4444', border: `1px solid ${attempt.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                            {attempt.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 950 }}>Attempt #{attempt.attemptId.toString().padStart(3, '0')}</h4>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 800 }}>
                              {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Unknown Date'}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 950, color: attempt.passed ? '#10b981' : '#ef4444', lineHeight: 1 }}>{attempt.score}%</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 950, color: attempt.passed ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>{attempt.passed ? 'PASSED' : 'FAILED'}</div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '6rem 2rem', textAlign: 'center', opacity: 0.3 }}>
                        <Award size={48} style={{ marginBottom: '1.5rem' }} />
                        <p style={{ fontWeight: 900, letterSpacing: '0.1em' }}>NO HISTORY FOUND</p>
                      </div>
                    )}
                  </div>
                )
                /* End of view data */
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-panel animate-slide-up hover-lift"
    style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '200px', border: `1px solid ${color}30`, background: `linear-gradient(135deg, var(--card-bg) 0%, ${color}05 100%)`, transition: 'all 0.3s ease' }}
  >
    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  </div>
);
