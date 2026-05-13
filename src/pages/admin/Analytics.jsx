import React from 'react';
import { BarChart2, Users, Download, BookOpen, Clock, Layout, CreditCard, UserCheck, TrendingUp, DollarSign } from 'lucide-react';
// import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'react-toastify';
import courseService from '../../services/courseService';
import userService from '../../services/userService';

const defaultStats = {
  totalCourses: 0,
  publishedCourses: 0,
  pendingCourses: 0,
  totalLessons: 0,
  totalRevenue: 0,
  totalTransactions: 0,
  totalStudents: 0,
  totalInstructors: 0,
  categoryDistribution: [],
  recentPayments: []
};

const StatCard = React.memo(({ icon, label, value, subValue, color }) => (
  <div
    className="glass-panel hover-lift"
    style={{ 
      padding: '1.5rem', 
      flex: '1 1 240px', 
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
      background: 'var(--card-bg)',
      borderRadius: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      willChange: 'transform'
    }}
  >
    <div style={{
      width: '38px', height: '38px', borderRadius: '10px',
      background: `${color}10`, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      opacity: 0.8
    }}>
      {React.cloneElement(icon, { size: 18 })}
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

export default function AdminAnalytics() {

  const fetchStats = async () => {
    try {
      const [courseStatsRes, allCoursesRes, paymentStatsRes, lessonCountRes, usersRes] = await Promise.allSettled([
        api.get('/api/course/admin/stats'),
        courseService.getAll(),
        api.get('/api/payments/admin/stats'),
        api.get('/api/lesson/count'),
        userService.getAllAdminUsers()
      ]);

      let courseData = { totalCourses: 0, publishedCourses: 0, pendingCourses: 0 };
      let allCourses = [];
      let paymentData = { totalRevenue: 0, totalTransactions: 0, recentPayments: [] };
      let lessonCount = 0;
      let users = [];

      if (courseStatsRes.status === 'fulfilled' && courseStatsRes.value?.data) courseData = courseStatsRes.value.data;
      if (allCoursesRes.status === 'fulfilled' && Array.isArray(allCoursesRes.value)) allCourses = allCoursesRes.value;
      if (paymentStatsRes.status === 'fulfilled' && paymentStatsRes.value?.data) paymentData = paymentStatsRes.value.data;
      if (lessonCountRes.status === 'fulfilled') lessonCount = lessonCountRes.value?.data || 0;
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) users = usersRes.value;

      const categories = {};
      allCourses.forEach(c => {
        if (c?.category) categories[c.category] = (categories[c.category] || 0) + 1;
      });

      const categoryDistribution = Object.entries(categories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalCourses: courseData.totalCourses || allCourses.length || 0,
        publishedCourses: courseData.publishedCourses || allCourses.filter(c => c.isPublished).length || 0,
        pendingCourses: courseData.pendingCourses || allCourses.filter(c => c.status === 'PENDING').length || 0,
        totalLessons: lessonCount,
        totalRevenue: paymentData.totalRevenue || 0,
        totalTransactions: paymentData.totalTransactions || 0,
        totalStudents: users.filter(u => u.role === 'STUDENT').length,
        totalInstructors: users.filter(u => u.role === 'INSTRUCTOR').length,
        categoryDistribution,
        recentPayments: paymentData.recentPayments || []
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Unexpected error in Analytics:", error);
      }
      toast.error("Failed to load analytics dashboard.");
      return defaultStats;
    }
  };

  const { data: stats = defaultStats, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: fetchStats,
    staleTime: 600000, // 10 minutes for analytics
  });

  const handleExport = () => {
    try {
      const reportData = [
        ['Online Learning Management System - Platform Report'],
        ['Generated At', new Date().toLocaleString()],
        [''],
        ['Metric', 'Value', 'Details'],
        ['Total Courses', stats.totalCourses, 'Total size of the course catalog'],
        ['Published Courses', stats.publishedCourses, 'Courses visible to students'],
        ['Pending Approval', stats.pendingCourses, 'Courses awaiting review'],
        [''],
        ['End of Report']
      ];

      const csvContent = "data:text/csv;charset=utf-8," + reportData.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `LMS_Platform_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Platform report exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to generate report.");
    }
  };

  return (
    <div className="admin-analytics" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 4vw 5rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.03em' }}>Platform <span className="text-gradient">Analytics</span></h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>Course catalog size, publication status, and distribution.</p>
        </div>
        <button
          onClick={handleExport}
          className="glass-btn-primary hover-scale-sm"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '0.5rem', 
            fontSize: '0.65rem', 
            fontWeight: 900, 
            background: 'var(--page-primary)',
            boxShadow: 'none',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            height: 'fit-content'
          }}
        >
          <Download size={12} strokeWidth={3} /> EXPORT REPORT
        </button>
      </header>

      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} subValue="Gross platform income" icon={<DollarSign size={22} />} color="#10b981" />
            <StatCard label="Total Courses" value={stats.totalCourses} subValue="Active catalog size" icon={<BookOpen size={22} />} color="#6366f1" />
            <StatCard label="Lessons" value={stats.totalLessons} subValue="Learning objects" icon={<Layout size={22} />} color="#8b5cf6" />
            <StatCard label="Students" value={stats.totalStudents} subValue="Active learners" icon={<Users size={22} />} color="#3b82f6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <StatCard label="Instructors" value={stats.totalInstructors} subValue="Content creators" icon={<UserCheck size={22} />} color="#f59e0b" />
            <StatCard label="Published" value={stats.publishedCourses} subValue="Live on platform" icon={<BarChart2 size={22} />} color="#10b981" />
            <StatCard label="Pending" value={stats.pendingCourses} subValue="Awaiting approval" icon={<Clock size={22} />} color="#f59e0b" />
            <StatCard label="Transactions" value={stats.totalTransactions} subValue="Successful payments" icon={<CreditCard size={22} />} color="#6366f1" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {/* Recent Transactions */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} color="#10b981" /> Recent Transactions
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['ID', 'STUDENT ID', 'AMOUNT', 'DATE', 'STATUS'].map(h => (
                        <th key={h} style={{ padding: '1rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPayments?.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.transactionId?.substring(0, 8)}...</td>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>ID: {p.studentId}</td>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>₹{p.amount}</td>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(p.paidAt).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900, background: p.status === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.status === 'SUCCESS' ? '#10b981' : '#ef4444' }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stats.recentPayments?.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent transactions.</div>
              )}
            </div>

            {/* Top Categories */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layout size={20} color="var(--page-secondary)" /> Top Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {stats.categoryDistribution?.map((cat, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name || 'Uncategorized'}</span>
                      <span style={{ fontSize: '0.85rem', color: idx === 0 ? 'var(--page-primary)' : 'var(--text-secondary)', fontWeight: 800 }}>{cat.count} Courses</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(cat.count / (stats.totalCourses || 1)) * 100}%`, background: idx === 0 ? 'var(--page-primary)' : 'rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                ))}
                {stats.categoryDistribution?.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No category data available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
