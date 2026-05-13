import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PlayCircle, CheckCircle, Video, Download, Info, HelpCircle,
  Zap, ChevronLeft, Lock, Award, Mail, Loader2, Edit, Bot,
  MessageSquareText, FileText, Layout, ChevronRight, Play,
  Settings, User, GraduationCap, ArrowRight, BookOpen,
  AlertCircle, Sparkles, CheckSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import assessmentService from '../services/assessmentService';
import enrollmentService from '../services/enrollmentService';
import QuizPlayer from '../components/student/QuizPlayer';
import LessonDiscussions from '../components/common/LessonDiscussions';
import progressService from '../services/progressService';
import { getAuthUser } from '../utils/auth';
import { findQuizForLesson, isQuizVisibleToStudent } from '../utils/quiz';
import { useTheme } from '../context/ThemeContext';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import AiTutor from '../components/AiTutor/AiTutor';
import '../styles/pages/Lessons.css';

// --- Memoized Components for Performance ---
const TabButton = React.memo(({ tab, activeTab, onClick }) => (
  <button
    onClick={() => onClick(tab.id)}
    className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.special ? 'ai-special' : ''} ${tab.locked ? 'tab-locked' : ''}`}
  >
    <span className="tab-icon">{tab.icon}</span>
    <span className="tab-label">{tab.label}</span>
    {tab.locked && <Lock size={10} className="lock-icon" />}
    {tab.special && <div className="ai-glow" />}
  </button>
));

const CurriculumItem = React.memo(({ lesson, idx, isActive, isCompleted, isLocked, onClick }) => (
  <div
    onClick={() => !isLocked && onClick(lesson)}
    className={`lesson-card ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-done' : ''} ${isLocked ? 'is-locked-card' : ''} animate-slide-up`}
    style={{ animationDelay: `${idx * 0.02}s` }}
  >
    <div className="lesson-card-left">
      <div className="status-indicator">
        {isCompleted ? <CheckCircle size={16} /> : <div className="lesson-number">{(idx + 1).toString().padStart(2, '0')}</div>}
      </div>
    </div>
    <div className="lesson-card-main">
      <div className="lesson-meta-row">
        <span className="lesson-meta">MODULE {idx + 1}</span>
        {isLocked && <Lock size={12} className="meta-lock" />}
      </div>
      <h4 className="lesson-title-side">{lesson.title}</h4>
      <div className="lesson-tags">
        {lesson.preview && <span className="preview-tag">FREE PREVIEW</span>}
        {isCompleted && <span className="completed-tag">COMPLETED</span>}
      </div>
    </div>
    <div className="lesson-card-right">
      {isActive ? <Play size={14} className="play-pulse" /> : <ChevronRight size={14} />}
    </div>
    {isActive && <div className="active-glow" />}
  </div>
));

// STABLE YOUTUBE PLAYER: Prevents remounting/re-initialization on parent rerenders
const MemoizedVideoPlayer = React.memo(({ videoUrl, title }) => {
  const embedUrl = useMemo(() => {
    if (!videoUrl) return null;
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const match = videoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
    }
    return videoUrl;
  }, [videoUrl]);

  if (!embedUrl) return null;

  return (
    <iframe 
      src={embedUrl} 
      title={title || 'Lesson Video'} 
      frameBorder="0" 
      allowFullScreen 
      className="lesson-iframe" 
    />
  );
}, (prev, next) => prev.videoUrl === next.videoUrl && prev.title === next.title);

// MEMOIZED SIDEBAR: Prevents huge list re-renders
const CurriculumSidebar = React.memo(({ 
  courseProgress, 
  completedCount, 
  totalCount, 
  lessons, 
  currentLessonId, 
  completedLessonIds, 
  isEnrolled, 
  isInstructor, 
  isAdmin, 
  onLessonSelect 
}) => {
  return (
    <aside className="curriculum-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-stats">
          <div className="progress-ring-mini">
            <svg viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${courseProgress}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            </svg>
            <span className="progress-value">{courseProgress}%</span>
          </div>
          <h3>Curriculum</h3>
        </div>
        <div className="completion-count">{completedCount} / {totalCount} Modules Finished</div>
      </div>

      <div className="lesson-scroll-container custom-scrollbar">
        {lessons.map((lesson, idx) => (
          <CurriculumItem
            key={lesson.lessonId}
            lesson={lesson}
            idx={idx}
            isActive={currentLessonId === lesson.lessonId}
            isCompleted={completedLessonIds.has(lesson.lessonId)}
            isLocked={!isEnrolled && !lesson.preview && !isInstructor && !isAdmin}
            onClick={onLessonSelect}
          />
        ))}
      </div>
    </aside>
  );
});

const extractPayload = (response, fallback) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data ?? fallback;
  return data ?? fallback;
};

const deriveProgressFromCompletedLessons = (completedCount, totalLessons) => {
  if (!totalLessons) return 0;
  return Math.min(Math.round((completedCount / totalLessons) * 100), 100);
};

export default function Lessons() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const userId = user?.userId || user?.id;
  const isInstructor = user?.role?.toUpperCase() === 'INSTRUCTOR';
  const navState = location.state;
  const { isDarkMode } = useTheme();

  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('Course Content');
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [isEnrolled, setIsEnrolled] = useState(navState?.enrolled || false);
  const [enrollmentCheckDone, setEnrollmentCheckDone] = useState(!!navState?.enrolled);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [passedQuizIds, setPassedQuizIds] = useState(new Set());
  const [instructorId, setInstructorId] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const [certificateIssued, setCertificateIssued] = useState(false);
  const [isProcessingCert, setIsProcessingCert] = useState(false);
  const [courseLevel, setCourseLevel] = useState('Beginner');
  const [courseDuration, setCourseDuration] = useState(0);
  const [enrolledAt, setEnrolledAt] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  const isOwner = instructorId && Number(userId) === Number(instructorId);

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const sId = user?.userId || user?.id;

      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/api/course/${courseId}`).catch(() => null),
        api.get(`/api/lesson/course/${courseId}`).catch(() => ({ data: [] }))
      ]);

      if (!courseRes) {
        toast.error("Course not found.");
        navigate('/courses');
        return;
      }

      const courseData = courseRes.data;
      setCourseTitle(courseData.title);
      setCoursePrice(courseData.price || 0);
      setInstructorId(courseData.instructorId);
      setCourseLevel(courseData.level || 'Beginner');
      setCourseDuration(courseData.totalDuration || 0);

      const allLessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
      const filteredLessons = allLessons
        .filter(l => isInstructor || l.published)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setLessons(filteredLessons);

      if (sId) {
        enrollmentService.checkEnrollment(sId, courseId).then(res => {
          const isEnrolledVal = (res.data === true || (typeof res.data === 'object' && res.data.enrolledAt)) ||
            (courseData.instructorId && Number(sId) === Number(courseData.instructorId)) ||
            (user?.role?.toUpperCase() === 'ADMIN');

          setIsEnrolled(isEnrolledVal);
          if (res.data && typeof res.data === 'object') {
            setEnrolledAt(res.data.enrolledAt);
            setCompletedAt(res.data.completedAt);
            setCertificateIssued(Boolean(res.data.certificateIssued));
          }
          setEnrollmentCheckDone(true);

          if (isEnrolledVal) {
            Promise.all([
              assessmentService.getQuizzesByCourse(courseId).catch(() => ({ data: [] })),
              progressService.getAllStudentProgress(sId).catch(() => ({ data: { data: [] } })),
              assessmentService.getStudentAttempts(sId).catch(() => ({ data: [] }))
            ]).then(([qRes, pRes, attemptsRes]) => {
              const fetchedQuizzes = Array.isArray(qRes.data) ? qRes.data : [];
              setQuizzes(isInstructor ? fetchedQuizzes : fetchedQuizzes.filter(isQuizVisibleToStudent));

              const progressList = extractPayload(pRes, []);
              const completedSet = new Set(
                progressList
                  .filter(p => Number(p.courseId) === Number(courseId) && (p.completed || p.isCompleted))
                  .map(p => Number(p.lessonId))
              );
              setCompletedLessonIds(completedSet);
              setPassedQuizIds(new Set((attemptsRes.data || []).filter(a => a.passed).map(a => a.quizId)));
              setCourseProgress(deriveProgressFromCompletedLessons(completedSet.size, filteredLessons.length));
            });
          }
        });
      }

      if (courseData.instructorId) {
        api.get(`/auth/profile/${courseData.instructorId}`).then(res => setInstructor(res.data)).catch(() => null);
      }

      // Selection logic
      if (lessonId) {
        const target = filteredLessons.find(l => l.lessonId === Number(lessonId));
        if (target) setCurrentLesson(target);
      } else if (filteredLessons.length > 0) {
        const initialId = navState?.initialLessonId;
        const target = initialId ? filteredLessons.find(l => l.lessonId === Number(initialId)) : filteredLessons[0];
        setCurrentLesson(target);
      }

    } catch (err) {
      console.error("Fetch Curriculum Error:", err);
      toast.error("Failed to load course content.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, userId, isInstructor, navigate, navState?.initialLessonId, lessonId, user]);

  const isAccessBlocked = useMemo(() => {
    if (isLoading) return false;
    if (isInstructor) return false;
    if (user?.role?.toUpperCase() === 'ADMIN') return false;
    if (!currentLesson) return false;
    if (currentLesson.preview) return false;
    return !isEnrolled;
  }, [isLoading, isInstructor, user?.role, currentLesson, isEnrolled]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    const syncQuiz = async () => {
      if (currentLesson?.lessonId && quizzes.length > 0) {
        const lessonQuiz = findQuizForLesson(quizzes, currentLesson);
        setHasQuiz(!!lessonQuiz);
        if (lessonQuiz && !lessonQuiz.questions) {
          try {
            const qRes = await assessmentService.getQuestions(lessonQuiz.quizId);
            lessonQuiz.questions = qRes.data;
          } catch (err) { console.error(err); }
        }
        setActiveQuiz(lessonQuiz ? { ...lessonQuiz } : null);
      } else {
        setActiveQuiz(null);
        setHasQuiz(false);
      }
      setShowQuiz(false);
    };
    syncQuiz();
    if (navState?.initialTab) setActiveTab(navState.initialTab);
  }, [currentLesson, quizzes, navState?.initialTab]);

  useEffect(() => {
    if (!userId || !currentLesson || !isEnrolled || isInstructor) return;
    const intervalId = setInterval(() => {
      progressService.trackProgress(userId, courseId, currentLesson.lessonId, 30).catch(() => null);
    }, 30000);
    return () => clearInterval(intervalId);
  }, [userId, currentLesson, isEnrolled, isInstructor, courseId]);

  const handleMarkComplete = async () => {
    if (!userId || !lessons.length || !isEnrolled) return;
    const lid = currentLesson?.lessonId;
    if (!lid || completedLessonIds.has(lid)) return;

    // 1. Optimistic Updates
    const previousCompletedIds = new Set(completedLessonIds);
    const previousProgress = courseProgress;

    const nextCompletedSet = new Set([...completedLessonIds, lid]);
    const nextProgress = deriveProgressFromCompletedLessons(nextCompletedSet.size, lessons.length);

    setCompletedLessonIds(nextCompletedSet);
    setCourseProgress(nextProgress);

    // Move to next lesson immediately for better flow
    const idx = lessons.findIndex(l => l.lessonId === lid);
    if (idx < lessons.length - 1) {
      setCurrentLesson(lessons[idx + 1]);
    } else if (nextProgress === 100) {
      // Don't call claim cert optimistically as it's a heavy operation, but show feedback
      toast.info("Course mastery achieved!");
    }

    toast.success("Progress synchronized!");

    try {
      await progressService.markLessonComplete(userId, courseId, lid);
      enrollmentService.updateProgress(userId, courseId, nextProgress).catch(() => null);

      if (nextProgress === 100 && !certificateIssued) {
        handleClaimCertificate();
      }
    } catch (err) {
      // 2. Rollback on failure
      setCompletedLessonIds(previousCompletedIds);
      setCourseProgress(previousProgress);
      toast.error("Telemetry sync failed. Progress reverted.");
    }
  };

  const handleClaimCertificate = async () => {
    if (!userId || !courseId || courseProgress < 99 || isProcessingCert) return;
    setIsProcessingCert(true);
    try {
      await progressService.issueCertificate(userId, courseId, courseTitle, instructor?.fullName || 'LMS Instructor', courseLevel, courseDuration);
      setCertificateIssued(true);
      toast.success("📜 Certificate Issued!");
    } catch (err) {
      if (err.response?.status === 409) setCertificateIssued(true);
      else toast.error("Failed to issue certificate.");
    } finally { setIsProcessingCert(false); }
  };

  const handleDownloadCertificate = async () => {
    setIsProcessingCert(true);
    try {
      const res = await progressService.getCertificate(userId, courseId);
      const data = extractPayload(res, null);
      if (data) await generateCertificatePDF({
        studentName: user.fullName || user.email,
        courseName: data.courseName || courseTitle,
        instructorName: data.instructorName || 'LMS Instructor',
        date: new Date(data.issuedAt).toLocaleDateString(),
        level: data.courseLevel || courseLevel,
        duration: data.courseDuration || courseDuration,
        verificationCode: data.verificationCode,
        enrolledDate: enrolledAt ? new Date(enrolledAt).toLocaleDateString() : 'N/A',
        completedDate: completedAt ? new Date(completedAt).toLocaleDateString() : new Date().toLocaleDateString()
      }, true);
    } catch { toast.error("Download failed."); }
    finally { setIsProcessingCert(false); }
  };

  if (isLoading) {
    return (
      <div className="learning-loading-screen">
        <div className="loader-box">
          <Loader2 className="animate-spin" size={48} color="#6366f1" />
          <p>Syncing Knowledge Base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`learning-experience animate-route-fade ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* HEADER SECTION */}
      <div className="learning-header glass-header">
        <div className="header-left">
          <button
            onClick={() => navigate(-1)}
            className="back-btn-circular hover-lift"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="course-breadcrumb">
            <div className="breadcrumb-icon"><GraduationCap size={18} /></div>
            <div className="breadcrumb-text">
              <span className="course-name-tag">{courseTitle}</span>
              <h1 className="lesson-nav-title">
                {currentLesson?.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="lesson-stats">
            <div className="stat-item">
              <span className="stat-label">MODULE</span>
              <span className="stat-value">{(lessons.findIndex(l => l.lessonId === currentLesson?.lessonId) + 1).toString().padStart(2, '0')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">TOTAL</span>
              <span className="stat-value">{lessons.length.toString().padStart(2, '0')}</span>
            </div>
          </div>

          {isOwner && (
            <button onClick={() => navigate(`/instructor/course/${courseId}/curriculum`)} className="glass-btn-primary manage-btn">
              <Edit size={14} /> <span>MANAGE</span>
            </button>
          )}
        </div>
      </div>

      <div className="learning-main-grid">
        {/* PLAYER SECTION */}
        <main className="content-viewport">
          {currentLesson ? (
            <div className="content-container animate-slide-up">
              <div className="player-outer-wrapper glass-panel shadow-premium">
                <div className="video-player-container">
                  {isAccessBlocked ? (
                    <div className="premium-lock-screen">
                      <div className="lock-visual-stack">
                        <div className="lock-circle-bg">
                          <Lock size={48} className="lock-main-icon" />
                        </div>
                        <div className="lock-pulse-ring" />
                        <div className="lock-pulse-ring delay-1" />
                      </div>

                      <div className="lock-content">
                        <span className="premium-badge">PREMIUM MODULE</span>
                        <h2>Enroll to Unlock Knowledge</h2>
                        <p>This module is part of the premium curriculum. Join the course to access high-quality videos, quizzes, and certificates.</p>

                        <div className="enroll-actions">
                          <button
                            onClick={() => navigate(`/course/${courseId}`)}
                            className="primary-enroll-btn"
                          >
                            <Sparkles size={18} />
                            <span>VIEW ENROLLMENT OPTIONS</span>
                          </button>
                          <button
                            onClick={() => {
                              const previewLesson = lessons.find(l => l.preview);
                              if (previewLesson) setCurrentLesson(previewLesson);
                              else toast.info("No preview modules available for this course.");
                            }}
                            className="secondary-preview-btn"
                          >
                            TRY A FREE PREVIEW
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : currentLesson.videoUrl ? (
                    <MemoizedVideoPlayer videoUrl={currentLesson.videoUrl} title={currentLesson.title} />
                  ) : (
                    <div className="no-video-fallback">
                      <div className="fallback-ring"><Video size={40} /></div>
                      <h3>Visual Content Pending</h3>
                      <p>The instructor has not uploaded a video for this module yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TABS NAVIGATION */}
              <div className="experience-tabs glass-panel">
                <nav className="tabs-nav">
                  {[
                    { id: 'video', label: 'Overview', icon: <Play size={16} /> },
                    { id: 'notes', label: 'Curriculum', icon: <FileText size={16} /> },
                    { id: 'assessment', label: 'Quiz', icon: <CheckSquare size={16} /> },
                    { id: 'discussions', label: 'Community', icon: <MessageSquareText size={16} /> },
                    { id: 'ai tutor', label: 'AI Tutor', icon: <Bot size={16} />, special: true },
                    { id: 'certificate', label: 'Achievement', icon: <Award size={16} />, locked: courseProgress < 100 }
                  ].map((tab) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      activeTab={activeTab}
                      onClick={setActiveTab}
                    />
                  ))}
                </nav>

                <div className="tab-content-viewport">
                  <div className="tab-content-inner animate-route-fade" key={activeTab}>
                    {activeTab === 'video' && (
                      <div className="overview-tab">
                        <div className="content-header-row">
                          <h2 className="content-h2">{currentLesson.title}</h2>
                          {isEnrolled && !isInstructor && (
                            <button
                              onClick={handleMarkComplete}
                              disabled={completedLessonIds.has(currentLesson.lessonId)}
                              className={`completion-btn ${completedLessonIds.has(currentLesson.lessonId) ? 'is-complete' : ''}`}
                            >
                              {completedLessonIds.has(currentLesson.lessonId) ? (
                                <><CheckCircle size={18} /> <span>COMPLETED</span></>
                              ) : (
                                <><Zap size={18} /> <span>MARK AS FINISHED</span></>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="content-divider" />
                        <div className="description-rich-text">
                          {currentLesson.description || "Detailed overview coming soon..."}
                        </div>

                        <div className="instructor-card-mini">
                          <div className="instructor-info">
                            <div className="instructor-avatar-ring">
                              {instructor?.profilePicUrl ? <img src={instructor.profilePicUrl} alt="" /> : <User />}
                            </div>
                            <div className="instructor-details">
                              <span className="taught-by">PUBLISHED BY</span>
                              <span className="instructor-name">{instructor?.fullName || "EduLearn Faculty"}</span>
                            </div>
                          </div>
                          <div className="course-badges">
                            <div className="badge"><Sparkles size={12} /> {courseLevel}</div>
                            <div className="badge"><Layout size={12} /> Module {lessons.findIndex(l => l.lessonId === currentLesson.lessonId) + 1}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'notes' && (
                      <div className="notes-tab scroll-area">
                        <div className="section-intro">
                          <FileText size={24} className="accent-icon" />
                          <h3>Study Material & Curriculum</h3>
                        </div>
                        <div className="study-content-box">
                          {currentLesson.description || "No specific study materials attached to this module."}
                        </div>
                      </div>
                    )}

                    {activeTab === 'assessment' && (
                      <div className="assessment-tab">
                        {activeQuiz ? (
                          <QuizPlayer quiz={activeQuiz} studentId={userId} onComplete={(res) => res.passed && handleMarkComplete()} />
                        ) : (
                          <div className="empty-assessment-state glass-card">
                            <div className="empty-icon-ring"><AlertCircle size={40} /></div>
                            <h3>Assessment Not Configured</h3>
                            <p>This module focuses on conceptual understanding. No evaluation is required for completion.</p>
                            <button onClick={() => setActiveTab('video')} className="return-btn">Return to Module <ArrowRight size={16} /></button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'certificate' && (
                      <div className="certificate-tab">
                        {courseProgress < 100 ? (
                          <div className="locked-certificate-state">
                            <div className="locked-icon-box"><Lock size={48} /></div>
                            <h2>Credential Locked</h2>
                            <p>You have completed <strong>{courseProgress}%</strong> of the curriculum. Finalize all modules and quizzes to unlock your verified certificate.</p>
                            <div className="progress-mini-track">
                              <div className="progress-mini-fill" style={{ width: `${courseProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="unlocked-certificate-state">
                            <div className="award-icon-box"><Award size={64} className="pulse-award" /></div>
                            <h2>Certification Ready!</h2>
                            <p>Congratulations! You have mastered the curriculum of <strong>{courseTitle}</strong>. Your achievement is now verified.</p>
                            <button
                              onClick={certificateIssued ? handleDownloadCertificate : handleClaimCertificate}
                              className="claim-btn-premium"
                              disabled={isProcessingCert}
                            >
                              {isProcessingCert ? <Loader2 className="animate-spin" /> : (certificateIssued ? 'DOWNLOAD VERIFIED PDF' : 'CLAIM ACHIEVEMENT')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ai tutor' && (
                      <div className="ai-tutor-tab-wrapper">
                        {isAccessBlocked ? (
                          <div className="tab-lock-fallback">
                            <Bot size={32} />
                            <h3>AI Assistant Locked</h3>
                            <p>Enroll in the course to interact with our advanced AI Tutor for this lesson.</p>
                          </div>
                        ) : (
                          <AiTutor lessonId={currentLesson.lessonId} />
                        )}
                      </div>
                    )}

                    {activeTab === 'discussions' && (
                      <div className="discussions-tab-wrapper">
                        {isAccessBlocked ? (
                          <div className="tab-lock-fallback">
                            <MessageSquareText size={32} />
                            <h3>Community Access Restricted</h3>
                            <p>Join the student community to participate in module discussions.</p>
                          </div>
                        ) : (
                          <LessonDiscussions
                            lessonId={currentLesson.lessonId}
                            courseId={courseId}
                            instructorId={instructorId}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-state">
              <div className="no-selection-box">
                <PlayCircle size={64} className="faint-icon" />
                <h2>Select a Module</h2>
                <p>Choose a lesson from the sidebar to begin your learning journey.</p>
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR NAVIGATION */}
        <CurriculumSidebar
          courseProgress={courseProgress}
          completedCount={completedLessonIds.size}
          totalCount={lessons.length}
          lessons={lessons}
          currentLessonId={currentLesson?.lessonId}
          completedLessonIds={completedLessonIds}
          isEnrolled={isEnrolled}
          isInstructor={isInstructor}
          isAdmin={user?.role === 'ADMIN'}
          onLessonSelect={setCurrentLesson}
        />
      </div>
    </div>
  );
}
