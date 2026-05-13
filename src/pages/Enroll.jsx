import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { ShieldCheck, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';
import enrollmentService from '../services/enrollmentService';
import paymentService from '../services/paymentService';
import { getAuthUser } from '../utils/auth';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

const Enroll = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const user = getAuthUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Pre-load Razorpay SDK for instant availability
    const loadRazorpay = () => {
      if (window.Razorpay) return;
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();

    const fetchCourseAndCheckEnrollment = async () => {
      try {
        if (user) {
          const userId = user.userId || user.id;
          const enrollRes = await enrollmentService.checkEnrollment(userId, courseId);
          if (enrollRes.data === true) {
            toast.info("You are already enrolled in this course!");
            navigate(`/student/course/${courseId}/lessons`);
            return;
          }
        }
        const res = await api.get(`/api/course/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        toast.error("Failed to load course details.");
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseAndCheckEnrollment();
  }, [courseId, user?.userId, navigate]);

  const handleEnrollment = async () => {
    if (!user || !course) return;
    
    // Check if course is free
    if (course.price === 0) {
      setIsProcessing(true);
      try {
        const userId = user.userId || user.id;
        await enrollmentService.enroll(userId, courseId, 0);
        queryClient.invalidateQueries(['studentEnrollments']);
        queryClient.invalidateQueries(['isEnrolled']);
        toast.success("Successfully enrolled in " + course.title);
        navigate(`/student/course/${courseId}/lessons`, { replace: true });
      } catch (err) {
        console.error("Enrollment failed:", err);
        toast.error("Enrollment failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Paid Enrollment Flow
    setIsProcessing(true);
    try {
      // One final check to prevent race conditions / duplicate payments
      const userId = user.userId || user.id;
      const enrollRes = await enrollmentService.checkEnrollment(userId, courseId);
      if (enrollRes.data === true) {
        toast.info("You are already enrolled!");
        navigate(`/student/course/${courseId}/lessons`);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment system is still loading. Please wait a second.");
        setIsProcessing(false);
        return;
      }
      
      // 1. Create Razorpay Order
      const orderRes = await paymentService.createOrder(course.price);
      const orderId = orderRes.data;

      // 2. Open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SiTlZWKxygz5Es',
        amount: course.price * 100,
        currency: "INR",
        name: "EduLearn LMS",
        description: `Enrollment for ${course.title}`,
        order_id: orderId,
        handler: async (response) => {
          // Immediately show a loading state while processing verification
          setIsProcessing(true);
          toast.info("Processing your payment...", { autoClose: 2000 });

          try {
            // 3. Verify Payment
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            
            const isVerified = await paymentService.verifyPayment(verifyData);
            
            if (isVerified.data) {
              // 4. Record Payment & 5. Enroll Student (Parallel for speed)
              await Promise.all([
                paymentService.processPayment({
                  studentId: userId,
                  courseId: Number(courseId),
                  amount: course.price,
                  mode: 'ONLINE',
                  transactionId: response.razorpay_payment_id,
                  currency: 'INR',
                  courseTitle: course.title
                }),
                enrollmentService.enroll(userId, courseId, course.price)
              ]);
              
              queryClient.invalidateQueries(['studentEnrollments']);
              queryClient.invalidateQueries(['isEnrolled']);
              toast.success("Welcome aboard! Your course is ready.");
              // Pass enrolled state to Lessons.jsx to skip initial check
              navigate(`/student/course/${courseId}/lessons`, { 
                replace: true,
                state: { enrolled: true, courseId: Number(courseId) }
              });
            } else {
              toast.error("Payment verification failed.");
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Post-payment error:", err);
            toast.error("Enrollment finalizing...");
            // Even if verification UI fails, if payment was successful, the student might be enrolled via background events.
            // But for UX, we try to redirect if they likely succeeded.
            navigate(`/student/course/${courseId}/lessons`, { replace: true });
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false)
        },
        prefill: {
          name: user.fullName || "",
          email: user.email || "",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
          toast.error("Payment failed: " + response.error.description);
          setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("Could not initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="centered-message">Preparing Enrollment...</div>;

  return (
    <div className="main-content" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
      <button onClick={() => navigate(-1)} className="glass-btn-secondary" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowLeft size={16} /> Back to Course
      </button>

      <div 
        className="glass-panel animate-scale-in"
        style={{ padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Zap size={32} color="#6366f1" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '0.5rem' }}>Start Your Journey</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>You are about to join <span style={{ color: 'var(--text-primary)' }}>{course.title}</span></p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '2.5rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Price</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 950, color: '#10b981' }}>
                {course.price === 0 ? 'FREE' : `₹${course.price}`}
              </span>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <ShieldCheck size={18} color="#10b981" />
              <span>Instant Access Granted</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <CheckCircle size={18} color="#10b981" />
              <span>Full Curriculum & Assessments</span>
           </div>
        </div>

        <button 
          onClick={handleEnrollment}
          disabled={isProcessing}
          className="glass-btn-primary" 
          style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 950, background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
        >
          {isProcessing ? 'PROCESSING...' : (course.price === 0 ? 'ENROLL NOW' : `PAY & ENROLL`)}
        </button>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          By clicking the button above, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Enroll;
