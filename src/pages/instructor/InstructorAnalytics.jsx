import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Filter, 
  Award, 
  MessageSquare, 
  ArrowUpRight, 
  BarChart3, 
  PieChart, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Target,
  RefreshCcw,
  Play
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import discussionService from '../../services/discussionService';
import paymentService from '../../services/paymentService';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import { fetchCourseContentCounts } from '../../services/dashboardService';
import { getAuthUser } from '../../utils/auth';

const defaultAnalytics = {
  totalEnrollments: 0,
  activeStudents: 0,
  totalCourses: 0,
  studentInteractions: 0,
  totalRevenue: 0,
  avgRevenuePerStudent: 0,
  totalLessons: 0,
  totalAssessments: 0,
  avgCompletionRate: 0,
  mostPopularCourse: null,
  coursesPerformance: []
};
const StatCard = ({ icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    className="premium-card hover-lift"
    style={{
      padding: '1.25rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      borderRadius: '2rem',
      background: 'rgba(255,255,255,0.01)',
      border: '1px solid var(--border-color)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
      willChange: 'transform'
    }}
  >
    <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '80px', height: '80px', background: `${color}08`, borderRadius: '50%', filter: 'blur(25px)' }} />
    
    <div style={{ 
      width: '48px', 
      height: '48px', 
      borderRadius: '1rem', 
      background: `${color}10`, 
      color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: '1.25rem', 
      border: `1px solid ${color}15`,
      boxShadow: `0 8px 16px -4px ${color}30`,
      flexShrink: 0
    }}>
      {icon}
    </div>

    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 950, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.85rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
);

export default function InstructorAnalytics() {
  const [filter, setFilter] = useState('All Time');
  const navigate = useNavigate();
  const user = getAuthUser();
  const instructorId = Number(user?.userId || user?.id);

  const fetchAnalyticsData = async () => {
    if (!instructorId) return defaultAnalytics;

    try {
      // Step 1: Core Course Data
      const courses = await courseService.getInstructorCourses(instructorId);
      const courseIds = courses.map(c => c.courseId || c.id);

      if (courses.length === 0) return { ...defaultAnalytics, totalCourses: 0 };

      // Step 2: Parallel Fetching - Batch everything into a single parallel block to avoid waterfalls
      const [allEnrollmentsRes, allPaymentsRes, discussionThreadsRes, contentCounts] = await Promise.all([
        // Fetch enrollments for all courses in parallel
        Promise.all(courseIds.map(id => enrollmentService.getCourseEnrollments(id).catch(() => ({ data: [] })))),
        // Payments
        paymentService.getRecentInstructorPayments(courseIds).catch(() => []),
        // Discussions (Just get threads for now to estimate activity)
        discussionService.getThreadsByCourses(courseIds).catch(() => ({ data: [] })),
        fetchCourseContentCounts(courseIds).catch(() => ({ totalLessons: 0, totalAssessments: 0 }))
      ]);

      // Step 3: Process Results
      const now = new Date();
      const filterByDate = (dateStr) => {
        const date = new Date(dateStr);
        if (filter === 'Today') return date.toDateString() === now.toDateString();
        if (filter === 'This Week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return date >= oneWeekAgo;
        }
        if (filter === 'This Month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return date >= oneMonthAgo;
        }
        return true;
      };

      let totalEnrollmentsCount = 0;
      let activeStudentsSet = new Set();
      let totalProgress = 0;
      const coursesPerformance = [];

      allEnrollmentsRes.forEach((res, idx) => {
        const enrollments = res.data || [];
        const course = courses[idx];
        let courseFilteredCount = 0;

        let totalCourseProgress = 0;
        enrollments.forEach(e => {
          if (filterByDate(e.enrolledAt)) {
            courseFilteredCount++;
            activeStudentsSet.add(e.studentId);
            totalProgress += (e.progressPercent || 0);
            totalCourseProgress += (e.progressPercent || 0);
          }
        });

        totalEnrollmentsCount += courseFilteredCount;
        coursesPerformance.push({
          courseId: course.courseId,
          title: course.title,
          category: course.category,
          thumbnailUrl: course.thumbnailUrl,
          enrollments: courseFilteredCount,
          avgProgress: courseFilteredCount > 0 ? Math.round(totalCourseProgress / courseFilteredCount) : 0
        });
      });

      const filteredPayments = allPaymentsRes.filter(p => 
        filterByDate(p.paidAt) && ['SUCCESS', 'COMPLETED', 'PENDING'].includes(p.status?.toUpperCase())
      );

      const totalRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const studentInteractions = (discussionThreadsRes.data || []).length; // Simplified for speed

      return {
        totalEnrollments: totalEnrollmentsCount,
        activeStudents: activeStudentsSet.size,
        totalCourses: courses.length,
        studentInteractions,
        totalRevenue,
        avgRevenuePerStudent: activeStudentsSet.size > 0 ? Math.round(totalRevenue / activeStudentsSet.size) : 0,
        totalLessons: contentCounts.totalLessons,
        totalAssessments: contentCounts.totalAssessments,
        coursesPerformance: coursesPerformance.sort((a, b) => b.enrollments - a.enrollments),
        mostPopularCourse: coursesPerformance[0] || null,
        avgCompletionRate: totalEnrollmentsCount > 0 ? Math.round(totalProgress / totalEnrollmentsCount) : 0
      };

    } catch (error) {
      console.error("Analytics fetch error:", error);
      return defaultAnalytics;
    }
  };

  const { data: analytics = defaultAnalytics, isLoading: loading, refetch } = useQuery({
    queryKey: ['instructorAnalytics', instructorId, filter],
    queryFn: fetchAnalyticsData,
    enabled: !!instructorId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0', background: 'var(--bg-primary)' }}>
      
      {/* Hero Header Section */}
      <section style={{ position: 'relative', padding: '4rem 5vw 3rem', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%)' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.03) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1600px', margin: '0 auto' }}>
          <div className="animate-slide-up" style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.4rem 1.25rem', borderRadius: '2.5rem', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Activity size={16} className="text-gradient" />
              <span style={{ fontSize: '0.85rem', fontWeight: 950, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Smart Analytics</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem', lineHeight: 1, color: 'var(--text-primary)' }}>
                   Course <span className="text-gradient">Analytics</span>
                </h1>
                <p style={{ fontSize: '0.95rem', maxWidth: '600px', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500, opacity: 0.9 }}>
                  Track your sales and student progress. Our <span style={{ color: 'var(--page-primary)', fontWeight: 800 }}>AI Tutor</span> data shows how students are learning!
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                  {['Today', 'This Week', 'This Month', 'All Time'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'var(--page-primary)' : 'transparent', color: filter === f ? 'white' : 'var(--text-secondary)', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '1.25rem', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: 'background-color 0.2s ease, transform 0.2s ease' }}>{f}</button>
                  ))}
                </div>
                <button 
                  onClick={() => refetch()} 
                  className="premium-card hover-scale" 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                  title="Synchronize Data"
                >
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)', 
                    opacity: 0.5 
                  }} />
                  <RefreshCcw 
                    size={24} 
                    className={loading ? 'animate-spin' : ''} 
                    style={{ 
                      color: loading ? 'var(--page-primary)' : 'var(--text-secondary)',
                      filter: loading ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
                      transition: 'all 0.4s ease'
                    }} 
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Top Metrics Hero Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
            <StatCard icon={<DollarSign />} label="Gross Revenue" value={`₹${analytics.totalRevenue.toLocaleString()}`} color="#10b981" />
            <StatCard icon={<Users />} label="Active Learners" value={analytics.activeStudents} color="#6366f1" />
            <StatCard icon={<MessageSquare />} label="Interactions" value={analytics.studentInteractions} color="#ec4899" />
            <StatCard icon={<Award />} label="Completion Rate" value={`${analytics.avgCompletionRate}%`} color="#f59e0b" />
          </div>
        </div>
      </section>

      {/* Main Analytics Content Section */}
      <section style={{ padding: '2rem 5vw 6rem', maxWidth: '1600px', margin: '0 auto' }}>
          {loading ? (
            <div key="loader" className="animate-fade-in" style={{ padding: '6rem 0', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }}></div>
              <p style={{ marginTop: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.15em' }}>COMPUTING DATA...</p>
            </div>
          ) : analytics.totalCourses === 0 ? (
            <div key="empty" className="glass-panel animate-scale-in" style={{ padding: '8rem 2rem', textAlign: 'center', borderRadius: '2.5rem', border: '2px dashed var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                <BookOpen size={60} style={{ opacity: 0.1 }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '1rem' }}>No Courses Yet</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '550px', margin: '0 auto 3.5rem', lineHeight: 1.5 }}>Launch your first course to start seeing student progress and AI-driven insights!</p>
              <button onClick={() => navigate('/instructor/create-course')} className="glass-btn-primary" style={{ padding: '1rem 3.5rem', borderRadius: '1.5rem', fontWeight: 950, fontSize: '1.1rem' }}>Create Course</button>
            </div>
          ) : (
            <div key="content" className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
              {/* Core Content Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
                <div className="premium-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '1rem', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Lessons</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-primary)' }}>{analytics.totalLessons}</div>
                  </div>
                </div>
                <div className="premium-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Graduates</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--text-primary)' }}>{Math.round(analytics.totalEnrollments * (analytics.avgCompletionRate/100))}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem' }} className="analytics-grid-main">
                
                {/* Left: Detailed Performance Table */}
                <div className="premium-card" style={{ padding: '2rem', borderRadius: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.15rem', fontWeight: 950, letterSpacing: '-0.02em' }}>
                      <BarChart3 size={20} className="text-gradient" /> Course List
                    </h3>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.8rem', borderRadius: '0.75rem' }}>{analytics.coursesPerformance.length} ACTIVE</div>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1.25rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                          <th style={{ padding: '0 1.5rem' }}>Course Name</th>
                          <th style={{ padding: '0 1.5rem', textAlign: 'center' }}>Learners</th>
                          <th style={{ padding: '0 1.5rem', textAlign: 'right' }}>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.coursesPerformance.map((course, idx) => (
                          <tr key={course.courseId} style={{ transition: 'background-color 0.2s ease, transform 0.2s ease' }}>
                            <td style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem 0 0 1.25rem', border: '1px solid var(--border-color)', borderRight: 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '0.85rem', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'linear-gradient(135deg, #6366f1, #ec4899)', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }} />
                                <div>
                                  <div style={{ fontWeight: 950, color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '-0.01em' }}>{course.title}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginTop: '0.1rem' }}>{course.category}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', fontWeight: 950, fontSize: '1.15rem', color: 'var(--page-primary)' }}>{course.enrollments}</td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', background: 'rgba(255,255,255,0.02)', borderRadius: '0 1.25rem 1.25rem 0', border: '1px solid var(--border-color)', borderLeft: 'none', color: '#10b981', fontWeight: 950, fontSize: '0.85rem' }}>
                               {course.avgProgress || 0}% Done
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Distribution and Core Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="premium-card" style={{ padding: '1.5rem', borderRadius: '1.5rem', flex: 1 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.15rem', fontWeight: 950, marginBottom: '1.5rem' }}>
                      <PieChart size={20} color="#ec4899" /> Categories
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                      {Object.entries(
                        analytics.coursesPerformance.reduce((acc, c) => {
                          acc[c.category] = (acc[c.category] || 0) + c.enrollments;
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count], idx) => (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1rem' }}>
                            <span style={{ fontWeight: 950, color: 'var(--text-primary)' }}>{cat}</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>{count} Students</span>
                          </div>
                          <div style={{ height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div
                              style={{ height: '100%', background: ['linear-gradient(90deg, #6366f1, #818cf8)', 'linear-gradient(90deg, #ec4899, #f472b6)', 'linear-gradient(90deg, #f59e0b, #fbbf24)', 'linear-gradient(90deg, #10b981, #34d399)', 'linear-gradient(90deg, #06b6d4, #22d3ee)'][idx % 5], borderRadius: '10px', width: analytics.totalEnrollments > 0 ? `${(count / analytics.totalEnrollments) * 100}%` : 0, transition: 'width 1s ease-out' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div 
                    className="premium-card hover-lift" 
                    style={{ padding: '2rem', borderRadius: '1.75rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)', transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease', willChange: 'transform' }}
                  >
                    <div style={{ width: '80px', height: '80px', borderRadius: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <Target size={40} className="text-gradient" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 950, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>Market Growth</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', fontWeight: 500 }}>
                      Leading in <span style={{ color: 'var(--text-primary)', fontWeight: 950 }}>"{analytics.mostPopularCourse?.category}"</span> with a student base that is growing fast!
                    </p>
                    <button onClick={() => navigate('/instructor/dashboard')} className="glass-btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', fontWeight: 950, fontSize: '0.9rem' }}>Back to Dashboard</button>
                  </div>
                </div>

              </div>


            </div>
          )}
      </section>

      <style>{`
        @media (max-width: 1200px) {
          .analytics-grid-main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
