import React from 'react';
import { Users, BookOpen, CheckCircle, Clock, BarChart2, Shield, Book, Layout, Activity, Bell, Zap, TrendingUp, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import courseService from '../../services/courseService';
import { getAuthUser } from '../../utils/auth';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import notificationService from '../../services/notificationService';
import { fetchEnrollmentCounts } from '../../services/dashboardService';

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return new Date(date).toLocaleDateString();
};

const defaultDashboard = {
  profile: null,
  stats: {
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalLessons: 0,
    pendingBugs: 0,
  },
  recentUsers: [],
  recentCourses: [],
  allNotifications: [],
  genderStats: { male: 0, female: 0, other: 0 },
  enrollmentCounts: {},
};

const StatCard = React.memo(({ icon, label, value, color, subValue, onClick }) => (
    <div
      onClick={onClick}
      className="glass-panel hover-lift"
      style={{
        flex: '1 1 240px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${color}1a`,
        background: 'var(--card-bg)',
        borderRadius: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
        willChange: 'transform'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: `${color}10`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          opacity: 0.8
        }}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        {onClick && (
          <span style={{ fontSize: '0.6rem', fontWeight: 950, color: color, background: `${color}10`, padding: '0.2rem 0.5rem', borderRadius: '4px', letterSpacing: '0.05em' }}>
            MANAGE
          </span>
        )}
      </div>
      
      <div style={{ marginTop: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {value}
        </h2>
        <h4 style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </h4>
        {subValue && <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, opacity: 0.6 }}>{subValue}</p>}
      </div>
    </div>
));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const userId = user?.userId || user?.id;

  const fetchDashboardData = async () => {
    try {
      const [profileRes, userRes, courseRes, courseStatsRes, lessonCountRes, bugRes, notifRes] = await Promise.all([
        userId ? userService.getById(userId).catch(() => null) : Promise.resolve(null),
        userService.getAllAdminUsers().catch(() => []),
        courseService.getAll().catch(() => []),
        api.get('/api/course/admin/stats').catch(() => ({ data: {} })),
        api.get('/api/lesson/count').catch(() => ({ data: 0 })),
        api.get('/api/bugs').catch(() => ({ data: [] })),
        notificationService.getAllNotifications().catch(() => ({ data: { data: [] } }))
      ]);

      const users = userRes || [];
      const courses = courseRes || [];
      const courseStats = courseStatsRes.data || {};
      const allNotifications = notifRes?.data?.data || [];

      const genderStats = { male: 0, female: 0, other: 0 };
      users.forEach(u => {
        const g = u.gender?.toLowerCase();
        if (g === 'male') genderStats.male++;
        else if (g === 'female') genderStats.female++;
        else genderStats.other++;
      });

      const recentCourses = courses.slice(-5).reverse();
      const enrollmentCounts = await fetchEnrollmentCounts(recentCourses.map(c => c.courseId)).catch(() => ({}));

      return {
        profile: profileRes,
        stats: {
          totalUsers: users.length,
          totalStudents: users.filter(u => u.role === 'STUDENT').length,
          totalInstructors: users.filter(u => u.role === 'INSTRUCTOR').length,
          totalCourses: courses.length,
          publishedCourses: courseStats.publishedCourses || courses.filter(c => c.isPublished).length,
          pendingCourses: courseStats.pendingCourses || courses.filter(c => c.status === 'PENDING').length,
          totalLessons: lessonCountRes.data || 0,
          pendingBugs: (bugRes?.data || []).filter(b => b.status === 'OPEN' || b.status === 'PENDING').length,
        },
        recentUsers: users.slice(-5).reverse(),
        recentCourses,
        allNotifications: allNotifications.slice(0, 15),
        genderStats,
        enrollmentCounts,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching admin dashboard data:", error);
      }
      return defaultDashboard;
    }
  };

  const { data: dashboard = defaultDashboard, isLoading } = useQuery({
    queryKey: ['adminDashboard', userId],
    queryFn: fetchDashboardData,
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  });

  const { profile, stats, recentUsers, recentCourses, allNotifications, genderStats, enrollmentCounts } = dashboard;

  return (
    <div className="admin-dashboard-container" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 3vw 5rem' }}>
      <header style={{ marginBottom: '2.5rem', padding: '2rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Zap size={18} className="text-gradient" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Platform Nexus</span>
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.03em' }}>System <span className="text-gradient">Intelligence</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>
            Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{profile?.fullName || user?.fullName || 'Administrator'}</span>. Dashboard synchronized.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em', color: '#10b981', whiteSpace: 'nowrap' }}>SYSTEM ONLINE</span>
            </div>
        </div>
      </header>

      {isLoading ? (
        <div style={{ padding: '10rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: '50px', height: '50px', margin: '0 auto' }}></div>
          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: '0.3em' }}>SYNCHRONIZING NEXUS...</p>
        </div>
      ) : (
        <div>
          
          {/* Top Tier Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <StatCard label="Platform Traffic" value={stats.totalUsers} subValue="Registered accounts" icon={<Users size={22} />} color="#6366f1" onClick={() => navigate('/admin/users')} />
            <StatCard label="Course Catalog" value={stats.totalCourses} subValue="Total hosted content" icon={<BookOpen size={22} />} color="#8b5cf6" onClick={() => navigate('/admin/courses')} />
            <StatCard label="Instructors" value={stats.totalInstructors} subValue="Platform Instructors" icon={<UserCheck size={22} />} color="#10b981" />
            <StatCard label="System Alerts" value={stats.pendingBugs} subValue="Unresolved issue reports" icon={<AlertTriangle size={22} />} color="#ef4444" onClick={() => navigate('/admin/bugs')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Live Activity Feed */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={20} className="text-gradient" /> Live Platform Activity
                    </h3>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '2rem' }}>REAL-TIME FEED</div>
                </div>
                
                <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {allNotifications.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>No recent activity recorded.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {allNotifications.map((notif, idx) => (
                                <div 
                                    key={notif.id} 
                                    style={{ 
                                        padding: '1rem', 
                                        borderRadius: '1rem', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{ 
                                        width: '36px', height: '36px', borderRadius: '10px', 
                                        background: notif.type?.includes('BUG') ? 'rgba(239,68,68,0.1)' : notif.type?.includes('PAYMENT') ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                                        color: notif.type?.includes('BUG') ? '#ef4444' : notif.type?.includes('PAYMENT') ? '#10b981' : '#6366f1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {notif.type?.includes('BUG') ? <AlertTriangle size={18} /> : notif.type?.includes('PAYMENT') ? <TrendingUp size={18} /> : <Bell size={18} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{notif.title}</span>
                                            <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{formatTimeAgo(notif.createdAt)}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Platform Health / Demographics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 900 }}>Platform Demographics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { label: 'Male Learners', count: genderStats.male, color: '#3b82f6', percent: (genderStats.male / (stats.totalUsers || 1)) * 100 },
                            { label: 'Female Learners', count: genderStats.female, color: '#ec4899', percent: (genderStats.female / (stats.totalUsers || 1)) * 100 },
                            { label: 'Other / Non-Binary', count: genderStats.other, color: '#94a3b8', percent: (genderStats.other / (stats.totalUsers || 1)) * 100 },
                        ].map(stat => (
                            <div key={stat.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                                    <span>{stat.count}</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${stat.percent}%`, background: stat.color, transition: 'width 1s ease-out' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(139,92,246,0.05) 100%)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layout size={18} color="#8b5cf6" /> Content Health
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Live Courses</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#10b981' }}>{stats.publishedCourses}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Awaiting</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#f59e0b' }}>{stats.pendingCourses}</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* User/Course Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.75rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Users size={20} color="var(--page-primary)" /> Top Educators & Recent Joins
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {recentUsers.map(u => (
                          <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--page-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'white' }}>
                                  {u.fullName.charAt(0)}
                              </div>
                              <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{u.fullName}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                              </div>
                              <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--page-primary)' }}>{u.role}</span>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.75rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Book size={20} color="#8b5cf6" /> Trending Curriculum
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {recentCourses.map(c => (
                          <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                              <div style={{ width: '60px', height: '40px', borderRadius: '8px', background: 'var(--border-color)', overflow: 'hidden' }}>
                                  <img src={c.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&q=50'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.category}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 950, fontSize: '0.85rem' }}>{enrollmentCounts[String(c.courseId)] || 0}</div>
                                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>SALES</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

        </div>
      )}
    </div>
  );
}
