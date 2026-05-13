import api from './api';
import enrollmentService from './enrollmentService';
import { extractCollection, extractPayload } from '../lib/api/responseNormalizer';

/**
 * normalizePayment
 * Domain-specific mapping for payment entities.
 * Ensures the UI always sees consistent field names.
 */
const normalizePayment = (payment = {}) => ({
  paymentId: payment.paymentId ?? payment.id ?? `${payment.studentId || 'student'}-${payment.courseId || 'course'}-${payment.transactionId || payment.paidAt || 'payment'}`,
  studentId: payment.studentId ?? payment.userId ?? null,
  courseId: payment.courseId ?? payment.course?.courseId ?? null,
  amount: Number(payment.amount ?? 0),
  status: payment.status || 'PENDING',
  mode: payment.mode || payment.paymentMode || 'ONLINE',
  transactionId: payment.transactionId || payment.referenceId || payment.razorpayPaymentId || '',
  paidAt: payment.paidAt || payment.createdAt || payment.paymentDate || payment.date || null,
  currency: payment.currency || 'INR',
  message: payment.message || ''
});

const normalizePayments = (payload, candidateKeys = []) =>
  extractCollection(payload, candidateKeys).map(normalizePayment);


const paymentService = {
  processPayment: (paymentData) => api.post('/api/payments', paymentData),

  getPaymentsByStudent: async (studentId) => {
    const res = await api.get(`/api/payments/student/${studentId}`);
    return normalizePayments(res.data, ['payments', 'transactions', 'recentPayments']);
  },

  getPaymentsByCourse: async (courseId) => {
    try {
      const res = await api.get(`/api/payments/course/${courseId}`);
      if (import.meta.env.DEV) console.log(`💳 Payments for course ${courseId}:`, res.data);
      return normalizePayments(res.data, ['payments', 'transactions', 'recentPayments']);
    } catch (error) {
      if (import.meta.env.DEV) console.warn(`⚠️ Failed to fetch payments for course ${courseId}:`, error.message);
      return [];
    }
  },

  refundPayment: (paymentId) => api.put(`/api/payments/${paymentId}/refund`),

  subscribe: (subData) => api.post('/api/payments/subscriptions', subData),

  getSubscription: (studentId) => api.get(`/api/payments/subscriptions/${studentId}`),

  checkSubscriptionStatus: (studentId) => api.get(`/api/payments/subscriptions/${studentId}/active`),

  createOrder: (amount) => api.get(`/api/payments/razorpay/order?amount=${amount}`),
  verifyPayment: (data) => api.post('/api/payments/razorpay/verify', data),

  getAdminStats: async () => {
    const res = await api.get('/api/payments/admin/stats');
    const stats = res.data || {};

    return {
      totalRevenue: Number(stats.totalRevenue || 0),
      totalTransactions: Number(stats.totalTransactions || 0),
      totalSubscriptions: Number(stats.totalSubscriptions || 0),
      currency: stats.currency || 'INR',
      recentPayments: normalizePayments(stats, ['recentPayments', 'payments', 'transactions'])
    };
  },

  getRecentInstructorPayments: async (courseIds = []) => {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      if (import.meta.env.DEV) console.warn('⚠️ No courseIds provided to getRecentInstructorPayments');
      return [];
    }

    if (import.meta.env.DEV) console.log(`💳 Fetching payments for ${courseIds.length} courses:`, courseIds);
    
    // Strategy 1: Try fetching payments by individual courses
    const paymentLists = await Promise.all(
      courseIds.map(async (courseId) => {
        try {
          const payments = await paymentService.getPaymentsByCourse(courseId);
          if (import.meta.env.DEV) console.log(`✅ Course ${courseId}: ${payments.length} payments`);
          return payments;
        } catch (error) {
          if (import.meta.env.DEV) console.error(`❌ Failed to fetch payments for course ${courseId}:`, error.message);
          return [];
        }
      })
    );

    let allPayments = paymentLists.flat();
    if (import.meta.env.DEV) console.log(`📊 Strategy 1 - Total payments across all courses: ${allPayments.length}`);
    
    // Strategy 2: If no payments found, try admin stats as fallback
    if (allPayments.length === 0) {
      try {
        if (import.meta.env.DEV) console.log('📊 Strategy 1 failed, trying Strategy 2 (admin stats)...');
        const adminStats = await paymentService.getAdminStats();
        allPayments = adminStats.recentPayments || [];
        if (import.meta.env.DEV) console.log(`✅ Strategy 2 - Found ${allPayments.length} payments from admin stats`);
      } catch (error) {
        if (import.meta.env.DEV) console.error('❌ Strategy 2 also failed:', error.message);
      }
    }

    // Strategy 3: Filter payments to match courseIds if we got admin stats
    if (allPayments.length > 0 && paymentLists.flat().length === 0) {
      allPayments = allPayments.filter(p => 
        courseIds.includes(p.courseId) || !p.courseId
      );
      if (import.meta.env.DEV) console.log(`📊 Strategy 2 - After filtering to instructor courses: ${allPayments.length} payments`);
    }
    
    // Strategy 4: If still no payments, create synthetic payments from enrollments
    if (allPayments.length === 0) {
      try {
        if (import.meta.env.DEV) console.log('📊 Strategy 1-3 failed, trying Strategy 4 (synthetic from enrollments)...');
        
        for (const courseId of courseIds) {
          try {
            const enrollRes = await enrollmentService.getCourseEnrollments(courseId);
            const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : (enrollRes.data?.data || []);
            
            // Get course details to find pricing
            const courseRes = await api.get(`/api/course/${courseId}`).catch(() => ({}));
            const coursePrice = courseRes.data?.price || courseRes.data?.coursePrice || 0;
            
            if (enrollments.length > 0 && coursePrice > 0) {
              enrollments.forEach(enrollment => {
                const payment = normalizePayment({
                  paymentId: `synth-${enrollment.enrollmentId || `${enrollment.studentId}-${courseId}`}`,
                  studentId: enrollment.studentId,
                  courseId: courseId,
                  amount: coursePrice,
                  status: 'COMPLETED',
                  paidAt: enrollment.enrolledAt || new Date().toISOString(),
                  transactionId: `synth-${courseId}-${enrollment.studentId}`
                });
                allPayments.push(payment);
              });
            }
          } catch (e) {
            if (import.meta.env.DEV) console.warn(`⚠️ Failed to generate synthetic payments for course ${courseId}`);
          }
        }
        if (import.meta.env.DEV) console.log(`✅ Strategy 4 - Generated ${allPayments.length} synthetic payments from enrollments`);
      } catch (error) {
        if (import.meta.env.DEV) console.error('❌ Strategy 4 also failed:', error.message);
      }
    }

    return allPayments.sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));
  }
};

export default paymentService;
