import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle, HelpCircle, List, Clock, Target, AlertCircle } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import assessmentService from '../../services/assessmentService';

export default function QuizEditor({ courseId, quiz, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 30,
    passingScore: 60,
    courseId: parseInt(courseId),
    published: true,
    isPublished: true
  });

  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'questions'

  useEffect(() => {
    if (quiz) {
      setFormData({
        quizId: quiz.quizId,
        title: quiz.title || '',
        description: quiz.description || '',
        timeLimitMinutes: quiz.timeLimitMinutes || 30,
        passingScore: quiz.passingScore || 60,
        courseId: parseInt(quiz.courseId || courseId),
        published: true,
        isPublished: true
      });
      // In a real app, we might fetch questions separately if not included in quiz object
      // For now, let's assume they might be fetched or passed
      if (quiz.questions) {
        setQuestions(quiz.questions);
      }
    }
  }, [quiz, courseId]);

  const handleAddQuestion = () => {
    const newQuestion = {
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 5,
      orderIndex: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
    setActiveTab('questions');
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    const oldOptionValue = updated[qIndex].options[oIndex];
    
    // Check if the current option was marked as correct
    const wasCorrect = updated[qIndex].correctAnswer === oldOptionValue;
    
    updated[qIndex].options[oIndex] = value;
    
    // If this option was the correct one, sync the correctAnswer field with the new text
    if (wasCorrect) {
      updated[qIndex].correctAnswer = value;
    }
    
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim() === '') {
      toast.warning("Please enter a quiz title.");
      setActiveTab('settings');
      return;
    }

    if (questions.length === 0) {
      toast.warning("Please add at least one question.");
      setActiveTab('questions');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || q.text.trim() === '') {
        toast.warning(`Please enter text for Question ${i + 1}.`);
        setActiveTab('questions');
        return;
      }

      // Ensure all 4 options are filled
      const emptyOptionIndex = q.options.findIndex(opt => !opt || opt.trim() === '');
      if (emptyOptionIndex !== -1) {
        toast.warning(`Question ${i + 1} has an empty option (Option ${emptyOptionIndex + 1}). Please fill all choices.`);
        setActiveTab('questions');
        return;
      }

      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        toast.warning(`Question ${i + 1} needs a correct answer selected.`);
        setActiveTab('questions');
        return;
      }

      if (!q.options.includes(q.correctAnswer)) {
        toast.warning(`The selected correct answer for Question ${i + 1} no longer matches any option text.`);
        setActiveTab('questions');
        return;
      }
    }

    setIsSaving(true);
    try {
      let savedQuiz;
      const quizPayload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim(),
        published: true,
        isPublished: true 
      };

      if (formData.quizId) {
        const res = await assessmentService.updateQuiz(quizPayload);
        savedQuiz = res.data;
      } else {
        const res = await assessmentService.createQuiz(quizPayload);
        savedQuiz = res.data;
      }

      // Save questions
      for (const q of questions) {
        const questionPayload = {
          ...q,
          text: q.text.trim(),
          correctAnswer: q.correctAnswer.trim(),
          options: q.options.map(opt => opt.trim()),
          quizId: savedQuiz.quizId
        };
        await assessmentService.addQuestions(savedQuiz.quizId, questionPayload);
      }

      // Keep lesson quizzes immediately available to students once saved.
      try {
        await assessmentService.publishQuiz(savedQuiz.quizId);
      } catch (publishError) {
        if (import.meta.env.DEV) console.warn('Quiz publish step failed after save:', publishError);
      }

      toast.success("Quiz saved successfully!");
      if (onSave) onSave(savedQuiz);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Save Quiz Error Details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message || error.response?.data;
      
      let displayMessage = "Failed to save quiz. Please check all fields.";
      if (typeof backendMessage === 'string') {
        displayMessage = backendMessage;
      } else if (backendMessage?.error) {
        displayMessage = backendMessage.error;
      } else if (backendMessage?.message) {
        displayMessage = backendMessage.message;
      } else if (status) {
        displayMessage = `Server Status ${status}: ${JSON.stringify(error.response?.data || 'No response body')}`;
      } else {
        displayMessage = `Network Error: ${error.message}. Is the backend service running?`;
      }
        
      toast.error(`❌ ${displayMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '1.5rem', margin: 0, marginBottom: '0.25rem' }}>
            {formData.quizId ? 'Edit Assessment' : 'Create New Assessment'}
          </h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Configure your quiz settings and add questions below</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} className="glass-btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="glass-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSaving ? 'Saving...' : <><Save size={18} /> Save Assessment</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'glass-btn-primary' : 'glass-btn-secondary'}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          ⚙️ General Settings
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={activeTab === 'questions' ? 'glass-btn-primary' : 'glass-btn-secondary'}
          style={{ padding: '0.5rem 1.5rem', position: 'relative' }}
        >
          📝 Add Questions 
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '1rem', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
            {questions.length}
          </span>
        </button>
      </div>

        {activeTab === 'settings' ? (
          <div 
            key="settings"
            className="animate-fade-in"
          >
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Quiz Title</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Module 1 Final Assessment"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Passing Score (%)</label>
                  <div style={{ position: 'relative' }}>
                    <Target style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                    <input 
                      type="number" 
                      className="glass-input" 
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      value={formData.passingScore}
                      onChange={e => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                      min="0" max="100"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Time Limit (Minutes)</label>
                  <div style={{ position: 'relative' }}>
                    <Clock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                    <input 
                      type="number" 
                      className="glass-input" 
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                      value={formData.timeLimitMinutes}
                      onChange={e => setFormData({...formData, timeLimitMinutes: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Description</label>
                <textarea 
                  className="glass-input" 
                  style={{ minHeight: '100px', width: '100%' }}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what this quiz covers..."
                />
              </div>

              {/* Publish Toggle Removed - Synced with Lesson */}
            </div>
          </div>
        ) : (
          <div 
            key="questions"
            className="animate-fade-in"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--page-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ background: 'var(--page-primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    QUESTION {qIdx + 1}
                  </span>
                  <button onClick={() => handleRemoveQuestion(qIdx)} className="icon-btn-circle" style={{ color: '#ef4444' }} title="Remove Question">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ fontSize: '1.1rem', fontWeight: 600, width: '100%' }}
                    placeholder="Type your question here..."
                    value={q.text}
                    onChange={e => handleUpdateQuestion(qIdx, 'text', e.target.value)}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Radio indicator */}
                        <div 
                          onClick={() => handleUpdateQuestion(qIdx, 'correctAnswer', opt)}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            borderColor: q.correctAnswer === opt && opt !== '' ? '#10b981' : 'rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', 
                            background: q.correctAnswer === opt && opt !== '' ? '#10b981' : 'transparent',
                            boxShadow: q.correctAnswer === opt && opt !== '' ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
                          }} />
                        </div>
                        <input 
                          type="text" 
                          className="glass-input" 
                          style={{ width: '100%', padding: '0.6rem 1rem', border: q.correctAnswer === opt && opt !== '' ? '1px solid rgba(16,185,129,0.5)' : '1px solid transparent' }}
                          placeholder={`Option ${oIdx + 1}`}
                          value={opt}
                          onChange={e => handleUpdateOption(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
                      <AlertCircle size={16} /> Click the circle next to the correct answer
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Points:</label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        style={{ padding: '0.25rem 0.5rem', width: '60px', textAlign: 'center' }}
                        value={q.marks}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          handleUpdateQuestion(qIdx, 'marks', isNaN(val) ? 1 : val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: '1rem', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '1.25rem', background: 'rgba(129, 140, 248, 0.05)', marginBottom: '3rem' }}>
              <button 
                onClick={handleAddQuestion}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  border: 'none', 
                  borderRadius: '1rem', 
                  background: '#6366f1', 
                  color: 'white', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.75rem', 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                  boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
                  willChange: 'transform'
                }}
                className="hover-lift"
              >
                <Plus size={24} /> ADD ANOTHER QUESTION
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
               <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="glass-btn-primary" 
                style={{ padding: '1.25rem 4rem', fontSize: '1.1rem', fontWeight: 950, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
               >
                 {isSaving ? 'Saving...' : <><Save size={22} /> Finalize & Save Assessment</>}
               </button>
            </div>
          </div>
        )}
    </div>
  );
}
