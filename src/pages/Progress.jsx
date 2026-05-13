import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import enrollmentService from '../services/enrollmentService';
import progressService from '../services/progressService';
import api from '../services/api';
import { getAuthUser } from '../utils/auth';
// import { motion } from 'framer-motion';
import { Award, BookOpen, CheckCircle, RefreshCcw, Activity, Download, Loader2, Mail } from 'lucide-react';
import { generateCertificatePDF } from '../utils/certificateGenerator';

const extractPayload = (response, fallback) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data ?? fallback;
  return data ?? fallback;
};

const fetchCoursesByIds = async (courseIds) => {
  if (!courseIds.length) return {};
  const params = new URLSearchParams();
  courseIds.forEach(id => params.append('ids', id));
  const response = await api.get(`/api/course/bulk?${params.toString()}`);

  const courses = extractPayload(response, []);
  return Array.isArray(courses)
    ? courses.reduce((acc, course) => {
        acc[course.courseId] = course;
        return acc;
      }, {})
    : {};
};

export default function Progress() {
  const user = getAuthUser();
  const studentId = user?.userId || user?.id;
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [courseTitles, setCourseTitles] = useState({});
  const [courseData, setCourseData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(null);
  const [isIssuing, setIsIssuing] = useState(null);

  useEffect(() => {
    const sId = getAuthUser()?.userId;
    if (sId) {
      fetchEnrollments(sId);
    } else {
      setLoading(false);
    }
  }, []); // Only run once on mount

  const fetchEnrollments = async (sId) => {
    try {
      setLoading(true);
      const res = await enrollmentService.getStudentEnrollments(sId);
      const data = extractPayload(res, []);
      setEnrollments(data);
      
      const details = await fetchCoursesByIds(data.map((e) => e.courseId)).catch(() => ({}));
      const titles = data.reduce((acc, enrollment) => {
        acc[enrollment.courseId] = details[enrollment.courseId]?.title || `Course #${enrollment.courseId}`;
        return acc;
      }, {});
      setCourseTitles(titles);
      setCourseData(details);
    } catch (error) {
      toast.error("Could not load your progress at this time.");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeLearning = (courseId) => {
    navigate(`/student/course/${courseId}/lessons`);
  };

  const handleIssueCertificate = async (courseId) => {
    if (isIssuing === courseId) return;
    
    try {
       setIsIssuing(courseId);
       const course = courseData[courseId] || {};
       
       await progressService.issueCertificate(
         studentId, 
         courseId, 
         course.title, 
         course.instructorName || 'LMS Instructor', 
         course.level, 
         course.totalDuration
       );
       
       toast.success("📜 Certificate Issued successfully! You can now download it.");
       fetchEnrollments(studentId);
    } catch (error) {
       console.error("Issue error:", error);
       
       // Handle 409 Conflict specifically
       if (error.response?.status === 409) {
          toast.info("Certificate already generated for this course.");
          fetchEnrollments(studentId);
       } else {
          const errorMsg = error.response?.data?.message || "Could not issue certificate. Ensure you have completed the course.";
          toast.error(errorMsg);
       }
    } finally {
       setIsIssuing(null);
    }
  };

  const handleDownloadCertificate = async (courseId) => {
    try {
      setIsDownloading(courseId);
      const course = courseData[courseId] || {};
      const enrollment = enrollments.find(e => e.courseId === courseId);
      
      // 1. Get certificate details from progress service
      const certRes = await progressService.getCertificate(studentId, courseId);
      const certData = extractPayload(certRes, null);
      
      if (!certData) {
        toast.error("Certificate record not found.");
        return;
      }

      // 2. Trigger PDF Generation & Download
      await generateCertificatePDF({
        studentName: user.fullName || user.email,
        courseName: certData.courseName || course.title,
        instructorName: certData.instructorName || 'LMS Instructor',
        date: new Date(certData.issuedAt).toLocaleDateString(),
        level: certData.courseLevel || course.level || 'Beginner',
        duration: certData.courseDuration || course.totalDuration || '10',
        verificationCode: certData.verificationCode,
        enrolledDate: enrollment?.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
        completedDate: enrollment?.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : 'N/A'
      }, true);

      toast.success("✅ Certificate downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleEmailCertificate = async (courseId) => {
    try {
      setIsDownloading(`email-${courseId}`);
      const course = courseData[courseId] || {};
      const enrollment = enrollments.find(e => e.courseId === courseId);
      
      // 1. Get certificate details
      const certRes = await progressService.getCertificate(studentId, courseId);
      const certData = extractPayload(certRes, null);
      
      if (!certData) {
        toast.error("Certificate record not found.");
        return;
      }

      // 2. Generate PDF Base64
      const { base64, filename } = await generateCertificatePDF({
        studentName: user.fullName || user.email,
        courseName: certData.courseName || course.title,
        instructorName: certData.instructorName || 'LMS Instructor',
        date: new Date(certData.issuedAt).toLocaleDateString(),
        level: certData.courseLevel || course.level || 'Beginner',
        duration: certData.courseDuration || course.totalDuration || '10',
        verificationCode: certData.verificationCode,
        enrolledDate: enrollment?.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
        completedDate: enrollment?.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : 'N/A'
      }, false);

      // 3. Send to Backend
      await progressService.emailCertificate({
        to: user.email,
        subject: `Your Certificate: ${certData.courseName}`,
        templateName: 'certificate',
        templateModel: {
          userName: user.fullName || user.email,
          courseName: certData.courseName
        },
        attachmentBase64: base64,
        attachmentName: filename
      });

      toast.success("📧 Certificate has been sent to your email!");
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to email certificate. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="main-content">
      <header className="page-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="page-title">My Learning <span className="text-gradient">Progress</span></h1>
        <p className="page-subtitle">Track your achievements, complete courses, and earn certificates.</p>
      </header>

      {loading ? (
        <div className="centered-message">
          <div className="loading-spinner"></div>
          <p>Analyzing your learning journey...</p>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {enrollments.length > 0 ? enrollments.map(enrollment => (
            <div key={enrollment.enrollmentId} className="animate-slide-up" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--page-primary)' }}>
                      <BookOpen size={24} />
                   </div>
                   <div>
                     <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{courseTitles[enrollment.courseId] || `Course #${enrollment.courseId}`}</h3>
                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, marginTop: '0.3rem', fontWeight: 600 }}>
                       📅 Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                       {enrollment.completedAt && ` • ✅ Completed: ${new Date(enrollment.completedAt).toLocaleDateString()}`}
                     </p>
                   </div>
                </div>
                <span style={{
                  padding: '0.4rem 1rem', 
                  borderRadius: '2rem', 
                  fontSize: '0.75rem', 
                  background: enrollment.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  color: enrollment.status === 'Completed' ? '#10b981' : 'var(--page-primary)',
                  border: `1px solid ${enrollment.status === 'Completed' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {enrollment.status === 'Completed' ? <CheckCircle size={14} /> : <Activity size={14} />}
                  {enrollment.status}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>Learning Path Mastery</span>
                  <span>{enrollment.progressPercent}%</span>
                </div>
                <div style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', height: '10px', borderRadius: '9999px', overflow: 'hidden', padding: '1px' }}>
                  <div 
                    style={{
                      width: `${enrollment.progressPercent}%`, 
                      height: '100%', 
                      background: enrollment.status === 'Completed' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #818cf8, #6366f1)',
                      borderRadius: '9999px',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                 {enrollment.status !== 'Completed' && (
                   <button 
                     onClick={() => handleResumeLearning(enrollment.courseId)}
                     className="hover-lift" 
                     style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', background: 'var(--page-primary)', color: 'white', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
                   >
                     <RefreshCcw size={16} style={{ marginRight: '0.4rem' }} /> Resume Learning
                   </button>
                 )}
                 {enrollment.status === 'Completed' && !enrollment.certificateIssued && (
                   <button 
                     onClick={() => handleIssueCertificate(enrollment.courseId)}
                     className="hover-lift"
                     style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}
                     disabled={isIssuing === enrollment.courseId}
                   >
                     {isIssuing === enrollment.courseId ? (
                        <Loader2 size={16} className="animate-spin" />
                     ) : (
                        <><Award size={16} style={{ marginRight: '0.4rem' }} /> Claim Certificate</>
                     )}
                   </button>
                 )}
                 {enrollment.certificateIssued && (
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                      <button 
                        className="hover-lift"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                        onClick={() => handleDownloadCertificate(enrollment.courseId)}
                        disabled={isDownloading === enrollment.courseId}
                      >
                         {isDownloading === enrollment.courseId ? (
                           <Loader2 size={16} className="animate-spin" />
                         ) : (
                           <><Download size={16} style={{ marginRight: '0.4rem' }} /> Download PDF</>
                         )}
                      </button>
                      <button 
                        className="hover-lift"
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                        onClick={() => handleEmailCertificate(enrollment.courseId)}
                        disabled={isDownloading === `email-${enrollment.courseId}`}
                      >
                         {isDownloading === `email-${enrollment.courseId}` ? (
                           <Loader2 size={16} className="animate-spin" />
                         ) : (
                           <><Mail size={16} style={{ marginRight: '0.4rem', color: '#3b82f6' }} /> Send to Mail</>
                         )}
                      </button>
                    </div>
                 )}
              </div>
            </div>
          )) : (
            <div className="glass-panel animate-fade-in" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <BookOpen size={64} color="#475569" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', margin: '0 0 0.5rem 0' }}>No Active Learning Paths</h3>
              <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto 2rem auto' }}>You haven't started any courses yet. Explore our catalog to begin your journey!</p>
              <button onClick={() => window.location.href='/courses'} className="glass-btn-primary" style={{ padding: '0.8rem 2rem' }}>Browse Catalog</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
