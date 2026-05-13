import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Send, Award, XCircle, RotateCcw, Zap, Target, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import assessmentService from '../../services/assessmentService';
import { useTheme } from '../../context/ThemeContext';

export default function QuizPlayer({ quiz, studentId, onComplete }) {
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState('ready'); // 'ready', 'active', 'submitting', 'finished'
  const [results, setResults] = useState(null);
  const [startError, setStartError] = useState(null);
  const { isDarkMode } = useTheme();

  const [questions, setQuestions] = useState(quiz.questions || []);
  const [questionsLoading, setQuestionsLoading] = useState(!quiz.questions || quiz.questions.length === 0);
  const timerRef = useRef(null);
  const submitHandledRef = useRef(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStartError(null);
    if (!quiz.questions || quiz.questions.length === 0) {
      loadQuestions();
    }
  }, [quiz.quizId]);

  // Auto-start is removed. Player now waits for user to click Start.

  const loadQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const res = await assessmentService.getQuestions(quiz.quizId);
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Failed to load quiz questions:", err);
      toast.error("Could not load quiz questions.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0 && !submitHandledRef.current) {
            submitHandledRef.current = true;
            handleSubmit();
          }
          return Math.max(0, newTime);
        });
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else if (timerRef.current && status !== 'active') {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, timeLeft]);

  const handleStart = async () => {
    if (status === 'loading' || status === 'active' || status === 'submitting') return;
    if (!studentId) {
      toast.error("Please log in to attempt the quiz.");
      return;
    }
    try {
      setStartError(null);
      setStatus('loading');
      submitHandledRef.current = false;
      // The service expects (quizId, studentId) - let's be explicit
      const res = await assessmentService.startAttempt(Number(quiz.quizId), Number(studentId));
      setAttempt(res.data);
      setTimeLeft((quiz.timeLimitMinutes || 30) * 60);
      setStatus('active');
      toast.success("Assessment started! You've got this.");
    } catch (error) {
      console.error("Start Attempt Error:", error);
      const msg = error.response?.data?.message || "Assessment is currently unavailable. Please try again later.";
      setStartError(msg);
      // Only toast if it's not the same error we already have displayed
      if (msg !== startError) {
        toast.error(msg);
      }
      setStatus('ready');
    }
  };

  const handleOptionSelect = (option) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIdx].questionId]: option
    });
  };

  const handleSubmit = async () => {
    if (status === 'submitting' || submitHandledRef.current) return;

    submitHandledRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('submitting');
    try {
      const res = await assessmentService.submitAttempt(attempt.attemptId, answers);
      setResults(res.data);
      setStatus('finished');
      toast.success("Assessment submitted successfully!");
    } catch (error) {
      console.error("Submit Attempt Error:", error);
      toast.error("Failed to submit assessment.");
      submitHandledRef.current = false;
      setStatus('active');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeft < 60;
  const answeredCount = Object.keys(answers).length;

  // ─── READY STATE ───────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Initializing Assessment...</p>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Zap size={36} color="#6366f1" />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{quiz.title?.replace(/\[L-\d+\]/g, '').trim()}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{questions.length} Questions · {quiz.timeLimitMinutes || 30} Minutes · {quiz.passingScore}% to Pass</p>
        {startError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{startError}</p>}
        <button
          className="hover-scale"
          onClick={handleStart}
          disabled={questionsLoading || questions.length === 0}
          style={{
            padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '1rem', color: 'white',
            cursor: questionsLoading ? 'wait' : 'pointer',
            boxShadow: '0 10px 25px rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 auto',
            transition: 'all 0.2s'
          }}
        >
          <Zap size={20} /> {questionsLoading ? 'Loading Questions...' : 'Start Assessment'}
        </button>
      </div>
    );
  }

  // ─── ACTIVE STATE ──────────────────────────────────────────────────────
  if (status === 'active' || status === 'submitting') {
    const currentQuestion = questions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / questions.length) * 100;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Top Bar: Timer + Progress + Finish */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '1rem',
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: 800,
              border: `2px solid ${isTimeCritical ? 'rgba(239,68,68,0.5)' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
              background: isTimeCritical ? 'rgba(239,68,68,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
              color: isTimeCritical ? '#ef4444' : 'var(--page-primary)',
              boxShadow: isTimeCritical ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <Clock size={22} className={isTimeCritical ? "pulse-animation" : ""} />
              {formatTime(timeLeft)}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>Question</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {currentQuestionIdx + 1} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>/ {questions.length}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>Answers</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{answeredCount} / {questions.length}</p>
            </div>
            <button
              onClick={handleSubmit}
              className="glass-btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem',
                fontSize: '0.9rem',
                fontWeight: 900,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                boxShadow: '0 10px 20px rgba(239, 68, 68, 0.1)'
              }}
            >
              <Send size={18} style={{ marginRight: '0.5rem' }} /> Submit Quiz
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '999px', marginBottom: '2rem', overflow: 'hidden' }}>
          <div
            style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '999px', width: `${progress}%`, transition: 'width 0.4s ease-out' }}
          />
        </div>

        {/* Question Navigation Dots */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q.questionId] !== undefined;
            const isCurrent = idx === currentQuestionIdx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIdx(idx)}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '0.5rem',
                  border: isCurrent ? '2px solid #818cf8' : (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'),
                  background: isCurrent ? 'rgba(99,102,241,0.2)' : isAnswered ? 'rgba(16,185,129,0.15)' : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                  color: isCurrent ? '#818cf8' : isAnswered ? '#34d399' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
          <div
            key={currentQuestionIdx}
            className="glass-panel animate-fade-in"
            style={{ padding: '2rem', borderRadius: '1rem' }}
          >
            {/* Question Number Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Question {currentQuestionIdx + 1}
              </span>
              {currentQuestion?.marks && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '0.5rem' }}>
                  {currentQuestion.marks} pts
                </span>
              )}
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2.5rem', lineHeight: 1.4, letterSpacing: '-0.02em' }}>
              {currentQuestion?.text}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentQuestion?.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.questionId] === option;
                const labels = ['A', 'B', 'C', 'D'];
                return (
                  <div
                    key={idx}
                    className="hover-lift"
                    onClick={() => handleOptionSelect(option)}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: '1.25rem',
                      border: `2px solid ${isSelected ? 'var(--page-primary)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                      background: isSelected ? 'rgba(99,102,241,0.1)' : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: '1rem',
                      background: isSelected ? 'var(--page-primary)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}>
                      {labels[idx] || idx + 1}
                    </div>
                    <span style={{ fontSize: '1.1rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 700 : 500 }}>
                      {option}
                    </span>
                    {isSelected && (
                      <div className="animate-scale-in" style={{ marginLeft: 'auto' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--page-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={16} color="white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        {/* End Question Card */}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
            className="glass-btn-secondary"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.5rem',
              opacity: currentQuestionIdx === 0 ? 0.3 : 1,
              cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={18} /> Previous
          </button>

          {currentQuestionIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
              className="glass-btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.5rem'
              }}
            >
              Next Question <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="hover-scale"
              onClick={handleSubmit}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '0.75rem',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              Submit Assessment <Send size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── FINISHED STATE ────────────────────────────────────────────────────
  if (status === 'finished') {
    const passed = results?.passed;
    const score = results?.score || 0;

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div
        className="animate-slide-up"
        style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}
      >
        <div style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2.5rem',
          padding: '4rem 3rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Animated Score Circle */}
          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 2.5rem' }}>
            <svg width="160" height="160" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="10" fill="none" />
              <circle
                cx="60" cy="60" r="52"
                stroke={passed ? '#10b981' : '#ef4444'}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ 
                  strokeDashoffset: offset,
                  transition: 'stroke-dashoffset 2s ease-out'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div className="animate-scale-in" style={{ animationDelay: '1s' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: passed ? '#10b981' : '#ef4444', display: 'block' }}>
                  {score}%
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '1.5s' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              {passed ? 'Outstanding Work! 🎉' : 'Keep Pushing! 💪'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
              {passed
                ? "You've mastered this lesson's concepts. Your commitment to excellence is paying off!"
                : "You're getting closer. Review the lesson content and try again to achieve mastery."}
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              marginBottom: '3rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Result</p>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 800,
                  color: passed ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  {passed ? <CheckCircle size={20} /> : <XCircle size={20} />} {passed ? 'PASSED' : 'FAILED'}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Minimum</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {quiz.passingScore}%
                </p>
              </div>
            </div>

            <button
              className="hover-scale"
              onClick={() => onComplete(results)}
              style={{
                padding: '1.25rem 4rem',
                fontSize: '1.1rem',
                fontWeight: 800,
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                background: passed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))',
                border: 'none',
                borderRadius: '1.25rem',
                color: 'white',
                cursor: 'pointer',
                boxShadow: passed ? '0 10px 30px rgba(16, 185, 129, 0.4)' : '0 10px 30px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {passed ? <><CheckCircle size={24} /> Continue to Next Lesson</> : <><RotateCcw size={24} /> Review & Retake</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING STATE ─────────────────────────────────────────────────────
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
      <p style={{ color: 'var(--text-secondary)' }}>Preparing assessment...</p>
    </div>
  );
}
