import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { ICONS } from '../design/iconMap';
import '../styles/pages/Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const userId = user?.userId;

  const { dashboard, isLoading } = useDashboardData(userId);
  
  const dashboardData = {
    ...dashboard,
    fullName: profile?.fullName || user?.fullName || 'Learner',
    profilePicUrl: profile?.profilePicUrl || user?.profilePicUrl,
  };

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 6rem' }}>

      <div
        className="dashboard-header-container animate-slide-up"
        style={{ marginBottom: '3rem', position: 'relative', padding: '2rem 0' }}
      >
        <div className="profile-greeting-wrapper">
          <div
            className="hover-scale transition-all-fast"
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/student/profile')}
          >
            <div style={{ position: 'absolute', inset: '-2px', background: 'var(--page-primary)', borderRadius: '1rem', opacity: 0.2 }} />
            {dashboardData.profilePicUrl ? (
              <img src={dashboardData.profilePicUrl} alt="Profile" loading="lazy" style={{ width: '110px', height: '110px', borderRadius: '1rem', objectFit: 'cover', border: '3px solid var(--glass-border)', position: 'relative', zIndex: 1 }} />
            ) : (
              <div style={{ width: '110px', height: '110px', borderRadius: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 950, color: 'var(--page-primary)', position: 'relative', zIndex: 1 }}>
                {dashboardData.fullName?.charAt(0)?.toUpperCase() || 'L'}
              </div>
            )}
          </div>

          <div className="dashboard-greeting">
            <div
              className="animate-slide-in-right"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', padding: '0.4rem 1.25rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--glass-border)', animationDelay: '0.1s' }}
            >
              <div style={{ width: '8px', height: '8px', background: 'var(--page-primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--page-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--page-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Learning Journey</span>
            </div>
            <h1 className="animate-slide-up" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: '1.1', color: 'var(--text-primary)', animationDelay: '0.2s' }}>
              Welcome back, <span style={{ color: 'var(--page-primary)' }}>
                {dashboardData.fullName ? dashboardData.fullName.split(' ')[0] : 'Learner'}
              </span>
            </h1>
            <p className="animate-slide-up" style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, maxWidth: '550px', lineHeight: '1.4', opacity: 0.8, animationDelay: '0.3s' }}>Track your courses, progress, and upcoming assessments here.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div key="loader" className="centered-message animate-fade-in" style={{ padding: '12rem 0' }}>
          <div className="loading-spinner" style={{ width: '50px', height: '50px' }}></div>
          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>LOADING DASHBOARD...</p>
        </div>
      ) : (
        <div key="content" className="animate-fade-in">

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            {[
              { label: 'Enrolled', val: dashboardData.stats.enrolled, color: 'var(--page-primary)', icon: <ICONS.COURSE size={20} />, id: 'active-courses-section' },
              { label: 'Completed', val: dashboardData.stats.completed, color: '#10b981', icon: <ICONS.COMPLETED size={20} />, id: 'active-courses-section' },
              { label: 'Quizzes', val: dashboardData.stats.quizzesTaken || 0, color: '#f59e0b', icon: <ICONS.LESSON size={20} />, route: '/student/assessment' },
              { label: 'Certificates', val: dashboardData.stats.certificates || 0, color: '#ec4899', icon: <ICONS.CERTIFICATE size={20} />, route: '/student/progress' }
            ].map((stat, i) => (
              <StatCard 
                key={i} 
                stat={stat} 
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => stat.id ? document.getElementById(stat.id)?.scrollIntoView({ behavior: 'smooth' }) : navigate(stat.route)} 
              />
            ))}
          </div>

          <div id="active-courses-section" style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>My <span style={{ color: 'var(--page-primary)' }}>Courses</span></h2>
              </div>
              {dashboardData.activeCourses.length > 0 && (
                <button 
                  onClick={() => navigate('/student/learning')} 
                  className="hover-scale" 
                  style={{ 
                    padding: '0.4rem 1rem', 
                    borderRadius: '2rem', 
                    fontWeight: 800, 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    border: '1px solid var(--glass-border)', 
                    color: 'var(--text-primary)', 
                    background: 'var(--card-bg)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  View All
                </button>
              )}
            </div>

            {dashboardData.activeCourses.length === 0 ? (
              <div
                className="animate-slide-up"
                style={{ padding: '3rem 2rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--glass-border)', borderRadius: '1rem', color: 'var(--text-secondary)' }}
              >
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  <ICONS.COURSE size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} /><br/>
                  No courses yet
                </p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Enroll in courses to start your learning journey</p>
                <button
                  onClick={() => navigate('/courses')}
                  style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: 'var(--page-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {dashboardData.activeCourses.map((course, i) => (
                  <CourseCard key={course.courseId} course={course} style={{ animationDelay: `${(i + 4) * 0.1}s` }} onClick={() => navigate(`/student/course/${course.courseId}/lessons`)} />
                ))}
              </div>
            )}
          </div>

          {dashboardData.featuredCourses.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Recommended <span style={{ color: 'var(--page-secondary)' }}>for You</span></h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {dashboardData.featuredCourses.map((course, i) => (
                  <FeaturedCard key={course.courseId} course={course} style={{ animationDelay: `${(i + 8) * 0.1}s` }} onClick={() => navigate(`/course/${course.courseId}`)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = React.memo(({ stat, style, onClick }) => (
  <div
    className="stat-card animate-slide-up hover-lift"
    style={{ ...style, cursor: 'pointer', border: `1px solid var(--glass-border)`, padding: '1.25rem 1.5rem', background: 'var(--card-bg)' }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div className="icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--page-primary)', margin: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {stat.icon}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {stat.label}
        </h4>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1 }}>
          {stat.val}
        </p>
      </div>
    </div>
  </div>
));

const CourseCard = React.memo(({ course, style, onClick }) => (
  <div
    className="premium-card animate-slide-up hover-lift"
    style={{ ...style, cursor: 'pointer', border: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}
    onClick={onClick}
  >
    <div style={{ width: '100%', aspectRatio: '16 / 9', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--bg-secondary)', position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '4rem 1.25rem 1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 30%, transparent 100%)' }}>
        <span style={{ background: 'var(--page-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 950, padding: '0.4rem 0.8rem', borderRadius: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 5px 15px rgba(0,0,0,0.4)' }}>{course.category}</span>
        <h3 style={{ margin: '0.75rem 0 0', fontSize: '1.1rem', fontWeight: 950, color: 'white', lineHeight: 1.2, textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>{course.title}</h3>
      </div>
    </div>
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 950 }}>
        <span style={{ color: 'var(--text-secondary)' }}>PROGRESS</span>
        <span style={{ color: 'var(--page-primary)' }}>{course.progressPercentage}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${course.progressPercentage}%`, height: '100%', background: 'var(--page-primary)', borderRadius: '10px' }} />
      </div>
    </div>
  </div>
));

const FeaturedCard = React.memo(({ course, style, onClick }) => (
  <div
    className="premium-card animate-slide-up hover-lift"
    style={{ ...style, cursor: 'pointer', border: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}
    onClick={onClick}
  >
    <div style={{ width: '100%', aspectRatio: '16 / 9', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'var(--bg-secondary)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.4)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontWeight: 900 }}>{course.level?.toUpperCase()}</div>
    </div>
    <div style={{ padding: '1.25rem' }}>
      <span style={{ color: 'var(--page-primary)', fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.category}</span>
      <h3 style={{ margin: '0.3rem 0 0.3rem', fontSize: '0.95rem', fontWeight: 950, color: 'var(--text-primary)', height: '2.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{course.title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 900, textTransform: 'uppercase' }}>● Recommended</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 950 }}>{course.price === 0 ? <span style={{ color: '#10b981' }}>FREE</span> : `₹${(course.price || 0).toLocaleString()}`}</span>
      </div>
    </div>
  </div>
));

export default StudentDashboard;

