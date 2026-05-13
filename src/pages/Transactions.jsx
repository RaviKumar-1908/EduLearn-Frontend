import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Calendar, User, Download, Search, TrendingUp, Wallet, Hash, Filter, ChevronDown } from 'lucide-react';
import { getAuthUser } from '../utils/auth';
import paymentService from '../services/paymentService';
import enrollmentService from '../services/enrollmentService';
import courseService from '../services/courseService';
import { fetchCoursesByIds, fetchProfilesByIds } from '../services/dashboardService';
import { toast } from 'react-toastify';
// import { motion, AnimatePresence } from 'framer-motion';

const buildStudentTransactions = async (userId) => {
  const [officialPayments, enrolledRes] = await Promise.all([
    paymentService.getPaymentsByStudent(userId),
    enrollmentService.getStudentEnrollments(userId),
  ]);

  const enrollments = Array.isArray(enrolledRes.data) ? enrolledRes.data : (enrolledRes.data?.data || []);
  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId).filter(Boolean))];
  const details = await fetchCoursesByIds(courseIds);

  const mergedTransactions = [...officialPayments];
  const paidCourseIds = new Set(officialPayments.map((payment) => payment.courseId));

  enrollments.forEach((enrollment) => {
    if (!paidCourseIds.has(enrollment.courseId)) {
      const course = details[enrollment.courseId];
      mergedTransactions.push({
        paymentId: `enroll-${enrollment.enrollmentId}`,
        courseId: enrollment.courseId,
        studentId: userId,
        amount: course?.price || 0,
        status: 'COMPLETED',
        paidAt: enrollment.enrolledAt || new Date().toISOString(),
        transactionId: `REG-${enrollment.courseId}-${userId}`,
        currency: 'INR'
      });
    }
  });

  const instructorIds = [...new Set(Object.values(details).map((course) => course?.instructorId).filter(Boolean))];
  const profiles = await fetchProfilesByIds(instructorIds).catch(() => ({}));

  return {
    transactions: mergedTransactions.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    courseDetails: details,
    profiles,
  };
};

const buildInstructorTransactions = async (userId) => {
  const instructorCourses = await courseService.getInstructorCourses(userId);
  const courseIds = instructorCourses.map((course) => course.courseId);
  const courseDetails = instructorCourses.reduce((acc, course) => {
    acc[course.courseId] = course;
    return acc;
  }, {});

  const transactions = await paymentService.getRecentInstructorPayments(courseIds);
  const studentIds = [...new Set(transactions.map((transaction) => transaction.studentId).filter(Boolean))];
  const profiles = await fetchProfilesByIds(studentIds).catch(() => ({}));

  return { transactions, courseDetails, profiles };
};

export default function Transactions() {
  const user = getAuthUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const isInstructor = user?.role?.toUpperCase() === 'INSTRUCTOR';
  const userId = user?.userId || user?.id;

  const { data, isLoading: loading } = useQuery({
    queryKey: ['transactions', userId, isInstructor],
    queryFn: () => (isInstructor ? buildInstructorTransactions(userId) : buildStudentTransactions(userId)),
    enabled: !!userId,
    staleTime: 60000,
    throwOnError: false,
  });

  const transactions = data?.transactions || [];
  const courseDetails = data?.courseDetails || {};
  const profiles = data?.profiles || {};

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const course = courseDetails[transaction.courseId];
      const searchStr = searchTerm.toLowerCase();
      const courseTitle = course?.title?.toLowerCase?.() || '';
      const transactionId = transaction.transactionId?.toLowerCase?.() || '';

      if (!courseTitle.includes(searchStr) && !transactionId.includes(searchStr)) return false;
      if (statusFilter !== 'ALL' && transaction.status?.toUpperCase() !== statusFilter) return false;

      if (dateFilter !== 'ALL_TIME') {
        const txDate = new Date(transaction.paidAt);
        const now = new Date();
        if (dateFilter === 'THIS_MONTH' && (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear())) return false;
        if (dateFilter === 'THIS_YEAR' && txDate.getFullYear() !== now.getFullYear()) return false;
      }

      return true;
    });
  }, [transactions, courseDetails, searchTerm, statusFilter, dateFilter]);

  const totalAmount = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => ['SUCCESS', 'COMPLETED'].includes(transaction.status?.toUpperCase()))
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }, [filteredTransactions]);

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 4vw 6rem' }} className="main-content">
      <header style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, letterSpacing: '-0.03em' }}>
            {isInstructor ? 'Revenue' : 'Payment'} <span className="text-gradient">History</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
            Track and manage your course transactions.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '0.75rem 1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Filtered Total</p>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>₹{totalAmount.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </header>

      <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by course or transaction hash..."
            className="glass-input"
            style={{ width: '100%', padding: '0.85rem 1.25rem 0.85rem 3.25rem', borderRadius: '1.25rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="glass-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', borderColor: isFilterOpen ? 'var(--page-primary)' : 'var(--border-color)' }}
          >
            <Filter size={18} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Filters</span>
            <ChevronDown size={16} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} />
          </button>

            {isFilterOpen && (
              <div
                className="animate-scale-in"
                style={{ position: 'absolute', top: '120%', right: 0, width: '320px', background: 'var(--card-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: '1.5rem', zIndex: 1000, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Execution Status</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['ALL', 'SUCCESS', 'COMPLETED', 'PENDING', 'FAILED'].map((status) => (
                      <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid var(--border-color)', background: statusFilter === status ? 'var(--page-primary)' : 'rgba(255,255,255,0.02)', color: statusFilter === status ? 'white' : 'var(--text-secondary)', cursor: 'pointer', transition: 'background-color 0.2s ease, transform 0.2s ease' }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Time Interval</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { id: 'ALL_TIME', label: 'All History' },
                      { id: 'THIS_MONTH', label: 'Current Month' },
                      { id: 'THIS_YEAR', label: 'Current Year' }
                    ].map((date) => (
                      <button 
                        key={date.id}
                        onClick={() => setDateFilter(date.id)}
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 800, textAlign: 'left', border: '1px solid var(--border-color)', background: dateFilter === date.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: dateFilter === date.id ? 'var(--page-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'background-color 0.2s ease, border-color 0.2s ease' }}
                      >
                        {date.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                   <button 
                    onClick={() => { setStatusFilter('ALL'); setDateFilter('ALL_TIME'); setIsFilterOpen(false); }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '8rem 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => {
              const course = courseDetails[transaction.courseId];
              const isSuccess = ['SUCCESS', 'COMPLETED'].includes(transaction.status?.toUpperCase());
              const relatedProfile = isInstructor
                ? (profiles[transaction.studentId] || profiles[String(transaction.studentId)])
                : (profiles[course?.instructorId] || profiles[String(course?.instructorId)]);
              
              return (
                <div 
                  key={transaction.paymentId} 
                  className="premium-card animate-slide-up" 
                  style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '2.5rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s ease, border-color 0.2s ease', willChange: 'transform' }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSuccess ? '#10b981' : '#ef4444', border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`, flexShrink: 0 }}>
                    {isSuccess ? <TrendingUp size={24} /> : <CreditCard size={24} />}
                  </div>

                  <div style={{ flex: 1.5, minWidth: '0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course?.title || `Course #${transaction.courseId}`}
                    </h3>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} /> {new Date(transaction.paidAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Hash size={13} /> <span style={{ fontFamily: 'monospace' }}>{transaction.transactionId?.substring(0, 10)}...</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', gap: '2rem', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {isInstructor ? 'Learner' : 'Faculty'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: relatedProfile?.profilePicUrl ? `url(${relatedProfile.profilePicUrl}) center/cover` : 'var(--bg-secondary)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          {!relatedProfile?.profilePicUrl && <User size={14} />}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {relatedProfile?.fullName || (isInstructor ? `Student #${transaction.studentId}` : course?.instructorName || 'Teacher')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      ₹{Number(transaction.amount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: isSuccess ? '#10b981' : '#ef4444' }}>
                      {transaction.status}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="glass-btn-secondary" style={{ padding: '0.6rem', borderRadius: '0.75rem' }} onClick={() => toast.info('Receipt export can be added next.')}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '2rem', border: '2px dashed var(--border-color)' }}>
              <Wallet size={56} style={{ color: 'var(--text-secondary)', opacity: 0.2, marginBottom: '2rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>No Matches Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 0' }}>Adjust your search or filters to find specific transactions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
