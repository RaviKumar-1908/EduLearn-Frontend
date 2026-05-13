import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, Shield, ArrowRight, Star, PlayCircle, Zap, CheckCircle2, Layout, Sparkles, Clock, ChevronRight, Bell, MessageSquare, Bug, Headset, Layers } from 'lucide-react';
import api from '../services/api';

import { FloatingBlob, WaveDivider } from '../components/common/VisualAssets';

// Define helper components OUTSIDE using function declarations for hoisting
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div
      className="hover-lift transition-all-fast animate-slide-up"
      style={{
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '1.25rem',
        border: '1px solid var(--glass-border)',
        textAlign: 'center'
      }}
    >
      <div style={{
        width: '70px',
        height: '70px',
        borderRadius: '1.25rem',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function MessageSquareIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalCourses: 500,
    totalStudents: '2.4M',
    successRate: '99%'
  });

  useEffect(() => {
    // Fetch camd for theourses for grid
    api.get('/api/course')
      .then(res => {
        const courses = Array.isArray(res.data) ? res.data : [];
        setFeaturedCourses(courses.slice(0, 8));

        // Use the length of the fetched courses for real count
        if (courses.length > 0) {
          setPlatformStats(prev => ({
            ...prev,
            totalCourses: courses.length
          }));
        }
      })
      .catch(err => console.error("Error fetching landing courses:", err))
      .finally(() => setLoadingCourses(false));
  }, []);

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* --- KINETIC HERO SECTION --- */}
      <section id="home" style={{
        position: 'relative',
        minHeight: 'calc(100vh - 110px)', /* Perfectly fits viewport height considering navbar and main-content padding */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem', /* Removed 6rem top padding to perfectly center */
        marginTop: '0'
      }}>
        {/* Cinematic Backdrop - Optimized with SVGs and Lightweight Assets */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <FloatingBlob color="#6366f1" top="5%" left="-10%" opacity={0.10} size="40vw" />
          <FloatingBlob color="#ec4899" bottom="10%" right="-10%" opacity={0.07} size="35vw" delay="3s" />

          {/* ── Floating Student Illustration Card ── */}
          <div className="animate-float" style={{
            position: 'absolute',
            top: '15%',
            right: '6%',
            width: '280px',
            zIndex: 1,
            background: 'var(--card-bg)',
            backdropFilter: 'blur(12px)',
            borderRadius: '2rem',
            border: '1px solid var(--glass-border)',
            padding: '1.25rem',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
            willChange: 'transform',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Session</span>
            </div>

            {/* SVG Illustration */}
            <svg viewBox="0 0 240 140" width="100%" xmlns="http://www.w3.org/2000/svg" aria-label="Students studying illustration">
              {/* Desk */}
              <rect x="20" y="108" width="200" height="8" rx="4" fill="#6366f1" opacity="0.15" />

              {/* Student 1 — laptop */}
              <rect x="30" y="72" width="72" height="46" rx="6" fill="#6366f1" opacity="0.12" />
              <rect x="34" y="76" width="64" height="34" rx="4" fill="#6366f1" opacity="0.25" />
              {/* screen lines */}
              <rect x="38" y="82" width="30" height="3" rx="1.5" fill="#818cf8" opacity="0.7" />
              <rect x="38" y="89" width="46" height="3" rx="1.5" fill="#818cf8" opacity="0.5" />
              <rect x="38" y="96" width="38" height="3" rx="1.5" fill="#818cf8" opacity="0.4" />
              {/* hinge */}
              <rect x="28" y="116" width="76" height="5" rx="2.5" fill="#6366f1" opacity="0.2" />
              {/* person head */}
              <circle cx="66" cy="60" r="10" fill="#6366f1" opacity="0.35" />
              <rect x="58" y="68" width="16" height="6" rx="3" fill="#6366f1" opacity="0.2" />

              {/* Student 2 — book */}
              <rect x="150" y="80" width="50" height="36" rx="4" fill="#ec4899" opacity="0.12" />
              <line x1="175" y1="80" x2="175" y2="116" stroke="#ec4899" strokeWidth="1.5" opacity="0.4" />
              <rect x="154" y="86" width="18" height="2.5" rx="1.25" fill="#f472b6" opacity="0.6" />
              <rect x="154" y="92" width="14" height="2.5" rx="1.25" fill="#f472b6" opacity="0.45" />
              <rect x="154" y="98" width="16" height="2.5" rx="1.25" fill="#f472b6" opacity="0.35" />
              <rect x="179" y="86" width="18" height="2.5" rx="1.25" fill="#f472b6" opacity="0.6" />
              <rect x="179" y="92" width="14" height="2.5" rx="1.25" fill="#f472b6" opacity="0.45" />
              {/* person head */}
              <circle cx="175" cy="65" r="10" fill="#ec4899" opacity="0.35" />
              <rect x="167" y="73" width="16" height="6" rx="3" fill="#ec4899" opacity="0.2" />

              {/* Chat bubble */}
              <rect x="90" y="30" width="60" height="28" rx="8" fill="#10b981" opacity="0.15" />
              <polygon points="110,58 118,66 126,58" fill="#10b981" opacity="0.12" />
              <rect x="97" y="38" width="28" height="3" rx="1.5" fill="#10b981" opacity="0.6" />
              <rect x="97" y="45" width="20" height="3" rx="1.5" fill="#10b981" opacity="0.45" />

              {/* Star rating */}
              <text x="94" y="22" fontSize="10" fill="#f59e0b" opacity="0.9">★★★★★</text>
            </svg>

          </div>

        </div>

        <div
          className="animate-slide-up"
          style={{ maxWidth: '1200px', textAlign: 'center', zIndex: 2 }}
        >
          <div
            className="animate-scale-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.5rem 1.5rem',
              borderRadius: '2rem',
              color: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '2rem',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              backdropFilter: 'blur(8px)',
              animationDelay: '0.4s'
            }}
          >
            <Sparkles size={20} /> AI-Powered Learning Experience
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            fontWeight: 950,
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            Unlock Your <br />
            <span style={{
              color: 'var(--page-primary)',
              filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.2))'
            }}>Potential</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '2.5rem auto',
            lineHeight: 1.5,
            fontWeight: 500,
            opacity: 0.9
          }}>
            Master new skills with industry-leading courses. Join over 2 million+
            passionate learners in a premium, distraction-free environment.
          </p>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4rem' }}>
            <button
              className="hover-scale transition-all-fast"
              onClick={() => navigate('/register')}
              style={{
                padding: '1.25rem 3.5rem', fontSize: '1.15rem', fontWeight: 950, borderRadius: '1.25rem',
                background: 'var(--page-primary)', border: 'none', color: 'white',
                cursor: 'pointer', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)'
              }}
            >
              Get Started Today
            </button>
            <button
              className="hover-scale transition-all-fast"
              onClick={() => navigate('/courses')}
              style={{
                padding: '1.25rem 3.5rem', fontSize: '1.15rem', fontWeight: 950, borderRadius: '1.25rem',
                background: 'rgba(255,255,255,0.03)', border: '2px solid var(--border-color)', color: 'var(--text-primary)',
                cursor: 'pointer', backdropFilter: 'blur(10px)'
              }}
            >
              Browse Courses
            </button>
          </div>
        </div>
        <WaveDivider bottom="-1px" />
      </section>

      {/* --- MASTERY QUADRANTS (FEATURED) --- */}
      <section id="courses" style={{ maxWidth: '1400px', margin: '0 auto', padding: '10rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>Featured <span style={{ color: '#6366f1' }}>Courses</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>Explore top-rated courses to accelerate your career.</p>
          </div>
          <button
            className="hover-lift transition-all-fast"
            onClick={() => navigate('/courses')}
            style={{
              background: 'none', border: 'none', color: '#6366f1', fontSize: '1.1rem', fontWeight: 950,
              display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
          >
            VIEW ALL COURSES <ChevronRight size={24} />
          </button>
        </div>

        {loadingCourses ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '400px', borderRadius: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {featuredCourses.map((course, idx) => (
              <div
                key={course.courseId}
                className="animate-slide-up hover-lift transition-all-fast"
                onClick={() => navigate(`/course/${course.courseId}`)}
                style={{
                  borderRadius: '2rem', overflow: 'hidden', cursor: 'pointer',
                  background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  position: 'relative',
                  maxWidth: '400px',
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div style={{
                  height: '180px',
                  background: 'rgba(15, 23, 42, 0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      alt={course.title}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--bg-secondary)',
                      opacity: 0.8
                    }} />
                  )}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(15, 23, 42, 0.9)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 900, color: 'white', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                    {course.category}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 950, marginBottom: '0.6rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> {course.totalDuration}m</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Star size={14} color="#f59e0b" fill="#f59e0b" /> {course.level}</span>
                  </div>
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 950, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GO MASTER</span>
                    </div>
                    <div
                      className="hover-scale transition-all-fast"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- CORE FEATURES --- */}
      <section id="features" style={{ maxWidth: '1400px', margin: '0 auto', padding: '8rem 2rem', position: 'relative' }}>
        <FloatingBlob color="#a855f7" top="0" right="-10%" opacity={0.05} size="40vw" />

        <div style={{ textAlign: 'center', marginBottom: '6rem', position: 'relative', zIndex: 1 }}>
          <div
            className="animate-slide-up"
            style={{
              display: 'inline-block',
              padding: '0.4rem 1.2rem',
              background: 'rgba(236, 72, 153, 0.1)',
              borderRadius: '2rem',
              color: '#ec4899',
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.15em',
              marginBottom: '1.5rem',
              border: '1px solid rgba(236, 72, 153, 0.2)'
            }}
          >
            PLATFORM FEATURES
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            Everything you need to <span style={{ color: '#6366f1' }}>Succeed</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '1.5rem auto', lineHeight: 1.6, fontWeight: 500 }}>
            A comprehensive ecosystem designed to provide the ultimate learning experience from start to finish.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          <FeatureCard
            icon={<Sparkles size={34} />}
            title="Advanced AI Tutor"
            desc="Get instant answers and personalized learning guidance from our integrated AI assistant."
            color="#a855f7"
          />
          <FeatureCard
            icon={<Bell size={34} />}
            title="Live Notifications"
            desc="Stay updated with real-time alerts for enrollments, payments, and course updates."
            color="#3b82f6"
          />
          <FeatureCard
            icon={<Headset size={34} />}
            title="Admin Support"
            desc="Direct access to platform administrators for dedicated assistance and guidance."
            color="#10b981"
          />
          <FeatureCard
            icon={<Bug size={34} />}
            title="Bug Reporting"
            desc="Easy-to-use feedback system to report issues and help us improve your experience."
            color="#f43f5e"
          />
          <FeatureCard
            icon={<Layers size={34} />}
            title="Course Variety"
            desc="Explore a vast library of courses across multiple categories and skill levels."
            color="#f59e0b"
          />
          <FeatureCard
            icon={<Award size={34} />}
            title="Industry Certificates"
            desc="Earn professional certifications upon completion to boost your career prospects."
            color="#ec4899"
          />
          <FeatureCard
            icon={<MessageSquare size={34} />}
            title="Discussion Forums"
            desc="Engage with a global community of learners and instructors in collaborative discussions."
            color="#06b6d4"
          />
          <FeatureCard
            icon={<Layout size={34} />}
            title="Smart Dashboard"
            desc="Track your progress, manage assignments, and view your stats in one sleek interface."
            color="#6366f1"
          />
        </div>
      </section>

      {/* --- REAL-TIME PLATFORM TICKETS --- */}
      <section id="stats" style={{ padding: '4rem 2rem', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>

          {/* Ticket: Course Count */}
          <div
            className="animate-slide-up hover-lift transition-all-fast"
            style={{
              padding: '1.5rem 2rem',
              background: 'var(--glass-bg)',
              borderRadius: '1.5rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              minWidth: '280px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)' }}>{platformStats.totalCourses}+</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verified Courses</div>
            </div>
          </div>

          {/* Ticket: Categories */}
          <div
            className="animate-slide-up hover-lift transition-all-fast"
            style={{
              padding: '1.5rem 2rem',
              background: 'var(--glass-bg)',
              borderRadius: '1.5rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              minWidth: '280px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              animationDelay: '0.1s'
            }}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '1rem', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {[...new Set(featuredCourses.map(c => c.category))].length || 0}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Specialized Domains</div>
            </div>
          </div>

          {/* Ticket: Support */}
          <div
            className="animate-slide-up hover-lift transition-all-fast"
            style={{
              padding: '1.5rem 2rem',
              background: 'var(--glass-bg)',
              borderRadius: '1.5rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              minWidth: '280px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              animationDelay: '0.2s'
            }}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)' }}>24/7</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expert Assistance</div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section style={{ maxWidth: '1200px', margin: '12rem auto', padding: '0 2rem', position: 'relative' }}>
        <FloatingBlob color="#6366f1" top="-20%" left="-10%" opacity={0.08} size="30vw" />

        <div
          className="animate-scale-in"
          style={{
            background: 'var(--card-bg)',
            padding: '4rem 2rem',
            borderRadius: '2.5rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>Ready to <span style={{ color: '#6366f1' }}>Start?</span></h2>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
              The future belongs to those who learn. Join our community today and start your journey.
            </p>
            <button
              className="hover-scale transition-all-fast"
              onClick={() => navigate('/register')}
              style={{
                padding: '1.25rem 4rem', fontSize: '1.25rem', fontWeight: 950, borderRadius: '1.25rem',
                background: 'var(--page-primary)', border: 'none', color: 'white',
                cursor: 'pointer', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)'
              }}
            >
              JOIN OUR COMMUNITY
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Minimal Premium) --- */}
      <footer style={{ padding: '6rem 2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>© 2026 EDULEARN LMS. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}

