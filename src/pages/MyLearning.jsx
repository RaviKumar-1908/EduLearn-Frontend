import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import enrollmentService from '../services/enrollmentService';
import progressService from '../services/progressService';
import api from '../services/api';
import { Award, BookOpen, RefreshCcw, Activity, Download, Loader2, Play, Trophy, Clock, BarChart, Mail } from 'lucide-react';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { fetchCoursesByIds } from '../services/dashboardService';
import { useUser } from '../context/UserContext';



const extractPayload = (response, fallback) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data ?? fallback;
  return data ?? fallback;
};

const extractProgressValue = (response, fallback = 0) => {
  const value = extractPayload(response, fallback);
  return typeof value === 'number' ? value : Number(value) || fallback;
};

const deriveProgressPercent = (completedCount, totalLessons) => {
  if (!totalLessons) return 0;
  return Math.min(Math.round((completedCount / totalLessons) * 100), 100);
};

const isCertificateMissingError = (error) => error?.response?.status === 404;
const isCertificateAlreadyIssuedError = (error) => error?.response?.status === 409;

// Pure fetch function — returns data, no side effects
// Optimized fetch function — reduced API calls significantly
const fetchMyLearningData = async (studentId) => {
  const [enrollmentsRes, certsRes] = await Promise.all([
    enrollmentService.getStudentEnrollments(studentId),
    progressService.getAllCertificates(studentId).catch(() => ({ data: [] }))
  ]);

  const allData = extractPayload(enrollmentsRes, []);
  const allCertificates = extractPayload(certsRes, []);
  
  if (!Array.isArray(allData)) return { enrollments: [], courseData: {}, newlyIssuedCourseId: null };

  const filtered = allData
    .filter(enrollment => enrollment && enrollment.status?.toUpperCase() !== 'CANCELLED')
    .reduce((acc, current) => {
      if (!current?.courseId) return acc;
      const existing = acc.find(item => item.courseId === current.courseId);
      if (!existing) return acc.concat([current]);
      
      const status = current.status?.toUpperCase();
      if (status === 'ACTIVE' || status === 'COMPLETED') {
        return acc.filter(item => item.courseId !== current.courseId).concat([current]);
      }
      return acc;
    }, []);

  const courseIds = filtered.map(e => e.courseId);
  const courseMap = await fetchCoursesByIds(courseIds).catch(() => ({}));
  
  const certificateSet = new Set(allCertificates.map(c => Number(c.courseId)));
  const newlyIssuedCourseIds = [];

  const syncedEnrollments = filtered.map(enrollment => {
    const courseId = Number(enrollment.courseId);
    const hasCertificate = certificateSet.has(courseId);
    const progress = enrollment.progressPercent || 0;

    // Background issue certificate if 100% and not issued
    if (progress >= 100 && !hasCertificate) {
      const course = courseMap[courseId] || {};
      progressService.issueCertificate(
        studentId, courseId,
        course.title || `Course #${courseId}`,
        course.instructorName || 'LMS Instructor',
        course.level || 'Beginner',
        Number(course.totalDuration || 0)
      ).catch(() => {});
    }

    return {
      ...enrollment,
      certificateIssued: hasCertificate || !!enrollment.certificateIssued
    };
  });

  return {
    enrollments: syncedEnrollments,
    courseData: courseMap,
    newlyIssuedCourseId: null // No longer blocking UI for this
  };
};

export default function MyLearning() {
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const { user } = useUser();
  const studentId = user?.userId || user?.id;
  const navigate = useNavigate();

  const [activeCertificateAction, setActiveCertificateAction] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const { data, isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ['myLearningData', studentId],
    queryFn: () => fetchMyLearningData(studentId),
    enabled: !!studentId,
    staleTime: 300000,
  });

  const enrollments = data?.enrollments || [];
  const courseData = data?.courseData || {};

  // Handle certificate modal for newly issued certificates
  useEffect(() => {
    if (data?.newlyIssuedCourseId) {
      const issuedEnrollment = data.enrollments.find(e => e.courseId === data.newlyIssuedCourseId);
      if (issuedEnrollment) {
        setSelectedEnrollment(issuedEnrollment);
        setShowCertModal(true);
        toast.success('Certificate is ready. You can download it or send it to your email now.');
      }
    }
  }, [data?.newlyIssuedCourseId]);

  const handleResumeLearning = (courseId) => {
    navigate(`/student/course/${courseId}/lessons`);
  };

  const buildCertificatePayload = async (courseId) => {
    const course = courseData[courseId];
    const enrollment = enrollments.find(item => item.courseId === courseId);
    if (!course || !enrollment) throw new Error('Course or enrollment data is unavailable.');

    const certRes = await progressService.getCertificate(studentId, courseId);
    const certData = extractPayload(certRes, null);
    if (!certData) throw new Error('Certificate record not found.');

    return {
      certData,
      pdfData: {
        studentName: user?.fullName || user?.email || 'Valued Learner',
        courseName: certData.courseName || course.title,
        instructorName: certData.instructorName || course.instructorName || 'LMS Instructor',
        date: new Date(certData.issuedAt || Date.now()).toLocaleDateString(),
        level: certData.courseLevel || course.level || 'Beginner',
        duration: certData.courseDuration || course.totalDuration || '10',
        verificationCode: certData.verificationCode,
        enrolledDate: enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
        completedDate: enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : 'N/A'
      }
    };
  };

  const runCertificateAction = async (enrollment, action) => {
    if (!enrollment) return;
    const actionKey = action === 'email' ? `email-${enrollment.courseId}` :
      (action === 'issue' ? `issue-${enrollment.courseId}` : `download-${enrollment.courseId}`);

    setSelectedEnrollment(enrollment);
    setActiveCertificateAction(actionKey);
    if (showCertModal) setShowCertModal(false);

    if (action === 'issue') {
      try {
        const course = courseData[enrollment.courseId] || {};
        await progressService.issueCertificate(
          studentId, enrollment.courseId,
          course.title || `Course #${enrollment.courseId}`,
          course.instructorName || 'LMS Instructor',
          course.level || 'Beginner',
          Number(course.totalDuration || 0)
        ).catch(e => {
          if (isCertificateAlreadyIssuedError(e)) return;
          throw e;
        });
        toast.success('Certificate claimed successfully! You can now download it.');
        refetch();
        return;
      } catch (err) {
        console.error('Manual certificate issuance failed:', err);
        toast.error('Failed to claim certificate. Ensure you have 100% progress.');
        return;
      } finally {
        setActiveCertificateAction(null);
      }
    }

    try {
      const { certData, pdfData } = await buildCertificatePayload(enrollment.courseId);
      if (action === 'download') {
        await generateCertificatePDF(pdfData, true);
        toast.success('Certificate downloaded successfully!');
        return;
      }
      const { base64, filename } = await generateCertificatePDF(pdfData, false);
      await progressService.emailCertificate({
        to: user?.email,
        subject: `Your Certificate: ${certData.courseName || pdfData.courseName}`,
        templateName: 'certificate',
        templateModel: {
          userName: user?.fullName || user?.email || 'Learner',
          courseName: certData.courseName || pdfData.courseName
        },
        attachmentBase64: base64,
        attachmentName: filename
      });
      toast.success('Certificate has been sent to your email!');
    } catch (error) {
      console.error(`Certificate ${action} failed:`, error);
      toast.error(action === 'download' ? 'Failed to generate certificate PDF.' : 'Failed to send certificate to email.');
    } finally {
      setActiveCertificateAction(null);
    }
  };

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.status === 'Completed' || e.progressPercent >= 100).length;
  const totalCertificates = enrollments.filter(e => e.certificateIssued).length;
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0) / totalCourses)
    : 0;

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '4rem', alignItems: 'start' }} className="learning-grid-layout">
        
        {/* Sidebar Section */}
        <aside className="learning-sidebar" style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>Learning <span className="text-gradient">Metrics</span></h3>
            <StatCard icon={<BookOpen />} label="Total Enrolled" value={totalCourses} color="#6366f1" isSidebar />
            <StatCard icon={<Trophy />} label="Certified Mastery" value={completedCourses} color="#10b981" isSidebar />
            <StatCard icon={<Award />} label="Issued Credentials" value={totalCertificates} color="#f59e0b" isSidebar />
            <StatCard icon={<Activity />} label="Global Proficiency" value={`${avgProgress}%`} color="#ec4899" isSidebar />
          </div>

          <div className="premium-card hover-scale" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))', cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onClick={() => navigate('/courses')}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Expand Your Horizon</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.25rem' }}>New expert-led modules available in your field.</p>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--page-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Explore Catalog <Play size={10} fill="currentColor" /></span>
          </div>

        </aside>

        <div className="learning-main-section">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Your <span className="text-gradient">Mastery Vault</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '1rem' }}>Access your enrolled courses and certifications.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="glass-btn-secondary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Sync Progress
            </button>
          </div>

          {/* Content Loader */}
            {isError ? (
              <div className="glass-panel animate-fade-in" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '2rem', border: '1px solid #ef444433' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                   <Activity size={40} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Connection Interrupted</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We couldn't synchronize your learning progress. Please check your connection.</p>
                <button onClick={() => refetch()} className="glass-btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '1rem' }}>Retry Sync</button>
              </div>
            ) : loading ? (
              <div key="loader" className="centered-message animate-fade-in" style={{ padding: '8rem 0' }}>
                <div className="loading-spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }}></div>
                <p style={{ marginTop: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading your courses...</p>
              </div>
            ) : enrollments.length > 0 ? (
              <div key="grid" className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {enrollments.map((enrollment, idx) => {
                  const course = courseData[enrollment.courseId] || {};
                  const isCompleted = enrollment.status === 'Completed' || enrollment.progressPercent >= 100;
                  const isDownloading = activeCertificateAction === `download-${enrollment.courseId}`;
                  const isEmailing = activeCertificateAction === `email-${enrollment.courseId}`;

                  return (
                  <div
                      key={enrollment.courseId}
                      className="premium-card animate-slide-up hover-lift"
                      style={{ padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: isCompleted ? '2px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)', animationDelay: `${idx * 0.05}s`, transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease', willChange: 'transform' }}
                    >
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--page-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.category || 'General'}</span>
                          <h3 style={{ fontSize: '1rem', fontWeight: 950, margin: '0.2rem 0', color: 'var(--text-primary)', lineHeight: 1.2 }}>{course.title || 'Mastery Module'}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> {course.totalDuration || 0}m</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><BarChart size={12} /> {course.level || 'Expert'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Curriculum Alignment</span>
                          <span style={{ color: isCompleted ? '#10b981' : 'var(--page-primary)' }}>{enrollment.progressPercent}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div
                            style={{ height: '100%', background: isCompleted ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #ec4899)', borderRadius: '10px', width: `${enrollment.progressPercent}%`, transition: 'width 1s ease-out' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', alignItems: 'stretch' }}>
                        <button onClick={() => handleResumeLearning(enrollment.courseId)} className="glass-btn-primary hover-scale"
                          style={{ flex: 1, padding: '0.7rem 0.75rem', background: isCompleted ? 'rgba(255,255,255,0.03)' : 'var(--page-primary)', color: isCompleted ? 'var(--text-primary)' : 'white', borderRadius: '0.9rem', fontWeight: 900, fontSize: '0.8rem', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          {isCompleted ? <><RefreshCcw size={13} /> Review</> : <><Play size={13} fill="currentColor" /> Resume</>}
                        </button>

                        {isCompleted && !enrollment.certificateIssued && (
                          <button onClick={() => runCertificateAction(enrollment, 'issue')} disabled={Boolean(activeCertificateAction)} className="glass-btn-primary hover-scale"
                            style={{ flex: 1, padding: '0.7rem 0.75rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', borderRadius: '0.9rem', fontWeight: 900, fontSize: '0.8rem', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                          >
                            {activeCertificateAction === `issue-${enrollment.courseId}` ? <Loader2 className="animate-spin" size={13} /> : <Award size={13} />} Claim
                          </button>
                        )}

                        {isCompleted && enrollment.certificateIssued && (
                          <>
                            <button onClick={() => runCertificateAction(enrollment, 'download')} disabled={Boolean(activeCertificateAction)} className="glass-btn-primary hover-scale"
                              style={{ flex: 1, padding: '0.7rem 0.75rem', background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', border: 'none', borderRadius: '0.9rem', fontWeight: 900, fontSize: '0.8rem', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              {isDownloading ? <Loader2 className="animate-spin" size={13} /> : <Download size={13} />} Cert
                            </button>
                            <button onClick={() => runCertificateAction(enrollment, 'email')} disabled={Boolean(activeCertificateAction)} className="glass-btn-secondary hover-scale"
                              style={{ flex: 1, padding: '0.7rem 0.75rem', borderRadius: '0.9rem', fontWeight: 900, fontSize: '0.8rem', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              {isEmailing ? <Loader2 className="animate-spin" size={13} /> : <Mail size={13} />} Mail
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div key="empty" className="glass-panel animate-scale-in" style={{ padding: '8rem 2rem', textAlign: 'center', borderRadius: '2rem', border: '2px dashed var(--border-color)' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                  <BookOpen size={56} style={{ opacity: 0.3 }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>Knowledge Base Vacant</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 3rem' }}>Initiate your learning sequence by exploring our global mastery repository.</p>
                <button onClick={() => navigate('/courses')} className="glass-btn-primary" style={{ padding: '1.25rem 3.5rem', borderRadius: '1.5rem', fontWeight: 900, fontSize: '1.1rem' }}>Browse Global Catalog</button>
              </div>
            )}
        </div>

      </div>

      <div className="modal-container">
        {showCertModal && selectedEnrollment && (
          <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.8)' }}>
            <div className="glass-panel animate-scale-in"
              style={{ width: '100%', maxWidth: '480px', padding: '4rem', textAlign: 'center', borderRadius: '3rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', margin: '0 auto' }}
            >
              <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2rem', borderRadius: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
                  <Award size={64} color="#10b981" />
                </div>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Credential Achieved</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
                Your expertise in <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{courseData[selectedEnrollment.courseId]?.title}</span> has been formally validated.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <button onClick={() => runCertificateAction(selectedEnrollment, 'download')} disabled={Boolean(activeCertificateAction)} className="glass-btn-primary hover-scale"
                  style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 900, borderRadius: '1.5rem', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, #10b981, #059669)', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease' }}
                >
                  {activeCertificateAction === `download-${selectedEnrollment.courseId}` ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
                  Download Locally
                </button>
                <button onClick={() => runCertificateAction(selectedEnrollment, 'email')} disabled={Boolean(activeCertificateAction)} className="glass-btn-secondary hover-scale"
                  style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: '1.1rem', fontWeight: 900, borderRadius: '1.5rem', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease' }}
                >
                  {activeCertificateAction === `email-${selectedEnrollment.courseId}` ? <Loader2 className="animate-spin" size={22} /> : <Mail size={22} style={{ color: 'var(--page-primary)' }} />}
                  Send to Mail
                </button>
                <button onClick={() => setShowCertModal(false)} className="text-btn" style={{ marginTop: '1rem', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                  Return to Repository
                </button>
              </div>
            </div>
          </div>
        )}
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
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
      willChange: 'transform'
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
