import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Video, FileText, CheckCircle, Clock, ChevronUp, ChevronDown, Save, ArrowLeft, HelpCircle, Zap, FileQuestion, FileCheck } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';
import assessmentService from '../../services/assessmentService';
import enrollmentService from '../../services/enrollmentService';
import notificationService from '../../services/notificationService';
import QuizEditor from '../../components/instructor/QuizEditor';
import { findQuizForLesson } from '../../utils/quiz';
import '../../styles/pages/CurriculumBuilder.css';

export default function CurriculumBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', description: '', videoUrl: '', resourceUrl: '',
    durationMinutes: 10, orderIndex: 1, preview: false
  });

  useEffect(() => {
    if (!courseId || isNaN(parseInt(courseId))) {
      toast.error("Invalid Course ID.");
      navigate('/instructor/dashboard');
      return;
    }
    fetchCourseAndLessons();
  }, [courseId]);

  const fetchCourseAndLessons = async () => {
    setIsLoading(true);
    try {
      const [courseRes, lessonsRes, quizzesRes] = await Promise.all([
        api.get(`/api/course/${courseId}`),
        api.get(`/api/lesson/course/${courseId}`),
        assessmentService.getQuizzesByCourse(courseId).catch(() => ({ data: [] }))
      ]);
      setCourse(courseRes.data);
      const sortedLessons = (Array.isArray(lessonsRes.data) ? lessonsRes.data : []).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setLessons(sortedLessons);
      setQuizzes(quizzesRes.data || []);
      
      const totalDuration = sortedLessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0);
      if (courseRes.data?.totalDuration !== totalDuration) {
        api.put(`/api/course/${courseId}/duration?duration=${totalDuration}`).catch(() => {});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQuizEditor = async (lesson) => {
    setEditingLesson(lesson);
    const lessonQuiz = findQuizForLesson(quizzes, lesson);
    if (lessonQuiz) {
      try {
        const qRes = await assessmentService.getQuestions(lessonQuiz.quizId);
        lessonQuiz.questions = qRes.data;
      } catch (err) {}
      setActiveQuiz({ ...lessonQuiz });
    } else {
      setActiveQuiz({ title: `${lesson.title} - Quiz`, description: `Assessment for ${lesson.title}`, courseId: parseInt(courseId) });
    }
    setIsQuizModalOpen(true);
  };

  const handleOpenModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title, description: lesson.description || '', videoUrl: lesson.videoUrl || '',
        resourceUrl: lesson.resourceUrl || '', durationMinutes: lesson.durationMinutes || 10,
        orderIndex: lesson.orderIndex || 1, preview: lesson.preview || false
      });
    } else {
      setEditingLesson(null);
      setFormData({ title: '', description: '', videoUrl: '', resourceUrl: '', durationMinutes: 10, orderIndex: lessons.length + 1, preview: false });
    }
    setIsModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = { ...formData, courseId: parseInt(courseId) };
      if (editingLesson) await api.put(`/api/lesson/${editingLesson.lessonId}`, payload);
      else await api.post('/api/lesson', payload);
      toast.success("Curriculum updated.");
      setIsModalOpen(false);
      fetchCourseAndLessons();
    } catch (error) {
      toast.error("Failed to save lesson.");
    } finally { setIsSaving(false); }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try { await api.delete(`/api/lesson/${lessonId}`); toast.success("Deleted."); fetchCourseAndLessons(); }
    catch (err) { toast.error("Delete failed."); }
  };

  const handlePublishToggle = async (lessonId) => {
    try {
      await api.put(`/api/lesson/publish/${lessonId}`);
      fetchCourseAndLessons();
    } catch (err) { toast.error("Status update failed."); }
  };

  const handleMoveLesson = async (index, direction) => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= lessons.length) return;
    const lA = lessons[index]; const lB = lessons[newIdx];
    const oldA = lA.orderIndex; lA.orderIndex = lB.orderIndex; lB.orderIndex = oldA;
    try {
      await Promise.all([api.put(`/api/lesson/${lA.lessonId}`, lA), api.put(`/api/lesson/${lB.lessonId}`, lB)]);
      fetchCourseAndLessons();
    } catch (err) {}
  };

  if (isLoading) return <div className="centered-message"><div className="loading-spinner"></div><p>Syncing Structure...</p></div>;

  return (
    <div className="curriculum-builder-container">
      
      {/* HEADER: RESPONSIVE VERSION */}
      <header 
        className="curriculum-header animate-fade-in"
      >
        <div className="header-info">
          <button onClick={() => navigate('/instructor/dashboard')} className="glass-btn-secondary back-btn">
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="step-badge">
            <span className="step-text">Step 2: Curriculum Architecture</span>
          </div>
          <h1 className="page-title">Curriculum <span className="text-gradient">Builder</span></h1>
          <p className="course-name">Course: {course?.title}</p>
        </div>
        
        <div className="header-actions">
          {course && !(course.isPublished || course.published) && (
            <button onClick={async () => { await api.put(`/api/course/publish/${courseId}`); fetchCourseAndLessons(); toast.success("Live!"); }} className="glass-btn-primary publish-btn">🚀 Go Live</button>
          )}
          <button onClick={() => handleOpenModal()} className="glass-btn-primary new-lesson-btn">
            <Plus size={18} /> New Lesson
          </button>
        </div>
      </header>

      <div className="curriculum-grid">
        
        {/* LEFT: LESSON STACK */}
        <div className="lesson-stack">
          {lessons.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} className="empty-icon" />
              <h3 className="empty-title">Empty Curriculum</h3>
              <p className="empty-text">Click "New Lesson" to start building.</p>
            </div>
          ) : (
            lessons.map((lesson, idx) => (
              <div 
                key={lesson.lessonId}
                className="curriculum-lesson-card animate-slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="lesson-reorder-btns">
                  <button onClick={() => handleMoveLesson(idx, 'up')} disabled={idx === 0} className="reorder-btn"><ChevronUp size={16} /></button>
                  <button onClick={() => handleMoveLesson(idx, 'down')} disabled={idx === lessons.length -1} className="reorder-btn"><ChevronDown size={16} /></button>
                </div>
                
                <div className="lesson-index-badge">{idx + 1}</div>
                
                <div className="lesson-info">
                  <h4 className="lesson-title">{lesson.title}</h4>
                  <div className="lesson-meta">
                    <span className="meta-item"><Clock size={12} /> {lesson.durationMinutes}m</span>
                    {lesson.videoUrl && <span className="meta-item"><Video size={12} /> Video</span>}
                    {lesson.preview && <span className="meta-item preview-label">Preview Allowed</span>}
                  </div>
                </div>

                <div className="lesson-actions">
                  <button 
                    onClick={() => handlePublishToggle(lesson.lessonId)} 
                    className={`status-btn ${lesson.published ? 'published' : 'draft'}`}
                  >
                    {lesson.published ? 'LIVE' : 'DRAFT'}
                  </button>
                  <div className="action-group">
                    {(() => {
                      const hasQuiz = !!findQuizForLesson(quizzes, lesson);
                      return (
                        <button 
                          onClick={() => handleOpenQuizEditor(lesson)} 
                          className={`action-btn ${hasQuiz ? 'has-quiz' : ''}`} 
                          title={hasQuiz ? "Edit Quiz" : "Add Quiz"}
                        >
                          {hasQuiz ? <CheckCircle size={16} className="quiz-status-icon" /> : <FileQuestion size={16} />}
                          <span className="action-label">QUIZ</span>
                        </button>
                      );
                    })()}
                    <button onClick={() => handleOpenModal(lesson)} className="action-btn" title="Edit"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteLesson(lesson.lessonId)} className="action-btn delete" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* RIGHT: COURSE SUMMARY */}
        <div className="summary-sidebar">
          <div className="summary-card">
            <div className="card-accent-line"></div>
            <h4 className="summary-header">Curriculum <span className="text-gradient">Pulse</span></h4>
            <div className="summary-stats">
              <div className="stat-box">
                <div className="stat-icon-wrapper lessons">
                  <FileText size={18} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{lessons.length}</div>
                  <div className="stat-label">LESSONS</div>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon-wrapper duration">
                  <Clock size={18} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)}</div>
                  <div className="stat-label">MINUTES</div>
                </div>
              </div>
            </div>
            
            <div className="summary-footer">
              <div className="progress-mini-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min((lessons.length / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="progress-text">{lessons.length >= 10 ? 'Course is robust' : `${10 - lessons.length} more lessons recommended`}</span>
            </div>
          </div>
          
          <div className="tip-card">
            <div className="tip-icon-glow">
              <Zap size={20} fill="#f59e0b" color="#f59e0b" />
            </div>
            <div className="tip-content">
              <h4 className="tip-header">Pro Optimization</h4>
              <p className="tip-text">
                Enable <b>Free Previews</b> for your introductory lessons. Data shows this increases enrollment by up to <span className="highlight-text">40%</span>.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* COMPACT MODAL */}
      {/* COMPACT MODAL */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div 
              className="lesson-modal animate-scale-in"
            >
              <h2 className="modal-title">{editingLesson ? 'Refine Lesson' : 'Add Content'}</h2>
              <form onSubmit={handleSaveLesson} className="lesson-form">
                <div className="input-group">
                  <label>Lesson Title</label>
                  <input className="glass-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Intro to Architecture" />
                </div>
                <div className="input-group">
                  <label>Video Link</label>
                  <input className="glass-input" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube/Vimeo/Direct Link" />
                </div>
                <div className="modal-form-grid">
                  <div className="input-group">
                    <label>Duration (Min)</label>
                    <input type="number" className="glass-input" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>Order Index</label>
                    <input type="number" className="glass-input" value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Lesson Notes (Markdown)</label>
                  <textarea className="glass-input" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="checkbox-group">
                  <input type="checkbox" checked={formData.preview} onChange={e => setFormData({...formData, preview: e.target.checked})} id="preview-check" />
                  <label htmlFor="preview-check">Allow Free Preview</label>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={isSaving} className="glass-btn-primary save-btn">{isSaving ? 'Saving...' : 'Save Lesson'}</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="glass-btn-secondary cancel-btn">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      {/* End Modal */}

      {/* Quiz Modal */}
        {isQuizModalOpen && (
          <div className="modal-overlay quiz-overlay">
            <div className="quiz-modal animate-scale-in">
              <QuizEditor courseId={courseId} quiz={activeQuiz} onSave={async () => { setIsQuizModalOpen(false); await fetchCourseAndLessons(); }} onCancel={() => setIsQuizModalOpen(false)} />
            </div>
          </div>
        )}
      {/* End Quiz Modal */}

      <style>{`
        .curriculum-builder-container {
          width: 100%;
          max-width: 1250px;
          margin: 0 auto;
          padding: 1rem 4vw 6rem;
        }

        .curriculum-header {
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .header-info { flex: 1 1 300px; }
        .back-btn { padding: 0.4rem 1rem; border-radius: 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
        .step-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(99, 102, 241, 0.08); padding: 0.3rem 0.8rem; border-radius: 2rem; margin-bottom: 0.75rem; border: 1px solid rgba(99, 102, 241, 0.15); }
        .step-text { font-size: 0.65rem; font-weight: 950; color: #6366f1; text-transform: uppercase; letter-spacing: 0.15em; }
        .page-title { font-size: clamp(1.5rem, 4vw, 1.8rem); font-weight: 950; margin: 0; letter-spacing: -0.03em; }
        .course-name { color: var(--text-secondary); font-size: 0.9rem; font-weight: 600; margin-top: 0.5rem; }

        .header-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .publish-btn { background: #10b981; padding: 0.75rem 1.5rem; border-radius: 1rem; font-size: 0.9rem; flex: 1 1 auto; }
        .new-lesson-btn { padding: 0.75rem 1.5rem; border-radius: 1rem; font-size: 0.9rem; flex: 1 1 auto; }

        .curriculum-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2.5rem;
          align-items: start;
        }

        .lesson-stack { display: flex; flex-direction: column; gap: 1rem; }
        .empty-state { padding: 4rem; text-align: center; border: 2px dashed var(--border-color); border-radius: 2rem; background: rgba(255,255,255,0.01); }
        .empty-icon { opacity: 0.2; margin-bottom: 1rem; }
        .empty-title { font-weight: 800; }
        .empty-text { color: var(--text-secondary); }

        .curriculum-lesson-card {
          padding: 0.75rem 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          flex-wrap: wrap;
        }

        .curriculum-lesson-card:hover {
          border-color: var(--page-primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .lesson-reorder-btns { display: flex; flex-direction: column; gap: 4px; }
        .reorder-btn { padding: 2px; background: transparent; border: none; cursor: pointer; color: var(--text-secondary); }
        .lesson-index-badge { width: 32px; height: 32px; background: rgba(99,102,241,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.9rem; color: #6366f1; flex-shrink: 0; }
        .lesson-info { flex: 1 1 200px; min-width: 0; }
        .lesson-title { margin: 0; font-size: 1rem; font-weight: 900; word-break: break-word; }
        .lesson-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; font-weight: 700; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; }
        .preview-label { color: #10b981; }

        .lesson-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; flex: 1 1 auto; }
        .status-btn { padding: 0.4rem 0.8rem; border-radius: 0.6rem; font-size: 0.65rem; font-weight: 950; border: 1px solid currentColor; white-space: nowrap; cursor: pointer; transition: background-color 0.2s, color 0.2s, border-color 0.2s; }
        .status-btn.published { background: rgba(16,185,129,0.1); color: #10b981; }
        .status-btn.draft { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .action-group { display: flex; gap: 0.5rem; }
        .action-btn { 
          display: flex; 
          align-items: center; 
          gap: 0.4rem; 
          padding: 0.4rem 0.75rem; 
          background: rgba(255,255,255,0.02); 
          border: 1px solid var(--border-color); 
          border-radius: 0.75rem; 
          color: var(--text-secondary); 
          cursor: pointer; 
          transition: background-color 0.2s, color 0.2s, border-color 0.2s; 
        }
        .action-btn:hover { 
          background: rgba(255,255,255,0.05); 
          border-color: var(--page-primary); 
          color: var(--page-primary);
        }
        .action-btn.has-quiz {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }
        .action-btn.has-quiz:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
        }
        .action-label { font-size: 0.65rem; font-weight: 950; letter-spacing: 0.05em; }
        .quiz-status-icon { color: #10b981; }
        .delete { color: #ef4444 !important; }

        /* SIDEBAR PREMIUM STYLING */
        .summary-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .summary-card { 
          position: relative;
          padding: 1.75rem; 
          border-radius: 1.75rem; 
          background: linear-gradient(165deg, var(--card-bg) 0%, rgba(99, 102, 241, 0.03) 100%); 
          border: 1px solid var(--border-color); 
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .card-accent-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #ec4899);
          opacity: 0.8;
        }

        .summary-header { 
          margin: 0 0 1.5rem 0; 
          font-size: 0.85rem; 
          font-weight: 950; 
          text-transform: uppercase; 
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .summary-stats { display: flex; flex-direction: column; gap: 1.25rem; }
        
        .stat-box { 
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem; 
          background: rgba(255,255,255,0.03); 
          border-radius: 1.25rem; 
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.3s ease;
        }
        
        .stat-box:hover {
          transform: translateX(5px);
          background: rgba(255,255,255,0.05);
        }

        .stat-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-icon-wrapper.lessons { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
        .stat-icon-wrapper.duration { background: rgba(16, 185, 129, 0.15); color: #34d399; }

        .stat-value { font-size: 1.6rem; font-weight: 950; line-height: 1; }
        .stat-label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); margin-top: 2px; }

        .summary-footer { margin-top: 1.5rem; }
        .progress-mini-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 0.75rem; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 10px; transition: width 1s ease-out; }
        .progress-text { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); }

        .tip-card { 
          display: flex;
          gap: 1.25rem;
          padding: 1.5rem; 
          border-radius: 1.75rem; 
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%); 
          border: 1px solid rgba(245, 158, 11, 0.15); 
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.05);
        }
        
        .tip-icon-glow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
        }

        .tip-header { margin: 0 0 0.4rem 0; font-size: 0.95rem; font-weight: 900; color: #f59e0b; }
        .tip-text { margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; }
        .highlight-text { color: #10b981; font-weight: 950; }

        /* MODAL */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; backdrop-filter: blur(8px); z-index: 1000; padding: 1rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); }
        .lesson-modal { width: 100%; max-width: 600px; padding: min(2rem, 5vw); border-radius: 2rem; background: var(--card-bg); border: 1px solid var(--border-color); max-height: 95vh; overflow-y: auto; }
        .modal-title { margin: 0 0 1.5rem 0; font-size: 1.4rem; font-weight: 950; }
        .lesson-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .input-group label { display: block; margin-bottom: 0.4rem; font-weight: 800; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
        .glass-input { width: 100%; padding: 0.75rem 1rem; border-radius: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: white; outline: none; transition: border-color 0.2s; }
        .glass-input:focus { border-color: #6366f1; }
        .modal-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .checkbox-group { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border-color); }
        .checkbox-group label { margin: 0; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
        .form-actions { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
        .save-btn { flex: 2 1 200px; padding: 0.85rem; font-weight: 950; border-radius: 0.75rem; }
        .cancel-btn { flex: 1 1 100px; padding: 0.85rem; font-weight: 800; border-radius: 0.75rem; }

        .quiz-modal { width: 95%; max-width: 900px; padding: min(1.5rem, 4vw); max-height: 90vh; overflow-y: auto; border-radius: 2rem; background: var(--card-bg); border: 1px solid var(--border-color); }

        @media (max-width: 1100px) {
          .curriculum-grid { grid-template-columns: 1fr 280px; gap: 1.5rem; }
        }

        @media (max-width: 950px) {
          .curriculum-grid { grid-template-columns: 1fr; }
          .summary-sidebar { order: -1; }
        }

        @media (max-width: 650px) {
          .curriculum-lesson-card {
            padding: 1rem;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .lesson-reorder-btns {
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            order: 5;
            border-top: 1px solid var(--border-color);
            padding-top: 0.75rem;
          }

          .lesson-index-badge {
            order: 1;
          }

          .lesson-info {
            order: 2;
            width: calc(100% - 45px);
          }

          .lesson-actions {
            width: 100%;
            justify-content: space-between;
            order: 3;
            margin-top: 0.5rem;
          }

          .modal-form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .curriculum-header {
            align-items: center;
            text-align: center;
          }
          .header-info {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .header-actions {
            width: 100%;
          }
          .header-actions button {
            width: 100%;
          }
          
          .lesson-info {
             width: 100%;
          }
          .lesson-index-badge {
             position: absolute;
             top: 1rem;
             right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
