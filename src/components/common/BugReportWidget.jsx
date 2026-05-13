import React, { useState } from 'react';
import { Bug, X, Send, AlertTriangle, Image as ImageIcon, Layers, Zap } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getAuthUser } from '../../utils/auth';

export default function BugReportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'GENERAL',
    priority: 'MEDIUM',
    content: ''
  });

  const user = getAuthUser();

  if (!user || user.role?.toUpperCase() === 'ADMIN') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.warning("Please describe the issue so we can investigate.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/bugs', {
        ...formData,
        userId: user?.userId || user?.id || 'ANONYMOUS',
        username: user?.fullName || user?.email || "User",
        email: user?.email || 'unknown@edulearn.com',
        reporterRole: user?.role || 'STUDENT',
        url: window.location.href // Auto-capture current context
      });
      toast.success("Incident logged in Command Center. Our team is on it.");
      setFormData({ category: 'GENERAL', priority: 'MEDIUM', content: '' });
      setIsOpen(false);
    } catch (error) {
      console.error("Bug submission failed:", error);
      toast.error("Telemetry failed. Please try reporting again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="hover-lift"
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          right: '2.5rem',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'auto'
        }}
      >
        <Bug size={28} />
      </button>

      {isOpen && (
          <div style={{ 
            position: 'fixed', inset: 0, zIndex: 1001, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '2rem', backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.5)',
            pointerEvents: 'auto'
          }}>
              <div
                className="premium-card animate-scale-in"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  padding: '2.5rem',
                  position: 'relative',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
                  borderRadius: '24px',
                  transition: 'all 0.3s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--page-primary)', marginBottom: '0.5rem' }}>
                      <Bug size={24} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Incident Terminal</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Report an <span style={{ color: 'var(--page-primary)' }}>Issue</span></h2>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'var(--input-bg)', border: 'none', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Selectors Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Layers size={12} style={{ marginRight: '0.4rem' }} /> Category
                      </label>
                      <select 
                        className="glass-input"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        style={{ padding: '0.8rem', borderRadius: '0.85rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                      >
                        <option value="GENERAL">General Issue</option>
                        <option value="UI">UI / Visual Bug</option>
                        <option value="PAYMENT">Payment / Finance</option>
                        <option value="PERFORMANCE">Performance / Lag</option>
                        <option value="SECURITY">Security Concern</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <AlertTriangle size={12} style={{ marginRight: '0.4rem' }} /> Priority
                      </label>
                      <select 
                        className="glass-input"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        style={{ 
                          padding: '0.8rem', borderRadius: '0.85rem',
                          background: 'var(--input-bg)', color: formData.priority === 'CRITICAL' ? '#ef4444' : 'var(--text-primary)',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <option value="LOW">Low Impact</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High Priority</option>
                        <option value="CRITICAL">🔥 CRITICAL</option>
                      </select>
                    </div>
                  </div>


                  {/* Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Zap size={12} style={{ marginRight: '0.4rem' }} /> Detailed Report
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Describe exactly what happened and steps to reproduce..."
                      rows={4}
                      className="glass-input"
                      style={{ 
                        resize: 'none', padding: '1rem', borderRadius: '1rem', width: '100%', lineHeight: 1.6,
                        background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      type="submit" 
                      className="hover-lift"
                      disabled={isSubmitting}
                      style={{ 
                        width: '100%', 
                        padding: '1.25rem', 
                        borderRadius: '1.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.75rem',
                        background: 'var(--page-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 950,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 15px 30px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isSubmitting ? (
                        <span className="loading-spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                      ) : (
                        <><Send size={20} /> Transmit Report</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
          </div>
        )}
    </>
  );
}
